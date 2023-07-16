import * as discord from "../discord.ts";
import { DISCORD_CLIENT_ID } from "./env.ts";

if (import.meta.main) {
  await main();
}

export async function main() {
  // Overwrite the Discord Application Command.
  await discord.registerCommand({
    app: APP_TLDR,
    botID: env.DISCORD_CLIENT_ID,
    botToken: env.DISCORD_TOKEN,
  });
}

// register: honor system for verifying leetcode account to discord user
// submit: submit the leetcode daily solution
