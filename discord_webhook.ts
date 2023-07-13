import type { RESTPostAPIWebhookWithTokenJSONBody } from "./deps.ts";

/**
 * Options are the options for a webhook message.
 */
export interface Options {
  /**
   * url is the webhook url.
   */
  url: string;

  /**
   * data is the webhook data.
   */
  data: RESTPostAPIWebhookWithTokenJSONBody;
}

/**
 * @see https://discord.com/developers/docs/resources/webhook#execute-webhook
 */
export function execute(o: Options) {
  return fetch(o.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(o.data),
  });
}
