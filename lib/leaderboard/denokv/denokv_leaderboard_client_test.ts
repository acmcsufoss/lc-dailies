import { assertEquals, assertRejects } from "lc-dailies/deps.ts";
import * as fake_lc from "lc-dailies/lib/lc/fake_client.ts";
import type { Season } from "lc-dailies/api/mod.ts";
import { DenoKvLeaderboardClient } from "./denokv_leaderboard_client.ts";

const FAKE_DISCORD_USER_ID = "fake_discord_user_id";
const FAKE_SEASON_START_DATE = new Date("2023-07-30");
const FAKE_SEASON: Season = {
  id: "",
  start_date: FAKE_SEASON_START_DATE.toUTCString(),
  players: {
    [FAKE_DISCORD_USER_ID]: {
      discord_user_id: FAKE_DISCORD_USER_ID,
      lc_username: fake_lc.FAKE_LC_USERNAME,
    },
  },
  scores: {
    [FAKE_DISCORD_USER_ID]: 50,
  },
  questions: {
    [fake_lc.FAKE_LC_QUESTION_NAME]: fake_lc.FAKE_LC_QUESTION,
  },
  submissions: {
    [FAKE_DISCORD_USER_ID]: {
      [fake_lc.FAKE_LC_QUESTION_NAME]: {
        id: fake_lc.FAKE_RECENT_SUBMISSION_ID,
        date: "Mon, 31 Jul 2023 00:00:00 GMT",
      },
    },
  },
};

Deno.test("DenoKvLeaderboardClient", async (t) => {
  const kv = await Deno.openKv(":memory:");
  const client = new DenoKvLeaderboardClient(
    kv,
    new fake_lc.FakeLCClient(),
  );

  await t.step("register", async () => {
    const result = await client.register(
      FAKE_DISCORD_USER_ID,
      fake_lc.FAKE_LC_USERNAME,
    );
    assertEquals(result.ok, true);
  });

  await t.step("register same username", () => {
    assertRejects(async () => {
      await client.register(
        FAKE_DISCORD_USER_ID,
        fake_lc.FAKE_LC_USERNAME,
      );
    });
  });

  await t.step("submit", async () => {
    const result = await client.submit(
      FAKE_DISCORD_USER_ID,
      fake_lc.FAKE_RECENT_SUBMISSION_ID,
      new Date(fake_lc.FAKE_LC_QUESTION_DATE),
    );
    assertEquals(result.ok, true);
  });

  let seasonID: string | undefined;
  await t.step("getLatestSeason", async () => {
    const season = await client.getLatestSeason();
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
  assertEquals(actualSeason?.scores, expectedSeason.scores);
  assertEquals(actualSeason?.players, expectedSeason.players);
  assertEquals(actualSeason?.questions, expectedSeason.questions);
  assertEquals(actualSeason?.submissions, expectedSeason.submissions);
}
