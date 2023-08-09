import { load } from "../deps.ts";

await load({ export: true });

/**
 * DISCORD_CLIENT_ID is the client ID of the Discord application.
 */
export const DISCORD_CLIENT_ID = Deno.env.get("DISCORD_CLIENT_ID")!;

/**
 * DISCORD_TOKEN is the token of the Discord application.
 */
export const DISCORD_TOKEN = Deno.env.get("DISCORD_TOKEN")!;

/**
 * PORT is the port to listen on.
 */
export const PORT = parseInt(Deno.env.get("PORT") || "8080");

/**
 * DISCORD_CHANNEL_ID is the channel ID specified for the application.
 */
export const DISCORD_CHANNEL_ID = Deno.env.get("DISCORD_CHANNEL_ID")!;

/**
 * DISCORD_PUBLIC_KEY is the public key of the Discord application.
 */
export const DISCORD_PUBLIC_KEY = Deno.env.get("DISCORD_PUBLIC_KEY")!;
