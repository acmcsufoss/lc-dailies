import { serve } from "./workers/daily/mod.ts";

if (import.meta.main) {
  await serve();
}
