import * as discord from "../discord.ts";
import * as env from "./env.ts";
import { APP_LC } from "./app.ts";

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
}

// register: honor system for verifying leetcode account to discord user
// submit: submit the leetcode daily solution
