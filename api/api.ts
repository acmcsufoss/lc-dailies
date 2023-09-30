import * as discord from "lc-dailies/lib/discord/mod.ts";
import * as lc from "lc-dailies/lib/lc/mod.ts";
import * as leaderboard from "lc-dailies/lib/leaderboard/mod.ts";
import * as router from "lc-dailies/lib/router/mod.ts";
import * as discord_app from "./discord_app/mod.ts";
import {
  makeDailyWebhookPostHandler,
  makeManualDailyWebhookPostHandler,
} from "./dailies.ts";
import { makeSeasonGetHandler, makeSeasonsGetHandler } from "./seasons.ts";

/**
 * makeAPIRouter creates a router which handles requests on the
 * LC-Dailies API.
 */
export function makeAPIRouter(
  discordApplicationID: string,
  discordPublicKey: string,
  discordChannelID: string,
  webhookURL: string,
  webhookToken: string,
  lcClient: lc.LCClient,
  leaderboardClient: leaderboard.LeaderboardClient,
) {
  return new router.Router()
    .post(
      new URLPattern({ pathname: "/" }),
      discord_app.withErrorResponse(
        discord_app.makeDiscordAppHandler(
          leaderboardClient,
          discordPublicKey,
          discordChannelID,
        ),
      ),
    )
    .post(
      new URLPattern({ pathname: "/webhook" }),
      makeManualDailyWebhookPostHandler(
        lcClient,
        leaderboardClient,
      ),
    )
    .post(
      new URLPattern({ pathname: "/webhook/:token" }),
      makeDailyWebhookPostHandler(
        lcClient,
        leaderboardClient,
        webhookURL,
        webhookToken,
      ),
    )
    .get(
      new URLPattern({ pathname: "/seasons" }),
      makeSeasonsGetHandler(leaderboardClient),
    )
    .get(
      new URLPattern({ pathname: "/seasons/:season_id" }),
      makeSeasonGetHandler(leaderboardClient),
    )
    .get(
      new URLPattern({ pathname: "/invite" }),
      () =>
        Promise.resolve(
          Response.redirect(makeInviteURL(discordApplicationID)),
        ),
    );
}

/**
 * makeOnLoad creates a function which is called when the server is
 * loaded.
 */
export function makeOnListen(
  port: number,
  discordApplicationID: string,
  discordToken: string,
) {
  /**
   * onLoad is callback which is called when the server starts listening.
   */
  return async function onLoad() {
    // Overwrite the Discord Application Command.
    await discord.registerCommand({
      app: discord_app.APP_LC,
      applicationID: discordApplicationID,
      botToken: discordToken,
    });

    console.log(
      "- Discord application information:",
      `https://discord.com/developers/applications/${discordApplicationID}/`,
    );
    console.log(
      "- Interaction endpoint:",
      `http://127.0.0.1:${port}/`,
    );
    console.log(
      "- Invite LC-Dailies to your server:",
      `http://127.0.0.1:${port}/invite`,
    );
    console.log(
      "- Latest season:",
      `http://127.0.0.1:${port}/seasons/latest`,
    );
  };
}

function makeInviteURL(applicationID: string) {
  return `https://discord.com/api/oauth2/authorize?client_id=${applicationID}&scope=applications.commands`;
}

fetch(
  "http://127.0.0.1:8080/webhook?season_id=01H8T4MM00BQHHK7VTTEJE1WAS&webhook_url=https://discord.com/api/webhooks/1128189891847667712/jUq5uK9dzM4V99fsj8Y6b8tBiZx_idMB5DAMKAPJQ4rTbEiqoy7ah2qUpORWyfaHGl4l",
  {
    method: "POST",
  },
).then((res) => res.json()).then(console.log).catch(console.error);
