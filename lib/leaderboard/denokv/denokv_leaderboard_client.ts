import { DAY, WEEK } from "@std/datetime";
import { ulid } from "@std/ulid";
import type * as api from "lc-dailies/lib/api/api.ts";
import type { LeaderboardClient } from "lc-dailies/lib/leaderboard/mod.ts";
import { sync } from "lc-dailies/lib/leaderboard/mod.ts";
import type { LCClientInterface } from "lc-dailies/lib/lc/mod.ts";

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
    private readonly lc: LCClientInterface,
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
  private async updateLatestSeason(season: api.Season): Promise<void> {
    // Update the season.
    const updateSeasonOp = this.kv.atomic();

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
    playerID: string,
    lcUsername: string,
  ): Promise<api.RegisterResponse> {
    const key: Deno.KvKey = [LeaderboardKvPrefix.PLAYERS, playerID];
    const playerResult = await this.kv.get<api.Player>(key);
    if (playerResult.value) {
      throw new Error("Player already registered");
    }

    // Verify the user with Leetcode.
    const isVerified = await this.lc.verifyUser(lcUsername);
    if (!isVerified) {
      throw new Error("Failed to verify user with Leetcode");
    }

    // Register the player.
    const registerResult = await this.kv
      .atomic()
      .check(playerResult)
      .set(
        key,
        { discord_user_id: playerID, lc_username: lcUsername },
      )
      .commit();
    if (!registerResult.ok) {
      throw new Error("Failed to register player");
    }

    return { ok: true };
  }

  public async unregister(playerID: string): Promise<api.UnregisterResponse> {
    const playerResult = await this.kv.get<api.Player>([
      LeaderboardKvPrefix.PLAYERS,
      playerID,
    ]);
    if (!playerResult.value) {
      throw new Error("Player not registered");
    }

    // Unregister the player.
    await this.kv.delete([
      LeaderboardKvPrefix.PLAYERS,
      playerID,
    ]);
    return { ok: true };
  }

  public async sync(
    seasonID?: string,
    referenceDate = new Date(),
  ): Promise<api.SyncResponse> {
    // startOfWeekUTC is the start of the season in UTC.
    const startOfWeekUTC = getStartOfWeek(this.restartMs, referenceDate);
    const startOfWeekDate = new Date(startOfWeekUTC);

    // Get the season.
    let season: api.Season;
    let seasonStartDate: Date;
    let isLatestSeason: boolean;
    let seasonResult: Deno.KvEntryMaybe<api.Season> | null;
    const players = await this.listPlayers();
    if (seasonID) {
      seasonResult = await this.kv.get<api.Season>([
        LeaderboardKvPrefix.SEASONS,
        seasonID,
      ]);
      if (!seasonResult.value) {
        throw new Error("Season not found");
      }

      season = seasonResult.value;
      seasonStartDate = new Date(season.start_date);
      isLatestSeason = startOfWeekDate.getTime() === seasonStartDate.getTime();
    } else {
      seasonResult = await this.getLatestSeasonFromKv();
      const isPresentAndLatest = seasonResult?.value &&
        new Date(seasonResult.value.start_date).getTime() ===
          startOfWeekDate.getTime();

      if (!isPresentAndLatest && seasonResult?.value) {
        // Sync old season.
        const oldSeason = await sync({
          lcClient: this.lc,
          players,
          season: seasonResult.value,
        });
        oldSeason.synced_at = referenceDate.toUTCString();

        // Store the synced old season.
        await this.kv.set(
          [LeaderboardKvPrefix.SEASONS, oldSeason.id],
          oldSeason,
        );
      }

      season = isPresentAndLatest
        ? seasonResult?.value!
        : makeEmptySeason(startOfWeekDate);
      seasonStartDate = new Date(season.start_date);
      isLatestSeason = true;
    }

    // Sync the season.
    season = await sync({ lcClient: this.lc, players, season });
    season.synced_at = referenceDate.toUTCString();

    // Store the synced season.
    await this.kv.set(
      [LeaderboardKvPrefix.SEASONS, season.id],
      season,
    );

    // Update the season if it is the latest season.
    startOfWeekDate.getTime() === seasonStartDate.getTime();
    if (isLatestSeason) {
      await this.updateLatestSeason(season);
    }

    // Return a sync response.
    return { season };
  }

  public async getSeason(
    seasonID: string,
  ): Promise<api.Season | null> {
    const seasonResult = await this.kv.get<api.Season>([
      LeaderboardKvPrefix.SEASONS,
      seasonID,
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

  public async getLatestSeason(): Promise<api.Season | null> {
    const seasonResult = await this.getLatestSeasonFromKv();
    return seasonResult?.value ?? null;
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
export function makeEmptySeason(startOfWeek: Date): api.Season {
  return {
    id: ulid(startOfWeek.getTime()),
    start_date: startOfWeek.toUTCString(),
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
