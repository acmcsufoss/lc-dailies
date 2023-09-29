import { assertEquals } from "lc-dailies/deps.ts";
import {
  calculatePlayerScore,
  calculateSeasonScores,
} from "./leaderboard_client.ts";

const FAKE_DURATION = 1e3 * 60 * 60 * 24;
const FAKE_POSSIBLE_HIGHEST_SCORE = 100;
const FAKE_POSSIBLE_LOWEST_SCORE = 50;
const FAKE_SEASON = {
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
      "name": "implement-stack-using-queues",
      "date": "2023-08-28",
      "title": "Implement Stack using Queues",
      "difficulty": "Easy",
      "url": "https://leetcode.com/problems/implement-stack-using-queues/",
    },
    "counting-bits": {
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
};

Deno.test("calculatePlayerScore calculates the score of a player", () => {
  assertEquals(
    calculatePlayerScore(
      "redacted_discord_id_00",
      {
        season: FAKE_SEASON,
        duration: FAKE_DURATION,
        possibleHighestScore: FAKE_POSSIBLE_HIGHEST_SCORE,
        possibleLowestScore: FAKE_POSSIBLE_LOWEST_SCORE,
      },
    ),
    159,
  );
});

Deno.test("calculateSeasonScore calculates the scores of a season", () => {
  const seasonScores = calculateSeasonScores({
    season: FAKE_SEASON,
    duration: FAKE_DURATION,
    possibleHighestScore: FAKE_POSSIBLE_HIGHEST_SCORE,
    possibleLowestScore: FAKE_POSSIBLE_LOWEST_SCORE,
  });

  assertEquals(
    seasonScores["redacted_discord_id_00"],
    159,
  );
  assertEquals(
    seasonScores["redacted_discord_id_01"],
    145,
  );
});
