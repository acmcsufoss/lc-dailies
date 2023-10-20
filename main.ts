import { DenoKvLeaderboardClient } from "lc-dailies/lib/leaderboard/denokv/mod.ts";
import { Router } from "lc-dailies/lib/router/mod.ts";
import * as lc from "lc-dailies/lib/lc/mod.ts";
import * as api from "./lib/api/mod.ts";
import {
  DISCORD_APPLICATION_ID,
  DISCORD_CHANNEL_ID,
  DISCORD_PUBLIC_KEY,
  DISCORD_TOKEN,
  DISCORD_WEBHOOK_URL,
  KV_URL,
  PORT,
  WEBHOOK_TOKEN,
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
  const r = api.makeAPIRouter(
    DISCORD_APPLICATION_ID,
    DISCORD_PUBLIC_KEY,
    DISCORD_CHANNEL_ID,
    DISCORD_WEBHOOK_URL,
    WEBHOOK_TOKEN,
    lcClient,
    leaderboardClient,
  );

  await Router.serve(
    {
      port: PORT,
      onListen: api.makeOnListen(
        PORT,
        DISCORD_APPLICATION_ID,
        DISCORD_TOKEN,
      ),
    },
    r,
  )
    .finished
    .finally(() => {
      kv.close();
    });
}
