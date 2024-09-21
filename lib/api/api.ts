import { createRouter } from "@fartlabs/rt";
import * as leaderboard from "lc-dailies/lib/leaderboard/mod.ts";
import * as discord_app from "./discord/mod.ts";
import type { Season } from "./types.ts";

export * from "./types.ts";

/**
 * APIRouterOptions are the options for the API router.
 */
export interface APIRouterOptions {
  leaderboardClient: leaderboard.LeaderboardClient;
  discordChannelID: string;
  discordApplicationID: string;
  discordPublicKey: string;
  discordToken: string;
}

/**
 * makeAPIRouter creates a router which handles requests on the
 * LC-Dailies API.
 */
export async function makeAPIRouter(options: APIRouterOptions) {
  const app = await discord_app.makeDiscordAppHandler(
    options.leaderboardClient,
    options.discordApplicationID,
    options.discordChannelID,
    options.discordPublicKey,
    options.discordToken,
  );
  return createRouter()
    .post(
      "/",
      (ctx) => discord_app.withErrorResponse(app)(ctx.request),
    )
    .get(
      "/invite",
      () => Response.redirect(makeInviteURL(options.discordApplicationID)),
    )
    .get(
      "/source",
      () => Response.redirect("https://github.com/acmcsufoss/lc-dailies"),
    )
    .get(
      "/seasons",
      async () => {
        const seasons = await options.leaderboardClient.listSeasons();
        return withCORS(new Response(JSON.stringify(seasons)));
      },
    )
    .get<"season_id">(
      "/seasons/:season_id.txt",
      async (ctx) => {
        const seasonID = ctx.params["season_id"];
        if (!seasonID) {
          return new Response("Missing season ID", { status: 400 });
        }

        const season = await getSeasonByIDOrLatest(
          options.leaderboardClient,
          seasonID,
        );
        if (!season) {
          return new Response("Season not found", { status: 404 });
        }

        const text = leaderboard.formatScores(season);
        return withCORS(
          new Response(text, { headers: { "Content-Type": "text/plain" } }),
        );
      },
    )
    .get<"season_id">(
      "/seasons/:season_id",
      async (ctx) => {
        const seasonID = ctx.params["season_id"];
        if (!seasonID) {
          return new Response("Missing season ID", { status: 400 });
        }

        const season = await getSeasonByIDOrLatest(
          options.leaderboardClient,
          seasonID,
        );
        return withCORS(new Response(JSON.stringify(season)));
      },
    );
}

/**
 * makeOnLoad creates a function which is called when the server is
 * loaded.
 */
export function makeOnListen(
  port: number,
  discordApplicationID: string,
) {
  /**
   * onLoad is callback which is called when the server starts listening.
   */
  return function onLoad() {
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

/**
 * withCORS wraps a Response with common CORS headers.
 */
function withCORS(response: Response): Response {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );

  return response;
}

/**
 * getSeasonByIDOrLatest gets a season by ID or the latest season.
 */
async function getSeasonByIDOrLatest(
  leaderboardClient: leaderboard.LeaderboardClient,
  seasonID: string | undefined,
): Promise<Season | null> {
  const season = !seasonID || seasonID === "latest"
    ? await leaderboardClient.getLatestSeason()
    : await leaderboardClient.getSeason(seasonID);
  if (season && !season.scores) {
    season.scores = await leaderboard.calculateScores(
      leaderboard.makeDefaultCalculateScoresOptions(
        season.players,
        season.questions,
        season.submissions,
      ),
    );
  }

  return season;
}
