import type * as api from "lc-dailies/lib/api/mod.ts";

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
  ): Promise<api.RegisterResponse>;

  /**
   * sync syncs the leaderboard with Leetcode.
   *
   * Throws an error if the season is unable to be synced.
   *
   * Returns the synced season.
   */
  sync(season_id?: string, reference_date?: Date): Promise<api.SyncResponse>;

  /**
   * getLatestSeason gets the latest season.
   */
  getLatestSeason(): Promise<api.Season | null>;

  /**
   * getSeason gets a season of the leaderboard by ID.
   */
  getSeason(season_id: string): Promise<api.Season | null>;

  /**
   * listSeasons gets a list of season IDs of the leaderboard.
   */
  listSeasons(): Promise<api.Season[]>;
}
