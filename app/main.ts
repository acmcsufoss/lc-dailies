import type {
  APIInteraction,
  APIInteractionResponse,
  APIInteractionResponseDeferredChannelMessageWithSource,
  APIUser,
} from "../deps.ts";
import {
  ApplicationCommandOptionType,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
  Utils,
} from "../deps.ts";
import * as discord from "../discord/mod.ts";
import * as lc from "../lc/mod.ts";
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
import * as env from "./env.ts";
import * as snacks from "./snacks.ts";

const kv = await Deno.openKv();
const lcClient = new lc.LCClient();
const leaderboardClient = new DenoKvLeaderboardClient(
  kv,
  lcClient,
);

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
  // Handle the daily webhook.
  const url = new URL(request.url);
  if (url.pathname.startsWith("/daily/") && request.method === "POST") {
    const token = url.pathname.slice("/daily/".length);
    if (token !== env.WEBHOOK_TOKEN) {
      return new Response("Invalid token", { status: 401 });
    }

    return handleExecuteDailyWebhook();
  }

  // Verify the request is coming from Discord.
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
          return Response.json(
            await handleRegisterSubcommand(
              interaction.member.user,
              parseRegisterOptions(interaction.data.options),
            ),
          );
        }

        case SUBMIT: {
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
}

async function handleExecuteDailyWebhook(): Promise<Response> {
  const question = await lcClient.getDailyQuestion();
  const content = formatLCDailyQuestion(question);
  await discord.executeWebhook({
    url: env.DISCORD_WEBHOOK_URL,
    data: { content },
  });

  return new Response("OK");
}

async function handleRegisterSubcommand(
  user: APIUser,
  options: ReturnType<typeof parseRegisterOptions>,
): Promise<APIInteractionResponse> {
  const registerResponse = await leaderboardClient.register(
    user.id,
    options.lc_username,
  );

  return makeRegisterInteractionResponse(registerResponse);
}

async function handleSubmitSubcommand(
  user: APIUser,
  options: ReturnType<typeof parseSubmitOptions>,
): Promise<APIInteractionResponse> {
  const submitResponse = await leaderboardClient.submit(
    user.id,
    lc.parseSubmissionID(options.submission_url),
  );

  return makeSubmitInteractionResponse(submitResponse);
}

function formatLCDailyQuestion(question: lc.DailyQuestion): string {
  return [
    `## Daily Leetcode Question for ${question.date}`,
    `**Question**: ${question.title}`,
    `**Difficulty**: ${question.difficulty}`,
    `**Link**: <${question.url}>`,
    `**Snack**: Here is a snack to get your brain working: ${snacks.pickRandom()}`,
  ].join("\n");
}
