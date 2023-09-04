import { serve } from "../env.ts";

if (import.meta.main) {
  await serve();
}
