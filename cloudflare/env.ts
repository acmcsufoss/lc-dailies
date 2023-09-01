import { load } from "~/deps.ts";

await load({ export: true });

/**
 * CF_ACCOUNT_ID is the account ID of the Cloudflare account.
 */
export const CF_ACCOUNT_ID = Deno.env.get("CF_ACCOUNT_ID")!;

/**
 * CF_API_TOKEN is the API token of the Cloudflare account.
 */
export const CF_API_TOKEN = Deno.env.get("CF_API_TOKEN")!;
