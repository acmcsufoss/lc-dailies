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
      (() => {
        const handle = app.makeDiscordAppHandler(
          leaderboardClient,
          env.DISCORD_PUBLIC_KEY,
          env.DISCORD_CHANNEL_ID,
        );
        return async (r: server.ServerRequest) =>
          await handle(r).catch((e) => {
            console.error(e);
            return new Response("Internal Server Error", { status: 500 });
          });
      })(),
    )
    .post(
      new URLPattern({ pathname: "/webhook/:token" }),
      handlers.makeDailyWebhookPostHandler(
        lcClient,
        env.DISCORD_WEBHOOK_URL,
        env.WEBHOOK_TOKEN,
      ),
    )
    .get(
      new URLPattern({ pathname: "/seasons" }),
      handlers.makeSeasonsGetHandler(leaderboardClient),
    )
    .get(
      new URLPattern({ pathname: "/seasons/:season_id" }),
      handlers.makeSeasonGetHandler(leaderboardClient),
    )
    .get(
      new URLPattern({ pathname: "/invite" }),
      () =>
        Promise.resolve(
          Response.redirect(makeInviteURL(env.DISCORD_APPLICATION_ID)),
        ),
    );

  await s.serve(onLoad).finished.finally(() => {
    kv.close();
  });
}

/**
 * onLoad is callback which is called when the server starts listening.
 */
async function onLoad() {
  // Overwrite the Discord Application Command.
  await discord.registerCommand({
    app: APP_LC,
    applicationID: env.DISCORD_APPLICATION_ID,
    botToken: env.DISCORD_TOKEN,
  });

  console.log(
    "- Discord application information:",
    `https://discord.com/developers/applications/${env.DISCORD_APPLICATION_ID}/`,
  );
  console.log(
    "- Interaction endpoint:",
    `http://127.0.0.1:${env.PORT}/`,
  );
  console.log(
    "- Invite LC-Dailies to your server:",
    `http://127.0.0.1:${env.PORT}/invite/`,
  );
  console.log(
    "- Latest season:",
    `http://127.0.0.1:${env.PORT}/seasons/latest/`,
  );
}

function makeInviteURL(applicationID: string) {
  return `https://discord.com/api/oauth2/authorize?client_id=${applicationID}&scope=applications.commands`;
}
