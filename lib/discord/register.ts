import type { RESTPostAPIApplicationCommandsJSONBody } from "../../deps.ts";

/**
 * RegisterCommandOptions is the initialization to register a Discord application command.
 */
export interface RegisterCommandOptions {
  applicationID: string;
  botToken: string;
  app: RESTPostAPIApplicationCommandsJSONBody;
}

/**
 * makeRegisterCommandsURL makes the URL to register a Discord application command.
 */
export function makeRegisterCommandsURL(
  applicationID: string,
  base = DISCORD_API_URL,
) {
  return new URL(`${base}/applications/${applicationID}/commands`);
}

/**
 * makeBotAuthorization makes the Authorization header for a bot.
 */
export function makeBotAuthorization(botToken: string) {
  return botToken.startsWith("Bot ") ? botToken : `Bot ${botToken}`;
}

/**
 * registerCommand registers a Discord application command.
 */
export async function registerCommand(
  options: RegisterCommandOptions,
): Promise<void> {
  const url = makeRegisterCommandsURL(options.applicationID);
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
