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
    const seasonID = request.url.searchParams.get("season_id") || undefined;

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
  seasonID?: string,
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

  // Format the webhook content.
  const content = formatDailyWebhook({ question, season });

  // Execute the webhook.
  await discord.executeWebhook({
    url: webhookURL,
    data: { content },
  });

  // Acknowledge the request.
  return new Response("OK");
}

/**
 * FormatDailyWebhookOptions are the options for formatDailyWebhook.
 */
export interface FormatDailyWebhookOptions {
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
 * formatDailyWebhook formats a daily webhook.
 */
export function formatDailyWebhook(
  options: FormatDailyWebhookOptions,
): string {
  const content = [
    `## Daily Leetcode Question for ${options.question.date}`,
    `**Question**: ${options.question.title}`,
    `**Difficulty**: ${options.question.difficulty}`,
    `**Link**: <${options.question.url}>`,
    `**Snack**: Here is a snack to get your brain working: ${snacks.pickRandom()}`,
    "",
    "Submit your solution by typing `/lc submit YOUR_SUBMISSION_URL` below! ([more info](https://acmcsuf.com/lc-dailies-handbook))",
  ].join("\n");

  if (!options.season) {
    return content;
  }

  // TODO: Render the leaderboard.
  return content;
}
