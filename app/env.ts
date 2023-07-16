import { load } from "../deps.ts";

await load({ export: true });

export const DISCORD_CLIENT_ID = Deno.env.get("DISCORD_CLIENT_ID")!;
export const DISCORD_TOKEN = Deno.env.get("DISCORD_TOKEN")!;
