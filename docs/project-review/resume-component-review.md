# Resume final review

November 13, 2026 — CHG-064. This checkpoint replaces CHG-063's recovery timings
and link-bound authentication model with the user-supplied `portal_inventory.xlsx`,
**Rules - Resume!C2:D19**, and six confirmed edge-case decisions. All 18 workbook
entries are mapped below. Application retention remains the earlier confirmed ten
days from initial save. No policy decision is deferred.

## Global ownership and shared consumers

`requirements/global/configurations/resume.json` owns thirteen numeric definitions
and defaults, projected through `configuration-bindings.json` into `recoveryPolicy`.
`rules/advisor-resume.json` owns lifecycle, privacy, request/attempt budgets, locks,
return context and storage. ASCE inherits the global model. CHG-108 fixes all
thirteen numeric values globally and prohibits effective-Site overrides. The compiler
rejects invalid limits and a warning threshold that does not precede MFA expiry. No other real Site is enabled.

The existing three Resume pages own structure and content placement through
`requirements/parked/{resume,resume-method,resume-code}.json`. Canonical fields own
requiredness, options, six-digit code validation and email formatting. Global resume
and recovery content owns messages/actions. Library, prototype and Storybook use
the same compiled fields, content, configurations and flow graph. The diagram reads
the authored global application graph, including terminal errors and the settled
Eligibility/Review return destinations.

## Workbook reconciliation

| Workbook rows | Confirmed production contract and prototype representation |
| --- | --- |
| 2–3 | Email magic link plus phone code. Text/Call use the saved phone; no email-code alternative. Only eligible active records receive simulated delivery, with uniform public confirmation for absent, expired or locked records. |
| 4–5 | Link validity is 10 minutes. Opening/rendering it does not consume it. Existing delivery-method Next atomically consumes it and starts MFA with the first code. A consumed link cannot start another session. |
| 6 | Invalid/expired/used links return to initial Resume with “This link is no longer valid. Request another secure link below.” |
| 7–9 | Five link requests per rolling 15 minutes by Site + normalized entered email, including unmatched emails. Sixth request starts a fixed 10-minute cooldown. Link replacement/use/expiry never resets the counter. |
| 10–11 | Separate fixed 30-minute MFA session. Warn inline at two minutes with no extension action. At zero, clear recovery context and redirect to the shared Session expired page (CHG-087). Original link expiry no longer controls this session. |
| 12–13 | Text or voice Call; mask the phone except its last four digits. Code is exactly six digits. |
| 14 | Code validity is 10 minutes, capped by MFA and original application expiry. Code expiry stays inline and allows explicit resend within the active MFA session. |
| 15–16 | Five total code requests per rolling 15 minutes, including the initial code. Share the application budget across Text/Call, links and MFA sessions. Sixth request starts a fixed 30-minute resend cooldown and returns to initial Resume with its specific message. |
| 17–18 | Three incorrect current-code attempts per MFA session. Resends preserve attempts. Third incorrect attempt immediately starts a fixed 30-minute application recovery lock, invalidates recovery sessions and returns to initial Resume with its specific message. New links/browsers cannot bypass the lock. |
| 19 | Incorrect codes show safe inline feedback. Malformed, expired and recognized replaced codes are rejected without spending an attempt. Resend replaces the current code. |

Cooldowns begin on the first excess request. Blocked retries neither add requests
nor extend the deadline. Expiry resets that request counter, even if earlier request
timestamps remain within 15 minutes. Link-limit responses are identical for matching
and missing emails, preserving privacy. Application locks are revealed only within
a proved recovery context; public requests retain the same confirmation and suppress
ineligible delivery. Recovery cannot extend application retention.

## Shared components, states and storage

The existing utility PageShell, FormShell, PageHeader, FieldRenderer, PageAlert,
ExpiringCodeAlert and ResendCountdownRow remain the page composition. A small shared
ResumeSessionWarning composes PageAlert with configured wording and a fixed-deadline
timer. MFA expiry and normal application inactivity use the shared Session expired
redirect (CHG-087). No new error-page family, actual email/phone service, authentication
integration or deletion batch is added.

