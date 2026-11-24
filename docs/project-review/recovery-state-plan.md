# Shared redirect-page component — prototype and Library review

Current checkpoint: November 13, 2026 (CHG-057). This supersedes the earlier
magic-link redirect-page proposal. This review
covers prototype presentation and Library/Storybook documentation. It adds no
service integration, magic-link validation or automatic failure routing.

## One component, source-defined content cases

`ApplicationErrorState` is the one global redirect-page component. Error,
Maintenance and Expired access are content groups, not different components.

| Case | Content and selection rule |
|---|---|
| HTTP 400/404/500 | Use a specific mapped error code when available. Show the document icon beside the code; no X overlay. |
| Generic technical error | An error occurred but no specific error-code mapping applies. Show the document icon without a code. |
| Maintenance | Temporary Site unavailability, with support and no navigation into the unavailable flow. |
| Session expired | Application inactivity or Resume MFA countdown reaches zero and opens this shared content. Use the clock icon and secure resume/start-new actions; link/code expiry stays inline. |
| Phone code expired (inline on code entry) | Show the expiry error on the verification-code page, disable verification and retain the resend action. Do not redirect to Session expired or another expiry page. |
| Magic link expired (inline on Resume) | An expired or invalid secure link lands directly on Resume with a page error above the email request field. The user requests another link through the existing form. There is no standalone expiry page or automatic link request. |

There are no payment, submission, saved-application-unavailable or outcome-specific
page components. Correctable field and business issues use ordinary current-page
feedback. A link request never indicates whether a saved application exists;
public confirmation remains uniform until successful resume verification.

## Fresh-start ownership and consumers

`requirements/global/recovery.json` owns the component contract, content-case
references, icons, action definitions and content groups. The ordered slots are
indicator, title, message, optional guidance, actions and shared Site support.
All redirect-page indicators use the shared 48px size. The minimal recovery header and shared
footer surround one centered card; empty optional slots leave no blank rows.

`requirements/global/content/recovery.json` owns the wording.
`requirements/parked/<page>.json` owns each global page declaration and content
placement. `resume.json` owns the inline magic-link error placement;
the superseded standalone `link-expired` page is retired. These global parked records are
fresh-start authoring sources, not legacy fallbacks. Compiled output is generated.
Library, prototype and Storybook use the same projection. ASCE inherits the global
structure and supplies its effective branding and contacts. No separate ASCE
implementation or other real-Site rollout is introduced.

Shared Questions support is a standard MUI info Alert with AlertTitle and no
leading alert icon. Contact-channel icons and accessible channel names remain.
There is no Application or product support heading. The confirmed technical
sentence below the divider contains the Send an email link. Page links use the
configured MUI Link; email-compatible HTML follows the same content and styling.

Superseded unavailable/outcome pages, specialized content and the old recovery
alert cannot reappear from saved catalogs. Direct prototype routes document the
content cases; adding a preview route does not establish service interception.

## Production rules and implementation status

- Specific error-code mappings take priority; generic technical content is the
  fallback only when an error has no specific mapping.
- The existing session timer and redirect are retained. Countdown verification
  checks that expiry fires at zero, once; ordinary activity cannot renew an open
  warning without its explicit action.
- Magic-link expiry uses the global `link-expired` alert definition with Resume
  as its host page. Its title/message remain shared fresh-start content. Production
  invalid/expired-link landing on Resume is documented; this pass previews the
  inline state without adding token validation or new service routing.
- Resume never discloses saved-application existence before successful verification.
- Only explicit Start new resets application values. Safe support references may
  be displayed; private diagnostics and tokens may not.

## Verification

Focused checks cover session countdown expiry, specific-code/generic presentation,
inline magic-link feedback and re-requesting, shared support and identifier privacy. Fresh-start
checks reconstruct every reviewed case without superseded authored records and
compare Library, prototype and Storybook projections. Production and Storybook
builds verify the generated previews.


## Client configuration and copy review (CHG-085)

User variant-by-variant decisions November 15, 2026. The one shared ApplicationErrorState remains the renderer for all six redirect cases.

| Variant | Client copy |
| --- | --- |
| HTTP 400 | Global title, explanation and guidance |
| HTTP 500 | Global title, explanation and guidance |
| Generic unmapped technical issue | Global title, explanation and guidance; remains the fallback only without a specific mapping |
| HTTP 404 | Global title, explanation and guidance |
| Maintenance | Three Site slots: `recovery.maintenance.title`, `.message`, `.guidance`; global defaults, optional guidance |
| Session expired | Global title, explanation and guidance; existing countdown redirect unchanged |

Maintenance values belong in `parked/sites/<site>/pages/maintenance.json` → `content`; ASCE inherits all three global defaults. Existing bindings project them into `pages.maintenance.title`, `.subhead` and `.recoveryGuidance`. The default adapter imports global content; ApplicationErrorState reads the same effective ComponentContentContext for direct status and incident-based presentation. Empty guidance renders no extra text row. The static recovery definitions continue to own global selection, severity, icons, actions and layout.

