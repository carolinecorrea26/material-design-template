# October 2 continuation — candidate, Builder, analytics and mock platform

This increment advances the requested sequence. **Steps 3–6 are not complete and
live runtime activation has not occurred.** Source uncertainties continue under
the documented provisional-value authorization. Code coverage, database readback
and mock contract tests do not certify complete product policy acceptance.

## Delivered candidate behavior

- Selection contracts are persisted for every enabled product across all ten
  active Sites. They support explicit modes, resulting-total increases,
  verified-policy input requirements, included riders, dependent-rider cleanup,
  incompatibility cleanup, locked fixed/multiplier benefits and choice amounts.
- WAEPA Standard life has an explicit rider-only candidate mode, health/payment/
  beneficiary participation, CIR/ABI boundaries and a provisional child schedule.
- CSEA has provisional clerical/non-clerical benefit calculations and included
  R25 AD&D with upgrade elections. Its authoritative rate-table asset is still
  missing and no empty or fabricated rate-table link appears.
- Provisional decisions and exact destinations are visible in the captured
  effective Site revision. Malformed policy versions are rejected by integrity
  validation and execution. See [working choices](../step3-provisional-decisions.md).

## Draft Builder and Library Analytics

Site Builder can create an isolated draft from a consistent persisted Library
revision. The development-only **Draft reviewed migration candidate** action
captures the reviewed compiler in a separate local adapter; it does not seed the
live database. Snapshots include every captured row, including tables with more
than 1,000 records.

Field label/requiredness controls and the applicant field renderer consume the
same draft Site. Draft controls configure PRASE capability, homepage/Coverage
quote presentation and a supplied PDF reference table. Recalculation suppresses
quote presentation when PRASE is disabled. Reference drawers use the existing
applicant component. This is a **field-level preview**, not full routed journey,
coverage-card or submission parity. Controls for the rest of the Library domains
and a complete derived-field authoring model remain open.

Library's **Analytics** tab supports All and selected-Site scope. IDs use semantic
page/kind/element keys, independent of labels and DOM order. It lists pages,
fields, navigation, tools, buttons, links, drawers and modals, with events,
triggers, permitted properties and instrumentation status. Selected scope follows
current page/coverage applicability. The auxiliary interaction inventory is an
initial explicit list; exhaustive UI element discovery remains open.

Form pages emit views, successful submits, validation failures, field changes
and Next activations. Payload reconstruction permits only Site, template and
revision metadata alongside tag/event identity. It never reads or includes input
values, URLs, health/payment values or session IDs. Pending drawer/modal/custom
control tags are explicitly identified. Single-page visibility observation and
all auxiliary interactions still require event verification.

## Publication boundary

`202610020001_library_publication.sql` adds separate draft/release/head/readiness/
audit tables and the initial admin identity binding. Draft saves use optimistic
versions. Publication copies an immutable payload and updates the Site head and
audit in one database transaction. Rollback restores an exact immutable release
without resetting the monotonic release generation.

SQL requires an active bound admin and AAL2. Browser clients cannot write
readiness evidence. Trusted evidence must match the payload hash and cover
migration, parity, rates, payments, analytics, submission and admin recovery;
expired or missing evidence rejects publication/rollback. The anonymous read
function exposes only the published Library envelope, never unpublished drafts.

This migration was tested in disposable PostgreSQL with stubbed auth claims. It
has **not** been deployed to hosted Supabase. It protects the new publication
boundary; it does not certify or replace every legacy Admin/operational RLS policy.
The Supabase service wrapper exists, but the existing Releases workspace has not
been converted to this publication model. No live cutover flag was enabled.

## Local mock platform and Caroline

The user clarified that PRASE cannot be connected and authorized a mock system
and a non-real email address. Run:

```sh
npm run mock:dev
```

The command exports a reviewed candidate, then starts a separate UI at
`http://127.0.0.1:5180` and a loopback API at port 8787. The existing normal
prototype may continue separately. Mock mode avoids configured Supabase and uses
local persistence. No emails are sent and no funds move.

The initial local identity is **caroline**, with **caroline@example.invalid**.
At `/admin-center`, the user chooses a password, enrolls an authenticator, and
saves eight one-use recovery codes offline. TOTP verification is required for
mock admin APIs. Recovery consumes a code and requires replacement authenticator
verification before restoring access. The setup screen was verified in the
browser; password/enrollment remain for the user. No known/default password,
production account or fake verified login was installed.

The server stores password hashes, TOTP secret and recovery-code hashes in
`.mock-platform/server-state.json` (Git-ignored, owner-only permissions). Session
cookies are HttpOnly/SameSite Strict, expire after 30 minutes, and are not
persisted across server restarts. This loopback mock is not a production identity
provider; production activation requires the real server authorization boundary.

