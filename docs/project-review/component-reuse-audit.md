# Component reuse audit

November 13, 2026. **R1–R7 implemented and verified.** Ownership is the global template, including capabilities disabled for ASCE. Effective-Site assignments and business-policy values were preserved. The original findings below describe the audit baseline; the implementation record follows them.

## Original audit coverage and method

- All **28 application/utility/advisor/recovery page definitions** and their **23 distinct page controllers** were accounted for; the six redirect cases share ErrorPage.
- All **110 canonical component records at the audit baseline** were matched to source: 14 application-frame owners, 22 page sections and 74 shared pieces. Two owners are MUI Button/Link; every local canonical source is within the scan.
- **160 local production UI/controller/adapter modules** were inventoried, including FormRoutePage, shared chrome and quote workflows. Admin/reference/demo UI, dependency internals and other real-Site rollouts are excluded.
- JSX structural comparison identified candidates; manual review checked state, callbacks, formatting, field bindings, source-driven configuration and existing shared owners. Matching MUI markup alone was not treated as a duplication defect. Short wrappers were checked for purpose, not rejected solely for their length.

75 catalog records have multiple source placements; only 49 have multiple distinct direct consumer files. Neither number measures distinct pages or runtime coverage: a single AppShell placement can serve the entire application. Role and implementation boundaries determine reuse, not those counts.

Current source hashes, the updated module/component inventory and structural candidates are in [component-reuse-evidence.json](component-reuse-evidence.json). Regenerate with `node scripts/audit-component-reuse.mjs`; `--check` detects stale evidence. The [component consolidation register](component-consolidation-review.md) has been refreshed to distinguish current findings from old completed items.

## Original findings and implementation boundaries

| ID / order | Confirmed gap | Evidence | Required change and boundary |
| --- | --- | --- | --- |
| **R1** | Date and month/year controls bypass their existing shared text presentation. | `src/components/forms/FieldRenderer.tsx:823` and `:902` independently rebuild TextField, external/floating labels, helper text, errors and adornments. `TextLikeField.tsx:15` already owns that presentation for other text-like formats and PhoneField. | Use the common presentation with separate formatting/storage adapters. Preserve IDs, full-date versus month/year formats, validation, autocomplete and restored values. This affects shared fields across pages, not a new field identity for each format. |
| **R2** | Page/header and standalone Resume frames still have parallel compositions. | `PageShell.tsx:43` repeats title/error/help placement instead of PageHeader/PageAlert. `Resume.tsx:65`, `ResumeMethod.tsx:52` and `ResumeCode.tsx:91` repeat the same outer Box → PageShell → FormShell → PageHeader arrangement. FormRoutePage already uses PageHeader. | Reuse the header owner and one presentational standalone-form frame. Keep Resume request/MFA controllers separate from application saving, navigation and security lifecycles; do not route them through application autosave just to reuse layout. PageTitle remains a legitimate internal primitive. |
| **R3** | Five ordinary dialog owners bypass the shared modal shell. | Raw Dialog/title/content/action chrome in `Home.tsx:302` (landing notice), `AppHeader.tsx:321` (coverage details), `ClientHelpBanner.tsx:193` (scheduling), `MemberVerification.tsx:233` and `SessionExpiryAlert.tsx:14`. AppModal already supplies this foundation. | Share modal chrome; preserve each controller's callbacks and content. Verification needs its staged header, and session expiry needs non-dismissal, alertdialog and focus behavior; add generic shell capabilities where necessary. The fullscreen image handoff and AppMenu's navigation Drawer have different layout purposes and remain justified exceptions. |
| **R4** | Health has parallel answer/detail renderers and duplicated page plumbing. | `HealthQuestion.tsx:21` and `YesNoDetailList.tsx:26` both compose FieldRenderer + conditional DynamicList. Default summary markup is repeated in SI/TELE/DI SUPP. TELE and DI SUPP have structurally matching FormRoutePage compositions. Production callers use the named `YesNoDetailQuestionFields` export; the numbered default YesNoDetailList composition has no production caller. | One question/detail renderer should receive mappings, display summaries, conditional/direct/repeated details and explicit bounds. Share common page/entry plumbing without merging questionnaire resolution, applicant participation or medical policies. Retire the unused default list composition only after reconciling its catalog/source references. Preserve independent self/spouse answers and source-specific limits; do not silently make different limits equal. |
| **R5** | Two page/person-named wrappers have only generic presentation. | `SpouseContact.tsx:5` is a supplied field array in FieldGroup; ContactSections already has that same fallback. `ReceiptNextSteps.tsx:4` is supplied title/description/children in an info Alert. | Inline SpouseContact through the existing generic field-section path or give the reused field-list view a neutral owner. Represent the receipt alert as a generic information-alert composition or its existing MUI owners. Keep actual spouse participation and ReceiptConfirmation's document/business content at their existing controllers/compositions. |
| **R6** | Equivalent page-level errors use different presentation paths. | Resume uses PageAlert for one error and raw Alert for a later request error (`Resume.tsx:68,75`); ResumeMethod (`:58`) and CIR load failure (`HealthCir.tsx:20`) also render raw page-level errors. PageAlert already owns page-message spacing and severity/live-region semantics. | Use the page-message owner for equivalent page-level feedback. Keep inline field/record notes, SiteSupport alerts and overlay-specific feedback distinct where their placement/semantics differ. Direct MUI Alert use is not itself a defect. No new error destinations or production routing should be introduced. |
| **R7** | The declared component model and canonical catalog are not fully reconciled. | PrototypeHandoffPage is implemented and shared by HealthQd/DocuSign, and declared in `requirements/global/components.json`, but has no canonical component record. Eleven declarations in that file lack canonical records; they are not eleven missing implementations (classification below). The old consolidation script also omitted three existing owners and referred to retired owners. | Give the implemented shared handoff one actual canonical example/record and reconcile placeholder/part declarations. Retain intentional named parts as parts. The audit tool's missing-family and stale-decision issues are corrected now; component model/application changes remain open. |

