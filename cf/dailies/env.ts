import { load } from "lc-dailies/deps.ts";
import {
  denoflare,
  DENOFLARE_VERSION_TAG,
} from "lc-dailies/lib/denoflare/mod.ts";

await load({ export: true });

const CF_ACCOUNT_ID = Deno.env.get("CF_ACCOUNT_ID")!;
const CF_API_TOKEN = Deno.env.get("CF_API_TOKEN")!;
const WEBHOOK_URL = Deno.env.get("WEBHOOK_URL")!;

const DENOFLARE_SCRIPT_NAME = "lc-dailies";
const DENOFLARE_SCRIPT_SPECIFIER = "cf/dailies/dailies.ts";

async function daily(...args: string[]) {
  return await denoflare({
    versionTag: DENOFLARE_VERSION_TAG,
    scriptName: DENOFLARE_SCRIPT_NAME,
    path: DENOFLARE_SCRIPT_SPECIFIER,
    cfAccountID: CF_ACCOUNT_ID,
    cfAPIToken: CF_API_TOKEN,
    localPort: 8080,
    args,
  });
}

export async function serve() {
  return await daily(
    "serve",
    DENOFLARE_SCRIPT_NAME,
    "--secret-binding",
    `WEBHOOK_URL:${WEBHOOK_URL}`,
  );
}

export async function push() {
  return await daily(
    "push",
    DENOFLARE_SCRIPT_NAME,
  );
}
