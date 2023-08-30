import * as env from "./env.ts";
import * as lc from "./lc/mod.ts";
import * as lc_dailies from "./server/servers/lc_dailies/mod.ts";
import { DenoKvLeaderboardClient } from "./leaderboard/denokv/mod.ts";

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
  const s = lc_dailies.makeLCDailiesServer(
    env.PORT,
    env.DISCORD_APPLICATION_ID,
    env.DISCORD_PUBLIC_KEY,
    env.DISCORD_CHANNEL_ID,
    env.DISCORD_WEBHOOK_URL,
    env.WEBHOOK_TOKEN,
    lcClient,
    leaderboardClient,
  );

  await s.serve(
    lc_dailies.makeOnLoad(
      env.PORT,
      env.DISCORD_APPLICATION_ID,
      env.DISCORD_TOKEN,
    ),
  )
    .finished
    .finally(() => {
      kv.close();
    });
}
