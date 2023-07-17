import type {
  APIApplicationCommandInteractionDataOption,
  APIApplicationCommandOption,
} from "../../deps.ts";
import { ApplicationCommandOptionType } from "../../deps.ts";

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
  const usernameOption = options.find((option) =>
    option.name === SUBMIT_SUBMISSION_URL
  );
  if (usernameOption?.type !== ApplicationCommandOptionType.String) {
    throw new Error("Expected a string for the username option.");
  }

  return {
    [SUBMIT_SUBMISSION_URL]: usernameOption.value,
  };
}
