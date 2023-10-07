/**
 * ScheduledEvent is the expected Cloudflare event for this worker.
 */
export interface ScheduledEvent {
  cron: string;
}

/**
 * Env is the expected environment variables for this worker.
 */
export interface Env {
  WEBHOOK_URL: string;
}

/**
 * Ctx is the expected context for this worker.
 */
interface Ctx {
  waitUntil(promise: Promise<unknown>): void;
}

export default {
  /**
   * fetch is executed on every request.
   */
  async fetch(request: Request, env: Env) {
    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/__scheduled") {
      return new Response("Not found", { status: 404 });
    }

    const cron = url.searchParams.get("cron");
    if (cron !== CRON_EXPRESSION) {
      return new Response("Unexpected cron expression", { status: 400 });
    }

    const seasonID = url.searchParams.get("season_id");
    return await execute(env.WEBHOOK_URL, seasonID);
  },

  /**
   * scheduled is executed daily at 12:00 AM UTC.
   *
   * See:
   * - <https://developers.cloudflare.com/workers/runtime-apis/scheduled-event/>
   */
  scheduled(event: ScheduledEvent, env: Env, ctx: Ctx) {
    if (event.cron !== CRON_EXPRESSION) {
      return;
    }

    ctx.waitUntil(execute(env.WEBHOOK_URL));
  },
};

function execute(webhookURL: string | URL, seasonID?: string | null) {
  if (seasonID) {
    webhookURL = new URL(webhookURL);
    webhookURL.searchParams.set("season_id", seasonID);
  }

  return fetch(webhookURL, { method: "POST" });
}

/**
 * CRON_EXPRESSION is the cron expression for the scheduled event.
 *
 * See:
 * - <https://crontab.guru/#0_0_*_*_*>
 */
const CRON_EXPRESSION = "0 0 * * *";
