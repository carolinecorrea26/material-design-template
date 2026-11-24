# Advisor final review

November 13, 2026 — CHG-063. Completes the fresh-start review of Advisor Login,
Advisor Send Confirmation and Application Edit Confirmation. This checkpoint
supersedes the October presentation review's reset, recipient and nine-day notes.
No Advisor decision is deferred.

## Ownership and consumers

Structure, section conditions, save participation and content references live in
`requirements/parked/{advisor-login,advisor-send-confirmation,application-edit-confirmation}.json`.
These are global definitions despite the directory name. Canonical fields are in
`requirements/parked/field-details.json`; labels, options and validation are not
copied into controllers or examples. Global behavior is in
`requirements/global/rules/advisor-resume.json`, with page mappings under
`requirements/mappings/requirements/`. ASCE inherits these definitions and defaults;
no ASCE-only implementation or other real-Site rollout was added.

Library, prototype and detached Storybook pages resolve the same compiled source.
Storybook's six meaningful examples use the actual controllers and explicit
fictional answers. Its saved-application example supplies an initial-save age to
show the original deadline; it does not author another retention value.

## Components, content and behavior

| Surface | Shared composition and confirmed contract |
| --- | --- |
| Login | FormRoutePage, configured title/header slot, MUI Tabs, FieldRenderer and submit button. Start/Continue labels, section notes and branch visibility come from source. Validate a supported required mode and only its active fields. |
| Start | Required advisor email, ten-digit phone and advisor code. Starts at Membership. Login is excluded from application autosave, clears the preceding household/session and retains the entered advisor details. |
| Continue | Required applicant email, separate from advisor email, with third-party autocomplete disabled. Carries that email into Resume without looking up or confirming an application. Verification precedes restoration and ordinary advisor editing returns to Eligibility. |
| Applicant handoff | Profile's shared SendApplicationDialog shows applicant name/email. Cancel stays on Profile; Send opens Advisor Send Confirmation. Applicant `flow=advisor` context requires verification before Review and locks earlier completed steps. The URL context grants no authorization. |
| Sent confirmation | Standard success Alert and DetailsTable show saved applicant identity, a stable local sent timestamp and the actual original saved-application deadline. Missing metadata uses source-defined missing values; sending never adds nine days or restarts retention. |
| Start new application | Clears applicant answers, elections, collections, saved handle/deadline, receipt reference and session flags; cancels pending saves. Retains advisor email/phone/code, selects Start and returns to Advisor Login. Site/entry restrictions remain browsing context; the prior server application is not deleted by this action. |
| Edit request | Review's existing shared dialog and Application Edit Confirmation use the saved advisor email. Missing identity never invents a recipient. Cancel stays on Review; Send opens the confirmation, which uses a stable local timestamp, live announcement and Return to Home. |

Page wording is declared in global `content/confirmations.json` and the page-content
source, projected through `content-bindings.json`. Approved effective-Site header and identity-field label overrides use the same inheritance path; CHG-107 fixes core inclusion, requiredness and validation globally. Confirmation
pages also opt out of application saves. Native alerts, tables and actions remain
parts of existing page owners; no duplicate component family was introduced.

## Configuration, storage and implementation

The global retention default is **10 days from initial save**, shared with Resume
through `requirements/global/configurations/resume.json`. Effective Sites may
assign supported overrides. Sending, editing, requests and successful verification
do not extend the stored deadline. Old `confirmation.signatureRetentionDays`
configuration and captured advisor-rule copies are retired by the compiler.

Advisor email/phone/code and the independent applicant-email are scalar application
bindings. Reset retains only the source-defined advisor identity fields and the
selected mode, plus applicant-email for Continue. Confirmation timestamps are local
display metadata; expiry comes from the saved handle, not a second application
record. Review sends the saved recipient into the existing dialog.

Production authorization, delivery and retention enforcement are recorded system
requirements. The prototype implements validation, state transitions, simulated
persistence and display; it does not authenticate advisors, deliver real emails or
run deletion batches. Confirmation rendering does not perform a delivery operation.

## Verification

Focused checks cover branch/mode validation, no household save at entry, reset and
identity retention, original deadline display, Continue prefill, Profile handoff,
Review restoration and actual Storybook rendering. Fresh-start checks reconstruct
the pages without superseded records and compare Library/prototype/Storybook
projections, global defaults and effective overrides. See also the
[Resume checkpoint](resume-component-review.md).

Final verification: 53 fresh-start checks, 55 focused Advisor/Resume checks,
51 adjacent regression checks and 60 requirement-schema checks passed. Application
and Storybook production builds passed, with identical catalog artifacts. Visual
checks confirmed original-deadline display, uniform resume confirmation and inline
link/code expiry. TypeScript, scoped ESLint and whitespace checks passed.


