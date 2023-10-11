/**
 * Player is a registered player from Leetcode.
 */
export interface Player {
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
 * Players is a map of players by Discord user ID.
 */
export interface Players {
  [discord_user_id: string]: Player;
}

/**
 * Submission is a Leetcode submission.
 */
export interface Submission {
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
 * Submissions is a map of submissions by question name
 * by Discord user ID.
 */
export interface Submissions {
  [discord_user_id: string]: {
    [question_name: string]: Submission;
  };
}

/**
 * Question is a Leetcode question.
 */
export interface Question {
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
 * Questions is a map of questions by question name.
 */
export interface Questions {
  [question_name: string]: Question;
}

/**
 * Scores is a map of scores by Discord user ID.
 */
export interface Scores {
  [discord_user_id: string]: number;
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
  scores: Scores;

  /**
   * players is the map of players in the season.
   */
  players: Players;

  /**
   * questions is the map of questions in the season.
   */
  questions: Questions;

  /**
   * submissions is the map of submissions in the season.
   */
  submissions: Submissions;
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
 * SyncResponse is the response for the sync subcommand.
 */
export interface SyncResponse {
  /**
   * season is the season that was synced.
   */
  season: Season;
}
