import { WEBHOOK_URL } from "./env.ts";
import * as discord from "./discord.ts";
import * as lc from "./lc_client.ts";
import * as snacks from "./snacks.ts";

import type { LeaderboardClient } from "./leaderboard/mod.ts";
import { DenoKvLeaderboardClient } from "./leaderboard/denokv/mod.ts";

if (import.meta.main) {
  await main();
}

async function makeLeaderboardClient(): Promise<LeaderboardClient> {
  return new DenoKvLeaderboardClient(
    await Deno.openKv("./dev.db"),
    new lc.LCClient(),
  );
}

// TODO: Put everything back to normal.

async function main() {
  const client = await makeLeaderboardClient();
  const result = await client.getCurrentSeason();
  const result2 = await client.listSeasons();
  // const result3 = await client.register(
  //   "260901399729012736",
  //   "EthanThatOneKid",
  // );
  // const result55 = await (await Deno.openKv("./dev.db"))
  //   .get(["leaderboard_players", "260901399729012736"]);
  const result4 = await client.submit(
    "260901399729012736",
    lc.parseSubmissionID(
      "https://leetcode.com/problems/excel-sheet-column-title/submissions/1031839418/",
    ),
  );
  console.log({
    result,
    result2,
    // result3,
    // result55,
    // result4,
  });

  // const date = new Date();
  // const [question] = await client.listDailyQuestions(
  //   1,
  //   date.getFullYear(),
  //   date.getMonth() + 1,
  // );
  // const content = formatLCDailyQuestion(question);
  // await discord.executeWebhook({
  //   url: WEBHOOK_URL,
  //   data: { content },
  // });
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
