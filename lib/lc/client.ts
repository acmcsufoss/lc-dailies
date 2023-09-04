/**
 * DailyQuestion is the representation of Leetcode's daily question.
 *
 * Sample:
 * Daily Leetcode Question for 2021-10-20 (date)
 * Question: Find Eventual Safe States (question.title)
 * Difficulty: Medium (question.difficulty)
 * Link: https://leetcode.com/problems/find-eventual-safe-states/ (link)
 */
export interface DailyQuestion {
  /**
   * name is the name of the daily question.
   */
  name: string;

  /**
   * date is the date the daily question was posted.
   */
  date: string;

  /**
   * title is the title of the daily question.
   */
  title: string;

  /**
   * difficulty is the difficulty of the daily question.
   */
  difficulty: string;

  /**
   * url is the link of the daily question.
   */
  url: string;
}

/**
 * RecentSubmission is the representation of Leetcode's recent submission per user.
 */
export interface RecentSubmission {
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
 * LCClient is the client for Leetcode.
 */
export class LCClient {
  /**
   * verifyUser verifies the user by username.
   */
  public async verifyUser(username: string): Promise<boolean> {
    const response = await fetch(`https://leetcode.com/${username}/`);
    return response.status === 200;
  }

  /**
   * getDailyQuestion gets the daily question from Leetcode.
   */
  public async getDailyQuestion(): Promise<DailyQuestion> {
    const date = new Date();
    const [question] = await this.listDailyQuestions(
      1,
      date.getFullYear(),
      date.getMonth() + 1,
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
    limit: number,
    asOfYear: number,
    asOfMonth: number,
  ): Promise<DailyQuestion[]> {
    const dailies: DailyQuestion[] = [];
    let currentYear = asOfYear;
    let currentMonth = asOfMonth;

    while (dailies.length < limit) {
      const response = await gql(
        JSON.stringify({
          operationName: "dailyCodingQuestionRecords",
          query:
            "\n    query dailyCodingQuestionRecords($year: Int!, $month: Int!) {\n  dailyCodingChallengeV2(year: $year, month: $month) {\n    challenges {\n      date\n      userStatus\n      link\n      question {\n        questionFrontendId\n        title\n        titleSlug\n      difficulty\n      }\n    }\n    weeklyChallenges {\n      date\n      userStatus\n      link\n      question {\n        questionFrontendId\n        title\n        titleSlug\n      }\n    }\n  }\n}\n    ",
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
    limit: number,
  ): Promise<RecentSubmission[]> {
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
          .map((
            acSubmission: {
              id: string;
              title: string;
              timestamp: string;
              titleSlug: string;
            },
          ): RecentSubmission => ({
            id: acSubmission.id,
            name: acSubmission.titleSlug,
            title: acSubmission.title,
            timestamp: acSubmission.timestamp,
          }))
      );
  }
}

function makeQuestionURL(titleSlug: string): string {
  return `https://leetcode.com/problems/${titleSlug}/`;
}

/**
 * gql executes a query to Leetcode's GraphQL API.
 */
async function gql(body: string): Promise<Response> {
  return await fetch("https://leetcode.com/graphql/", {
    method: "POST",
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9",
      authorization: "",
      "content-type": "application/json",
    },
    body,
  });
}

/**
 * parseSubmissionID parses the submission ID from the submission URL.
 */
export function parseSubmissionID(submissionURLOrID: string): string {
  let submissionID = submissionURLOrID;
  try {
    const url = new URL(submissionURLOrID);
    if (LEETCODE_SUBMISSIONS_PATHNAME_PATTERN.test(url.pathname)) {
      submissionID = url.pathname
        .replace(LEETCODE_SUBMISSIONS_PATHNAME_PATTERN, "")
        .replace(/\/$/, "");
    }
  } catch {
    // noop
  }
  return submissionID;
}

const LEETCODE_SUBMISSIONS_PATHNAME_PATTERN =
  /^\/(problems\/.*\/submissions\/|submissions\/detail\/)/;

/**
 * Valid submission URLs: This entails a full URL or the direct submission ID.
 * https://leetcode.com/problems/implement-stack-using-queues/submissions/1035629181/
 * https://leetcode.com/submissions/detail/1035629181/
 * 1035629181
 * https://leetcode.com/problems/unique-paths/submissions/1039832006/?envType=daily-question&envId=2023-09-03
 */
