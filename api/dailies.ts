import type { APIEmbed } from "lc-dailies/deps.ts";
import * as discord from "lc-dailies/lib/discord/mod.ts";
import * as router from "lc-dailies/lib/router/mod.ts";
import * as lc from "lc-dailies/lib/lc/mod.ts";
import * as leaderboard from "lc-dailies/lib/leaderboard/mod.ts";
import * as snacks from "./snacks.ts";

/**
 * makeDailyWebhookPostHandler creates a handler for daily webhook POST requests.
 */
export function makeDailyWebhookPostHandler(
  lcClient: lc.LCClient,
  leaderboardClient: leaderboard.LeaderboardClient,
  webhookURL: string,
  webhookToken?: string,
) {
  /**
   * handlePostDailyWebhook handles POST requests to the daily webhook.
   */
  return async function handlePostDailyWebhook(
    request: router.RouterRequest,
  ): Promise<Response> {
    // Check the webhook token.
    const token = request.params["token"];
    if (webhookToken && token !== webhookToken) {
      return new Response("Invalid token", { status: 401 });
    }

    // Get the season ID if applicable.
    const seasonID = request.url.searchParams.get("season_id");

    // Execute the webhook.
    return await executeDailyWebhook(
      lcClient,
      leaderboardClient,
      webhookURL,
      seasonID,
    );
  };
}

async function executeDailyWebhook(
  lcClient: lc.LCClient,
  leaderboardClient: leaderboard.LeaderboardClient,
  webhookURL: string,
  seasonID: string | null,
): Promise<Response> {
  // Get the daily question.
  const question = await lcClient.getDailyQuestion();

  // Get the season data if a season ID is provided or if it is Sunday.
  const isSunday = new Date(question.date).getDay() === 0;
  const season = seasonID
    ? await leaderboardClient.getSeason(seasonID)
    : isSunday
    ? await leaderboardClient.getCurrentSeason()
    : null;

  // Format the webhook embed.
  const embeds = makeDailyWebhookEmbeds({ question, season });

  // Execute the webhook.
  await discord.executeWebhook({
    url: webhookURL,
    data: { embeds },
  });

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
  question: lc.DailyQuestion;

  /**
   * season is the season to recap.
   */
  season: leaderboard.Season | null;
}

/**
 * makeDailyWebhookEmbeds formats a daily webhook.
 */
export function makeDailyWebhookEmbeds(
  options: DailyWebhookOptions,
): APIEmbed[] {
  const questionEmbed: APIEmbed = {
    title: `Daily Leetcode Question for ${options.question.date}`,
    description: options.question.title,
    url: options.question.url,
    fields: [
      {
        name: "Difficulty",
        value: options.question.difficulty,
        inline: true,
      },
      {
        name: "Snack",
        value: snacks.pickRandom(),
        inline: true,
      },
      {
        name: "Submit",
        value:
          "Submit your solution by typing `/lc submit YOUR_SUBMISSION_URL` below! [More Info](https://acmcsuf.com/lc-dailies-handbook)",
      },
    ],
  };

  if (!options.season) {
    return [questionEmbed];
  }

  const scores = leaderboard.calculateSeasonScores(
    leaderboard.makeDefaultCalculateScoresOptions(options.season),
  );
  const leaderboardContent = [
    "```",
    "Rank | Name | Score",
    "--- | --- | ---",
    ...Object.entries(scores).map(([playerID, score], i) => {
      const player = options.season!.players[playerID];
      return `${i + 1} | ${player.lc_username} | ${score}`;
    }),
    "```",
  ].join("\n");

  const leaderboardEmbed: APIEmbed = {
    title: `Leaderboard for ${options.season.start_date}`,
    fields: [
      {
        name: "Leaderboard",
        value: leaderboardContent,
      },
    ],
  };

  return [questionEmbed, leaderboardEmbed];
}
