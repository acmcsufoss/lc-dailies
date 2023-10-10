import { DAY } from "lc-dailies/deps.ts";
import type * as api from "lc-dailies/api/mod.ts";

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
  const ratio = Math.min(Math.max(msElapsed / options.duration, 0), 1);
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
    duration: DAY,
    modifyScore: defaultModifyScore,
  };
}

/**
 * defaultModifyScore is the default score modifier.
 */
export function defaultModifyScore(score: number): number {
  return Math.ceil(score);
}
