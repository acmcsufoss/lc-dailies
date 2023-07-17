import type { RESTPostAPIApplicationCommandsJSONBody } from "../deps.ts";

import { SUB_REGISTER } from "./sub/register.ts";
import { SUB_SUBMIT } from "./sub/submit.ts";

export const LC = "lc";
export const LC_DESCRIPTION =
  "Set of commands to register and submit Leetcode solutions.";

/**
 * APP_LC is the top-level command for the LC Application Commands.
 */
export const APP_LC: RESTPostAPIApplicationCommandsJSONBody = {
  name: LC,
  description: LC_DESCRIPTION,
  options: [SUB_REGISTER, SUB_SUBMIT],
};
