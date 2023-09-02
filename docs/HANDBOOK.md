# Handbook

This brief handbook contains comprehensive knowledge needed to operate the `/lc`
slash command on the ACM CSUF Discord server.

## Table of contents

- [Seasons](#seasons)
- [`/lc` slash command](#lc-slash-command)

## Seasons

Seasons are week-long competitions that reset every Sunday at midnight UTC. The
goal of each season is for each player to submit an accepted solution to as many
of Leetcode's daily challenges as fast as possible.

- The JSON API for our live season results is available at
  <https://lc-dailies.deno.dev/seasons/latest>.
- All seasons are available at <https://lc-dailies.deno.dev/seasons>.

## `/lc` slash command

The `/lc` slash command is a Discord application command that allows members of
the ACM CSUF Discord server to participate in weekly Leetcode competitions that
automatically reset every Sunday at midnight UTC.

> **NOTE**
>
> _LC-Dailies_' source code is located at <https://oss.acmcsuf.com/lc-dailies>!

### Security

This tool takes advantage of Discord's permissions system to elevate the
security of `/lc`, allowing only verified members of the ACM CSUF Discord server
to play in our automated weekly competitions.

### Operate with confidence

The software is a
[Discord slash command](https://discord.com/developers/docs/interactions/application-commands).
All that is required to use the tool is a Discord account with the `Verified`
role on the [ACM CSUF Discord server](https://acmcsuf.com/discord).

- This slash command is only available to members with the `Verified` role.
- This slash command is available in all text channels of the
  [ACM CSUF Discord server](https://acmcsuf.com/discord).

### Register your Leetcode username

Associate your Leetcode username with your Discord account to participate in our
weekly competitions.

- Type `/lc register` in the `📚algo-chat` text channel to use the slash
  command.
- Populate the required field `lc_username` with your Leetcode username.
- Press <kbd>Enter</kbd> to submit the registration.
- Wait for the response from the slash command to confirm the registration. This
  may take a second.

### Submit your Leetcode solution

Once you have registered your Leetcode username, you are ready to participate in
our weekly competitions.

- Type `/lc submit` in the `📚algo-chat` text channel to use the slash command.
- Populate the required field `lc_submission_url` with the URL to your accepted
  Leetcode solution of a daily challenge from the current season e.g. all
  Leetcode dailies announced since the previous Sunday at midnight UTC.
- Press <kbd>Enter</kbd> to submit the solution.
- Wait for the response from the slash command to confirm the submission. This
  may take a second.
- If the submission was successful, your submission will be added to
  [the leaderboard](https://lc-dailies.deno.dev/seasons/latest).

|                           Valid `lc_submission_url` values                           |
| :----------------------------------------------------------------------------------: |
| `https://leetcode.com/problems/implement-stack-using-queues/submissions/1035629181/` |
|                `https://leetcode.com/submissions/detail/1035629181/`                 |
|                                     `1035629181`                                     |

---

Developed with 💖 by [**@acmcsufoss**](https://oss.acmcsuf.com/)