Mock quote responses are labeled synthetic and use a deliberately simple test
rate ($0.25 per $1,000 per month, minimum $1). They are not insurer premiums or
product eligibility decisions. Payment accepts only opaque `mock-approved` and
`mock-declined` fixture tokens, with idempotency and conflict checks; real account
or card properties are rejected. Builder exposes these contract tests separately
from applicant pricing. CSEA's disabled PRASE setting still suppresses quote tests.

Mock-mode applicant analytics send only the permitted tag metadata to the local
mock endpoint. It rejects unknown tags and extra/sensitive properties. The event
buffer is capped at 1,000 and inspection requires the mock admin session.

Mock drafts are saved with server-attributed Caroline audit entries. The server
supports versioned immutable releases and rollback with server-owned acceptance
checks. The normal mock startup has no complete acceptance provider, so it
**refuses publication**. Test-only injected server acceptance exercises successful
publication/rollback; those test fixtures do not certify the running candidate.

## Validation and remaining gates

- Full application/migration suite: **868 passed**, two PostgreSQL cases skipped
  in the ordinary run and subsequently passed against freshly seeded reviewed
  PostgreSQL rows/snapshot. The supplemental mock analytics rejection test was
  added after this full run and verified with the mock integration suite.
- PostgreSQL seed repeatability, constraints, RLS and concurrent snapshot checks
  passed. All ten Site snapshots matched the reviewed candidate.
- Separate publication PostgreSQL checks passed AAL1 rejection, missing/forged/
  expired evidence rejection, immutable versions, atomic head/audit, stale update
  rejection and exact rollback.
- TypeScript, full lint and production build passed. Existing large-bundle
  warnings remain. The mock setup screen was inspected in the browser.

Remaining Step 3 work includes complete CSEA dependent elections, ASCE/AVMA
rider-only journeys, policy-verification behavior, ISI association-specific
choices/identifier roles, remaining applicant classes and residency rules,
question/financial/tobacco/attestation participation, all billing adjustments,
exact conditional submission mappings and full per-product acceptance.

Remaining Step 4 work includes full applicant journey consumption of draft data,
all Library editing domains, complete reactive derivation/code-mapping controls
and exhaustive analytics element coverage. Step 5 still needs same-revision
Library/Builder/applicant parity, acceptance evidence generation, publication UI
integration and complete mock service/tagging verification across templates.
Step 6 needs user-completed credential/TOTP setup and a controlled published-data
activation only after those gates pass. The mock service does not bypass them.

### Analytics tracking-plan correction

The Analytics view is a generated draft specification, **not** a read of persisted analytics Library tables or an inventory of verified Adobe Analytics / Contentsquare tags. Its sources are prototype page/field definitions, shared component definitions, and explicitly proposed interactions. Vendor mappings are currently null and unconfigured. Local DOM hooks do not prove vendor delivery, correct placement for every Site/template, or complete event coverage.

Kind and event types now use Library tags. The table provides descriptions, triggers, vendor mapping columns, local-hook/proposed status, expandable source/scope/payload details, search, categorical filters, export, and pagination. Field candidates are optional and excluded from the initial view; this does not remove their runtime hooks. Shared menu/privacy specifications are consolidated instead of repeated per page. Unassigned/internal catalog definitions are excluded from the applicant tracking plan. Proposed interactions require applicability review. Persisted tracking specifications, exact vendor mappings and verified end-to-end coverage remain outstanding migration work.

### Applicant interaction inventory expansion

Fields now appear by default in Analytics; the previous optional-only field default hid real component controls, including the configured rate-frequency switch. Rate-frequency controls are classified as toggles with a clear monthly/annual label and retain Site applicability from the field inspection inventory. A Page / area filter complements Kind and event filters and pagination.

Source-reviewed specifications now include coverage category/options/portfolio controls, dependent-only and removal confirmations, beneficiary add/edit/remove/save/cancel/share/application actions, quote estimate/apply/continue buttons, page help drawers, resume buttons, shared menu tools, legal modals, print actions and support links. Each entry records a source file and display condition. The beneficiary editor is correctly modeled as a modal; the speculative payment-details drawer entry was removed. These specifications remain uninstrumented vendor candidates. This expanded inventory still does not claim an exhaustive, browser-verified census or persisted Adobe/Contentsquare mappings.

### Reusable tracking rows

Analytics now defaults to grouped tracking rows rather than individual placements. The previous 858-row inventory expanded product/applicant controls, conditional health detail fields and shared calculator inputs into their exact placement IDs. Grouping uses explicit reusable control families rather than label equality, keeps separate instrumentation states and vendor mappings, and preserves every underlying tag ID, Site and display condition in expandable details. An individual-placement switch remains available for implementation review. Runtime inventory and payload IDs are unchanged.
