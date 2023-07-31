/**
 * LCDailyQuestion is the representation of Leetcode's daily question.
 *
 * Sample:
 * Daily Leetcode Question for 2021-10-20 (date)
 * Question: Find Eventual Safe States (question.title)
 * Difficulty: Medium (question.difficulty)
 * Link: https://leetcode.com/problems/find-eventual-safe-states/ (link)
 */
export interface LCDailyQuestion {
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
 * LCRecentSubmission is the representation of Leetcode's recent submission per user.
 */
export interface LCRecentSubmission {
  /**
   * id is the id details of the submission.
   */
  id: string;

  /**
   * title is the title of the submission.
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
   * getDailyQuestion gets the daily question from Leetcode.
   */
  public async getDailyQuestion(): Promise<LCDailyQuestion> {
    return await fetch("https://leetcode.com/graphql/", {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        authorization: "",
        "content-type": "application/json",
      },
      body:
        '{"query":"\\n    query questionOfToday {\\n  activeDailyCodingChallengeQuestion {\\n    date\\n    userStatus\\n    link\\n    question {\\n      acRate\\n      difficulty\\n      freqBar\\n      frontendQuestionId: questionFrontendId\\n      isFavor\\n      paidOnly: isPaidOnly\\n      status\\n      title\\n      titleSlug\\n      hasVideoSolution\\n      hasSolution\\n      topicTags {\\n        name\\n        id\\n        slug\\n      }\\n    }\\n  }\\n}\\n    ","variables":{},"operationName":"questionOfToday"}',
      method: "POST",
    })
      .then((response) => response.json())
      /**
       * Map the result of the graphql query into the shape of a LCDailyQuestion instance.
       */
      .then((json) => ({
        date: json.data.activeDailyCodingChallengeQuestion.date,
        title: json.data.activeDailyCodingChallengeQuestion.question.title,
        difficulty:
          json.data.activeDailyCodingChallengeQuestion.question.difficulty,
        url:
          `https://leetcode.com${json.data.activeDailyCodingChallengeQuestion.link}`,
      }));
  }

  /**
   * getRecentSubmissions gets the recent submissions from Leetcode by username.
   */
  public async getRecentSubmissions(
    username: string,
    limit: number,
  ): Promise<LCRecentSubmission[]> {
    return await fetch("https://leetcode.com/graphql/", {
      "headers": {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9",
        "authorization": "",
        "content-type": "application/json",
      },
      "method": "POST",
      body: JSON.stringify({
        operationName: "recentAcSubmissions",
        query:
          "\n    query recentAcSubmissions($username: String!, $limit: Int!) {\n  recentAcSubmissionList(username: $username, limit: $limit) {\n    id\n    title\n    titleSlug\n    timestamp\n  }\n}\n    ",
        variables: { username, limit },
      }),
    })
      .then((response) => response.json())
      .then((json) =>
        json.data.recentAcSubmissionList
          .map((
            acSubmission: { id: string; title: string; timestamp: string },
          ) => ({
            id: acSubmission.id,
            title: acSubmission.title,
            timestamp: acSubmission.timestamp,
          }))
      );
  }
}
