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
 * LCClient is the client for Leetcode.
 */
export class LCClient {
  /**
   * getDailyQuestion gets the daily question from Leetcode.
   */
  public async getDailyQuestion(): Promise<LCDailyQuestion> {
    return await fetch("https://leetcode.com/graphql/", {
      "headers": {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9",
        "authorization": "",
        "content-type": "application/json",
      },
      "body":
        '{"query":"\\n    query questionOfToday {\\n  activeDailyCodingChallengeQuestion {\\n    date\\n    userStatus\\n    link\\n    question {\\n      acRate\\n      difficulty\\n      freqBar\\n      frontendQuestionId: questionFrontendId\\n      isFavor\\n      paidOnly: isPaidOnly\\n      status\\n      title\\n      titleSlug\\n      hasVideoSolution\\n      hasSolution\\n      topicTags {\\n        name\\n        id\\n        slug\\n      }\\n    }\\n  }\\n}\\n    ","variables":{},"operationName":"questionOfToday"}',
      "method": "POST",
    }).then((response) => response.json());
  }
}
