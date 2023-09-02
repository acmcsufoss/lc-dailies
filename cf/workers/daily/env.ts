import { load } from "~/deps.ts";
import { denoflare, DENOFLARE_VERSION_TAG } from "~/lib/denoflare/mod.ts";

await load({ export: true });

const CF_ACCOUNT_ID = Deno.env.get("CF_ACCOUNT_ID")!;
const CF_API_TOKEN = Deno.env.get("CF_API_TOKEN")!;
const WEBHOOK_TOKEN = Deno.env.get("WEBHOOK_TOKEN")!;

async function daily(...args: string[]) {
  return await denoflare({
    versionTag: DENOFLARE_VERSION_TAG,
    scriptName: "lc-daily",
    path: "cf/workers/daily/main.ts",
    cfAccountID: CF_ACCOUNT_ID,
    cfAPIToken: CF_API_TOKEN,
    localPort: 8080,
    args,
  });
}

export async function serve() {
  console.log({ WEBHOOK_TOKEN });
  return await daily(
    "serve",
    // "--secret-binding",
    // `WEBHOOK_TOKEN:${WEBHOOK_TOKEN}`,
  );
}

export async function push() {
  return await daily("push");
}
