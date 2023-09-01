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

export default {
  /**
   * fetch is the main entrypoint for the worker.
   * This worker runs daily at 12:00 AM UTC.
   *
   * See: <https://crontab.guru/#0_0_*_*_*>.
   */
  fetch(event: ScheduledEvent, env: Env) {
    if (event.cron !== "0 0 * * *") {
      return new Response("Unexpected cron schedule", { status: 400 });
    }

    return fetch(env.WEBHOOK_URL, { method: "POST" });
  },
};
