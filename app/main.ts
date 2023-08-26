import type {
  APIInteraction,
  APIInteractionResponseDeferredChannelMessageWithSource,
} from "../deps.ts";
import {
  ApplicationCommandOptionType,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
  Utils,
} from "../deps.ts";
import * as discord from "../discord.ts";
import * as env from "./env.ts";
import * as lc from "../lc_client.ts";
import type { LeaderboardClient } from "../leaderboard/mod.ts";
import { DenoKvLeaderboardClient } from "../leaderboard/denokv/mod.ts";
import { APP_LC } from "./app.ts";
import {
  makeRegisterInteractionResponse,
  parseRegisterOptions,
  REGISTER,
} from "./sub/register.ts";
import {
  makeSubmitInteractionResponse,
  parseSubmitOptions,
  SUBMIT,
} from "./sub/submit.ts";

if (import.meta.main) {
  await main();
}

export async function main() {
  // Overwrite the Discord Application Command.
  await discord.registerCommand({
    botID: env.DISCORD_CLIENT_ID,
    botToken: env.DISCORD_TOKEN,
    app: APP_LC,
  });

  // Log the application command.
  console.log(
    "LC-Dailies application command:\n",
    `- Local: http://localhost:${env.PORT}/\n`,
    `- Invite: https://discord.com/api/oauth2/authorize?client_id=${env.DISCORD_CLIENT_ID}&scope=applications.commands\n`,
    `- Info: https://discord.com/developers/applications/${env.DISCORD_CLIENT_ID}/information`,
  );

  // Start the server.
  Deno.serve({ port: env.PORT }, handle);
}

/**
 * handle is the HTTP handler for the Boardd application command.
 */
export async function handle(request: Request): Promise<Response> {
  const { error, body } = await discord.verify(request, env.DISCORD_PUBLIC_KEY);
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
      if (interaction.channel?.id !== env.DISCORD_CHANNEL_ID) {
        return new Response("Invalid request", { status: 400 });
      }

      // Assert the interaction is from a member.
      if (!interaction.member?.user) {
        return new Response("Invalid request", { status: 400 });
      }

      // Assert the interaction has options.
      if (!interaction.data.options || interaction.data.options.length === 0) {
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
          const options = parseRegisterOptions(interaction.data.options);
          const l = await makeLeaderboardClient();
          const registerResponse = await l.register(
            interaction.member.user.id,
            options.lc_username,
          );
          return Response.json(
            makeRegisterInteractionResponse(registerResponse),
          );
        }

        case SUBMIT: {
          const options = parseSubmitOptions(interaction.data.options);
          const l = await makeLeaderboardClient();
          const submitResponse = await l.submit(
            interaction.member.user.id,
            options.submission_url,
          );
          return Response.json(
            makeSubmitInteractionResponse(submitResponse),
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
}

async function makeLeaderboardClient(): Promise<LeaderboardClient> {
  return new DenoKvLeaderboardClient(
    await Deno.openKv(),
    new lc.LCClient(),
  );
}
