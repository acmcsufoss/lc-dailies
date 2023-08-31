import { load } from "/lc-dailies/deps.ts";

await load({ export: true });

/**
 * PORT is the port to listen on.
 */
export const PORT = parseInt(Deno.env.get("PORT") || "8080");

/**
 * WEBHOOK_TOKEN is used to authenticate requests to execute our webhook.
 *
 * Usage: POST /daily/:token
 */
export const WEBHOOK_TOKEN = Deno.env.get("WEBHOOK_TOKEN")!;

/**
 * DISCORD_APPLICATION_ID is the application ID of the Discord application.
 */
export const DISCORD_APPLICATION_ID = Deno.env.get("DISCORD_APPLICATION_ID")!;

/**
 * DISCORD_TOKEN is the token of the Discord application.
 */
export const DISCORD_TOKEN = Deno.env.get("DISCORD_TOKEN")!;

/**
 * DISCORD_PUBLIC_KEY is the public key of the Discord application.
 */
export const DISCORD_PUBLIC_KEY = Deno.env.get("DISCORD_PUBLIC_KEY")!;

/**
 * DISCORD_WEBHOOK_URL is the webhook URL of the Discord application.
 */
export const DISCORD_WEBHOOK_URL = Deno.env.get("DISCORD_WEBHOOK_URL")!;

/**
 * DISCORD_CHANNEL_ID is the channel ID specified for the application.
 */
export const DISCORD_CHANNEL_ID = Deno.env.get("DISCORD_CHANNEL_ID")!;
