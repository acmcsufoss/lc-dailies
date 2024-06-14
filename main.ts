import { DenoKvLeaderboardClient } from "lc-dailies/lib/leaderboard/denokv/mod.ts";
import * as lc from "lc-dailies/lib/lc/mod.ts";
import * as api from "lc-dailies/lib/api/mod.ts";

if (import.meta.main) {
  await main();
}

async function main() {
  const kv = await Deno.openKv(Deno.env.get("KV_URL")!);
  const lcClient = new lc.LCClient();
  const leaderboardClient = new DenoKvLeaderboardClient(
    kv,
    lcClient,
  );
  const discordApplicationID = Deno.env.get("DISCORD_APPLICATION_ID")!;
  const discordChannelID = Deno.env.get("DISCORD_CHANNEL_ID")!;
  const discordPublicKey = Deno.env.get("DISCORD_PUBLIC_KEY")!;
  const discordToken = Deno.env.get("DISCORD_TOKEN")!;
  const router = await api.makeAPIRouter({
    leaderboardClient,
    discordApplicationID,
    discordChannelID,
    discordPublicKey,
    discordToken,
  });

  const port = Number(Deno.env.get("PORT"));
  Deno.serve(
    {
      port,
      onListen: api.makeOnListen(port, discordApplicationID),
    },
    (request) => router.fetch(request),
  );
}
