import { assertEquals, ulid } from "../../deps.ts";
import type {
  DailyQuestion,
  LCClient,
  RecentSubmission,
} from "../../lc_client.ts";
import type { Season } from "../leaderboard_client.ts";
import { DenoKvLeaderboardClient } from "./mod.ts";

const FAKE_DISCORD_USER_ID = "fake_discord_user_id";
const FAKE_LC_USERNAME = "fake_lc_username";
const FAKE_LC_QUESTION_NAME = "fake_lc_question_name";
const FAKE_LC_QUESTION_TITLE = "fake_lc_question_title";
const FAKE_LC_QUESTION_URL = "fake_lc_question_url";
const FAKE_LC_QUESTION_DIFFICULTY = "fake_lc_question_difficulty";
const FAKE_LC_QUESTION_DATE = "2023-07-31";

const FAKE_LC_QUESTIONS: DailyQuestion[] = [
  {
    name: FAKE_LC_QUESTION_NAME,
    title: FAKE_LC_QUESTION_TITLE,
    url: FAKE_LC_QUESTION_URL,
    difficulty: FAKE_LC_QUESTION_DIFFICULTY,
    date: FAKE_LC_QUESTION_DATE,
  },
  //   {
  //     name: "strange-printer",
  //     date: "2023-07-30",
  //     title: "Strange Printer",
  //     difficulty: "Hard",
  //     url: "https://leetcode.com/problems/strange-printer/",
  //   },
  //   {
  //     name: "soup-servings",
  //     date: "2023-07-29",
  //     title: "Soup Servings",
  //     difficulty: "Medium",
  //     url: "https://leetcode.com/problems/soup-servings/",
  //   },
];
const FAKE_DATE = new Date("2023-07-31");
const FAKE_RECENT_SUBMISSION_ID = "1031839418";
const FAKE_RECENT_SUBMISSIONS: RecentSubmission[] = [
  {
    id: FAKE_RECENT_SUBMISSION_ID,
    name: FAKE_LC_QUESTION_NAME,
    title: FAKE_LC_QUESTION_TITLE,
    timestamp: "1656697600",
  },
];
const FAKE_SEASON: Season = {
  id: ulid(FAKE_DATE.getTime()),
  start_date: FAKE_DATE.toUTCString(),
  players: {
    [FAKE_DISCORD_USER_ID]: {
      discord_user_id: FAKE_DISCORD_USER_ID,
      lc_username: FAKE_LC_USERNAME,
    },
  },
  questions: {
    [FAKE_LC_QUESTION_NAME]: {
      name: FAKE_LC_QUESTION_NAME,
      title: FAKE_LC_QUESTION_TITLE,
      url: FAKE_LC_QUESTION_URL,
      difficulty: FAKE_LC_QUESTION_DIFFICULTY,
      date: FAKE_LC_QUESTION_DATE,
    },
  },
  submissions: {
    [FAKE_DISCORD_USER_ID]: [FAKE_LC_QUESTION_NAME],
  },
};

class FakeLCClient implements LCClient {
  public verifyUser(username: string): Promise<boolean> {
    return Promise.resolve(username === FAKE_LC_USERNAME);
  }

  public listDailyQuestions(
    _: number,
    __: number,
    ___: number,
  ): Promise<DailyQuestion[]> {
    return Promise.resolve(FAKE_LC_QUESTIONS);
  }

  public getRecentAcceptedSubmissions(
    _: string,
    __: number,
  ): Promise<RecentSubmission[]> {
    return Promise.resolve(FAKE_RECENT_SUBMISSIONS);
  }
}

Deno.test("DenoKvLeaderboardClient", async (t) => {
  const kv = await Deno.openKv(":memory:");
  const client = new DenoKvLeaderboardClient(
    kv,
    new FakeLCClient(),
  );

  await t.step("register", async () => {
    const result = await client.register(
      FAKE_DISCORD_USER_ID,
      FAKE_LC_USERNAME,
    );
    assertEquals(result, { ok: true });
  });

  await t.step("submit", async () => {
    const result = await client.submit(
      FAKE_DISCORD_USER_ID,
      FAKE_RECENT_SUBMISSION_ID,
      FAKE_DATE,
    );
    assertEquals(result, { ok: true });
  });

  //   await t.step("getCurrentSeason", async () => {
  //     const result = await client.getCurrentSeason();
  //     assertEquals(result, FAKE_SEASON);
  //   });

  //   await t.step("listSeasons", async () => {
  //     const result = await client.listSeasons();
  //     assertEquals(result, [FAKE_SEASON]);
  //   });

  //   await t.step("getSeason", async () => {
  //     const result = await client.getSeason(FAKE_SEASON.id);
  //     assertEquals(result, FAKE_SEASON);
  //   });

  // Dispose of the resource.
  kv.close();
});
