import * as leaderboard from "lc-dailies/lib/leaderboard/mod.ts";
import * as router from "lc-dailies/lib/router/mod.ts";

/**
 * makeSeasonsGetHandler makes a handler that returns a list of seasons.
 */
export function makeSeasonsGetHandler(
  leaderboardClient: leaderboard.LeaderboardClient,
) {
  /**
   * handleGetSeasons handles GET requests to the seasons endpoint.
   */
  return async function handleGetSeasons(): Promise<Response> {
    const seasons = await leaderboardClient.listSeasons();
    return new Response(JSON.stringify(seasons));
  };
}

/**
 * makeSeasonGetHandler makes a handler that returns a season.
 */
export function makeSeasonGetHandler(
  leaderboardClient: leaderboard.LeaderboardClient,
) {
  /**
   * handleGetSeason handles GET requests to the season endpoint.
   */
  return async function handleGetSeason(
    request: router.RouterRequest,
  ): Promise<Response> {
    const seasonID = request.params["season_id"];
    if (!seasonID) {
      return new Response("Missing season ID", { status: 400 });
    }

    const season =
      await (seasonID === "latest"
        ? leaderboardClient.getLatestSeason()
        : leaderboardClient.getSeason(seasonID));
    return new Response(JSON.stringify(season));
  };
}

/**
 * makeSeasonTxtGetHandler makes a handler that returns a plaintext
 * representation of a season.
 */
export function makeSeasonTxtGetHandler(
  leaderboardClient: leaderboard.LeaderboardClient,
) {
  /**
   * handleGetSeasonTxt handles GET requests to the season.txt endpoint.
   */
  return async function handleGetSeasonTxt(
    request: router.RouterRequest,
  ): Promise<Response> {
    const seasonID = request.params["season_id"];
    if (!seasonID) {
      return new Response("Missing season ID", { status: 400 });
    }

    const season =
      await (seasonID === "latest"
        ? leaderboardClient.getLatestSeason()
        : leaderboardClient.getSeason(seasonID));
    if (!season) {
      return new Response("Season not found", { status: 404 });
    }

    const text = leaderboard.formatScores(season);
    return new Response(text, {
      headers: { "Content-Type": "text/plain" },
    });
  };
}
