import type {
  APIApplicationCommandInteractionDataOption,
  APIApplicationCommandOption,
  APIInteractionResponse,
} from "lc-dailies/deps.ts";
import {
  ApplicationCommandOptionType,
  InteractionResponseType,
} from "lc-dailies/deps.ts";
import type * as leaderboard from "lc-dailies/lib/leaderboard/mod.ts";

export const SUBMIT = "submit";
export const SUBMIT_DESCRIPTION =
  "Submit your Leetcode solution for today's challenge";
export const SUBMIT_SUBMISSION_URL = "submission_url";
export const SUBMIT_SUBMISSION_URL_DESCRIPTION = "Your Leetcode submission URL";

/**
 * SUB_SUBMIT is the subcommand for the LC-Dailies command.
 */
export const SUB_SUBMIT: APIApplicationCommandOption = {
  name: SUBMIT,
  description: SUBMIT_DESCRIPTION,
  type: ApplicationCommandOptionType.Subcommand,
  options: [
    {
      name: SUBMIT_SUBMISSION_URL,
      description: SUBMIT_SUBMISSION_URL_DESCRIPTION,
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
};

/**
 * parseSubmitOptions parses the options for the submit subcommand.
 */
export function parseSubmitOptions(
  options: APIApplicationCommandInteractionDataOption[],
): {
  [SUBMIT_SUBMISSION_URL]: string;
} {
  const submitOption = options.find((option) => option.name === SUBMIT);
  if (!submitOption) {
    throw new Error("No options provided");
  }
  if (
    submitOption.type !== ApplicationCommandOptionType.Subcommand
  ) {
    throw new Error("Invalid option type");
  }
  if (!submitOption.options) {
    throw new Error("No options provided");
  }

  const submissionURLOption = submitOption.options.find((option) =>
    option.name === SUBMIT_SUBMISSION_URL
  );
  if (submissionURLOption?.type !== ApplicationCommandOptionType.String) {
    throw new Error("Expected a string for the submission URL option");
  }

  return {
    [SUBMIT_SUBMISSION_URL]: submissionURLOption.value,
  };
}

/**
 * makeSubmitInteractionResponse makes the interaction response for the register subcommand.
 */
export function makeSubmitInteractionResponse(
  r: leaderboard.SubmitResponse,
): APIInteractionResponse {
  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: `Your submission was ${r.ok ? "successful" : "unsuccessful"}.`,
    },
  };
}
