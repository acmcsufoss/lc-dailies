/**
 * LCPlayer is a registered player from Leetcode.
 */
export interface LCPlayer {
  /**
   * discord_user_id is the Discord user ID of the player.
   */
  discord_user_id: string;

  /**
   * lc_username is the Leetcode username of the player.
   */
  lc_username: string;
}

/**
 * LCSubmission is a Leetcode submission.
 */
export interface LCSubmission {
  /**
   * id is the ID of the submission.
   */
  id: string;

  /**
   * date is the timestamp of the Leetcode submission.
   */
  date: string;
}

/**
 * LCQuestion is a Leetcode question.
 */
export interface LCQuestion {
  /**
   * name is the name of the daily question.
   */
  name: string;

  /**
   * date is the date the daily question was posted in the format of YYYY-MM-DD.
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
 * Season is a season of the leaderboard.
 */
export interface Season {
  /**
   * id is the ID of the season.
   */
  id: string;

  /**
   * start_date is the start date of the season.
   */
  start_date: string;

  /**
   * scores is the map of scores in the season.
   */
  scores: { [discord_user_id: string]: number };

  /**
   * players is the map of players in the season.
   */
  players: { [discord_user_id: string]: LCPlayer };

  /**
   * questions is the map of questions in the season.
   */
  questions: { [lc_question_name: string]: LCQuestion };

  /**
   * submissions is the map of submissions in the season.
   */
  submissions: {
    [discord_user_id: string]: {
      [lc_question_name: string]: LCSubmission;
    };
  };
}

/**
 * RegisterResponse is the response for the register subcommand.
 */
export interface RegisterResponse {
  /**
   * ok is whether the registration was successful.
   */
  ok: boolean;
}

/**
 * SubmitResponse is the response for the submit subcommand.
 */
export interface SubmitResponse {
  /**
   * ok is whether the submission was successful.
   */
  ok: boolean;
}
