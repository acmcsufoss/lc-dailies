import { DenoKvLeaderboardClient } from "lc-dailies/lib/leaderboard/denokv/mod.ts";
import { Router } from "lc-dailies/lib/router/mod.ts";
import * as lc from "lc-dailies/lib/lc/mod.ts";
import * as api from "lc-dailies/api/mod.ts";
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
  try {
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
  } catch (error) {
    // TODO: Resolve this error.
    //
    // Task start deno run -A --unstable main.ts
    // - Discord application information: https://discord.com/developers/applications/1130004756153253960/
    // - Interaction endpoint: http://127.0.0.1:8080/
    // - Invite LC-Dailies to your server: http://127.0.0.1:8080/invite
    // - Latest season: http://127.0.0.1:8080/seasons/latest
    // SyntaxError: Unexpected token 'O', "OK" is not valid JSON
    //     at parse (<anonymous>)
    //     at packageData (ext:deno_fetch/22_body.js:369:14)
    //     at consumeBody (ext:deno_fetch/22_body.js:246:12)
    //     at eventLoopTick (ext:core/01_core.js:183:11)
    console.log(error);
  }
}
