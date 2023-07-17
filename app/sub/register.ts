import type {
  APIApplicationCommandInteractionDataOption,
  APIApplicationCommandOption,
} from "../../deps.ts";
import { ApplicationCommandOptionType } from "../../deps.ts";

export const REGISTER = "register";
export const REGISTER_DESCRIPTION = "Register your Leetcode account";
export const REGISTER_LC_USERNAME = "lc_username";
export const REGISTER_LC_USERNAME_DESCRIPTION = "Your Leetcode username";

/**
 * SUB_REGISTER is the subcommand for the LC-Dailies command.
 */
export const SUB_REGISTER: APIApplicationCommandOption = {
  name: REGISTER,
  description: REGISTER_DESCRIPTION,
  type: ApplicationCommandOptionType.Subcommand,
  options: [
    {
      name: REGISTER_LC_USERNAME,
      description: REGISTER_LC_USERNAME_DESCRIPTION,
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
};

/**
 * parseRegisterOptions parses the options for the register subcommand.
 */
export function parseRegisterOptions(
  options: APIApplicationCommandInteractionDataOption[],
): {
  [REGISTER_LC_USERNAME]: string;
} {
  const usernameOption = options.find((option) =>
    option.name === REGISTER_LC_USERNAME
  );
  if (usernameOption?.type !== ApplicationCommandOptionType.String) {
    throw new Error("Expected a string for the username option.");
  }

  return {
    [REGISTER_LC_USERNAME]: usernameOption.value,
  };
}
