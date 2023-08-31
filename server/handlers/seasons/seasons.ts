import * as leaderboard from "../../../leaderboard/mod.ts";
import * as server from "../../../server/mod.ts";

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
    request: server.ServerRequest,
  ): Promise<Response> {
    const seasonID = request.params["season_id"];
    if (!seasonID) {
      return new Response("Missing season ID", { status: 400 });
    }

    console.log({ seasonID });

    const season =
      await (seasonID === "latest"
        ? leaderboardClient.getCurrentSeason()
        : leaderboardClient.getSeason(seasonID));
    return new Response(JSON.stringify(season));
  };
}
