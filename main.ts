import { WEBHOOK_URL } from "./env.ts";
import * as discord_webhook from "./discord_webhook.ts";
import * as lc_client from "./lc_client.ts";

const client = new lc_client.LCClient();

console.log(JSON.stringify(await client.getDailyQuestion(), null, 2));

await discord_webhook.execute({
  url: WEBHOOK_URL,
  data: {
    "content": "Daily Leetcode Question",
  },
});

function formatLCDailyQuestion(
  question: lc_client.LCDailyQuestion,
): string {
  return [
    `Daily Leetcode Question for ${question.date}`,
    `Question: ${question.title}`,
    `Difficulty: ${question.difficulty}`,
    `Link: ${question.url}`,
  ].join("\n");
}