Action labels and behavior remain global for every variant; Maintenance still has no application-navigation actions. Site identity/branding and support contacts retain their independent effective configuration. No custom return time, save guarantee, additional error component, service interception or automatic failure routing is introduced. Link/code expiry stays inline on the reviewed Resume screens; the later CHG-087 session destination applies to MFA sessions. This completes redirect copy classification; unsupported variant/action overrides are rejected.


CHG-087 supersedes the earlier inline-MFA landing: the existing shared expiration page covers application inactivity and Resume MFA session expiry. Link and phone-code expiry remain inline. Global Session expired wording now says “Your session has expired.” without restricting the cause to application inactivity. Its copy remains global by the confirmed variant review; no additional MFA page/content type is created. The prototype's existing MFA expiry handling now selects this shared page; no technical-error service interception is introduced.


CHG-086–088 final verification: **78 Fresh-start checks and 97 focused checks passed**. TypeScript, focused ESLint, requirements mapping and component/Storybook/icon/handoff checks pass. Prototype and Storybook production bundles build successfully; public, prototype and Storybook catalogs have identical SHA-256 `51ff0996bcb99a2ac4cef20e3583c03e99e35df05cf0ac81323b0b527c7a7e57`. All 110 canonical component owners remain covered. HomeHero and QuickDecisionExplainer explicitly declare their existing shared MUI Link dependency in the global component inventory.

Browser verification confirmed global Home wording with synthetic effective branding, the primary action/continuation link, no blank helpers, 16px ZIP/state/DOB gaps at desktop and 390px width, no mobile horizontal overflow, a 1s QD reveal transform and weight-600/no-underline controls, including shared recovery/support/footer links. The shared expiration page uses the generic session wording. Timer, late-response and inline link/code expiry behavior is covered by focused integration tests. ASCE has no new Site-owned copy or configuration assignment.


## Non-copy configuration review (CHG-111)

November 17, 2026: all six redirect cases remain one global ApplicationErrorState composition. The global template owns route/page participation/order, minimal header/shared footer, widths, ordered slots, indicator size/icons, error-code mapping, permitted actions and their destinations, reset behavior, support-reference privacy, and session/link/code selection rules. These are not ordinary Site settings. There are no form fields, operation-specific page types, payment/resume-specific recovery controls, configurable retry/return times or Site maintenance-activation switch. Maintenance activation remains a production host/availability responsibility, not a newly implemented service.

Only Maintenance title, explanation and optional guidance accept the three already approved Site copy overrides. HTTP 400/404/500, unmapped technical-error and Session expired copy/actions remain global. Effective Site identity and support contacts continue through their shared configuration. ASCE inherits defaults. Library definitions stay global; effective page/content projections carry permitted overrides. Existing ApplicationErrorState, ApplicationRecoveryActions, PageShell/FormShell and SiteSupport remain the shared owners. No wrapper or additional story variation is needed.

The audit found application inactivity still marked provisional. The user confirmed **45 minutes of inactivity with a two-minute warning**, fixed globally, separately from the confirmed **30-minute Resume MFA session with a two-minute warning**. `global/configurations/application-session.json` now owns the two numeric defaults; shared validation requires positive whole minutes and warning lead time shorter than inactivity. Bindings project them into `applicationSessionPolicy` for the Library/prototype/Storybook. The existing timer reads the same global source, with no Site overrides or changed duration. The provisional hardcoded policy and duplicated legacy rule descriptions are replaced with confirmed shared recovery rules.

Before its warning opens, form activity may renew the application inactivity deadline. Once open, only the explicit Keep session active action can renew an unexpired session; activity/reload/navigation cannot extend it. Absolute deadlines survive routes/reloads/background pauses. Expiry opens the shared Session expired page once; utility pages remain usable. Resume MFA remains fixed and cannot be extended. Expired/invalid links stay on Resume, and expired phone codes stay on code entry while MFA remains active. Public recovery never reveals saved-application existence.

Production rules are normative requirements; existing local timer and recovery simulation remain their prototype representation. No live availability/session/authentication/delivery integration or new technical-error interception is added. No policy decision remains open for these templates.

CHG-111 verification: **92 Fresh-start checks and 57 focused checks passed**. Checks cover global timing values/override rejection and validation, retirement of provisional rules, reconstruction and Library/prototype/Storybook agreement, effective Maintenance copy, session/MFA countdowns, inline link expiry, permitted actions/resets, support and identifier privacy. TypeScript, focused ESLint, requirements mapping, component-reuse and catalog/Storybook/icon/handoff gates pass. Prototype and Storybook builds pass. Public, prototype and Storybook catalogs share SHA-256 `f2e5d06a33339326fdf1eb97d01c11b50ea43de8b7e8ac36e6defde2aeb5f8c0`. This template configuration review is complete with no open decisions.
