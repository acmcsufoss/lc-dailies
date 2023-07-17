import type {
  RESTPostAPIApplicationCommandsJSONBody,
  RESTPostAPIWebhookWithTokenJSONBody,
} from "./deps.ts";

/**
 * ExecuteWebhookOptions are the options for a webhook message.
 */
export interface ExecuteWebhookOptions {
  /**
   * url is the webhook url.
   */
  url: string;

  /**
   * data is the webhook data.
   */
  data: RESTPostAPIWebhookWithTokenJSONBody;
}

/**
 * RegisterCommandOptions is the initialization to register a Discord application command.
 */
export interface RegisterCommandOptions {
  botID: string;
  botToken: string;
  app: RESTPostAPIApplicationCommandsJSONBody;
}

/**
 * makeRegisterCommandsURL makes the URL to register a Discord application command.
 */
export function makeRegisterCommandsURL(
  clientID: string,
  base = DISCORD_API_URL,
) {
  return new URL(`${base}/applications/${clientID}/commands`);
}

/**
 * makeBotAuthorization makes the Authorization header for a bot.
 */
export function makeBotAuthorization(botToken: string) {
  return botToken.startsWith("Bot ") ? botToken : `Bot ${botToken}`;
}

/**
 * @see https://discord.com/developers/docs/resources/webhook#execute-webhook
 */
export function executeWebhook(o: ExecuteWebhookOptions) {
  return fetch(o.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(o.data),
  });
}

export async function registerCommand(
  options: RegisterCommandOptions,
): Promise<void> {
  const url = makeRegisterCommandsURL(options.botID);
  const response = await fetch(url, {
    method: "POST",
    headers: new Headers([
      ["Content-Type", "application/json"],
      ["Authorization", makeBotAuthorization(options.botToken)],
    ]),
    body: JSON.stringify(options.app),
  });
  if (!response.ok) {
    console.error("text:", await response.text());
    throw new Error(
      `Failed to register command: ${response.status} ${response.statusText}`,
    );
  }
}

/**
 * DISCORD_API_URL is the base URL for the Discord API.
 */
export const DISCORD_API_URL = "https://discord.com/api/v10";
