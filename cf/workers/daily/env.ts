import { load } from "~/deps.ts";
import { denoflare, DENOFLARE_VERSION_TAG } from "~/lib/denoflare/mod.ts";

await load({ export: true });

const CF_ACCOUNT_ID = Deno.env.get("CF_ACCOUNT_ID")!;
export const CF_API_TOKEN = Deno.env.get("CF_API_TOKEN")!;

async function daily(subcommand: "push" | "serve") {
  await denoflare({
    versionTag: DENOFLARE_VERSION_TAG,
    scriptName: "lc-daily",
    path: "cloudflare/workers/daily/main.ts",
    cfAccountID: CF_ACCOUNT_ID,
    cfAPIToken: CF_API_TOKEN,
    localPort: 8080,
    subcommand,
  });
}

export function serve() {
  return daily("serve");
}

export function push() {
  return daily("push");
}
