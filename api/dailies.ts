import * as discord from "~/lib/discord/mod.ts";
import * as router from "~/lib/router/mod.ts";
import * as lc from "~/lib/lc/mod.ts";
import * as snacks from "./snacks.ts";

/**
 * makeDailyWebhookPostHandler creates a handler for daily webhook POST requests.
 */
export function makeDailyWebhookPostHandler(
  lcClient: lc.LCClient,
  webhookURL: string,
  webhookToken?: string,
) {
  /**
   * handlePostDailyWebhook handles POST requests to the daily webhook.
   */
  return async function handlePostDailyWebhook(
    request: router.RouterRequest,
  ): Promise<Response> {
    const token = request.params["token"];
    if (webhookToken && token !== webhookToken) {
      return new Response("Invalid token", { status: 401 });
    }

    return await handleExecuteDailyWebhook(lcClient, webhookURL);
  };
}

async function handleExecuteDailyWebhook(
  lcClient: lc.LCClient,
  webhookURL: string,
): Promise<Response> {
  const question = await lcClient.getDailyQuestion();
  const content = formatLCDailyQuestion(question);
  await discord.executeWebhook({
    url: webhookURL,
    data: { content },
  });

  return new Response("OK");
}

function formatLCDailyQuestion(question: lc.DailyQuestion): string {
  return [
    `## Daily Leetcode Question for ${question.date}`,
    `**Question**: ${question.title}`,
    `**Difficulty**: ${question.difficulty}`,
    `**Link**: <${question.url}>`,
    `**Snack**: Here is a snack to get your brain working: ${snacks.pickRandom()}`,
  ].join("\n");
}
