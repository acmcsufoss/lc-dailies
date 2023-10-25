import type { Question } from "lc-dailies/lib/api/mod.ts";

/**
 * LCQuestion is an alias interface for a Leetcode question.
 */
export type LCQuestion = Question;

/**
 * LCSubmission is the representation of Leetcode's recent submission per user.
 */
export interface LCSubmission {
  /**
   * id is the id details of the submission.
   */
  id: string;

  /**
   * name is the name of the question of the submission.
   */
  name: string;

  /**
   * title is the title of the question of the submission.
   */
  title: string;

  /**
   * timestamp is the time the submission was submitted.
   */
  timestamp: string;
}

/**
 * LCClientInterface is the client interface for Leetcode.
 */
export interface LCClientInterface {
  /**
   * verifyUser verifies the user by username.
   */
  verifyUser(username: string): Promise<boolean>;

  /**
   * getDailyQuestion gets the daily question from Leetcode.
   */
  getDailyQuestion(): Promise<LCQuestion>;

  /**
   * listDailyQuestions gets the last `amount` of daily questions from Leetcode since `asOfYear` and `asOfMonth`.
   */
  listDailyQuestions(
    limit: number,
    asOfYear: number,
    asOfMonth: number,
  ): Promise<LCQuestion[]>;

  /**
   * getRecentAcceptedSubmissions gets the recent accepted submissions from
   * Leetcode by username.
   */
  getRecentAcceptedSubmissions(
    username: string,
    limit?: number,
  ): Promise<LCSubmission[]>;
}
