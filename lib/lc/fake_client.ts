import type {
  LCClientInterface,
  LCQuestion,
  LCSubmission,
} from "./client_interface.ts";

export const FAKE_LC_USERNAME = "fake_lc_username";
export const FAKE_LC_QUESTION_NAME = "fake_lc_question_name";
export const FAKE_LC_QUESTION_TITLE = "fake_lc_question_title";
export const FAKE_LC_QUESTION_URL = "fake_lc_question_url";
export const FAKE_LC_QUESTION_DIFFICULTY = "fake_lc_question_difficulty";
export const FAKE_LC_QUESTION_DATE = "2023-07-31";
export const FAKE_LC_QUESTION: LCQuestion = {
  name: FAKE_LC_QUESTION_NAME,
  title: FAKE_LC_QUESTION_TITLE,
  url: FAKE_LC_QUESTION_URL,
  difficulty: FAKE_LC_QUESTION_DIFFICULTY,
  date: FAKE_LC_QUESTION_DATE,
};
export const FAKE_LC_QUESTIONS: LCQuestion[] = [FAKE_LC_QUESTION];
export const FAKE_RECENT_SUBMISSION_ID = "1031839418";
export const FAKE_RECENT_SUBMISSION_TIMESTAMP = "1690761600";
export const FAKE_RECENT_SUBMISSION: LCSubmission = {
  id: FAKE_RECENT_SUBMISSION_ID,
  name: FAKE_LC_QUESTION_NAME,
  title: FAKE_LC_QUESTION_TITLE,
  timestamp: FAKE_RECENT_SUBMISSION_TIMESTAMP,
};
export const FAKE_RECENT_SUBMISSIONS: LCSubmission[] = [
  FAKE_RECENT_SUBMISSION,
];

/**
 * FakeLCClient is a fake implementation of LCClient.
 */
export class FakeLCClient implements LCClientInterface {
  public verifyUser(username: string): Promise<boolean> {
    return Promise.resolve(username === FAKE_LC_USERNAME);
  }

  public listDailyQuestions(
    _: number,
    __: number,
    ___: number,
  ): Promise<LCQuestion[]> {
    return Promise.resolve(FAKE_LC_QUESTIONS);
  }

  public getRecentAcceptedSubmissions(
    _: string,
    __: number,
  ): Promise<LCSubmission[]> {
    return Promise.resolve(FAKE_RECENT_SUBMISSIONS);
  }

  public getDailyQuestion(): Promise<LCQuestion> {
    return Promise.resolve(FAKE_LC_QUESTION);
  }
}
