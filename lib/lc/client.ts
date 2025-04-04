import { retry } from "@std/async/retry";
import type {
  LCClientInterface,
  LCQuestion,
  LCSubmission,
} from "./client_interface.ts";
import { makeQuestionURL } from "./urls.ts";
import { gql } from "./gql.ts";

/**
 * LCClient is the client for Leetcode.
 */
export class LCClient implements LCClientInterface {
  constructor(
    private readonly fetch: typeof globalThis.fetch = globalThis.fetch.bind(
      globalThis,
    ),
  ) {}

  /**
   * verifyUser verifies the user by username.
   */
  public async verifyUser(username: string): Promise<boolean> {
    const response = await retry(() =>
      this.fetch(
        `https://leetcode.com/${username}/`,
        { headers: { "priority": "u=0, i", "content-type": "text/html" } },
      )
    );
    return response.status === 200;
  }

  /**
   * getDailyQuestion gets the daily question from Leetcode.
   */
  public async getDailyQuestion(): Promise<LCQuestion> {
    const date = new Date();
    const [question] = await this.listDailyQuestions(
      date.getFullYear(),
      date.getMonth() + 1,
      1,
    );
    if (!question) {
      throw new Error("No daily question found");
    }

    return question;
  }

  /**
   * listDailyQuestions gets the last `amount` of daily questions from Leetcode since `asOfYear` and `asOfMonth`.
   */
  public async listDailyQuestions(
    asOfYear: number,
    asOfMonth: number,
    limit = 10,
  ): Promise<LCQuestion[]> {
    const dailies: LCQuestion[] = [];
    let currentYear = asOfYear;
    let currentMonth = asOfMonth;

    while (dailies.length < limit) {
      const response = await gql(
        JSON.stringify({
          operationName: "dailyCodingQuestionRecords",
          query:
            "\n    query dailyCodingQuestionRecords($year: Int!, $month: Int!) {\n  dailyCodingChallengeV2(year: $year, month: $month) {\n    challenges {\n      date\n      userStatus\n      link\n      question {\n        questionFrontendId\n        title\n        titleSlug\n      difficulty\n      }\n    }\n    weeklyChallenges {\n      date\n      userStatus\n      link\n      question {\n        questionFrontendId\n        title\n        titleSlug\n     difficulty\n      }\n    }\n  }\n}\n    ",
          variables: { year: currentYear, month: currentMonth },
        }),
      );
      const json = await response.json();
      const challenges = json.data.dailyCodingChallengeV2.challenges
        .reverse() as Array<{
          date: string;
          question: {
            title: string;
            titleSlug: string;
            difficulty: string;
            questionFrontendId: string;
          };
        }>;
      for (const challenge of challenges) {
        if (dailies.length === limit) {
          break;
        }

        dailies.push({
          name: challenge.question.titleSlug,
          date: challenge.date,
          title: challenge.question.title,
          difficulty: challenge.question.difficulty,
          url: makeQuestionURL(challenge.question.titleSlug),
          number: parseInt(challenge.question.questionFrontendId),
        });
      }

      currentMonth--;
      if (currentMonth === 0) {
        currentMonth = 12;
        currentYear--;
      }
    }

    return dailies;
  }

  /**
   * getRecentAcceptedSubmissions gets the recent accepted submissions from
   * Leetcode by username.
   */
  public async getRecentAcceptedSubmissions(
    username: string,
    limit = MAX_SUBMISSIONS_LIMIT,
  ): Promise<LCSubmission[]> {
    if (limit > MAX_SUBMISSIONS_LIMIT) {
      limit = MAX_SUBMISSIONS_LIMIT;
    }

    return await gql(
      JSON.stringify({
        operationName: "recentAcSubmissions",
        query:
          "\n    query recentAcSubmissions($username: String!, $limit: Int!) {\n  recentAcSubmissionList(username: $username, limit: $limit) {\n    id\n    title\n    titleSlug\n    timestamp\n  }\n}\n    ",
        variables: { username, limit },
      }),
    )
      .then((response) => response.json())
      /**
       * Map the result of the graphql query into the shape of a LCDailyQuestion instance.
       */
      .then((json) =>
        json.data.recentAcSubmissionList
          ?.map((
            acSubmission: {
              id: string;
              title: string;
              timestamp: string;
              titleSlug: string;
            },
          ): LCSubmission => ({
            id: acSubmission.id,
            name: acSubmission.titleSlug,
            title: acSubmission.title,
            timestamp: acSubmission.timestamp,
          })) ?? []
      );
  }
}

/**
 * MAX_SUBMISSIONS_LIMIT is the maximum amount of submissions to fetch from Leetcode.
 */
export const MAX_SUBMISSIONS_LIMIT = 20;
