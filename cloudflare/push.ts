import { push } from "./workers/daily/mod.ts";

if (import.meta.main) {
  await push();
}
