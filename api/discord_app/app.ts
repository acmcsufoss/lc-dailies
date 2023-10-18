import type {
  APIInteraction,
  APIInteractionResponse,
  APIUser,
  RESTPostAPIApplicationCommandsJSONBody,
} from "lc-dailies/deps.ts";
import {
  ApplicationCommandOptionType,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
  Utils,
} from "lc-dailies/deps.ts";
import * as router from "lc-dailies/lib/router/mod.ts";
import * as discord from "lc-dailies/lib/discord/mod.ts";
import * as leaderboard from "lc-dailies/lib/leaderboard/mod.ts";
import {
  makeRegisterInteractionResponse,
  parseRegisterOptions,
  REGISTER,
  SUB_REGISTER,
} from "./sub/register.ts";
import {
  makeSyncInteractionResponse,
  parseSyncOptions,
  SUB_SYNC,
  SYNC,
} from "./sub/sync.ts";

export const LC = "lc";
export const LC_DESCRIPTION =
  "Set of commands to register and submit Leetcode solutions.";

/**
 * APP_LC is the top-level command for the LC Application Commands.
 */
export const APP_LC: RESTPostAPIApplicationCommandsJSONBody = {
  name: LC,
  description: LC_DESCRIPTION,
  options: [SUB_REGISTER, SUB_SYNC],
};

/**
 * makeDiscordAppHandler creates a handler for Discord application command interactions.
 */
export function makeDiscordAppHandler(
  leaderboardClient: leaderboard.LeaderboardClient,
  discordPublicKey: string,
  discordChannelID: string,
) {
  return async function handleDiscordApp(
    request: router.RouterRequest,
  ): Promise<Response> {
    // Verify the request is coming from Discord.
    const { error, body } = await discord.verify(
      request.request,
      discordPublicKey,
    );
    if (error !== null) {
      return error;
    }

    // Parse the incoming request as JSON.
    const interaction = await JSON.parse(body) as APIInteraction;
    switch (interaction.type) {
      case InteractionType.Ping: {
        return Response.json({ type: InteractionResponseType.Pong });
      }

      case InteractionType.ApplicationCommand: {
        // Assert the interaction is a context menu interaction.
        if (
          !Utils.isChatInputApplicationCommandInteraction(interaction)
        ) {
          return new Response("Invalid request", { status: 400 });
        }

        // Assert the interaction is within the specified channel.
        if (interaction.channel?.id !== discordChannelID) {
          return new Response("Invalid request", { status: 400 });
        }

        // Assert the interaction is from a member.
        if (!interaction.member?.user) {
          return new Response("Invalid request", { status: 400 });
        }

        // Assert the interaction has options.
        if (
          !interaction.data.options || interaction.data.options.length === 0
        ) {
          throw new Error("No options provided");
        }

        // Assert the interaction has a subcommand.
        const { 0: { name, type } } = interaction.data.options;
        if (type !== ApplicationCommandOptionType.Subcommand) {
          throw new Error("Invalid option type");
        }

        // Assert the interaction has a subcommand.
        if (!interaction.member) {
          throw new Error("No user provided");
        }

        // Handle the subcommand.
        switch (name) {
          case REGISTER: {
            const registerResponse = await handleRegisterSubcommand(
              leaderboardClient,
              interaction.member.user,
              parseRegisterOptions(interaction.data.options),
            );

            return Response.json(registerResponse);
          }

          case SYNC: {
            const syncResponse = await handleSyncSubcommand(
              leaderboardClient,
              parseSyncOptions(interaction.data.options),
            );

            return Response.json(syncResponse);
          }

          default: {
            throw new Error("Invalid subcommand");
          }
        }
      }

      default: {
        return new Response("Invalid request", { status: 400 });
      }
    }
  };
}

/**
 * handleRegisterSubcommand handles the register subcommand.
 */
async function handleRegisterSubcommand(
  leaderboardClient: leaderboard.LeaderboardClient,
  user: APIUser,
  options: ReturnType<typeof parseRegisterOptions>,
): Promise<APIInteractionResponse> {
  const registerResponse = await leaderboardClient.register(
    user.id,
    options.lc_username,
  );

  return makeRegisterInteractionResponse(registerResponse);
}

/**
 * handleSyncSubcommand handles the sync subcommand.
 */
async function handleSyncSubcommand(
  leaderboardClient: leaderboard.LeaderboardClient,
  options: ReturnType<typeof parseSyncOptions>,
): Promise<APIInteractionResponse> {
  try {
    const syncResponse = await leaderboardClient.sync(
      options.season_id,
    );

    const interactionResponse = makeSyncInteractionResponse(syncResponse);
    console.log({ interactionResponse, syncResponse });
    return interactionResponse;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

/**
 * withErrorResponse wraps around the Discord app handler to catch any errors
 * and return a response using the error message.
 */
export function withErrorResponse(
  oldHandle: router.RouterHandler["handle"],
): router.RouterHandler["handle"] {
  return async function handle(
    request: router.RouterRequest,
  ): Promise<Response> {
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
