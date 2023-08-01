import type {
  RESTPostAPIApplicationCommandsJSONBody,
  RESTPostAPIWebhookWithTokenJSONBody,
} from "./deps.ts";
import { nacl } from "./deps.ts";

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

/**
 * verify verifies whether the request is coming from Discord.
 */
export async function verify(
  request: Request,
  publicKey: string,
): Promise<{ error: Response; body: null } | { error: null; body: string }> {
  if (request.method !== "POST") {
    return {
      error: new Response("Method not allowed", { status: 405 }),
      body: null,
    };
  }

  if (request.headers.get("content-type") !== "application/json") {
    return {
      error: new Response("Unsupported Media Type", { status: 415 }),
      body: null,
    };
  }

  const signature = request.headers.get("X-Signature-Ed25519");
  if (!signature) {
    return {
      error: new Response("Missing header X-Signature-Ed25519", {
        status: 401,
      }),
      body: null,
    };
  }

  const timestamp = request.headers.get("X-Signature-Timestamp");
  if (!timestamp) {
    return {
      error: new Response("Missing header X-Signature-Timestamp", {
        status: 401,
      }),
      body: null,
    };
  }

  const body = await request.text();
  const valid = nacl.sign.detached.verify(
    new TextEncoder().encode(timestamp + body),
    hexToUint8Array(signature),
    hexToUint8Array(publicKey),
  );

  // When the request's signature is not valid, we return a 401 and this is
  // important as Discord sends invalid requests to test our verification.
  if (!valid) {
    return {
      error: new Response("Invalid request", { status: 401 }),
      body: null,
    };
  }

  return { body, error: null };
}

/** hexToUint8Array converts a hexadecimal string to Uint8Array. */
function hexToUint8Array(hex: string) {
  return new Uint8Array(hex.match(/.{1,2}/g)!.map((val) => parseInt(val, 16)));
}