All findings are **global definition/composition work**, with no new ASCE-only implementation. No new business-policy decision was identified for these changes. Existing behavior, content, validation, production-service boundaries and Site values must be preserved; a later implementation discovery must be surfaced rather than silently deferred.

## R7 original declaration classification

| Declaration without a canonical record | Current disposition |
| --- | --- |
| PrototypeHandoffPage | Implemented shared owner; missing canonical catalog/example coverage. QD and DocuSign should continue sharing it. |
| FieldGroup | Real named export of SectionDivider; document as its part rather than inventing another independent component. |
| Snackbar / HelpChip | MUI/inline parts represented through AppSnackbar and PageHelpChips. Identify the actual owner/part rather than treating these labels as separate application implementations. |
| SectionNote / ConfirmationAlert | Descriptive inline alert parts, not implemented standalone components. Reconcile declarations with actual MUI/shared-alert placements. |
| ResumeEmailRequest / ResumeDeliveryMethod / ResumeCodeEntry / AdvisorLoginTabs | Inlined form/page arrangements, not exported components under these names. Document actual controllers and configured fields/parts; do not create page-specific wrappers merely to satisfy old names. |
| ESignInstructions | No current implementation; the accepted DocuSign prototype is the image handoff. Reconcile the obsolete instruction-component declaration with that accepted model. |

## Page coverage and retained boundaries

| Page family (count) | Reuse assessment |
| --- | --- |
| Home (1) | Existing hero, applying/coverage content, quote workflow and pricing owners are shared appropriately; R3 applies to the notice shell. Decorative application previews remain separate from real form fields. |
| Membership / Eligibility (2) | FieldRenderer, PhoneField, AddressFields, FieldGrid, PageHelp and verification/address primitives are shared. Membership outcome and eligibility/verification controllers remain distinct. R1/R3 affect underlying fields/verification chrome. Parked-client source branches were not enabled or given a new business-policy review. |
| Coverage / Beneficiary (2) | ProductCard, category/applicant surfaces, field controls, prices and record-row primitives are shared. Beneficiary's primary/contingent, trust and apply-to-other-coverages orchestration is a real domain boundary, not another generic DynamicList. |
| Contact / Profile (2) | AddressFields and person-independent profile/physician controls are shared. BusinessInformation's same-as-home synchronization and employment participation are meaningful local behavior. R5 removes the data-only spouse wrapper; R1 affects date presentation. |
| Review (1) | Read-only documents, legal statements, notice placement and consent remain domain compositions over shared primitives. No additional page-specific wrapper extraction is justified by this audit. |
| SI / TELE / DI SUPP / CIR / QD (5) | Shared grouping/fields/lists and the existing generic help removal are retained. R4 covers rendering duplication; R6 covers CIR page feedback; R7 covers QD's shared handoff model. Questionnaire/applicant policies remain independent data/logic. |
| Payment (1) | SharedPaymentControls, product/category surfaces, prices and PageHelp are reused. PaymentSections is a distinct composition; the controller resolves collection/policy and normal form continuation. CHG-070 completes its separate final page/rule review and removes authorization/submission actions. |
| DocuSign / Receipt (2) | DocuSign already shares the external handoff (R7). Receipt decisions, documents and support are meaningful compositions; only the data-only info-alert wrapper is R5. DocuSign final page audit is complete in CHG-073; Receipt final page audit is complete in CHG-074, retaining shared information/support/error and estimate owners. |
| Advisor entry / sent confirmation / edit confirmation (3) | Shared frame, fields, DetailsTable and send dialog are appropriate. Keep advisor identity/reset and edit-return controllers separate; generic Stack/Alert/Button usage does not require a combined confirmation workflow component. |
| Resume request / method / code (3) | Shared fields, expiry/resend primitives and feedback already exist. R2/R6 cover remaining frame/message duplication. Retain request budgets, fixed MFA session, attempt locks and privacy rules in their existing shared domain/services. |
| 400 / 404 / 500 / technical / maintenance / session-expired redirects (6) | Already share ErrorPage/ApplicationErrorState, recovery actions and SiteSupport. No new template per failure cause is warranted. |

