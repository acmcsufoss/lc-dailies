import { DAY, ulid, WEEK } from "lc-dailies/deps.ts";
import type * as api from "lc-dailies/api/mod.ts";
import type { LeaderboardClient } from "lc-dailies/lib/leaderboard/mod.ts";
import { sync } from "lc-dailies/lib/leaderboard/mod.ts";
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
   * listPlayers lists all the registered players.
   */
  private async listPlayers(): Promise<api.Players> {
    const players: api.Players = {};
    const entries = this.kv
      .list<api.Player>({ prefix: [LeaderboardKvPrefix.PLAYERS] });
    for await (const entry of entries) {
      const playerID = entry.key[1] as string;
      players[playerID] = entry.value;
    }

    return players;
  }

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
    const player: api.Player = { discord_user_id, lc_username };
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
   */
  public async sync(seasonID?: string): Promise<api.SyncResponse> {
    let season: api.Season;
    let seasonResult: Deno.KvEntryMaybe<api.Season> | null = null;
    if (seasonID) {
      seasonResult = await this.kv.get<api.Season>([
        LeaderboardKvPrefix.SEASONS,
        seasonID,
      ]);
      if (!seasonResult.value) {
        throw new Error("Season not found");
      }
    } else {
      seasonResult = await this.getLatestSeasonFromKv();
      season = seasonResult?.value
        ? seasonResult.value
        : makeEmptySeason(getStartOfWeek(this.restartMs));
    }

    const players = await this.listPlayers();
    season = await sync({
      lcClient: this.lc,
      players,
      season: season!,
    });

    return { season };
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

/**
 * makeEmptySeason creates an empty season.
 */
export function makeEmptySeason(startOfWeek: number): api.Season {
  return {
    id: ulid(startOfWeek),
    start_date: new Date(startOfWeek).toUTCString(),
    scores: {},
    players: {},
    questions: {},
    submissions: {},
  };
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
