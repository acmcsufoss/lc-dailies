/**
 * makeQuestionURL makes a Leetcode question URL from the title slug.
 */
export function makeQuestionURL(titleSlug: string): string {
  return `https://leetcode.com/problems/${titleSlug}/`;
}

/**
 * parseSubmissionID parses the submission ID from the submission URL.
 */
export function parseSubmissionID(submissionURLOrID: string): string {
  let submissionID = submissionURLOrID;
  try {
    const url = new URL(submissionURLOrID);
    if (LEETCODE_SUBMISSIONS_PATHNAME_PATTERN.test(url.pathname)) {
      submissionID = url.pathname
        .replace(LEETCODE_SUBMISSIONS_PATHNAME_PATTERN, "")
        .replace(/\/$/, "");
    }
  } catch {
    // noop
  }
  return submissionID;
}

/**
 * LEETCODE_SUBMISSIONS_PATHNAME_PATTERN is the pattern for Leetcode's
 * submission URLs.
 *
 * Valid submission URLs: This entails a full URL or the direct submission ID.
 * https://leetcode.com/problems/implement-stack-using-queues/submissions/1035629181/
 * https://leetcode.com/submissions/detail/1035629181/
 * 1035629181
 * https://leetcode.com/problems/unique-paths/submissions/1039832006/?envType=daily-question&envId=2023-09-03
 */
const LEETCODE_SUBMISSIONS_PATHNAME_PATTERN =
  /^\/(problems\/.*\/submissions\/|submissions\/detail\/)/;
