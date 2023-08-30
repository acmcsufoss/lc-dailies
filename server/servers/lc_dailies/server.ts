import * as app from "../../../app/mod.ts";
import * as discord from "../../../discord/mod.ts";
import * as lc from "../../../lc/mod.ts";
import * as leaderboard from "../../../leaderboard/mod.ts";
import * as server from "../../../server/mod.ts";
import * as handlers from "../../../server/handlers/mod.ts";

/**
 * makeLCDailiesServer creates a server which handles requests on the
 * LC-Dailies API.
 */
export function makeLCDailiesServer(
  port: number,
  discordApplicationID: string,
  discordPublicKey: string,
  discordChannelID: string,
  webhookURL: string,
  webhookToken: string,
  lcClient: lc.LCClient,
  leaderboardClient: leaderboard.LeaderboardClient,
) {
  return new server.Server(port)
    .post(
      new URLPattern({ pathname: "/" }),
      (() => {
        const handle = app.makeDiscordAppHandler(
          leaderboardClient,
          discordPublicKey,
          discordChannelID,
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
        webhookURL,
        webhookToken,
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
          Response.redirect(makeInviteURL(discordApplicationID)),
        ),
    );
}

/**
 * makeOnLoad creates a function which is called when the server is
 * loaded.
 */
export function makeOnLoad(
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
      app: app.APP_LC,
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
      `http://127.0.0.1:${port}/invite/`,
    );
    console.log(
      "- Latest season:",
      `http://127.0.0.1:${port}/seasons/latest/`,
    );
  };
}

function makeInviteURL(applicationID: string) {
  return `https://discord.com/api/oauth2/authorize?client_id=${applicationID}&scope=applications.commands`;
}
