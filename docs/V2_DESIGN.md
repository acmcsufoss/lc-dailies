# lc-dailies v2 design

Status: proposed design; no v2 implementation is authorized by this document.

Date: 2026-07-29

## 1. Goals

lc-dailies v2 should:

- replace Discord as the account identity with GitHub sign-in;
- let a GitHub user connect one LeetCode username;
- support a built-in global leaderboard and user-created private leaderboards;
- model each weekly run as a **Competition**, not a Season;
- preserve the existing LeetCode daily-question and accepted-submission scoring
  model;
- expose a documented, validated HTTP API using Hono and `@hono/zod-openapi`;
- keep the current v1 service and data readable while v2 is introduced
  incrementally.

## 2. Non-goals for the first v2 release

- Discord commands, Discord membership checks, or Discord webhooks as v2
  requirements;
- a LeetCode OAuth integration or cryptographic proof that a user controls a
  LeetCode account;
- custom competition schedules, custom scoring formulas, teams, prizes, or
  payments;
- a frontend application; v2 should initially be an API and authentication
  service;
- destructive conversion of existing Deno KV records;
- arbitrary public leaderboard creation. Public participation should be handled
  by the built-in global leaderboard.

## 3. Vocabulary and naming contract

| Old v1 term        | v2 canonical term               | Notes                                                                          |
| ------------------ | ------------------------------- | ------------------------------------------------------------------------------ |
| Season             | Competition                     | A fixed weekly scoring period.                                                 |
| season ID          | competition ID                  | New v2 JSON uses `competition_id` in relationship fields.                      |
| seasons            | competitions                    | New v2 route and collection names.                                             |
| player             | participant                     | A GitHub user with a connected LeetCode username who belongs to a leaderboard. |
| leaderboard client | leaderboard/competition service | Avoid putting storage details in public API names.                             |

The v2 source code, schemas, errors, documentation, and route paths must use
**Competition** terminology. `Season` remains only in the v1 compatibility
surface until that API is retired. We should not do a repository-wide blind
rename because it would silently change the existing public contract and its
stored-data types.

## 4. Product model

### 4.1 Accounts

GitHub is the stable identity provider. Store the immutable numeric GitHub user
ID as the primary identity; store the current GitHub login and avatar URL as
display metadata. A renamed GitHub login must not create a second account.

A v2 account contains approximately:

```ts
interface Account {
  github_id: string;
  github_login: string;
  avatar_url: string | null;
  leetcode_username: string | null;
  created_at: string;
  updated_at: string;
}
```

The application should not store a GitHub access token after sign-in unless a
later feature explicitly needs to call GitHub on the user's behalf. v2 only
needs identity, so the default is to exchange the token, fetch the authenticated
user, persist the account, and discard the token.

### 4.2 Global leaderboard

There is one built-in global leaderboard. A user must explicitly join it.
Joining a private leaderboard must not automatically publish that user's
participation globally.

The global leaderboard is publicly readable. Its participant display should use
GitHub login, with LeetCode usernames omitted by default unless we decide that
users explicitly opt into displaying them.

### 4.3 Private leaderboards

A private leaderboard is an owned group of participants. It has:

```ts
interface Leaderboard {
  id: string;
  name: string;
  visibility: "global" | "private";
  owner_github_id: string | null;
  created_at: string;
}
```

Recommended rules:

- only authenticated users can create private leaderboards;
- the owner is automatically a member;
- private leaderboard reads require authentication and membership, except for a
  deliberately shareable read-only view if we add that later;
- joining requires an invitation or unguessable join token;
- the owner can remove members and rotate the invitation token;
- membership changes affect future competitions, not already finalized
  competition snapshots.

### 4.4 Competitions

Every leaderboard has one weekly Competition per UTC week, beginning Sunday at
00:00 UTC and ending the following Sunday at 00:00 UTC. All leaderboards use the
same schedule in v2.

A Competition is a snapshot of the leaderboard's participants and their
submissions for that week. It should retain the participant display data needed
to render historical results even if a user later changes their GitHub login,
LeetCode username, or membership.

```ts
interface Competition {
  id: string;
  leaderboard_id: string;
  start_at: string;
  end_at: string;
  status: "active" | "complete";
  participants: Record<string, CompetitionParticipant>;
  questions: Questions;
  submissions: Submissions;
  scores: Record<string, number>;
  synced_at: string | null;
}
```

The current linear-decay scoring algorithm remains unchanged for the first v2
release. Renaming a concept is not a reason to change scoring.

## 5. Authentication design

Use GitHub's web authorization flow:

1. `GET /v2/auth/github` creates a short-lived OAuth transaction with a random
   state and PKCE verifier.
2. The server stores the transaction in Deno KV with a short TTL and sets an
   HttpOnly, Secure, SameSite=Lax state cookie.
3. GitHub redirects to `GET /v2/auth/github/callback`.
4. The callback validates state, exchanges the one-time code, fetches the
   authenticated GitHub user, upserts the account, creates an opaque server-side
   session, and redirects to the application.
