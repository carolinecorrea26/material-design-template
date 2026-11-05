# Review page component review

October 28, 2026. Continues [Profile](profile-component-review.md) using the [component documentation contract](component-documentation.md#required-review-format). Whole-page scenarios are the acceptance entry point; shared components keep their canonical examples. This pass prepares composition and behavior for review, without recording user acceptance or changing saved legal policy.

## Application frame

`AppShell` and `FormRoutePage` own the shared application surfaces, main steps/breadcrumbs, heading/Back, form state, restored values, required-field feedback, Next and transitions. Refer to the [application template](http://localhost:6010/?path=/story/application-patterns-application-page-template--standard-form-page) and [navigation review](navigation-state-review.md). Review's controller supplies coverage/aggregate and policy prerequisites before navigation. The shared route marks Review submitted after successful validation; edit availability then follows session state. Review explicitly supplies its rendered policy fields through the runtimeFields callback so their saved values are restored alongside ordinary page fields.

## Sections in page order

`ReviewSections` is one standalone production page-section composition. It receives resolved text, notice blocks, field definitions, applicant/flow state, document content and print/download callbacks. `src/pages/Review.tsx` retains saved policy selection, coverage validation, workflow state and routing. `ConfiguredApplicationDocumentPreview` resolves the application readout before passing explicit display sections, association name and edit targets to the shared view.

| Section | Shared owners | Review focus and conditional states |
| --- | --- | --- |
| Application guidance | Native alerts/text within ReviewSections | Standard warning, optional fully-underwritten health-question note, or advisor-prepared information/locked-step warning. The page supplies the state. |
| Application PDF download and readout | ApplicationDocumentPreview; page download callback | Saved-answer document groups, placeholders, pagination and edit controls. Signature is hidden on Review. The preview shows explicit display sections; its application adapter resolves the actual records and section-to-page targets. |
| Read and Sign | LegalReviewSection, ReviewStatement, FieldRenderer | Resolved fraud/authorization/consent wording; before-consent native notices; applicable appended notice blocks, lists and acknowledgement/identity fields. Existing placement and emphasis are preserved. |
| Electronic Consent | LegalReviewSection | Authored electronic disclosure in a 200px scrollable surface, with the same heading/border/Print pattern as Read and Sign. |
| Adult acknowledgements and remaining configured fields | ApplicantSectionDivider, FieldRenderer | Member acknowledgement plus independent spouse acknowledgement when that adult applies. Additional configured fields retain their existing fallback rendering. |

There remain exactly two legal sections. Policy blocks do not create extra sections or component identities. Native alerts, notice lists, download and Print controls are internal parts of their owners. The document-content slot does not make a second document implementation.

## Reuse and standalone boundaries

- `ApplicationDocumentPreview` now accepts display sections, association name, dates, signature state and section edit targets. It no longer reads the active client or builds records while rendering. Its existing three story IDs remain stable; they now run standalone and report edit callbacks locally. The application builder and PDF data preparation remain application responsibilities.
- `LegalReviewSection` replaces the duplicated heading, bordered text surface and Print action in both legal sections. It accepts children, an optional height limit and a callback. It selects no wording or policy.
- `ReviewStatement` remains the native text/notice composition. Its canonical examples now demonstrate plain text and a bold notice inserted immediately before the final `CONSENT:` boundary. Without that boundary, the current implementation renders the supplied text alone; the page provides notices only with resolved consent.
- Existing checkbox/input validation, applicant labels, confirmation dialog and advisor send-back dialog retain their shared owners. No new consent field identity or dialog definition is introduced.

The [standalone boundary contract](standalone-component-boundaries.md) applies to these views. Standalone examples use explicit display data and illustrative disclosure copy. Whole-page scenarios use the saved policy and actual authored legal wording.

## Policy, validation and workflow behavior

The page resolves fraud notices from residence, consent from applicant/product/underwriting state, authorization participation/wording, premium statements and active saved blocks. The extraction preserves their rules and text. Unresolved applicant type displays the existing prerequisite message; missing residency or unresolved consent blocks Next. Required active block fields are validated before continuing. Existing coverage validation and normalized member/spouse Life aggregate checks run first.

Regression scenarios cover the existing applicant-type consent variants, underwritten authorization, NY notice placement, Connecticut warning, dividend fields, supplemental-health attestation, guaranteed-issue certification and payroll authorization. These are checks of saved configuration and rendering; they do not establish legal sufficiency or constitute a new policy decision.

Standard document Edit opens the existing ConfirmationDialog. Cancel keeps Review; confirmation routes to the selected page, or calls the single-page section navigator. In advisor flow, Edit opens SendApplicationDialog and confirmation routes to application-edit-confirmation. Its recipient is still the page's existing placeholder `advisor@example.com`; no email transport is implemented by that action. Submitted Review removes document edit callbacks.

Download invokes the existing application PDF generator. Both Print buttons currently invoke `window.print()` for the browser document; they do not print only the adjacent section. The component's standalone example reports the callback without opening a print dialog. These are existing behavior boundaries to consider during page review.

## Whole-page scenarios

Start at **Pages → Review → Whole page**. All scenarios render the production page and saved template configuration. Fictional answers and submitted/advisor flags remain local; successful navigation stops at a local completion message. Explicit local session state prevents one scenario from locking another.

| Scenario | Focus |
| --- | --- |
| [Empty](http://localhost:6010/?path=/story/pages-review-whole-page--empty) | Initial document and legal sections; unchecked acknowledgement and Next validation |
| [Restored consent](http://localhost:6010/?path=/story/pages-review-whole-page--restored-consent) | Restored acknowledgement and continuation |
| [Member and spouse](http://localhost:6010/?path=/story/pages-review-whole-page--member-and-spouse) | Independent adult acknowledgements and document data |
| [Dividend election](http://localhost:6010/?path=/story/pages-review-whole-page--dividend-election) | Saved election and identity fields inside Read and Sign |
| [Missing applicant type](http://localhost:6010/?path=/story/pages-review-whole-page--missing-applicant-type) | Unresolved consent prerequisite |
| [Jurisdiction notices](http://localhost:6010/?path=/story/pages-review-whole-page--jurisdiction-notices) | NY notices, emphasis and before-consent placement |
| [Guaranteed issue](http://localhost:6010/?path=/story/pages-review-whole-page--guaranteed-issue) | Certification inside the existing Read and Sign section |
| [Payroll authorization](http://localhost:6010/?path=/story/pages-review-whole-page--payroll-authorization) | Payroll block placement before Electronic Consent and acknowledgement |
| [Advisor edit request](http://localhost:6010/?path=/story/pages-review-whole-page--advisor-edit-request) | Advisor guidance, edit request, Cancel and local confirmation route |
| [Locked after review](http://localhost:6010/?path=/story/pages-review-whole-page--locked-after-review) | Submitted state without document Edit buttons |

## Canonical examples and optional inspection

- [Document preview](http://localhost:6010/?path=/story/content-applicationdocumentpreview--with-edit-buttons): pagination, placeholder, signature and edit callback presentation; existing IDs preserved.
- [Review statement](http://localhost:6010/?path=/story/forms-review-statement--before-consent-notice): native notice insertion and emphasis, with illustrative copy.
- [Legal review section](http://localhost:6010/?path=/story/forms-legal-review-section--scrollable): shared disclosure surface and print callback.
- **Pages → Review → Sections**: standalone default, member/spouse and advisor-guidance compositions. Optional inspection tools, not separate acceptance gates.

## Verification and remaining review

Verification results are recorded below after focused runtime/source checks and production builds. Page wording/layout, browser Print/download acceptance, all-Site visual/accessibility review and actual advisor delivery remain separate review boundaries. The existing legal-policy regression tests preserve saved notice/consent behavior.

Next review family: Health pages. Their specialized questions and shared question-list components still need the same page/section/component review.

## Restoration correction found during browser review

The restored-consent scenario exposed that Review used `devFillFields` to register policy-generated controls. The shared frame filters development extras against saved field placements, while adult acknowledgement fields have no scalar page placements. They rendered but did not receive restored values. Review now supplies its visible block/acknowledgement definitions through an explicit `runtimeFields` callback. FormRoutePage includes these caller-resolved fields in defaults, restoration, merged fields and development fill; the existing filter for development-only extras remains in place. The controller still resolves block participation and spouse visibility.

New tests mount the real Review page and form frame to verify independently restored member/spouse acknowledgements and saved dividend checkbox/name values. Shared persistence/navigation regressions cover the frame change. The fictional whole-page fixtures also explicitly answer the existing-Life prerequisite, so continuing Review tests its own acknowledgement and navigation rather than missing Profile data.

Final verification: 88 distinct focused checks passed across Review legal-policy/rendering regressions, real-page restoration, shared route persistence/navigation, standalone/actual stories, PDF source data and catalog/source integrity. Application and Storybook TypeScript, targeted ESLint, both production builds and catalog/handoff checks passed. The built audit includes all 398 non-admin story exports and 98 saved components with zero audit errors or invalid examples; review links resolve. Browser checks confirmed required-consent feedback, restored checked consent and successful local continuation, advisor edit dialog/cancellation and submitted-state removal of document edit buttons.