Global content distinguishes link invalidity, link-request cooldown, MFA expiry,
code-request cooldown and application attempt lock. Cooldown values are displayed
from the actual retry deadline, and blocked controls re-enable when it elapses.
Changing the entered email does not transfer another email's request restriction.
Technical diagnostics never become user copy. There are no automatic link requests
or code issues on mount.

A separate Site-scoped, tab-local recovery handle stores the opaque MFA ID, MFA
proof, fixed session/code deadlines, masked target, method and advisor UI context.
It survives Back/reload without renewing time and is cleared on success, terminal
errors and new-application reset. The global internal `mfaSessionId` URL contract
replaces the consumed link proof on continuation URLs; a guessed ID grants no
access. Tokens/codes are not written into applicant answer storage.

The local simulator keeps hashed link/MFA/code proofs, replaced-code hashes,
request timestamps and fixed cooldown/lock deadlines outside applicant answers.
A new MFA session replaces an earlier session for the application while shared
budgets/locks persist. Existing valid codes remain subject to session expiry and
application locks; a resend limit is a delivery limit, not another incorrect-code
attempt. The explicit demo outbox remains separate from production delivery.
Late verification responses cannot restore an application after local MFA expiry
or after the page has been left. Service validation remains authoritative.

## Verification

Focused checks cover one-time consumption and restoration, binding to Site/person/
application, independent expiry boundaries, reload/restart, fixed cooldown reset,
privacy for matched/unmatched emails, shared request budgets, attempt preservation,
immediate lock, rejected old/malformed codes, phone-only delivery, masked targets,
late responses, URL deadline tampering and both verified return paths.

Source reconstruction checks remove superseded page/field records, compare Library,
prototype, Storybook and the flow graph, verify global/default inheritance and
rejection of effective overrides (CHG-108), and reject invalid global limits/warning
thresholds.
Storybook uses twelve meaningful actual-page examples plus the shared MFA warning;
fixture cleanup restores its temporary recovery handle and rendering performs no
requests. Production enforcement and delivery requirements are recorded as system
behavior; local execution remains a simulation.

The separate historical `storedLibraryModel.test.ts` and
`libraryRequirements.test.ts` suites are not clean: their migration-fixture run
reported approval/expectation failures (14 failures, seven passes, one skip),
including unapproved captured ASCE rules and old collection expectations. These
fixtures were not rewritten or used as the current Resume source. The current-source
reconstruction/consumer-parity gate and focused recovery tests are reported
separately; no other real Site is rolled out to repair historical fixtures.

Final current-source verification: 55 fresh-start checks and 87 focused recovery,
advisor, storage and actual-story checks passed. The corrected MFA-warning example
was rerun separately with all twelve Resume story checks passing. Application and
Storybook production builds passed with identical catalog artifacts. Visual review
confirmed matching MFA/code warning deadlines and the distinct application-lock
page error. The historical-fixture failures above remain separately recorded.


## Client configuration and copy review (CHG-083)

User decision November 15, 2026: all page copy on Resume request, delivery-method selection and code entry remains global. None of the three pages declares a Site page-copy slot. This includes title/introduction, privacy-safe confirmations, instructions, expiry/limit/lock messages, warnings, validation, resend and navigation/action wording. CHG-108 subsequently fixes recovery-policy settings and these three screens’ fields globally; this supersedes their earlier supported Site-override boundary. Effective Site branding/support and masked runtime values retain their existing owners.

The default page adapter already imports the global Resume source. Existing form/frame, feedback, countdown and MFA-warning components are reused; no Site/page-specific wrapper is added. This completes Resume's copy classification without changing counters, locks, deadlines, disclosure protections, restoration, storage or prototype service boundaries.


## Shared session-expiration destination (CHG-087)

User decision November 15, 2026 supersedes the earlier inline MFA-expired landing. Application inactivity and the fixed Resume MFA session expiry use the same existing Session expired page and global wording. On MFA timeout, clear the recovery handle and replace the URL with the shared page, retaining Site/advisor context without tokens or private recipient data. Service-reported MFA expiry and missing/expired MFA handles use the same destination. The production requirement and local prototype route agree; no new page type, authentication or delivery service is added.

