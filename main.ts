import { WEBHOOK_URL } from "./env.ts";
import * as discord from "./discord.ts";
import * as lc_client from "./lc_client.ts";
import * as snacks from "./snacks.ts";

if (import.meta.main) {
  await main();
}

async function main() {
  const client = new lc_client.LCClient();
  const question = await client.getDailyQuestion();
  const content = formatLCDailyQuestion(question);
  await discord.executeWebhook({
    url: WEBHOOK_URL,
    data: { content },
  });
}

function formatLCDailyQuestion(
  question: lc_client.LCDailyQuestion,
): string {
  return [
    `## Daily Leetcode Question for ${question.date}`,
    `**Question**: ${question.title}`,
    `**Difficulty**: ${question.difficulty}`,
    `**Link**: <${question.url}>`,
    `**Snack**: Here is a snack to get your brain working: ${snacks.pickRandom()}`,
  ].join("\n");
}
