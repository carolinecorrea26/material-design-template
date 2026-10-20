# Durable applicant save and resume: local mock

October 8, 2026. The default persisted mock prototype now saves applications independently of the Portal Library and administrator account. All recovery delivery is local simulation; real notification delivery is outside the requested prototype scope.

## Browser journey

Start with `npm run dev` (or `npm run mock:dev`). Complete Membership with a synthetic email address and continue. The save banner shows the application reference. Open **Resume options**, request a resume link, and refresh the explicitly labeled local outbox. Open that link in a fresh session, choose a simulated delivery method, request a code, refresh the outbox and enter the displayed code. Recovery replaces the current household with the saved values; it does not load a demonstration household. Email/text/phone choices all use local simulation and send nothing.

The initial save requires the canonical `email` field. Page navigation awaits a successful durable save; errors block continuation. Subsequent context updates autosave serially. A browser handle carries the application ID and write capability; browser form caches and handles are scoped by Site. The historical unscoped `applicationFormValues` cache is not automatically assigned to a Site. `dev:catalog` retains browser caching but has no durable mock recovery.

## Store and contract

`scripts/applicant-saves.mjs` owns a separate JSON store at `${statePath}.applicants.json` (normally `.mock-platform/server-state.json.applicants.json`). Writes use a temporary file and atomic rename with owner-only permissions. A failed write restores the prior in-memory state. The store contains synthetic applicant values and local outbox previews; it is not a production medical-data store.

| Endpoint | Binding and effect |
|---|---|
| POST `/api/mock/applicant/save` | Creates an opaque application ID or requires the matching write capability. Binds Site, immutable recipient, release environment, Library revision and a complete value snapshot. |
| POST `/api/mock/applicant/resume/request` | Requires the exact application/Site/recipient. Revokes prior links and issues a new link to the local outbox. |
| POST `/api/mock/applicant/resume/challenge` | Requires that link's token and binding. Issues a random six-digit code; a resend replaces the previous code. |
| POST `/api/mock/applicant/resume/verify` | Requires the current code and link. Consumes recovery, revokes other links and rotates the write capability. Returns the saved snapshot. |
| POST `/api/mock/applicant/outbox` | Scoped local simulation preview. Exposes only current, unexpired messages. This intentional local preview is not a production recovery-authentication mechanism. |

Save retention is ten days from creation, links expire after ten minutes, codes after five minutes. Each code allows five incorrect attempts, each link allows five code issues, and resume requests are limited to five per application per minute. Expired records are purged on subsequent requests. Tokens, codes and write capabilities are hashed for verification; raw link/code contents exist only in the simulated outbox. Recovery tokens are removed from the route after success.

Changed Library revisions flag the save for revalidation. Coverage or Review must be completed again before mock submission; ordinary autosaves do not clear that flag. This is a client-assisted mock consistency check.

## Evidence and limits

Automated tests cover restart persistence of household/coverage/billing values; Site/recipient/application isolation; two households for one recipient; expiry, revocation, replay, resend and attempt limits; rotated capabilities; stale revisions and failed writes. Browser checks used an isolated temporary backend and synthetic ASCE member: save, link delivery, fresh-tab challenge, rejection of an incorrect code, successful recovery and restored Membership values. The user's existing preview and administrator account were not changed.

This completes the durable local mock recovery scope. Production adapters and real notification delivery are outside the user’s requested work.