CHG-064 follow-through: the [Resume workbook reconciliation](resume-component-review.md)
supersedes the earlier recovery limits and link-bound verification model. Advisor
handoff still requires successful email-link plus phone verification before Review;
its original application deadline and retained-identity/reset rules are unchanged.


## Client configuration and copy review (CHG-083)

User decisions November 15, 2026. Advisor entry has two Site content slots: `page.advisor-login.title` and `page.advisor-login.subhead`, inheriting global definitions/defaults. Effective values belong in `parked/sites/<site>/pages/advisor-login.json` → `content`. ASCE inherits both. Existing content bindings feed the page's custom header, Library and Storybook; no new header component or parallel copy is introduced.

| Advisor item | Copy/configuration ownership |
| --- | --- |
| Entry title/introduction | Site wording overrides with global defaults |
| Start/Continue instructions | Global |
| Tab/button labels, validation and access behavior | Existing global/shared field/component contracts |
| Application sent and Edit request sent pages | All copy global, including headers, success messages, detail/deadline labels, announcements and actions; no Site page-copy slots |
| Advisor/applicant identity, actual deadline and effective branding | Existing independent answer/policy/Site data; global labels do not hard-code these values |

The confirmation default adapter now imports its global content. Existing FormRoutePage, native success Alert and DetailsTable compositions remain justified page compositions; no duplicate confirmation component is introduced for configurable wording. This completes copy classification for Advisor entry and its two confirmation pages. Reset/retention, validation, access, recipient and delivery rules are unchanged.


## Non-copy configuration review (CHG-107)

User decision November 17, 2026. Advisor code validation is global and nonblank
only; Sites cannot configure code format or length. This review keeps the
confirmed Advisor workflow and closes generic field-override gaps.

| Item | Configuration boundary |
| --- | --- |
| Entry mode | Global Start/Continue options, labels, default Start and required participation. Sites cannot hide the mode or remove a branch. |
| Active entry fields | Global inclusion/requiredness: Start collects advisor email, phone and code; Continue collects applicant email. Hidden inactive branches do not validate. |
| Identity validation | Email formats and ten-digit phone validation stay global. Code is required/nonblank with no format or length restriction. Site hiding, optional-product exceptions and validation overrides reject. |
| Identity labels | Existing supported Site overrides retained for email, phone, code and applicant-email labels; the mode label/options remain global. |
| Entry title/introduction | Existing two Site content slots with global defaults; instructions/actions/validation/access behavior remain global. |
| Page structure/order/save participation | Fixed global definitions. All three pages opt out of application autosave. No new Advisor enablement, reordering or confirmation setting. Existing URL entry context is not authentication. |
| Confirmation copy and actions | Global; no Site copy slots. Actual applicant/advisor identity, saved deadline and event timestamps are data rather than editable configuration. |
| Retention | Existing shared saved-application retention policy; default ten days from initial save. Sending, editing and verification do not renew it. No independent Advisor deadline. |
| Restart and handoff | Existing global rules: clear applicant state and retain advisor details; send from Profile; verified applicant returns to Review; corrections use the saved advisor recipient. |

The shared field constraint resolver enforces these boundaries. Required text
now rejects whitespace through the shared validator and renderer; this is not an
Advisor-only regex. Explicit nonblank code strings, including punctuation and
long values, have no added format/length restriction. Other field input and
format contracts remain unchanged.

SendApplicationDialog remains one shared component for applicant handoff and
return-to-advisor edits. Its defaults/actions/recipient labels/placeholders and
the default content adapter now read global Fresh-start definitions rather than
parallel strings. Existing standalone variants exercise those definitions; no
new dialog or duplicate story is created.

AdvisorLoginFields is a justified mode/branch composition of MUI Tabs,
FieldRenderer and the shared form frame. Confirmation controllers retain their
different metadata/actions: original applicant deadline plus restart versus
saved advisor recipient plus Return to Home/live announcement. Both reuse the
standard success Alert and DetailsTable, with no separate confirmation component
family. ASCE inherits the global contracts. Production access authorization and
actual message delivery remain recorded requirements; this change adds neither.

CHG-107 verification: **90 Fresh-start and 113 focused checks passed**. Checks cover field-override rejection with retained supported labels, source reconstruction and consumer agreement, global dialog copy, whitespace-only code rejection and unrestricted nonblank codes, branch validation, restart/reset, original retention, Profile handoff, applicant Review/edit routing and standalone/page Storybook examples. TypeScript, scoped lint, requirements and all component/reuse/icon/organization/handoff gates passed. Application and Storybook builds passed; public, application and Storybook catalogs match. ASCE inherits the global contracts. No Advisor configuration decision remains open.
