import { executeDailyWebhook } from "lc-dailies/lib/api/dailies.ts";
import * as lc from "lc-dailies/lib/lc/mod.ts";
import { DISCORD_WEBHOOK_URL, KV_URL } from "lc-dailies/env.ts";
import { DenoKvLeaderboardClient } from "lc-dailies/lib/leaderboard/denokv/mod.ts";

export function setupCron() {
  Deno.cron("discord_webhook", { dayOfWeek: { every: 1 } }, async () => {
    const kv = await Deno.openKv(KV_URL);
    const lcClient = new lc.LCClient();
    const leaderboardClient = new DenoKvLeaderboardClient(
      kv,
      lcClient,
    );
    await executeDailyWebhook(
      lcClient,
      leaderboardClient,
      DISCORD_WEBHOOK_URL,
    );
  });

  // TODO: Abstract sync function from executeDailyWebhook.
  // TODO: Sync every 15 minutes.
  Deno.cron("sync", {}, () => {});
}