AppShell chrome, native field owners, AddressFields, PhoneField, FieldGrid, SectionDivider/FieldGroup, applicant/category/product surfaces, EstimatedRate/frequency display, DynamicList, PageHelp, AppDrawer/AppModal and SiteSupport remain the canonical foundations. Configured* adapters bind effective data to pure views; their thinness alone is not a reason to merge them into views. Global semantic presets such as ProgressSavedSnackbar and the compact QuickDecision indicator are likewise legitimate shared contracts.

## Status and verification

The earlier all-purpose Keep/future-consolidation notes are not proof that these findings were resolved. R1–R7 now have the implementations below. Previous confirmed business decisions remain intact. No findings remain open in this reuse audit; final business-rule reviews of other application pages remain separate.

Original audit verification was source-based: complete canonical-source coverage, deterministic module hashes and structural candidates, review-register regeneration and `--check`, JavaScript syntax checks and a whitespace check. That audit did not run application suites. The implementation verification is recorded below.

## R1–R6 implementation record (CHG-068)

| Finding | Global implementation | Preserved boundary |
| --- | --- | --- |
| R1 | Full dates and month/year use TextLikeField through FieldRenderer. | Separate format/storage adapters, field IDs, validation, autocomplete and restored values. |
| R2 | PageShell delegates to PageHeader/PageAlert; Resume request/method/code use StandaloneFormPage. | The frame is presentational; controllers retain form state, security, navigation and service boundaries. |
| R3 | All five ordinary dialogs compose AppModal. Its generic contracts cover staged headers, compact/mobile sizing, dividers, dismissal, labelled descriptions and action autofocus. | Verification stages and Home/header/scheduling callbacks remain local. Session expiry cannot be dismissed with Escape/backdrop; its extension action receives focus. Fullscreen handoff and navigation Drawer remain intentional exceptions. |
| R4 | HealthQuestion renders both default and configured questions. ConfiguredHealthPage shares SI/TELE/DI SUPP plumbing; HealthDetailSummary shares default record summaries through the explicit summary slot. Unused YesNoDetailList and its duplicate story are retired. | Questionnaire resolution and participation remain in their existing domain functions. Self/spouse keys and collections remain independent. Default surface limits stay source-defined (10); configured lists retain their previous unbounded presentation rather than inheriting 10. |
| R5 | ContactSections uses its generic field-section path for spouse fields. InformationAlert replaces the data-only receipt-named alert. | Applicant headings, participation and receipt content/actions remain with their existing compositions. |
| R6 | Equivalent Resume, delivery-method, CIR-load and PageShell errors use PageAlert. | Inline domain/support/overlay alerts retain MUI Alert. No new redirects or production services. |

Fresh-start page compositions and global component metadata declare the actual owners. The source pages retire `component-spouse-contact`, `component-receipt-next-steps` and `component-yes-no-detail-list`; reconstruction checks inject those superseded records and verify their removal. Canonical stories use real authored fields. Generated Library/Storybook records are rebuilt from these sources.

Implementation verification completed:

- All **58 fresh-start checks** pass, including injected superseded-record removal, full source reconstruction, synthetic-Site inheritance and Library/prototype/Storybook projection parity.
- The follow-up focused run passes **105 checks** across shared fields/dates, modal focus/non-dismissal, session guards, Home notices, Contact and Health stories, and standalone compositions. Additional focused Health grouping/restoration, TELE variants, advisor/resume and member-verification cases passed. The mapped-record regression also passes: distinct field/storage keys restore correctly and explicit limits control Add without losing the record.
- Both prototype and Storybook builds succeed. Main and Storybook TypeScript, focused ESLint, requirements mapping, component review, icon audit, handoff generation, evidence freshness and whitespace checks pass.
- Public, prototype-build and Storybook catalogs have the identical SHA-256: `bbf036b476694b92712ec51533d6cf6827c323c2432ebb9197f08dc864e06609`.
- Built-browser spot checks confirm the standalone frame, focused/non-dismissible warning and combined member/spouse health layout. These verify this refactor; they do not claim full visual acceptance of all pages.
- The initial broader Contact run passed 17/18 cases. Its remaining assertion expects a Membership phone field for WAEPA; it exercises unrolled-Site fixture data outside these changes. No WAEPA rollout or policy was changed to satisfy it. The initial session-dialog accessibility failure was corrected and its follow-up suite passes.

At R1–R6 completion, the inventory contained 109 canonical records and 161 local UI/controller/adapter modules. R7 below completes the declaration reconciliation and adds the missing canonical handoff record.

## R7 implementation record (CHG-069)

Ownership is global; no effective-Site assignments or policy values changed. No unresolved business decision was found.

| Original declaration | Final representation |
| --- | --- |
| PrototypeHandoffPage | One canonical shared-piece record with real implementation and single/multiple-screen stories. Health QD and DocuSign whole-page examples link to this owner. Global placeholder examples and effective image assignments remain distinct. |
| FieldGroup | SectionDivider named export, documented in its `parts`; page placements explicitly name `partOf: SectionDivider`. |
| SectionNote | Native MUI Alert part of EligibilitySections or BeneficiaryProductRecords, with explicit part ownership. Existing content and placement stay intact. |
| Snackbar / HelpChip | Native parts of AppSnackbar / PageHelpChips. Coverage references AppSnackbar directly. |
| ConfirmationAlert | Removed the fictitious standalone declaration/tree node. Confirmation page compositions explicitly document their page-owned native success Alert in FormRoutePage's content slot. |
| ResumeEmailRequest / ResumeDeliveryMethod / ResumeCodeEntry / AdvisorLoginTabs | Removed unused component placeholders. Existing page controllers, real configured fields, shared frames and native Tabs remain their documented compositions. |
| ESignInstructions | Removed obsolete declaration. The existing DocuSign image handoff remains the accepted prototype. |

Canonical source bindings, roles, dependencies and parts now live together in `requirements/global/components.json`; the build script no longer maintains parallel role/part lists. The component compiler reconstructs the canonical inventory, refreshes stale definitions and removes undeclared records. Library reads use that same fresh projection; prototype and Storybook expose the compiled component records too. Generated usage/example annotations are retained separately from source-owned definitions and regenerated by the build analyzer. Registration/dependency checks reject disagreement with the actual stories/source. Owned-part validation rejects unresolved or unscoped part placements.

Verification completed:

- **60 fresh-start checks pass**, including component reconstruction with an empty component table and parity with a populated one. Library, prototype and Storybook agree on canonical records; definitions remain global under Site filters.
- **41 distinct focused checks pass**, covering the registry, actual canonical handoff stories, existing QD/DocuSign behavior, Health stories, Eligibility validation, component structure/scope and the ASCE/shared catalog paths. One additional Node regression verifies rejection of invalid registrations and part ownership. Two old component-inventory expectations (a count of 67 and a retired Eligibility example) were updated to the reviewed model.
- Main and Storybook TypeScript, focused ESLint, requirements checks, canonical-source/story/dependency validation, evidence freshness and whitespace checks pass. Prototype and Storybook builds succeed. Public, prototype-build and Storybook catalogs have identical SHA-256 `4c6be2261e72bc5d4db9e61119d3021f09de96950bd934080b487ab8008c8043`.
- Browser checks confirm both canonical handoff variants and the intermediate two-screen advance. Existing effective images remain in the whole-page examples; no business-policy or external-service behavior changed.
- Three broader shared-catalog tests assume parked WAEPA/ABE Sites exist in the deployed ASCE-only catalog. They fail with `Unavailable Site`; these are outside this rollout and no other real Sites were enabled to satisfy them. This is separate from the already-recorded older WAEPA Contact fixture assertion.

The final inventory has **110 canonical owners, 161 local UI/controller/adapter modules and zero unmatched declarations**, with source coverage for every canonical local owner. All seven reuse findings are closed. No unresolved business-policy questions were identified.
