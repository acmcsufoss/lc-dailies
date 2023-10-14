import type {
  APIApplicationCommandInteractionDataOption,
  APIApplicationCommandOption,
  APIInteractionResponse,
} from "lc-dailies/deps.ts";
import {
  ApplicationCommandOptionType,
  InteractionResponseType,
} from "lc-dailies/deps.ts";
import * as api from "lc-dailies/api/mod.ts";
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
      content: `Season \`${r.season.id}\` synced.\n\n${formatScores(r.season)}`,
    },
  };
}
