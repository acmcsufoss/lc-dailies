import { DAY, ulid, WEEK } from "lc-dailies/deps.ts";
import type * as api from "lc-dailies/api/mod.ts";
import type { LeaderboardClient } from "lc-dailies/lib/leaderboard/mod.ts";
import {
  calculateSeasonScores,
  makeDefaultCalculateScoresOptions,
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
    const playerResult = await this.kv.get<api.LCPlayer>(key);
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

  public async submit(
    discord_user_id: string,
    lc_submission_id: string,
    currentDate = new Date(),
  ): Promise<api.SubmitResponse> {
    // Check if the player is registered in our leaderboard.
    const maybePlayerResult = await this.kv
      .get<api.LCPlayer>([LeaderboardKvPrefix.PLAYERS, discord_user_id]);
    if (!maybePlayerResult.value) {
      throw new Error("Player not registered");
    }

    // Find the accepted submission in the recent submissions of the player.
    const recentAcceptedSubmissions = await this.lc
      .getRecentAcceptedSubmissions(maybePlayerResult.value.lc_username, 10);
    const acceptedSubmission = recentAcceptedSubmissions
      .find((s) => s.id === lc_submission_id);
    if (!acceptedSubmission) {
      throw new Error("Submission not found");
    }

    // The latest season. Default to empty season when not found or not latest.
    // If current date is no longer in the "latest" season, create a new season.
    const maybeSeasonResult = await this.getLatestSeasonFromKv();
    const isLatestSeason = !!(maybeSeasonResult?.value) && checkDateInWeek(
      new Date(maybeSeasonResult.value.start_date).getTime(),
      currentDate.getTime(),
    );
    const season = isLatestSeason
      ? maybeSeasonResult?.value
      : makeEmptySeason(getStartOfWeek(this.restartMs, currentDate));

    // Check if the submission is part of the current season.
    const seasonStartDate = new Date(season.start_date);
    const acceptedSubmissionDate = fromLCTimestamp(
      acceptedSubmission.timestamp,
    );
    const isSubmissionInSeason = checkDateInWeek(
      seasonStartDate.getTime(),
      acceptedSubmissionDate.getTime(),
    );
    if (!isSubmissionInSeason) {
      throw new Error("Submission not in season");
    }

    // Find the question in the duration of the season from the recent daily questions.
    // Use the end date of the season as the end date of the duration.
    const seasonEndDate = new Date(seasonStartDate.getTime() + WEEK);
    const seasonYear = seasonEndDate.getUTCFullYear();
    const seasonMonth = seasonEndDate.getUTCMonth() + 1;
    const recentDailyQuestions = await this.lc
      .listDailyQuestions(10, seasonYear, seasonMonth);

    // Find the question in the recent daily questions.
    const recentDailyQuestion = recentDailyQuestions
      .find((q) => q.name === acceptedSubmission.name);
    if (!recentDailyQuestion) {
      throw new Error("Question not found");
    }

    // Check if the question is part of the season.
    const isQuestionInSeason = checkDateInWeek(
      new Date(season.start_date).getTime(),
      new Date(recentDailyQuestion.date).getTime(),
    );
    if (!isQuestionInSeason) {
      throw new Error("Question not in season");
    }

    // Check if the question is already registered in the current season for the player.
    const registeredQuestion = season.submissions[discord_user_id]
      ?.[recentDailyQuestion.name];
    if (registeredQuestion) {
      throw new Error("Question already registered");
    }

    // Add the submission to the player's submissions.
    season.submissions[discord_user_id] ??= {};
    season.submissions[discord_user_id][recentDailyQuestion.name] = {
      id: acceptedSubmission.id,
      date: acceptedSubmissionDate.toUTCString(),
    };

    // Add player to the season if not already in the season.
    season.players[discord_user_id] ??= maybePlayerResult.value;

    // Add the question to the season if not already in the season.
    season.questions[recentDailyQuestion.name] ??= recentDailyQuestion;

    // Add the calculated scores to the season.
    season.scores = calculateSeasonScores(makeDefaultCalculateScoresOptions(
      season.players,
      season.questions,
      season.submissions,
    ));

    // Update the season in Deno KV.
    await this.updateLatestSeason(season, maybeSeasonResult);
    return { ok: true };
  }

  public async getLatestSeason(): Promise<api.Season | null> {
    const seasonResult = await this.getLatestSeasonFromKv();
    if (!seasonResult?.value) {
      return null;
    }

    return seasonResult.value;
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

function makeEmptySeason(startOfWeek: number): api.Season {
  return {
    id: ulid(startOfWeek),
    start_date: new Date(startOfWeek).toUTCString(),
    scores: {},
    players: {},
    questions: {},
    submissions: {},
  };
}

function fromLCTimestamp(timestamp: string): Date {
  const utcSeconds = parseInt(timestamp);
  return new Date(utcSeconds * 1e3);
}
