import type * as lc from "lc-dailies/lib/lc/mod.ts";

/**
 * Player is a registered player in the leaderboard.
 */
export interface Player {
  /**
   * discord_user_id is the Discord user ID of the player.
   */
  discord_user_id: string;

  /**
   * lc_username is the Leetcode username of the player.
   */
  lc_username: string;
}

/**
 * Submission is a submission in the leaderboard.
 */
export interface Submission {
  /**
   * id is the ID of the submission.
   */
  id: string;

  /**
   * date is the date of the submission.
   */
  date: string;
}

/**
 * Season is a season of the leaderboard.
 */
export interface Season {
  /**
   * id is the ID of the season.
   */
  id: string;

  /**
   * start_date is the start date of the season.
   */
  start_date: string;

  /**
   * players is the map of players in the season.
   */
  players: { [discord_user_id: string]: Player };

  /**
   * questions is the map of questions in the season.
   */
  questions: { [lc_question_name: string]: lc.DailyQuestion };

  /**
   * submissions is the map of submissions in the season.
   */
  submissions: {
    [discord_user_id: string]: {
      [lc_question_name: string]: Submission;
    };
  };
}

/**
 * RegisterResponse is the response for the register subcommand.
 */
export interface RegisterResponse {
  /**
   * ok is whether the registration was successful.
   */
  ok: boolean;
}

/**
 * SubmitResponse is the response for the submit subcommand.
 */
export interface SubmitResponse {
  /**
   * ok is whether the submission was successful.
   */
  ok: boolean;
}

/**
 * LeaderboardClient is the client interface for the leaderboard.
 */
export interface LeaderboardClient {
  /**
   * register registers a new player to the leaderboard.
   */
  register(
    discord_user_id: string,
    lc_username: string,
  ): Promise<RegisterResponse>;

  /**
   * submit registers a new submission to the leaderboard.
   *
   * Returns the season of the submission.
   */
  submit(
    discord_user_id: string,
    lc_submission_id: string,
  ): Promise<SubmitResponse>;

  /**
   * getCurrentSeason gets the current season of the leaderboard.
   */
  getCurrentSeason(): Promise<Season | null>;

  /**
   * getSeason gets a season of the leaderboard by ID.
   */
  getSeason(season_id: string): Promise<Season | null>;

  /**
   * listSeasons gets a list of season IDs of the leaderboard.
   */
  listSeasons(): Promise<Season[]>;
}

/**
 * CalculateScoresOptions is the options for calculateScores.
 */
export interface CalculateScoresOptions {
  /**
   * season is the season to calculate the score for.
   */
  season: Season;

  /**
   * possibleHighestScore is the highest possible score.
   */
  possibleHighestScore: number;

  /**
   * possibleLowestScore is the lowest possible score.
   */
  possibleLowestScore: number;

  /**
   * duration is the amount of milliseconds it takes to linearly interpolate
   * between the highest and lowest possible scores.
   */
  duration: number;
}

/**
 * calculateSubmissionScore calculates the score of a submission.
 */
export function calculateSubmissionScore(
  submission: Submission,
  question: lc.DailyQuestion,
  options: CalculateScoresOptions,
): number {
  const questionDate = new Date(question.date);
  const submissionDate = new Date(submission.date);
  const msElapsed = submissionDate.getTime() - questionDate.getTime();
  const ratio = Math.min(Math.max(msElapsed / options.duration, 0), 1);
  const questionScore =
    ((options.possibleHighestScore - options.possibleLowestScore) *
      ratio) + options.possibleLowestScore;
  return Math.ceil(questionScore);
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
  const submissions = options.season.submissions[playerID];
  if (!submissions) {
    return 0;
  }

  const scoreSum = Object.entries(submissions)
    .reduce((score, [questionID, submission]) => {
      const question = options.season.questions[questionID];
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
 * calculateSeasonScores calculates the scores of all players in a season.
 */
export function calculateSeasonScores(
  options: CalculateScoresOptions,
): Record<string, number> {
  return Object.keys(options.season.players)
    .reduce((scores, playerID) => {
      scores[playerID] = calculatePlayerScore(playerID, options);
      return scores;
    }, {} as Record<string, number>);
}
