import { assertEquals } from "@std/assert";
import type { LCQuestion, LCSubmission } from "lc-dailies/lib/lc/mod.ts";
import { sync } from "./sync.ts";
import type * as api from "lc-dailies/lib/api/types.ts";

const FAKE_UNSYNCED_SEASON: api.Season = {
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
  "scores": {},
};

const FAKE_QUESTION: LCQuestion = {
  number: 7,
  name: "reverse-integer",
  date: "2023-09-02",
  title: "Reverse Integer",
  difficulty: "Easy",
  url: "https://leetcode.com/problems/reverse-integer/",
};

const FAKE_SUBMISSION: LCSubmission = {
  id: "8008569420",
  name: "reverse-integer",
  title: "Reverse Integer",
  timestamp: "1693627483",
};

const FAKE_SYNCED_SEASON: api.Season = {
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
    "reverse-integer": FAKE_QUESTION,
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
      "reverse-integer": {
        "id": FAKE_SUBMISSION.id,
        "date": "Sat, 02 Sep 2023 04:04:43 GMT",
      },
    },
  },
  "scores": {
    "redacted_discord_id_00": 159,
    "redacted_discord_id_01": 204,
  },
};

Deno.test("sync syncs a season with Leetcode", async () => {
  const actual = await sync({
    season: FAKE_UNSYNCED_SEASON,
    players: FAKE_UNSYNCED_SEASON.players,
    lcClient: {
      verifyUser(_: string) {
        throw new Error("Not implemented");
      },
      getDailyQuestion() {
        throw new Error("Not implemented");
      },
      listDailyQuestions(_: number, __: number, ___: number) {
        return Promise.resolve([FAKE_QUESTION]);
      },
      getRecentAcceptedSubmissions(username: string, _?: number) {
        const result: LCSubmission[] = [];
        const fakeUsername =
          FAKE_UNSYNCED_SEASON.players.redacted_discord_id_01.lc_username;
        if (username === fakeUsername) {
          result.push(FAKE_SUBMISSION);
        }

        return Promise.resolve(result);
      },
    },
  });

  assertEquals(actual, FAKE_SYNCED_SEASON);
});