Magic-link expiry/invalidity remains a page error on initial Resume. Phone-code expiry remains inline on code entry while the MFA session is active. Request limits/attempt locks retain their reviewed messages and destinations. The fixed-session warning cannot extend time. The shared authored Resume graph includes the expiration page and an explicit user Resume action; the redundant inline-MFA example/copy is retired. Canonical Session expired examples remain under the shared error pages.


CHG-086–088 final verification: **78 Fresh-start checks and 97 focused checks passed**. TypeScript, focused ESLint, requirements mapping and component/Storybook/icon/handoff checks pass. Prototype and Storybook production bundles build successfully; public, prototype and Storybook catalogs have identical SHA-256 `51ff0996bcb99a2ac4cef20e3583c03e99e35df05cf0ac81323b0b527c7a7e57`. All 110 canonical component owners remain covered. HomeHero and QuickDecisionExplainer explicitly declare their existing shared MUI Link dependency in the global component inventory.

Browser verification confirmed global Home wording with synthetic effective branding, the primary action/continuation link, no blank helpers, 16px ZIP/state/DOB gaps at desktop and 390px width, no mobile horizontal overflow, a 1s QD reveal transform and weight-600/no-underline controls, including shared recovery/support/footer links. The shared expiration page uses the generic session wording. Timer, late-response and inline link/code expiry behavior is covered by focused integration tests. ASCE has no new Site-owned copy or configuration assignment.


## Non-copy configuration review (CHG-108)

November 17, 2026: global page-field constraints now prevent Sites from hiding or making optional any Resume input, changing its label/options, or replacing its format, input mode or length checks. Request-link email remains required with email validation and a 254-character maximum; delivery remains required Text/Call; phone verification remains required and exactly six digits. All page and field wording remains global as confirmed in CHG-083. No new Site setting or ASCE-owned implementation is introduced.

Shared component reuse is retained: StandaloneFormPage composes the utility shell/header/form, FieldRenderer uses canonical fields, and PageAlert, ExpiringCodeAlert and ResendCountdownRow supply shared feedback. ResumeSessionWarning remains a justified shared composition for the fixed MFA deadline, without the application timer's extension action. The standalone feedback stories now read their link/code confirmation copy from Fresh-start rather than duplicate literals.

Privacy, explicit-only requests, counters, locks, proof storage, fixed deadlines and restoration routes retain the reviewed rules. Expired/invalid links stay on initial Resume, expired codes stay on code entry while MFA remains active, and expired MFA redirects to Session expired. Production delivery, authorization and deletion rules remain documented requirements represented by the local simulator.

User decisions fix all thirteen numeric values globally, superseding the earlier Site-override contract. Saved-application retention remains ten days from initial save; links and codes last ten minutes; MFA lasts thirty minutes with a two-minute warning; three incorrect current-code attempts trigger the thirty-minute lock; five code requests are allowed per fifteen minutes, with the sixth triggering the thirty-minute cooldown; five link requests are allowed per fifteen minutes, with the sixth triggering the ten-minute cooldown. Original application and MFA deadlines remain authoritative and cannot be renewed by updates or resends.

The compiler rejects authored page, eligibility and relational Site replacements; superseded scoped values from saved catalogs are discarded. Only global values are projected, with Library metadata explicitly stating that Site overrides are prohibited. The simulator reads the same authored global policy, independently of captured Site values. Existing injected simulator test values represent global-policy fixtures, not a supported client configuration. No policy question remains open for Resume.

CHG-108 verification: **91 Fresh-start checks and 104 focused checks passed** (103 recovery/Advisor/storage/field/story checks plus the local simulator integration check). TypeScript, focused ESLint, requirements mapping, component-reuse, Storybook organization, icon and handoff gates pass. Prototype and Storybook production builds pass. Public, prototype and Storybook catalogs share SHA-256 `679b7669c3b5e409be56dbd5f4d379c0e08825fe5ae9954c892c74ca8c3720c2`. Reconstruction removes superseded reviewed records; scoped replacement checks exercise all thirteen definitions and saved-catalog consumer agreement. Resume configuration review is complete.
