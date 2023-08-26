import type * as lc from "../lc_client.ts";

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
  submissions: { [discord_user_id: string]: string[] }; // TODO: Change to question ID if submission is successful.
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
