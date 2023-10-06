import { DAY } from "lc-dailies/deps.ts";
import type * as api from "lc-dailies/api/mod.ts";

/**
 * CalculateScoresOptions is the options for calculateScores.
 */
export interface CalculateScoresOptions {
  /**
   * submissions are the submissions in the season.
   */
  submissions: api.Season["submissions"];

  /**
   * questions are the questions in the season.
   */
  questions: api.Season["questions"];

  /**
   * players are the players in the season.
   */
  players: api.Season["players"];

  /**
   * possibleHighestScore is the highest possible score.
   */
  possibleHighestScore: number;

  /**
   * possibleLowestScore is the lowest possible score.
   */
  possibleLowestScore: number;

  /**
   * duration is the amount of milliseconds it takes to linearly interpolate
   * between the highest and lowest possible scores.
   */
  duration: number;
}

/**
 * calculateSubmissionScore calculates the score of a submission.
 */
export function calculateSubmissionScore(
  submission: api.LCSubmission,
  question: api.LCQuestion,
  options: CalculateScoresOptions,
): number {
  const questionDate = new Date(`${question.date} GMT`);
  const submissionDate = new Date(submission.date);
  const msElapsed = submissionDate.getTime() - questionDate.getTime();
  const ratio = Math.min(Math.max(msElapsed / options.duration, 0), 1);
  const questionScore =
    ((options.possibleHighestScore - options.possibleLowestScore) *
      ratio) + options.possibleLowestScore;
  return Math.ceil(questionScore);
}

/**
 * calculatePlayerScore calculates the score of a player in a season.
 *
 * See:
 * https://github.com/acmcsufoss/lc-dailies/issues/32#issuecomment-1728904942
 */
export function calculatePlayerScore(
  playerID: string,
  options: CalculateScoresOptions,
): number {
  const submissions = options.submissions[playerID];
  if (!submissions) {
    return 0;
  }

  const scoreSum = Object.entries(submissions)
    .reduce((score, [questionID, submission]) => {
      const question = options.questions[questionID];
      if (!question) {
        return score;
      }

      return score + calculateSubmissionScore(
        submission,
        question,
        options,
      );
    }, 0);

  return scoreSum;
}

/**
 * calculateSeasonScores calculates the scores of all players in a season.
 *
 * Returns a map of player ID to score.
 */
export function calculateSeasonScores(
  options: CalculateScoresOptions,
): Record<string, number> {
  return Object.keys(options.players)
    .reduce((scores, playerID) => {
      scores[playerID] = calculatePlayerScore(playerID, options);
      return scores;
    }, {} as Record<string, number>);
}

/**
 * makeDefaultCalculateScoresOptions creates a default CalculateScoresOptions.
 */
export function makeDefaultCalculateScoresOptions(
  players: api.Season["players"],
  questions: api.Season["questions"],
  submissions: api.Season["submissions"],
): CalculateScoresOptions {
  return {
    players,
    questions,
    submissions,
    possibleHighestScore: 100,
    possibleLowestScore: 50,
    duration: DAY,
  };
}
