import { SECOND, WEEK } from "lc-dailies/deps.ts";
import type * as api from "lc-dailies/lib/api/mod.ts";
import type { LCClientInterface } from "lc-dailies/lib/lc/mod.ts";
import {
  calculateScores,
  makeDefaultCalculateScoresOptions,
} from "lc-dailies/lib/leaderboard/mod.ts";

/**
 * SyncOptions are the required options for the sync operation.
 */
export interface SyncOptions {
  /**
   * season is the season to sync.
   */
  season: api.Season;

  /**
   * players are the registered players.
   */
  players: api.Players;

  /**
   * lcClient is the Leetcode client.
   */
  lcClient: LCClientInterface;

  /**
   * questionsFetchAmount is the amount of questions to fetch from Leetcode.
   *
   * If not specified, it will be set to 10.
   */
  questionsFetchAmount?: number;
}

/**
 * sync creates a season given a list of players, an LCCient, and a
 * date range.
 */
export async function sync(options: SyncOptions): Promise<api.Season> {
  // Fetch the daily questions of the season.
  const seasonStartDate = new Date(options.season.start_date);
  const seasonEndDate = new Date(seasonStartDate.getTime() + WEEK);
  const recentDailyQuestions = await options.lcClient.listDailyQuestions(
    seasonEndDate.getUTCFullYear(),
    seasonEndDate.getUTCMonth() + 1,
    options.questionsFetchAmount,
  );

  // Fetch the submissions of the players.
  for (const playerID in options.players) {
    // Get the submissions of the player.
    const player = options.players[playerID];
    const lcSubmissions = await options.lcClient
      .getRecentAcceptedSubmissions(player.lc_username);

    // Store the submissions in the season.
    for (const lcSubmission of lcSubmissions) {
      const questionName = lcSubmission.name;

      // Skip if the submission is not the earliest submission.
      const submissionDate = fromLCTimestamp(lcSubmission.timestamp);
      const storedSubmission: api.Submission | undefined = options.season
        .submissions[playerID]?.[questionName];
      if (
        storedSubmission && new Date(storedSubmission.date) < submissionDate
      ) {
        continue;
      }

      // Skip if the submission is not in the season.
      const isSubmissionInSeason = checkDateBetween(
        seasonStartDate.getTime(),
        seasonEndDate.getTime(),
        submissionDate.getTime(),
      );
      if (!isSubmissionInSeason) {
        continue;
      }

      // Fetch the question if it is not in the season.
      const storedQuestion: api.Question | undefined =
        options.season.questions[questionName];
      if (!storedQuestion) {
        // Skip if the question is not found.
        const recentDailyQuestion = recentDailyQuestions
          .find((q) => q.name === questionName);
        if (!recentDailyQuestion) {
          continue;
        }

        // Skip if the question is not in the season.
        const questionDate = new Date(recentDailyQuestion.date);
        const isQuestionInSeason = checkDateBetween(
          seasonStartDate.getTime(),
          seasonEndDate.getTime(),
          questionDate.getTime(),
        );
        if (!isQuestionInSeason) {
          continue;
        }

        // Store the question in the season.
        options.season.questions[questionName] ??= recentDailyQuestion;
      }

      // Store the earliest submission of the player.
      options.season.submissions[playerID] ??= {};
      options.season.submissions[playerID][questionName] = {
        id: lcSubmission.id,
        date: submissionDate.toUTCString(),
      };

      // Store the player in the season if it is not in the season.
      options.season.players[playerID] ??= player;
    }
  }

  // Calculate the scores of the players.
  options.season.scores = calculateScores(
    makeDefaultCalculateScoresOptions(
      options.season.players,
      options.season.questions,
      options.season.submissions,
    ),
  );

  return options.season;
}

/**
 * fromLCTimestamp converts a Leetcode timestamp to a Date.
 */
export function fromLCTimestamp(timestamp: string): Date {
  const utcSeconds = parseInt(timestamp);
  return new Date(utcSeconds * SECOND);
}

/**
 * checkDateBetween checks if a date is in a given duration.
 */
export function checkDateBetween(
  start: number,
  end: number,
  date: number,
): boolean {
  return date >= start && date < end;
}
