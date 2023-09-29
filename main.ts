import { DenoKvLeaderboardClient } from "lc-dailies/lib/leaderboard/denokv/mod.ts";
import { Router } from "lc-dailies/lib/router/mod.ts";
import * as lc from "lc-dailies/lib/lc/mod.ts";
import * as api from "lc-dailies/api/mod.ts";
import * as env from "lc-dailies/env.ts";

if (import.meta.main) {
  await main();
}

async function main() {
  const kv = await Deno.openKv(env.KV_URL);
  const lcClient = new lc.LCClient();
  const leaderboardClient = new DenoKvLeaderboardClient(
    kv,
    lcClient,
  );
  const r = api.makeAPIRouter(
    env.DISCORD_APPLICATION_ID,
    env.DISCORD_PUBLIC_KEY,
    env.DISCORD_CHANNEL_ID,
    env.DISCORD_WEBHOOK_URL,
    env.WEBHOOK_TOKEN,
    lcClient,
    leaderboardClient,
  );

  await Router.serve(
    {
      port: env.PORT,
      onListen: api.makeOnListen(
        env.PORT,
        env.DISCORD_APPLICATION_ID,
        env.DISCORD_TOKEN,
      ),
    },
    r,
  )
    .finished
    .finally(() => {
      kv.close();
    });
}
