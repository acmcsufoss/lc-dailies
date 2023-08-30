import type {
  APIInteraction,
  APIInteractionResponse,
  APIInteractionResponseDeferredChannelMessageWithSource,
  APIUser,
  RESTPostAPIApplicationCommandsJSONBody,
} from "../deps.ts";
import {
  ApplicationCommandOptionType,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
  Utils,
} from "../deps.ts";
import * as leaderboard from "../leaderboard/mod.ts";
import * as server from "../server/mod.ts";
import * as discord from "../discord/mod.ts";
import * as lc from "../lc/mod.ts";
import {
  makeRegisterInteractionResponse,
  parseRegisterOptions,
  REGISTER,
  SUB_REGISTER,
} from "./sub/register.ts";
import {
  makeSubmitInteractionResponse,
  parseSubmitOptions,
  SUB_SUBMIT,
  SUBMIT,
} from "./sub/submit.ts";

export const LC = "lc";
export const LC_DESCRIPTION =
  "Set of commands to register and submit Leetcode solutions.";

/**
 * APP_LC is the top-level command for the LC Application Commands.
 */
export const APP_LC: RESTPostAPIApplicationCommandsJSONBody = {
  name: LC,
  description: LC_DESCRIPTION,
  options: [SUB_REGISTER, SUB_SUBMIT],
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
    request: server.ServerRequest,
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
            const handleRegisterSubcommand = makeRegisterSubcommandHandler(
              leaderboardClient,
            );
            return Response.json(
              await handleRegisterSubcommand(
                interaction.member.user,
                parseRegisterOptions(interaction.data.options),
              ),
            );
          }

          case SUBMIT: {
            const handleSubmitSubcommand = makeSubmitSubcommandHandler(
              leaderboardClient,
            );
            return Response.json(
              await handleSubmitSubcommand(
                interaction.member.user,
                parseSubmitOptions(interaction.data.options),
              ),
            );
          }
        }

        // Acknowledge the interaction.
        return Response.json(
          {
            type: InteractionResponseType.DeferredChannelMessageWithSource,
            data: {
              flags: MessageFlags.Ephemeral,
            },
          } satisfies APIInteractionResponseDeferredChannelMessageWithSource,
        );
      }

      default: {
        return new Response("Invalid request", { status: 400 });
      }
    }
  };

  function makeRegisterSubcommandHandler(
    leaderboardClient: leaderboard.LeaderboardClient,
  ) {
    /**
     * handleRegisterSubcommand handles the register subcommand.
     */
    return async function handleRegisterSubcommand(
      user: APIUser,
      options: ReturnType<typeof parseRegisterOptions>,
    ): Promise<APIInteractionResponse> {
      // TODO: Remove console.log.
      console.log("Registering " + user.id + " with " + options.lc_username);
      const registerResponse = await leaderboardClient.register(
        user.id,
        options.lc_username,
      );

      return makeRegisterInteractionResponse(registerResponse);
    };
  }

  function makeSubmitSubcommandHandler(
    leaderboardClient: leaderboard.LeaderboardClient,
  ) {
    /**
     * handleSubmitSubcommand handles the submit subcommand.
     */
    return async function handleSubmitSubcommand(
      user: APIUser,
      options: ReturnType<typeof parseSubmitOptions>,
    ): Promise<APIInteractionResponse> {
      // TODO: Remove console.log.
      console.log("Submitting " + user.id + " with " + options.submission_url);
      const submitResponse = await leaderboardClient.submit(
        user.id,
        lc.parseSubmissionID(options.submission_url),
      );

      return makeSubmitInteractionResponse(submitResponse);
    };
  }
}
