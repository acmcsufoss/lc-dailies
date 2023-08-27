import * as env from "./env.ts";
import * as discord from "./discord.ts";
import * as lc from "./lc.ts";
import * as snacks from "./snacks.ts";

if (import.meta.main) {
  await main();
}

async function main() {
  const client = new lc.LCClient();
  const question = await getDailyQuestion(client);
  const content = formatLCDailyQuestion(question);
  await discord.executeWebhook({
    url: env.WEBHOOK_URL,
    data: { content },
  });
}

async function getDailyQuestion(
  client: lc.LCClient,
): Promise<lc.DailyQuestion> {
  const date = new Date();
  const [question] = await client.listDailyQuestions(
    1,
    date.getFullYear(),
    date.getMonth() + 1,
  );
  if (!question) {
    throw new Error("No daily question found");
  }

  return question;
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
