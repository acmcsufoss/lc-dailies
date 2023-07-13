import { load } from "./deps.ts";

await load({ export: true });

export const WEBHOOK_URL = Deno.env.get("WEBHOOK_URL")!;
