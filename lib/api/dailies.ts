import { type APIEmbed, WEEK } from "lc-dailies/deps.ts";
import * as api from "./mod.ts";
import * as discord from "lc-dailies/lib/discord/mod.ts";
import * as lc from "lc-dailies/lib/lc/mod.ts";
import * as leaderboard from "lc-dailies/lib/leaderboard/mod.ts";
import * as snacks from "./snacks.ts";

export async function executeDailyWebhook(
  lcClient: lc.LCClient,
  leaderboardClient: leaderboard.LeaderboardClient,
  webhookURL: string,
  seasonID?: string | null,
): Promise<Response> {
  // Get the daily question.
  const question = await lcClient.getDailyQuestion();
  const questionDate = new Date(`${question.date} GMT`);
  const isSunday = questionDate.getDay() === 0;

  // Get the stored season.
  const storedSeason = seasonID
    ? await leaderboardClient.getSeason(seasonID)
    : await leaderboardClient.getLatestSeason();

  // If the season is ongoing, then sync it.
  const referenceDate = new Date();

  let isLatestSeason = false;
  if (storedSeason) {
    const seasonStartDate = new Date(storedSeason.start_date).getTime();
    const seasonEndDate = seasonStartDate + WEEK;
    isLatestSeason = leaderboard.checkDateBetween(
      seasonStartDate,
      seasonEndDate,
      referenceDate.getTime(),
    );
  }

  // Sync the season if it is ongoing and not synced.
  const syncedSeason = isLatestSeason && storedSeason
    ? await leaderboardClient
      .sync(storedSeason.id)
      .then((response) => response.season)
    : null;

  // Format the webhook embed.
  const embeds = makeDailyWebhookEmbeds({
    question,
    questionDate,
    season: isSunday ? (syncedSeason ?? storedSeason) : null,
  });

  // Execute the webhook.
  await discord.executeWebhook({
    url: webhookURL,
    data: { embeds },
  });

  // If the season is not synced, then sync it to set up the next season.
  if (!syncedSeason) {
    await leaderboardClient.sync(undefined, referenceDate);
  }

  // Acknowledge the request.
  return new Response("OK");
}

/**
 * DailyWebhookOptions are the options for makeDailyWebhookEmbeds.
 */
export interface DailyWebhookOptions {
  /**
   * question is the daily question.
   */
  question: api.Question;

  /**
   * questionDate is the date of the question.
   */
  questionDate: Date;

  /**
   * season is the season to recap.
   */
  season: api.Season | null;
}

/**
 * makeDailyWebhookEmbeds formats a daily webhook.
 */
export function makeDailyWebhookEmbeds(
  options: DailyWebhookOptions,
): APIEmbed[] {
  const embed: APIEmbed = {
    title: options.question.title,
    url: options.question.url,
    description: `Daily Leetcode question for ${options.question.date}.`,
    color: getColorByDifficulty(options.question.difficulty),
    fields: [
      {
        name: "Difficulty",
        value: options.question.difficulty,
        inline: true,
      },
      {
        name: "Here is a snack to get your brain working!",
        value: snacks.pickRandom(options.questionDate),
        inline: true,
      },
      {
        name:
          "Register to play by typing `/lc register YOUR_LC_USERNAME` below!",
        value: "[See more…](https://acmcsuf.com/lc-dailies-handbook)",
      },
    ],
  };

  if (options.season) {
    embed.fields?.push({
      name: `Leaderboard for week of ${options.season.start_date}`,
      value: [
        "```",
        leaderboard.formatScores(options.season),
        "```",
      ].join("\n"),
    });
  }

  return [embed];
}

/**
 * getColorByDifficulty returns a color for a difficulty.
 */
export function getColorByDifficulty(difficulty: string): number | undefined {
  switch (difficulty) {
    case "Easy": {
      return 0x339933;
    }

    case "Medium": {
      return 0xff6600;
    }

    case "Hard": {
      return 0xe91e63;
    }
  }
}
