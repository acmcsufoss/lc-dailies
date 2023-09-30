import { type APIEmbed } from "lc-dailies/deps.ts";
import * as discord from "lc-dailies/lib/discord/mod.ts";
import * as router from "lc-dailies/lib/router/mod.ts";
import * as lc from "lc-dailies/lib/lc/mod.ts";
import * as leaderboard from "lc-dailies/lib/leaderboard/mod.ts";
import * as snacks from "./snacks.ts";

/**
 * makeDailyWebhookPostHandler creates a handler for daily webhook POST requests.
 */
export function makeDailyWebhookPostHandler(
  lcClient: lc.LCClient,
  leaderboardClient: leaderboard.LeaderboardClient,
  webhookURL: string,
  webhookToken?: string,
) {
  /**
   * handlePostDailyWebhook handles POST requests to the daily webhook.
   */
  return async function handlePostDailyWebhook(
    request: router.RouterRequest,
  ): Promise<Response> {
    // Override the webhook URL if applicable.
    const overrideWebhookURL = request.url.searchParams.get("webhook_url");
    if (overrideWebhookURL) {
      webhookURL = overrideWebhookURL;
    }

    // Check the webhook token.
    const token = request.params["token"];
    if (!overrideWebhookURL && webhookToken && token !== webhookToken) {
      return new Response("Invalid token", { status: 401 });
    }

    // Get the season ID if applicable.
    const seasonID = request.url.searchParams.get("season_id");

    // Execute the webhook.
    return await executeDailyWebhook(
      lcClient,
      leaderboardClient,
      webhookURL,
      seasonID,
    );
  };
}

/**
 * makeManualDailyWebhookPostHandler creates a handler for any variable
 * webhook URL POST requests.
 */
export function makeManualDailyWebhookPostHandler(
  lcClient: lc.LCClient,
  leaderboardClient: leaderboard.LeaderboardClient,
) {
  return async function handleManualPostDailyWebhook(
    request: router.RouterRequest,
  ): Promise<Response> {
    const seasonID = request.url.searchParams.get("season_id");
    const webhookURL = request.url.searchParams.get("webhook_url");
    if (!webhookURL) {
      return new Response("Missing webhook_url", { status: 400 });
    }

    return await executeDailyWebhook(
      lcClient,
      leaderboardClient,
      webhookURL,
      seasonID,
    );
  };
}

async function executeDailyWebhook(
  lcClient: lc.LCClient,
  leaderboardClient: leaderboard.LeaderboardClient,
  webhookURL: string,
  seasonID: string | null,
): Promise<Response> {
  // Get the daily question.
  const question = await lcClient.getDailyQuestion();

  // Get the season data if a season ID is provided or if it is Sunday.
  const isSunday = new Date(question.date).getDay() === 0;
  const season = seasonID
    ? await leaderboardClient.getSeason(seasonID)
    : isSunday
    ? await leaderboardClient.getCurrentSeason()
    : null;

  // Format the webhook embed.
  const embeds = makeDailyWebhookEmbeds({ question, season });

  // Execute the webhook.
  await discord.executeWebhook({
    url: webhookURL,
    data: { embeds },
  });

  // Acknowledge the request.
  return new Response("OK");
}

/**
 * DailyWebhookOptions are the options for makeDailyWebhookEmbeds.
 */
export interface DailyWebhookOptions {
  /**
   * question is the daily question.
   */
  question: lc.DailyQuestion;

  /**
   * season is the season to recap.
   */
  season: leaderboard.Season | null;
}

/**
 * makeDailyWebhookEmbeds formats a daily webhook.
 */
export function makeDailyWebhookEmbeds(
  options: DailyWebhookOptions,
): APIEmbed[] {
  const embed: APIEmbed = {
    title: options.question.title,
    url: options.question.url,
    description: `Daily Leetcode question for ${options.question.date}.`,
    fields: [
      {
        name: "Difficulty",
        value: options.question.difficulty,
        inline: true,
      },
      {
        name: "Here is a snack to get your brain working!",
        value: snacks.pickRandom(),
        inline: true,
      },
      {
        name:
          "Submit your solution by typing `/lc submit YOUR_SUBMISSION_URL` below!",
        value: "[See more…](https://acmcsuf.com/lc-dailies-handbook)",
      },
    ],
  };

  if (options.season) {
    embed.fields?.push({
      name: `Leaderboard for week of ${options.season.start_date}`,
      value: formatScores(options.season),
    });
  }

  return [embed];
}

/**
 * formatScores formats the scores of all players in a season.
 */
export function formatScores(season: leaderboard.Season): string {
  const scores = leaderboard.calculateSeasonScores(
    leaderboard.makeDefaultCalculateScoresOptions(season),
  );
  return [
    "```",
    ...Object.entries(scores)
      .sort(({ 1: scoreA }, { 1: scoreB }) => scoreB - scoreA)
      .map(([playerID, score], i) => {
        const player = season.players[playerID];
        const formattedScore = String(score).padStart(3, " ");
        const formattedRank = formatRank(i + 1);
        return `${formattedScore} ${player.lc_username} (${formattedRank})`;
      }),
    "```",
  ].join("\n");
}

/**
 * formatRank formats the rank of a player in a season.
 */
export function formatRank(rank: number): string {
  switch (rank) {
    case 1: {
      return "🥇";
    }

    case 2: {
      return "🥈";
    }

    case 3: {
      return "🥉";
    }

    case 11:
    case 12:
    case 13: {
      return `${rank}th`;
    }
  }

  const lastDigit = rank % 10;
  switch (lastDigit) {
    case 1: {
      return `${rank}st`;
    }

    case 2: {
      return `${rank}nd`;
    }

    case 3: {
      return `${rank}rd`;
    }

    default: {
      return `${rank}th`;
    }
  }
}
