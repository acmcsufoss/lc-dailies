import type * as api from "lc-dailies/lib/api/types.ts";

/**
 * CalculateScoresOptions is the options for calculateScores.
 */
export interface CalculateScoresOptions {
  /**
   * submissions are the submissions in the season.
   */
  submissions: api.Submissions;

  /**
   * questions are the questions in the season.
   */
  questions: api.Questions;

  /**
   * players are the players in the season.
   */
  players: api.Players;

  /**
   * possibleHighestScore is the highest possible score per question.
   */
  possibleHighestScore: number;

  /**
   * possibleLowestScore is the lowest possible score per question.
   */
  possibleLowestScore: number;

  /**
   * duration is the amount of milliseconds it takes to linearly interpolate
   * between the highest and lowest possible scores.
   */
  duration: number;

  /**
   * modifyScore modifies the score of a player.
   */
  modifyScore?: (score: number) => number;
}

/**
 * calculateSubmissionScore calculates the score of a submission.
 */
export function calculateSubmissionScore(
  submission: api.Submission,
  question: api.Question,
  options: CalculateScoresOptions,
): number {
  const questionDate = new Date(`${question.date} GMT`);
  const submissionDate = new Date(submission.date);
  const msElapsed = submissionDate.getTime() - questionDate.getTime();
  const ratio = 1 - Math.min(Math.max(msElapsed / options.duration, 0), 1);
  const score = ((options.possibleHighestScore - options.possibleLowestScore) *
    ratio) + options.possibleLowestScore;
  if (!options.modifyScore) {
    return score;
  }

  return options.modifyScore(score);
}

/**
 * calculatePlayerScore calculates the score of a player in a season.
 *
 * See:
 * https://github.com/acmcsufoss/lc-dailies/issues/32#issuecomment-1728904942
 */
export function calculatePlayerScore(
  playerID: string,
  options: CalculateScoresOptions,
): number {
  const submissions = options.submissions[playerID];
  if (!submissions) {
    return 0;
  }

  const scoreSum = Object.entries(submissions)
    .reduce((score, [questionID, submission]) => {
      const question = options.questions[questionID];
      if (!question) {
        return score;
      }

      return score + calculateSubmissionScore(
        submission,
        question,
        options,
      );
    }, 0);

  return scoreSum;
}

/**
 * calculateScores calculates the scores of all players in a season.
 *
 * Returns a map of player ID to score.
 */
export function calculateScores(
  options: CalculateScoresOptions,
): api.Scores {
  return Object.keys(options.players)
    .reduce((scores, playerID) => {
      const score = calculatePlayerScore(playerID, options);
      if (score > 0) {
        scores[playerID] = score;
      }

      return scores;
    }, {} as api.Scores);
}

/**
 * makeDefaultCalculateScoresOptions creates a default CalculateScoresOptions.
 */
export function makeDefaultCalculateScoresOptions(
  players: api.Players,
  questions: api.Questions,
  submissions: api.Submissions,
): CalculateScoresOptions {
  return {
    players,
    questions,
    submissions,
    possibleHighestScore: 100,
    possibleLowestScore: 50,
    duration: 1_000 * 60 * 60 * 24, // 1 day.
    modifyScore: defaultModifyScore,
  };
}

/**
 * defaultModifyScore is the default score modifier.
 */
export function defaultModifyScore(score: number): number {
  return Math.ceil(score);
}

/**
 * formatScores formats the scores of all players in a season.
 */
export function formatScores(season: api.Season): string {
  return Object.entries(season.scores)
    .sort(({ 1: scoreA }, { 1: scoreB }) => scoreB - scoreA)
    .map(([playerID, score], i) => {
      const player = season.players[playerID];
      const formattedScore = String(score).padStart(3, " ");
      const formattedSubmissions = formatSubmissions(season, playerID);
      const formattedRank = formatRank(i + 1);
      return `${formattedScore} ${formattedSubmissions} ${player.lc_username} (${formattedRank})`;
    })
    .join("\n");
}

/**
 * formatSubmissions formats the submissions of a player in a season.
 */
export function formatSubmissions(
  season: api.Season,
  playerID: string,
): string {
  const daysToQuestionIDsMap = Object.entries(season.questions)
    .reduce((questions, [questionID, question]) => {
      const date = new Date(question.date + " GMT");
      questions[date.getUTCDay()] = questionID;
      return questions;
    }, {} as Record<number, string>);

  let result = "";
  for (let i = 0; i < 7; i++) {
    const questionID = daysToQuestionIDsMap[i];
    if (!questionID) {
      result += formatDifficulty();
      continue;
    }

    const submission = season.submissions[playerID]?.[questionID];
    if (!submission) {
      result += formatDifficulty();
      continue;
    }

    const question = season.questions[questionID];
    result += formatDifficulty(question.difficulty);
  }

  return result;
}

/**
 * formatRank formats the rank of a player in a season.
 */
export function formatRank(rank: number): string {
  switch (rank) {
    case 1: {
      return "🥇";
    }

    case 2: {
      return "🥈";
    }

    case 3: {
      return "🥉";
    }

    case 11:
    case 12:
    case 13: {
      return `${rank}th`;
    }
  }

  const lastDigit = rank % 10;
  switch (lastDigit) {
    case 1: {
      return `${rank}st`;
    }

    case 2: {
      return `${rank}nd`;
    }

    case 3: {
      return `${rank}rd`;
    }

    default: {
      return `${rank}th`;
    }
  }
}

/**
 * formatDifficulty formats the difficulty of a question.
 */
export function formatDifficulty(difficulty?: string): string {
  switch (difficulty) {
    case "Easy": {
      return "🟢";
    }

    case "Medium": {
      return "🟠";
    }

    case "Hard": {
      return "🔴";
    }

    default: {
      return "·";
    }
  }
}