5. The browser sends only the opaque session cookie on subsequent requests.
6. `POST /v2/auth/logout` deletes the session and expires the cookie.

Request only the minimum GitHub read permission needed for identity
(`read:user`). Do not request repository access. Do not put GitHub tokens,
client secrets, or LeetCode credentials in browser storage or URLs.

Sessions should be random opaque identifiers stored in Deno KV with an initial
30-day expiry and rolling renewal only after we have tests for it. OAuth
transactions should expire after approximately 10 minutes and be single-use.

The callback, session, and cookie helpers should be isolated behind interfaces
so they can be tested without making network calls to GitHub.

## 6. LeetCode connection

After GitHub sign-in, a user can submit a LeetCode username. The server
continues to use the existing LeetCode profile check before accepting the
connection.

This check proves that the username exists, not that the GitHub user controls
the LeetCode account. The UI and API documentation must not claim stronger
verification. The first v2 release should:

- allow at most one connected LeetCode username per GitHub account;
- prevent one LeetCode username from being connected to multiple active
  accounts;
- retain the current accepted-submission lookup behavior;
- make changing or disconnecting a username an authenticated account action;
- snapshot the participant identity used by historical Competitions.

A stronger LeetCode ownership proof is a future design decision, not a hidden
assumption in v2.

## 7. API shape

### 7.1 Versioning and compatibility

Keep the current v1 routes unchanged while v2 is developed. Add v2 below a
distinct prefix:

```text
/v2/auth/*
/v2/account
/v2/leaderboards
/v2/leaderboards/:leaderboard_id
/v2/leaderboards/:leaderboard_id/competitions
/v2/leaderboards/:leaderboard_id/competitions/:competition_id
```

The existing `/seasons` endpoints remain a compatibility surface and continue
returning the old Season-shaped payload until a separately approved deprecation
plan exists. New v2 responses must never expose `season`, `seasons`, or
`season_id` names.

Recommended initial endpoints:

| Method | Path                                                            | Access               | Purpose                                                                     |
| ------ | --------------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------- |
| GET    | `/v2/auth/github`                                               | public               | Start GitHub sign-in.                                                       |
| GET    | `/v2/auth/github/callback`                                      | public               | Complete GitHub sign-in.                                                    |
| GET    | `/v2/account`                                                   | public               | Return the current account or `401`.                                        |
| POST   | `/v2/auth/logout`                                               | authenticated        | End the current session.                                                    |
| PUT    | `/v2/account/leetcode`                                          | authenticated        | Connect or replace a LeetCode username.                                     |
| DELETE | `/v2/account/leetcode`                                          | authenticated        | Disconnect the username.                                                    |
| GET    | `/v2/leaderboards`                                              | public/authenticated | List the global leaderboard and private leaderboards visible to the caller. |
| POST   | `/v2/leaderboards`                                              | authenticated        | Create a private leaderboard.                                               |
| GET    | `/v2/leaderboards/:leaderboard_id`                              | visibility-dependent | Read leaderboard metadata.                                                  |
| POST   | `/v2/leaderboards/:leaderboard_id/join`                         | authenticated        | Join using an invitation token.                                             |
| POST   | `/v2/leaderboards/:leaderboard_id/leave`                        | authenticated        | Leave a private leaderboard.                                                |
| GET    | `/v2/leaderboards/:leaderboard_id/competitions`                 | visibility-dependent | List competitions.                                                          |
| GET    | `/v2/leaderboards/:leaderboard_id/competitions/:competition_id` | visibility-dependent | Read one competition and its scores.                                        |
| GET    | `/v2/openapi.json`                                              | public               | Serve the generated OpenAPI document.                                       |

Use `latest` only as a query or convenience alias if it produces a clear schema.
The canonical resource remains a Competition with a concrete ID.

### 7.2 Response privacy

Do not return raw GitHub access tokens, session IDs, private invitation tokens,
or LeetCode submission data outside the authorized leaderboard/competition view.
For private Competitions, enforce authorization before loading or serializing
participant data.

Use consistent JSON errors with a stable machine-readable `code`, a
human-readable `message`, and optional validation details. At minimum define
`unauthorized`, `forbidden`, `not_found`, `conflict`, `invalid_request`, and
`upstream_error`.

## 8. Hono and Zod OpenAPI migration

Replace `@fartlabs/rt` with Hono in a compatibility-preserving step. The target
API composition is:

- `Hono` for the top-level server and non-OpenAPI legacy routes;
- `OpenAPIHono` for v2 routes;
- `createRoute` for every v2 endpoint;
- `z` schemas from `@hono/zod-openapi` for path parameters, query parameters,
  request bodies, and responses;
- `app.openapi(route, handler)` for validated, typed handlers;
- `app.doc('/v2/openapi.json', ...)` or the equivalent OpenAPI document route;
- a single top-level error handler for validation and domain errors.

