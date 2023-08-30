import { assertEquals } from "../../deps.ts";
import type {
  DailyQuestion,
  LCClient,
  RecentSubmission,
} from "../../lc/mod.ts";
import type { Season } from "../mod.ts";
import { DenoKvLeaderboardClient } from "./mod.ts";

const FAKE_DISCORD_USER_ID = "fake_discord_user_id";
const FAKE_LC_USERNAME = "fake_lc_username";
const FAKE_LC_QUESTION_NAME = "fake_lc_question_name";
const FAKE_LC_QUESTION_TITLE = "fake_lc_question_title";
const FAKE_LC_QUESTION_URL = "fake_lc_question_url";
const FAKE_LC_QUESTION_DIFFICULTY = "fake_lc_question_difficulty";
const FAKE_LC_QUESTION_DATE = "2023-07-31";
const FAKE_LC_QUESTION: DailyQuestion = {
  name: FAKE_LC_QUESTION_NAME,
  title: FAKE_LC_QUESTION_TITLE,
  url: FAKE_LC_QUESTION_URL,
  difficulty: FAKE_LC_QUESTION_DIFFICULTY,
  date: FAKE_LC_QUESTION_DATE,
};
const FAKE_LC_QUESTIONS: DailyQuestion[] = [FAKE_LC_QUESTION];
const FAKE_RECENT_SUBMISSION_ID = "1031839418";
const FAKE_RECENT_SUBMISSION_TIMESTAMP = "1690675200";
const FAKE_RECENT_SUBMISSION: RecentSubmission = {
  id: FAKE_RECENT_SUBMISSION_ID,
  name: FAKE_LC_QUESTION_NAME,
  title: FAKE_LC_QUESTION_TITLE,
  timestamp: FAKE_RECENT_SUBMISSION_TIMESTAMP,
};
const FAKE_RECENT_SUBMISSIONS: RecentSubmission[] = [FAKE_RECENT_SUBMISSION];
const FAKE_SEASON_START_DATE = new Date("2023-07-30");
const FAKE_SEASON: Season = {
  id: "",
  start_date: FAKE_SEASON_START_DATE.toUTCString(),
  players: {
    [FAKE_DISCORD_USER_ID]: {
      discord_user_id: FAKE_DISCORD_USER_ID,
      lc_username: FAKE_LC_USERNAME,
    },
  },
  questions: {
    [FAKE_LC_QUESTION_NAME]: FAKE_LC_QUESTION,
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

  public getDailyQuestion(): Promise<DailyQuestion> {
    return Promise.resolve(FAKE_LC_QUESTION);
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
    assertEquals(result.ok, true);
  });

  await t.step("submit", async () => {
    const result = await client.submit(
      FAKE_DISCORD_USER_ID,
      FAKE_RECENT_SUBMISSION_ID,
      new Date(FAKE_LC_QUESTION_DATE),
    );
    assertEquals(result.ok, true);
  });

  let seasonID: string | undefined;
  await t.step("getCurrentSeason", async () => {
    const season = await client.getCurrentSeason();
    seasonID = season?.id;
    assertSeasonsEqual(season, FAKE_SEASON);
  });

  await t.step("listSeasons", async () => {
    const seasons = await client.listSeasons();
    const season = seasons[0];
    assertSeasonsEqual(season, FAKE_SEASON);
  });

  await t.step("getSeason", async () => {
    const season = await client.getSeason(seasonID!);
    assertSeasonsEqual(season, FAKE_SEASON);
  });

  // Dispose of the resource.
  kv.close();
});

function assertSeasonsEqual(
  actualSeason: Season | null,
  expectedSeason: Season,
): void {
  assertEquals(actualSeason?.start_date, expectedSeason.start_date);
  assertEquals(actualSeason?.players, expectedSeason.players);
  assertEquals(actualSeason?.questions, expectedSeason.questions);
  assertEquals(actualSeason?.submissions, expectedSeason.submissions);
}
