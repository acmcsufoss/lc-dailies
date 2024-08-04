import { DenoKvLeaderboardClient } from "lc-dailies/lib/leaderboard/denokv/mod.ts";
import * as lc from "lc-dailies/lib/lc/mod.ts";
import * as api from "lc-dailies/lib/api/api.ts";
import { executeDailyWebhook } from "lc-dailies/lib/api/dailies.ts";

if (import.meta.main) {
  await main();
}

async function main() {
  const kv = await Deno.openKv(Deno.env.get("KV_URL")!);
  const lcClient = new lc.LCClient();
  const leaderboardClient = new DenoKvLeaderboardClient(
    kv,
    lcClient,
  );
  const discordApplicationID = Deno.env.get("DISCORD_APPLICATION_ID")!;
  const discordChannelID = Deno.env.get("DISCORD_CHANNEL_ID")!;
  const discordPublicKey = Deno.env.get("DISCORD_PUBLIC_KEY")!;
  const discordToken = Deno.env.get("DISCORD_TOKEN")!;
  const router = await api.makeAPIRouter({
    leaderboardClient,
    discordApplicationID,
    discordChannelID,
    discordPublicKey,
    discordToken,
  });

  Deno.cron(
    "sync leaderboard",
    // Sync at 5 minutes before every hour.
    "55 * * * *",
    async () => {
      await leaderboardClient.sync();
    },
  );

  Deno.cron(
    "execute daily webhook",
    // Execute every day at 12:00:000 AM UTC.
    "0 0 * * *",
    async () => {
      const webhookURL = Deno.env.get("DISCORD_WEBHOOK_URL")!;
      await executeDailyWebhook(
        lcClient,
        leaderboardClient,
        webhookURL,
      );
    },
  );

  const port = Number(Deno.env.get("PORT"));
  Deno.serve(
    {
      port,
      onListen: api.makeOnListen(port, discordApplicationID),
    },
    (request) => router.fetch(request),
  );
}
