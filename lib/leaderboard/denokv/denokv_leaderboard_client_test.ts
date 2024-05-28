import { assertEquals, assertRejects } from "@std/assert";
import { DAY, WEEK } from "@std/datetime";
import * as fake_lc from "lc-dailies/lib/lc/fake_client.ts";
import type { Season } from "lc-dailies/lib/api/mod.ts";
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

  await t.step("sync", async () => {
    const twoDaysAfterFakeSeasonStartDate = new Date(
      FAKE_SEASON_START_DATE.getTime() + 2 * DAY,
    );
    const syncResponse = await client
      .sync(undefined, twoDaysAfterFakeSeasonStartDate);
    assertSeasonsEquals(syncResponse.season, FAKE_SEASON);
  });

  let seasonID: string | undefined;
  await t.step("getLatestSeason", async () => {
    const season = await client.getLatestSeason();
    seasonID = season?.id;
    assertSeasonsEquals(season, FAKE_SEASON);
  });

  await t.step("sync again", async () => {
    const weekAfterFakeSeasonStartDate = new Date(
      FAKE_SEASON_START_DATE.getTime() + WEEK,
    );
    const syncResponse = await client
      .sync(undefined, weekAfterFakeSeasonStartDate);
    assertEquals(
      syncResponse.season.start_date,
      "Sun, 06 Aug 2023 00:00:00 GMT",
    );
    assertEquals(syncResponse.season.submissions, {});
  });

  await t.step("listSeasons", async () => {
    const seasons = await client.listSeasons();
    assertEquals(seasons.length, 2);

    const season = seasons[0];
    assertSeasonsEquals(season, FAKE_SEASON);
  });

  await t.step("getSeason", async () => {
    const season = await client.getSeason(seasonID!);
    assertSeasonsEquals(season, FAKE_SEASON);
  });

  // Dispose of the resource.
  kv.close();
});

function assertSeasonsEquals(
  actualSeason: Season | null,
  expectedSeason: Season,
): void {
  assertEquals(actualSeason?.start_date, expectedSeason.start_date);
  assertEquals(actualSeason?.scores, expectedSeason.scores);
  assertEquals(actualSeason?.players, expectedSeason.players);
  assertEquals(actualSeason?.questions, expectedSeason.questions);
  assertEquals(actualSeason?.submissions, expectedSeason.submissions);
}
