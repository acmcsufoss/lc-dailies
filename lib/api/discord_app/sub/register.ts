import type {
  APIApplicationCommandInteractionDataOption,
  APIApplicationCommandOption,
  APIInteractionResponse,
} from "lc-dailies/deps.ts";
import {
  ApplicationCommandOptionType,
  InteractionResponseType,
} from "lc-dailies/deps.ts";
import type * as api from "../../mod.ts";

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
) {
  const registerOption = options.find((option) => option.name === REGISTER);
  if (!registerOption) {
    throw new Error("No options provided");
  }
  if (
    registerOption.type !== ApplicationCommandOptionType.Subcommand
  ) {
    throw new Error("Invalid option type");
  }
  if (!registerOption.options) {
    throw new Error("No options provided");
  }

  const usernameOption = registerOption.options.find((option) =>
    option.name === REGISTER_LC_USERNAME
  );
  if (usernameOption?.type !== ApplicationCommandOptionType.String) {
    throw new Error("Expected a string for the username option.");
  }

  return { [REGISTER_LC_USERNAME]: usernameOption.value };
}

/**
 * makeRegisterInteractionResponse makes the interaction response for the register subcommand.
 */
export function makeRegisterInteractionResponse(
  r: api.RegisterResponse,
): APIInteractionResponse {
  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: `Your Leetcode username was ${
        r.ok ? "registered" : "not registered"
      }.`,
    },
  };
}
