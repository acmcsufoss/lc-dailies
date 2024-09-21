import { assertEquals } from "@std/assert";
import {
  calculatePlayerScore,
  calculateScores,
  makeDefaultCalculateScoresOptions,
} from "./scores.ts";
import type * as api from "lc-dailies/lib/api/types.ts";

const FAKE_SEASON: api.Season = {
  "id": "01H8T4MM00BQHHK7VTTEJE1WAS",
  "start_date": "Sun, 27 Aug 2023 00:00:00 GMT",
  "players": {
    "redacted_discord_id_00": {
      "discord_user_id": "redacted_discord_id_00",
      "lc_username": "EthanThatOneKid",
    },
    "redacted_discord_id_01": {
      "discord_user_id": "redacted_discord_id_01",
      "lc_username": "PillowGit",
    },
  },
  "questions": {
    "implement-stack-using-queues": {
      "number": 225,
      "name": "implement-stack-using-queues",
      "date": "2023-08-28",
      "title": "Implement Stack using Queues",
      "difficulty": "Easy",
      "url": "https://leetcode.com/problems/implement-stack-using-queues/",
    },
    "counting-bits": {
      "number": 338,
      "name": "counting-bits",
      "date": "2023-09-01",
      "title": "Counting Bits",
      "difficulty": "Easy",
      "url": "https://leetcode.com/problems/counting-bits/",
    },
  },
  "submissions": {
    "redacted_discord_id_00": {
      "implement-stack-using-queues": {
        "id": "1035629181",
        "date": "Wed, 30 Aug 2023 04:10:39 GMT",
      },
      "counting-bits": {
        "id": "1037337123",
        "date": "Fri, 01 Sep 2023 04:18:58 GMT",
      },
    },
    "redacted_discord_id_01": {
      "counting-bits": {
        "id": "1037327504",
        "date": "Fri, 01 Sep 2023 04:01:36 GMT",
      },
      "implement-stack-using-queues": {
        "id": "1034291152",
        "date": "Mon, 28 Aug 2023 17:06:37 GMT",
      },
    },
  },
  scores: {},
};

Deno.test("calculatePlayerScore calculates the score of a player", () => {
  assertEquals(
    calculatePlayerScore(
      "redacted_discord_id_00",
      makeDefaultCalculateScoresOptions(
        FAKE_SEASON.players,
        FAKE_SEASON.questions,
        FAKE_SEASON.submissions,
      ),
    ),
    159,
  );
});

Deno.test("calculateSeasonScores calculates the scores of a season", () => {
  const seasonScores = calculateScores(
    makeDefaultCalculateScoresOptions(
      FAKE_SEASON.players,
      FAKE_SEASON.questions,
      FAKE_SEASON.submissions,
    ),
  );

  assertEquals(
    seasonScores["redacted_discord_id_00"],
    159,
  );
  assertEquals(
    seasonScores["redacted_discord_id_01"],
    145,
  );
});
