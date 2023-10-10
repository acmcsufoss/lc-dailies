import { DAY, ulid, WEEK } from "lc-dailies/deps.ts";
import type * as api from "lc-dailies/api/mod.ts";
import type { LeaderboardClient } from "lc-dailies/lib/leaderboard/mod.ts";
import {
  calculateScores,
  makeDefaultCalculateScoresOptions,
  sync,
} from "lc-dailies/lib/leaderboard/mod.ts";
import type { LCClient } from "lc-dailies/lib/lc/mod.ts";

/**
 * DenoKvLeaderboardClient is the client for the leaderboard.
 */
export class DenoKvLeaderboardClient implements LeaderboardClient {
  public constructor(
    /**
     * kv is the key-value store for the leaderboard.
     */
    private readonly kv: Deno.Kv,
    /**
     * lc is the Leetcode client.
     */
    private readonly lc: LCClient,
    /**
     * restartMS is the milliseconds to restart the leaderboard.
     *
     * 0 is Sunday 12:00:000 AM UTC.
     * 604_799_999 is Saturday 11:59:999 PM UTC.
     */
    private readonly restartMs = 0,
  ) {}

  /**
   * getLatestSeasonFromKv reads the latest season from Deno KV.
   */
  private async getLatestSeasonFromKv(): Promise<
    Deno.KvEntryMaybe<api.Season> | null
  > {
    // Get the latest season ID.
    const latestSeasonIDResult = await this.kv
      .get<string>([LeaderboardKvPrefix.SEASON_ID]);
    if (!latestSeasonIDResult.value) {
      return null;
    }

    // Get the current season.
    const seasonResult = await this.kv.get<api.Season>([
      LeaderboardKvPrefix.SEASONS,
      latestSeasonIDResult.value,
    ]);
    if (!seasonResult.value) {
      throw new Error("Season not found");
    }

    return seasonResult;
  }

  /**
   * updateLatestSeason updates the latest season in Deno KV.
   */
  private async updateLatestSeason(
    season: api.Season,
    prevSeasonResult: Deno.KvEntryMaybe<api.Season> | null,
  ): Promise<void> {
    // Update the season.
    const updateSeasonOp = this.kv.atomic();
    if (prevSeasonResult) {
      updateSeasonOp.check(prevSeasonResult);
    }

    // Update the season.
    const updateSeasonResult = await updateSeasonOp.set(
      [LeaderboardKvPrefix.SEASONS, season.id],
      season,
    ).commit();
    if (!updateSeasonResult.ok) {
      throw new Error("Failed to update season");
    }

    // Update the current season ID.
    const updateSeasonIDResult = await this.kv.set(
      [LeaderboardKvPrefix.SEASON_ID],
      season.id,
    );
    if (!updateSeasonIDResult.ok) {
      throw new Error("Failed to update season ID");
    }

    return;
  }

  public async register(
    discord_user_id: string,
    lc_username: string,
  ): Promise<api.RegisterResponse> {
    const key: Deno.KvKey = [LeaderboardKvPrefix.PLAYERS, discord_user_id];
    const playerResult = await this.kv.get<api.Player>(key);
    if (playerResult.value) {
      throw new Error("Player already registered");
    }

    // Verify the user with Leetcode.
    const isVerified = await this.lc.verifyUser(lc_username);
    if (!isVerified) {
      throw new Error("Failed to verify user with Leetcode");
    }

    // Register the player.
    const player: api.LCPlayer = { discord_user_id, lc_username };
    const registerResult = await this.kv
      .atomic()
      .check(playerResult)
      .set(key, player)
      .commit();
    if (!registerResult.ok) {
      throw new Error("Failed to register player");
    }

    return { ok: true };
  }

  /**
   * sync syncs the leaderboard with Leetcode.
   *
   * Possible scenarios:
   * - No season ID given: check if latest season exists. If not, create a new
   *   season. If yes, update the latest season.
   * - Season ID given: get season by ID. If not found, throw error. If found
   *   and latest season, update the season. If found and not latest season,
   *   throw error.
   */
  public async sync(seasonID?: string): Promise<api.SyncResponse> {
    // Get the latest season.
    const latestSeasonResult = await this.getLatestSeasonFromKv();
    if (!latestSeasonResult) {
      // Create a new season.
      const startOfWeek = getStartOfWeek(this.restartMs);
      const season = makeEmptySeason(startOfWeek);

      // Populate season with synced data.
      await this.updateLatestSeason(season, null);
      return { ok: true };
    }
  }

  public async getSeason(
    season_id: string,
  ): Promise<api.Season | null> {
    const seasonResult = await this.kv.get<api.Season>([
      LeaderboardKvPrefix.SEASONS,
      season_id,
    ]);
    return seasonResult.value;
  }

  public async listSeasons(): Promise<api.Season[]> {
    const seasons: api.Season[] = [];
    const entries = this.kv
      .list<api.Season>({ prefix: [LeaderboardKvPrefix.SEASONS] });
    for await (const entry of entries) {
      seasons.push(entry.value);
    }

    return seasons;
  }
}

/**
 * LeaderboardKvPrefix is the key prefix for the leaderboard key-value store.
 */
export enum LeaderboardKvPrefix {
  /** Collection of players. */
  PLAYERS = "leaderboard_players",
  /** Collection of seasons. */
  SEASONS = "leaderboard_seasons",
  /** Latest season ID. */
  SEASON_ID = "leaderboard_season_id",
}

function checkDateInWeek(startOfWeek: number, date: number): boolean {
  return date >= startOfWeek && date < startOfWeek + WEEK;
}

function getStartOfWeek(restartMs = 0, date = new Date()): number {
  let startOfWeek = new Date(date).setUTCHours(0, 0, 0, 0) -
    (DAY * (date.getUTCDay())) +
    restartMs;
  if (startOfWeek > date.getTime()) {
    startOfWeek -= WEEK;
  }

  return startOfWeek;
}
