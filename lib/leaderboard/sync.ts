import { SECOND, ulid } from "lc-dailies/deps.ts";
import type * as api from "lc-dailies/api/mod.ts";
import type { LCClient } from "lc-dailies/lib/lc/mod.ts";

/**
 * sync creates a season given a list of players, an LCCient, and a
 * date range.
 */
export async function sync(
  lcClient: LCClient,
  players: api.Players,
  startDate: Date,
  endDate: Date,
): Promise<api.Season> {
  // Get the submissions of the players in the date range.
  // Calculate the scores of the players.
  // Create a season with the scores, submissions, and questions.
  return makeEmptySeason(startDate.getTime());
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

/**
 * fromLCTimestamp converts a Leetcode timestamp to a Date.
 */
export function fromLCTimestamp(timestamp: string): Date {
  const utcSeconds = parseInt(timestamp);
  return new Date(utcSeconds * SECOND);
}
