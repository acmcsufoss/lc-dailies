import type {
  APIApplicationCommandInteractionDataOption,
  APIApplicationCommandOption,
  APIInteractionResponse,
} from "lc-dailies/deps.ts";
import {
  ApplicationCommandOptionType,
  InteractionResponseType,
  SECOND,
} from "lc-dailies/deps.ts";
import * as api from "../../mod.ts";
import { formatScores } from "lc-dailies/lib/leaderboard/mod.ts";

export const SYNC = "sync";
export const SYNC_DESCRIPTION = "Sync and display your season scores";
export const SEASON_ID = "season_id";
export const SEASON_ID_DESCRIPTION = "The season ID to sync";

/**
 * SUB_SYNC is the subcommand for the LC-Dailies command for syncing a season.
 */
export const SUB_SYNC: APIApplicationCommandOption = {
  name: SYNC,
  description: SYNC_DESCRIPTION,
  type: ApplicationCommandOptionType.Subcommand,
  options: [
    {
      name: SEASON_ID,
      description: SEASON_ID_DESCRIPTION,
      type: ApplicationCommandOptionType.String,
    },
  ],
};

/**
 * parseSyncOptions parses the options for the sync subcommand.
 */
export function parseSyncOptions(
  options: APIApplicationCommandInteractionDataOption[],
) {
  const syncOption = options.find((option) => option.name === SYNC);
  if (!syncOption) {
    throw new Error("No options provided");
  }
  if (
    syncOption.type !== ApplicationCommandOptionType.Subcommand
  ) {
    throw new Error("Invalid option type");
  }
  if (!syncOption.options) {
    throw new Error("No options provided");
  }

  const seasonIDOption = syncOption.options.find((option) =>
    option.name === SEASON_ID
  );
  if (
    seasonIDOption &&
    seasonIDOption.type !== ApplicationCommandOptionType.String
  ) {
    throw new Error("Expected a string for the season ID option.");
  }

  return { [SEASON_ID]: seasonIDOption?.value };
}

/**
 * makeSyncInteractionResponse makes the interaction response for the sync subcommand.
 */
export function makeSyncInteractionResponse(
  r: api.SyncResponse,
): APIInteractionResponse {
  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: [
        `# Synced leaderboard [\`${r.season.id}\`](https://lc-dailies.deno.dev/seasons/${r.season.id}) for week of ${r.season.start_date} synced ${
          toDiscordTimestamp(new Date(r.season.synced_at!))
        }`,
        "```",
        formatScores(r.season),
        "```",
      ].join("\n"),
    },
  };
}

/**
 * toDiscordTimestamp converts a date to a Discord timestamp.
 *
 * Reference:
 * - https://gist.github.com/LeviSnoot/d9147767abeef2f770e9ddcd91eb85aa
 * - https://github.com/acmcsufoss/shorter/blob/dbaac9a020a621be0c349a8b9a870b936b988265/main.ts#L235
 */
function toDiscordTimestamp(date: Date) {
  return `<t:${~~(date.getTime() / SECOND)}:R>`;
}
