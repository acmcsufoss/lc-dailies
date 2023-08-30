import * as app from "./app/mod.ts";
import * as server from "./server/mod.ts";
import * as handlers from "./server/handlers/mod.ts";
import * as lc from "./lc/mod.ts";
import * as env from "./env.ts";
import * as discord from "./discord/mod.ts";
import { DenoKvLeaderboardClient } from "./leaderboard/denokv/mod.ts";
import { APP_LC } from "./app/app.ts";

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
  const s = new server.Server(env.PORT)
    .post(
      new URLPattern({ pathname: "/" }),
      app.makeDiscordAppHandler(
        leaderboardClient,
        env.DISCORD_PUBLIC_KEY,
        env.DISCORD_CHANNEL_ID,
      ),
    )
    .post(
      new URLPattern({ pathname: "/daily/:token" }),
      handlers.makeDailyWebhookPostHandler(
        lcClient,
        env.DISCORD_WEBHOOK_URL,
        env.WEBHOOK_TOKEN,
      ),
    )
    .get(
      new URLPattern({ pathname: "/seasons" }),
      // TODO: Add an implementation for makeSeasonsGetHandler.
      handlers.makeSeasonsGetHandler(),
    )
    .get(
      new URLPattern({ pathname: "/seasons/:season_id" }),
      // TODO: Add an implementation for makeSeasonGetHandler.
      handlers.makeSeasonGetHandler(),
    );

  s.serve(async () => {
    // Overwrite the Discord Application Command.
    await discord.registerCommand({
      app: APP_LC,
      botID: env.DISCORD_CLIENT_ID,
      botToken: env.DISCORD_TOKEN,
    });

    console.log(
      "Invite Boardd to your server:",
      `https://discord.com/api/oauth2/authorize?client_id=${env.DISCORD_CLIENT_ID}&scope=applications.commands`,
      "\n",
      "Discord application information:",
      `https://discord.com/developers/applications/${env.DISCORD_CLIENT_ID}/bot`,
      "\n",
      "Latest season:",
      `http://127:0.0.1:${env.PORT}/seasons/latest`,
    );
  });
}
