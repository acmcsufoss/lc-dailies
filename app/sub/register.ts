import type {
  APIApplicationCommandInteractionDataOption,
  APIApplicationCommandOption,
  APIInteractionResponse,
} from "../../deps.ts";
import {
  ApplicationCommandOptionType,
  InteractionResponseType,
} from "../../deps.ts";

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

/**
 * RegisterResponse is the response for the register subcommand.
 */
export interface RegisterResponse {
  /**
   * lc_username is the Leetcode username of the player.
   */
  lc_username: string;
}

/**
 * makeRegisterInteractionResponse makes the interaction response for the register subcommand.
 */
export function makeRegisterInteractionResponse(
  r: RegisterResponse,
): APIInteractionResponse {
  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content:
        `Your Leetcode username ${r.lc_username} is now registered to the leaderboard!`,
    },
  };
}
