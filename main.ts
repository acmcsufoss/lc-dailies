import { DenoKvLeaderboardClient } from "~/lib/leaderboard/denokv/mod.ts";
import { Router } from "~/lib/router/mod.ts";
import * as lc from "~/lib/lc/mod.ts";
import * as api from "~/api/mod.ts";
import * as env from "~/env.ts";

if (import.meta.main) {
  await main();
}

async function main() {
  const kv = await Deno.openKv();
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
