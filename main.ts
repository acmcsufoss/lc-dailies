import { DenoKvLeaderboardClient } from "lc-dailies/lib/leaderboard/denokv/mod.ts";
import { Router } from "lc-dailies/lib/router/mod.ts";
import * as lc from "lc-dailies/lib/lc/mod.ts";
import * as api from "lc-dailies/lib/api/mod.ts";
import {
  DISCORD_APPLICATION_ID,
  DISCORD_CHANNEL_ID,
  DISCORD_PUBLIC_KEY,
  DISCORD_TOKEN,
  KV_URL,
  PORT,
} from "lc-dailies/env.ts";

if (import.meta.main) {
  await main();
}

async function main() {
  const kv = await Deno.openKv(KV_URL);
  const lcClient = new lc.LCClient();
  const leaderboardClient = new DenoKvLeaderboardClient(
    kv,
    lcClient,
  );
  const router = api.makeAPIRouter({
    discordApplicationID: DISCORD_APPLICATION_ID,
    discordPublicKey: DISCORD_PUBLIC_KEY,
    discordChannelID: DISCORD_CHANNEL_ID,
    leaderboardClient,
  });

  Router.serve(
    {
      port: PORT,
      onListen: api.makeOnListen(
        PORT,
        DISCORD_APPLICATION_ID,
        DISCORD_TOKEN,
      ),
    },
    router,
  )
    .finished
    .finally(() => kv.close());
}
