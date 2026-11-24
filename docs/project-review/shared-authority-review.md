# Shared decision authority follow-up

Ownership: global runtime behavior and derived projections. Existing effective-Site
assignments, overrides, policy ceilings and product scopes remain authoritative;
this follow-up adds no real-Site rollout or Site-owned implementation.

Implemented:

- `applicantParticipation` projects active product/applicant elections for Coverage,
  submission checks, Beneficiary, underwriting and questionnaire portfolios. Removed
  dependents and products cannot participate through retained draft maps. Missing
  maps retain the existing defaults; explicitly empty maps remain empty.
- `validateCoverageSubmission` orchestrates joint-election, individual and aggregate
  policies for both Coverage and Review. Coverage explicitly defers only Profile
  underwriting facts. Review and restored applications enforce the same Site ceiling.
- `FormFieldDefinitions` supplies effective sibling definitions at application and
  standalone Storybook form boundaries. Phone-type options and validation inherit
  the same page overrides as ordinary fields. Contact needs no separate repair.
- `applicationLifecycle` projects recovery placement and signing locks from saved
  workflow stages. Transient progress is scoped by Site and application identity;
  recovery and workflow transitions notify the same session consumers. Legacy
  unscoped flags are never assigned to a household.
- Underwriting execution and Library reachability share the health-page mapping.
  Inspection uses explicit Site/layout context, the captured fresh-start source,
  assigned underwriting bands and portfolio routes. Related Site resolution does
  not install another prototype or activate retired Sites. Analytics caches are
  scoped to the installed revision and requested Site.

Component reuse: effective sibling definitions live in one form-boundary component
used by the prototype and standalone stories. Existing page views, phone controls,
policy resolvers and canonical stories remain shared. No new page wrapper or
parallel editable requirements were introduced.

Focused regressions cover removed dependents, missing versus empty elections,
changed Site ceilings at final validation, scoped phone choices and validation,
recovered signing locks, workflow persistence and cross-Site routing/source changes.
The stale ABE phone test now starts with a valid synthetic inherited Site before
applying an invalid binding. Analytics fixtures likewise use enrolled fresh-start
Sites and test stale-record rejection rather than obsolete saved authoring.

Verification: `npm run test:fresh-start` passed all 118 checks, including removal
of superseded authored records and consumer parity. TypeScript (`tsc -b`), focused
lint and current Coverage/Review, Library, field inheritance, workflow, recovery,
Storybook and synthetic-fixture regressions passed.

## Journey coverage migration

The eight historical journey/household failures have been replaced by acceptance
checks against authored fresh-start enrollment and effective policies. The old
migration scope remains historical evidence; it no longer defines runtime test
Sites. ASCE, AMA, AMA-GI, WAEPA and WAEPA GI are resolved through the same compiler
as Library and the prototype. No further real-Site rollout was needed.

Ownership and implementation:

- Global question identities come from the authored page mappings, including the
  stable `health-li-*` answer aliases on `health-tele`. Effective field surfaces
  are resolved once on the Site projection and reused by Library/prototype and
  journey validation. Both health validators use the existing repeatable-detail
  contract, bindings, field checks and limits; obsolete `.details` strings do not
  constitute valid UI evidence.
- An explicitly question-free GI assignment is valid. Missing non-GI participation
  continues to fail closed. Shared capability tests use synthetic authored Site
  assignments for rider-only applications, dependent-election defaults and billing
  fee variations. Confirmed ASCE/WAEPA standalone-CIR exclusions remain intact.
- The global OO question group and existing Coverage FieldGroup now expose the
  already-defined expense/responsibility inputs required by the AMA journey
  assignment. This is shared page composition, not an AMA-specific component.
- Acceptance fixture facts derive amounts, classes, periods, membership category,
  payment options and questionnaire answers from the resolved configuration.
  Existing coverage is explicit synthetic evidence. Tests never modify generated
  catalog output to activate overrides.

| Coverage layer | Responsibility |
| --- | --- |
| Fresh-start gate | Global ownership, reconstruction without superseded records, Site overrides, Library/prototype/Storybook parity |
| Journey contract acceptance | Every enrolled product/applicant/enabled mode, question assignment and conditional submission mapping |
| Representative journey matrix | Group by effective applicant/mode/class, underwriting/health, questionnaire, payment, dependent and required-period behavior; execute shared submission mechanics once per group |
| Exception acceptance | Shared invalid-input rejection once; AMA class/period override requirements separately |
| Household/portfolio acceptance | Member/spouse/child, multiple children, verified primary coverage, aggregate boundaries, exclusions and billing synchronization; authored overrides exercise changed behavior |
| Browser adapter parity | Each enrolled product/applicant/class projects the same effective choices and underwriting; calendar-age and infant-schedule boundaries reuse existing checks |
| Configured application traversal | Group by effective layout, applicants, health routes and payment; traverse forward/back through Review, signing and Receipt and pair with household submission and Coverage validation |
| Existing component/service tests | Actual entry handoff, save/resume/signing/receipt behavior, single-page composition and individual page validation stay shared; no duplicated browser suite per Site |

`npm run test:journeys` runs this focused acceptance/parity group. The route traversal
uses real flow resolvers and policy submission, not a browser rendering of every
page; existing page/component and workflow-service tests retain that responsibility.

AMA-GI assigns the user-confirmed individual-product-limits-only mode under its
Site products source (November 23, 2026). Global aggregate participation resolution
is shared by portfolio submission and the Coverage/Review submit validator;
approval metadata does not change behavior. Conflicting aggregate limits fail closed.

Verification: the focused journey group, shared health/surface/entry regressions,
TypeScript and focused lint pass. The fresh-start gate verifies all 118 ownership,
inheritance and consumer-parity checks. The generated deployment bundle is rebuilt
from the authored requirements. Existing opt-in SQL export coverage is unchanged.
