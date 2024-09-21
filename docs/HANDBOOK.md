# Handbook

This brief handbook contains comprehensive knowledge needed to operate the `/lc`
slash command on the ACM CSUF Discord server. Join the server at
<https://acmcsuf.com/discord>!

## Seasons

Seasons are week-long competitions on LC-Dailies which reset every Sunday at
midnight UTC. The goal of each season is for each player to submit an accepted
solution to as many of Leetcode's daily challenges as fast as possible.

- The live season results JSON API is available at
  <https://lc-dailies.deno.dev/seasons/latest>.
- All seasons are available at <https://lc-dailies.deno.dev/seasons>.

## Submissions

Submissions are the accepted solutions to Leetcode's daily challenges that are
submitted by players during a season.

Submissions are automatically synced with Leetcode's API every 15 minutes.

## Scoring

The scoring system for our weekly competitions is based on the time it takes for
the player to submit an accepted solution to Leetcode's daily challenges. A
player's total season score is the sum of their daily scores for each day of the
season.

The following is a representation of the submission scoring algorithm
implemented by function `calculateSubmissionScore`, located in file
`lib/leaderboard/scores.ts`.

```ts
const score =
  (1 - Math.min(Math.max(msElapsed / msAllotted, 0), 1)) * (hi - lo) + lo;
```

## Slash command

Slash commands are a way to integrate custom logic into Discord servers. In our
case, the `/lc` slash command is used to register your Leetcode username and
submit your solutions to Leetcode's daily challenges.

### `/lc` slash command

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

### Register your Leetcode username

Associate your Leetcode username with your Discord account to participate in our
weekly competitions.

- Type `/lc register` in the `📚algo-chat` text channel to use the slash
  command.
- Populate the required field `lc_username` with your Leetcode username.
- Press <kbd>Enter</kbd> to submit the registration command.
- Wait for the response from the slash command to confirm the registration. This
  may take a second.

### Unregister your Leetcode username

Disassociate your Leetcode username with your Discord account to stop
participating in our weekly competitions.

- Type `/lc unregister` in the `📚algo-chat` text channel to use the slash
  command.
- Press <kbd>Enter</kbd> to submit the unregistration command.
- Wait for the response from the slash command to confirm the unregistration.
  This may take a second.

### Submit your Leetcode solution

Once you have registered your Leetcode username, you are ready to participate in
our weekly competitions.

No further action is needed on your part to submit your Leetcode solutions. A
daily background process automatically syncs our stored leaderboard data with
the latest submissions data on Leetcode.

Our leaderboards are visible on the ACM at CSUF website at
<https://acmcsuf.com/lc-dailies>.

---

Developed with 💖 by [**@acmcsufoss**](https://oss.acmcsuf.com/)
