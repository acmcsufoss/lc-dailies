import { DAY, ulid, WEEK } from "../../deps.ts";
import type * as lc from "../../lc/mod.ts";
import * as leaderboard from "../mod.ts";

/**
 * DenoKvLeaderboardClient is the client for the leaderboard.
 */
export class DenoKvLeaderboardClient implements leaderboard.LeaderboardClient {
  public constructor(
    /**
     * kv is the key-value store for the leaderboard.
     */
    private readonly kv: Deno.Kv,
    /**
     * lc is the Leetcode client.
     */
    private readonly lc: lc.LCClient,
    /**
     * restartMS is the milliseconds to restart the leaderboard.
     *
     * 0 is Sunday 12:00:000 AM UTC.
     * 604_799_999 is Saturday 11:59:999 PM UTC.
     */
    private readonly restartMs = 0,
  ) {}

  /**
   * getCurrentSeasonFromKv reads the current season from Deno KV.
   */
  private async getCurrentSeasonFromKv(): Promise<
    Deno.KvEntryMaybe<leaderboard.Season> | null
  > {
    // Get the current season ID.
    const currentSeasonIDResult = await this.kv
      .get<string>([LeaderboardKvPrefix.SEASON_ID]);
    if (!currentSeasonIDResult.value) {
      return null;
    }

    // Get the current season.
    const seasonResult = await this.kv.get<leaderboard.Season>([
      LeaderboardKvPrefix.SEASONS,
      currentSeasonIDResult.value,
    ]);
    if (!seasonResult.value) {
      throw new Error("Season not found");
    }

    return seasonResult;
  }

  /**
   * updateCurrentSeason updates the current season in Deno KV.
   */
  private async updateCurrentSeason(
    season: leaderboard.Season,
    prevSeasonResult: Deno.KvEntryMaybe<leaderboard.Season> | null,
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

    // Update the season ID.
    const updateSeasonIDOp = this.kv.atomic();
    if (prevSeasonResult) {
      updateSeasonIDOp.check(prevSeasonResult);
    }

    // Update the current season ID.
    const updateSeasonIDResult = await updateSeasonIDOp.set(
      [LeaderboardKvPrefix.SEASON_ID],
      season.id,
    ).commit();
    if (!updateSeasonIDResult.ok) {
      throw new Error("Failed to update season ID");
    }

    return;
  }

  public async register(
    discord_user_id: string,
    lc_username: string,
  ): Promise<leaderboard.RegisterResponse> {
    const key: Deno.KvKey = [LeaderboardKvPrefix.PLAYERS, discord_user_id];
    const playerResult = await this.kv.get<leaderboard.Player>(key);
    if (playerResult.value) {
      throw new Error("Player already registered");
    }

    // Verify the user with Leetcode.
    const isVerified = await this.lc.verifyUser(lc_username);
    if (!isVerified) {
      throw new Error("Failed to verify user with Leetcode");
    }

    // Register the player.
    const player: leaderboard.Player = { discord_user_id, lc_username };
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
  ): Promise<leaderboard.SubmitResponse> {
    // Check if the player is registered in our leaderboard.
    const maybePlayerResult = await this.kv
      .get<leaderboard.Player>([LeaderboardKvPrefix.PLAYERS, discord_user_id]);
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

    // The current season. Default to empty season when not found or not current.
    // If current date is no longer in the "current season, create a new season.
    const maybeSeasonResult = await this.getCurrentSeasonFromKv();
    const isCurrentSeason = !!(maybeSeasonResult?.value) && checkDateInWeek(
      new Date(maybeSeasonResult.value.start_date).getTime(),
      currentDate.getTime(),
    );
    const season = isCurrentSeason
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
    // console.log({ season, recentDailyQuestion }); // TODO: Remove!
    const isQuestionInSeason = checkDateInWeek(
      new Date(season.start_date).getTime(),
      new Date(recentDailyQuestion.date).getTime(),
    );
    if (!isQuestionInSeason) {
      throw new Error("Question not in season");
    }

    // Check if the question is already registered in the current season for the player.
    const isQuestionRegistered = season.submissions[discord_user_id]
      ?.includes(recentDailyQuestion.name);
    if (isQuestionRegistered) {
      throw new Error("Question already registered");
    }

    // Add the submission to the player's submissions.
    season.submissions[discord_user_id] ??= [];
    season.submissions[discord_user_id].push(recentDailyQuestion.name);

    // Add player to the season if not already in the season.
    season.players[discord_user_id] ??= maybePlayerResult.value;

    // Add the question to the season if not already in the season.
    season.questions[recentDailyQuestion.name] ??= recentDailyQuestion;

    // Update the season in Deno KV.
    await this.updateCurrentSeason(season, maybeSeasonResult);
    return { ok: true };
  }

  public async getCurrentSeason(): Promise<leaderboard.Season | null> {
    const seasonResult = await this.getCurrentSeasonFromKv();
    if (!seasonResult?.value) {
      return null;
    }

    return seasonResult.value;
  }

  public async getSeason(
    season_id: string,
  ): Promise<leaderboard.Season | null> {
    const seasonResult = await this.kv.get<leaderboard.Season>([
      LeaderboardKvPrefix.SEASONS,
      season_id,
    ]);
    return seasonResult.value;
  }

  public async listSeasons(): Promise<leaderboard.Season[]> {
    const seasons: leaderboard.Season[] = [];
    const entries = this.kv
      .list<leaderboard.Season>({ prefix: [LeaderboardKvPrefix.SEASONS] });
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

function makeEmptySeason(startOfWeek: number): leaderboard.Season {
  return {
    id: ulid(startOfWeek),
    start_date: new Date(startOfWeek).toUTCString(),
    players: {},
    questions: {},
    submissions: {},
  };
}

function fromLCTimestamp(timestamp: string): Date {
  const utcSeconds = parseInt(timestamp);
  return new Date(utcSeconds * 1e3);
}