Do not migrate the v1 routes and implement GitHub authentication in the same
change. First prove that Hono can serve the existing routes and preserve their
status codes, headers, redirects, CORS behavior, and response bodies. Then add
the v2 OpenAPI router as a separate step.

Dependency changes should be limited to the Deno import map and lockfile. Do not
add a separate framework abstraction around Hono.

## 9. Deno KV layout

Namespace all v2 records so v1 data is untouched:

```text
["lc-dailies-v2", "accounts", github_id]
["lc-dailies-v2", "sessions", session_id]
["lc-dailies-v2", "oauth", state]
["lc-dailies-v2", "leaderboards", leaderboard_id]
["lc-dailies-v2", "memberships", leaderboard_id, github_id]
["lc-dailies-v2", "competitions", leaderboard_id, competition_id]
["lc-dailies-v2", "latest-competition", leaderboard_id]
```

Use atomic writes for account creation, membership creation, and
competition/latest-pointer updates. Add explicit indexes only when a query
requires them; avoid scanning every user or competition on every request.

The first sync implementation may reuse the existing LeetCode sync and score
functions through an adapter, but the adapter's domain types must be
Competition-based. A later optimization can cache recent accepted submissions
per connected LeetCode account so users who belong to multiple private
leaderboards do not cause duplicate upstream requests.

## 10. Migration strategy

There is no safe automatic mapping from a Discord ID to a GitHub ID. Therefore:

1. Leave v1 Discord-backed records and `/seasons` routes intact.
2. Introduce v2 records under the new KV namespace.
3. Ask existing participants to sign in with GitHub and reconnect their LeetCode
   username.
4. Do not copy historical v1 participation into v2 unless a deliberate
   claim/migration flow is designed and approved.
5. Keep v1 read-only or operationally supported until consumers of the old API
   have migrated.
6. Add explicit v1/v2 documentation so clients do not mistake the two identity
   systems for one account.

This avoids falsely attributing old results to a GitHub account and makes the
privacy boundary clear.

## 11. Proposed implementation phases

### Phase 0 — approve this design

Resolve the decisions in Section 12. Do not modify production behavior.

### Phase 1 — Hono compatibility migration

Replace the Rt router with Hono while preserving v1 routes and tests. Add
request-level regression tests for every current endpoint. No v2 storage or
GitHub flow in this phase.

### Phase 2 — v2 schemas and OpenAPI contract

Add Competition-based Zod schemas, the v2 route skeleton, JSON error format, and
generated OpenAPI document. Handlers may return explicit not-implemented
responses until the contract is stable.

### Phase 3 — GitHub accounts and sessions

Implement OAuth transactions, callback validation, sessions, `/v2/account`,
logout, and test doubles for GitHub API calls.

### Phase 4 — LeetCode connection and leaderboards

Implement the authenticated LeetCode connection, global opt-in, private
leaderboard creation, invitation, membership, and authorization tests.

### Phase 5 — Competitions and sync

Implement weekly Competition creation, participant snapshots, sync, scoring,
latest pointers, and public/private response filtering.

### Phase 6 — migration tooling and deprecation

Document reconnecting existing participants, add only an explicitly approved
historical migration path, and establish a v1 deprecation timeline based on
actual consumers.

Each phase should be a separate small commit or pull request. No phase should
rewrite the same files speculatively for multiple competing designs.

## 12. Decisions requiring confirmation

The following are recommendations, not yet product decisions:

1. **Global scope:** one built-in global leaderboard with explicit opt-in,
   rather than arbitrary public leaderboards. Recommended: accept.
2. **Private access:** authenticated membership plus rotating invite tokens; no
   public private data. Recommended: accept.
3. **Public identity:** show GitHub login; hide LeetCode usernames by default.
   Recommended: accept unless LeetCode handles are essential to the experience.
4. **GitHub integration:** GitHub OAuth App with `read:user`, state, and PKCE;
   do not request repository permissions. Recommended: accept.
5. **Competition schedule:** fixed Sunday-to-Sunday UTC competitions for every
   leaderboard. Recommended: accept for v2.1.
6. **Historical migration:** preserve v1 history separately; require explicit
   reconnect for v2. Recommended: accept.
7. **API prefix:** `/v2` with `/competitions` resources; retain `/seasons` only
   for v1 compatibility. Recommended: accept.
8. **OpenAPI UI:** serve the OpenAPI JSON first; add Swagger/Scalar UI only if a
   consumer needs it. Recommended: accept.
9. **LeetCode ownership:** describe the existing profile check accurately and do
   not pretend it proves account ownership. Recommended: accept.
10. **Repository ownership:** the currently checked-out repository is
    `acmcsufoss/lc-dailies`; `FartLabs/lc-dailies` does not currently exist on
    GitHub. Decide whether v2 remains in the source repository or is
    transferred/copied after the design is approved.

## References

- [Hono Zod OpenAPI example](https://hono.dev/examples/zod-openapi)
- [GitHub authorizing OAuth apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)
- [GitHub OAuth scopes](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps)
