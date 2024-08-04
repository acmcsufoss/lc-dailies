import { SECOND } from "@std/datetime";
import type {
  APIInteractionResponse,
  AppSchema,
} from "@discord-applications/app";
import {
  ApplicationCommandOptionType,
  createApp,
  InteractionResponseType,
  MessageFlags,
} from "@discord-applications/app";
import * as api from "lc-dailies/lib/api/mod.ts";
import * as leaderboard from "lc-dailies/lib/leaderboard/mod.ts";

export const lcSchema = {
  chatInput: {
    name: "lc",
    description: "Set of commands to register and submit Leetcode solutions.",
    subcommands: {
      register: {
        description: "Register your Leetcode account",
        options: {
          lc_username: {
            description: "Your Leetcode username",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        },
      },
      unregister: {
        description: "Unregister your Leetcode account",
      },
      sync: {
        description: "Sync the leaderboard with the latest submissions",
        options: {
          season_id: {
            description: "The season ID to sync",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        },
      },
    },
  },
} as const satisfies AppSchema;

/**
 * makeDiscordAppHandler creates a handler for Discord application command interactions.
 */
export function makeDiscordAppHandler(
  leaderboardClient: leaderboard.LeaderboardClient,
  applicationID: string,
  channelID: string,
  publicKey: string,
  token: string,
) {
  return createApp(
    {
      schema: lcSchema,
      applicationID,
      publicKey,
      token,
      invite: { path: "/invite", scopes: ["applications.commands"] },
      register: true,
    },
    {
      async register(interaction) {
        if (interaction.channel.id !== channelID) {
          return {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
              content:
                "This command is only available in the LC-Dailies channel.",
              flags: MessageFlags.Ephemeral,
            },
          };
        }

        const registerResponse = await leaderboardClient.register(
          interaction.user!.id,
          interaction.data.parsedOptions.lc_username,
        );

        return makeRegisterInteractionResponse(registerResponse);
      },
      async unregister(interaction) {
        if (interaction.channel.id !== channelID) {
          return {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
              content:
                "This command is only available in the LC-Dailies channel.",
              flags: MessageFlags.Ephemeral,
            },
          };
        }

        const unregisterResponse = await leaderboardClient.unregister(
          interaction.user!.id,
        );
        return {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content: `Your Leetcode username was ${
              unregisterResponse.ok ? "unregistered" : "not unregistered"
            }.`,
          },
        };
      },
      async sync(interaction) {
        const syncResponse = await leaderboardClient.sync(
          interaction.data.parsedOptions.season_id,
        );

        return makeSyncInteractionResponse(syncResponse);
      },
    },
  );
}

/**
 * withErrorResponse wraps around the Discord app handler to catch any errors
 * and return a response using the error message.
 */
export function withErrorResponse(
  oldHandle: (request: Request) => Promise<Response>,
): (request: Request) => Promise<Response> {
  return async function handle(request: Request): Promise<Response> {
    return await oldHandle(request)
      .catch((error) => {
        if (!(error instanceof Error)) {
          throw error;
        }

        return Response.json(
          {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
              content: `Error: ${error.message}`,
              flags: MessageFlags.Ephemeral,
            },
          } satisfies APIInteractionResponse,
        );
      });
  };
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
        leaderboard.formatScores(r.season),
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

/**
 * makeRegisterInteractionResponse makes the interaction response for the register subcommand.
 */
export function makeRegisterInteractionResponse(
  r: api.RegisterResponse,
): APIInteractionResponse {
  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: `Your Leetcode username was ${
        r.ok ? "registered" : "not registered"
      }.`,
    },
  };
}
