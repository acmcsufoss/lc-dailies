import { assertEquals } from "@std/assert";
import { makeQuestionURL, parseSubmissionID } from "./urls.ts";

Deno.test("makeQuestionURL", () => {
  assertEquals(
    makeQuestionURL("implement-stack-using-queues"),
    "https://leetcode.com/problems/implement-stack-using-queues/",
  );
});

Deno.test("parseSubmissionID full URL", () => {
  assertEquals(
    parseSubmissionID(
      "https://leetcode.com/problems/implement-stack-using-queues/submissions/1035629181/",
    ),
    "1035629181",
  );
});

Deno.test("parseSubmissionID detail URL", () => {
  assertEquals(
    parseSubmissionID(
      "https://leetcode.com/submissions/detail/1035629181/",
    ),
    "1035629181",
  );
});

Deno.test("parseSubmissionID submission ID ignores search params", () => {
  assertEquals(
    parseSubmissionID(
      "https://leetcode.com/problems/unique-paths/submissions/1039832006/?envType=daily-question&envId=2023-09-03",
    ),
    "1039832006",
  );
});

Deno.test("parseSubmissionID submission ID", () => {
  assertEquals(
    parseSubmissionID("1035629181"),
    "1035629181",
  );
});
