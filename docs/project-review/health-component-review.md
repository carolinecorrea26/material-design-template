# Health component and documentation review

October 28, 2026. Continues [Review](review-component-review.md) using the [component documentation contract](component-documentation.md). Covers all six implemented Health routes, the 18 supplied source sections, shared question/detail controls, restoration, validation and documentation. This is an engineering review of the current prototype and Storybook examples; it does not record user acceptance or activate every source form for every Site.

## Application frame

`FormRoutePage` owns PageShell/FormShell, main steps and breadcrumbs, title/Back/help placement, form state, validation feedback, persistence, transitions and Next. Refer to the application-template story (`application-patterns-application-page-template--standard-form-page`) and [navigation review](navigation-state-review.md). Health controllers supply participation, resolved questionnaires and page validation. Every Health page now places HealthInformationHelp in the common help slot. QD hides shared actions while external questions load.

## Sections in page order

| Page | Content within the common frame | Page behavior and examples |
| --- | --- | --- |
| Simplified Issue | Help chip/drawer, followed by question groups | Participating adults receive their own answer and detail bindings. Member-only and two-adult page examples use the saved SI pathway. |
| Life | Numbered question groups, with each participating adult inside its question | Generic Life and captured full source forms use the same grouping and controls. The configured-source example includes independent gender-dependent fields. QD/FUW processing alone does not determine whether online questions participate. |
| Disability | Help chip/drawer, then question groups | Generic DI and explicitly assigned supplemental DI use separate question identities. The combination policy selects the eight-question supplemental form for the relevant adult. |
| Critical Illness | CI question groups for the applicable CI-only or combined source variant | Matching questions group across adult variants; answers remain separate. California uses the supplied Substance Abuse replacement. Application tobacco collection stays on Coverage. |
| Chronic Illness Rider | Twelve CHR question groups, including activities and dwelling/Other follow-ups | Both Site enablement and that adult’s rider selection are required. ABE leaves this page disabled. The whole-page example explicitly enables it on a detached fixture. |
| QuickDecision | Shared ProcessingStatusPage loader and QD mark | External QD questions were not supplied. Storybook stays on the loader without a simulated question set, completion or Next action. Ordinary application timeout/recovery handling remains bounded. |

Question groups use an accessible heading and independent radio-group labels. Corresponding member and spouse questions share a group identity, not an answer ID. Different source questions retain different identities. Native headings, introduction text and source instructions do not acquire answer controls.

## Canonical components and ownership

| Owner | Role, contents and internal parts | Placements, variations and review status |
| --- | --- | --- |
| HealthQuestionList | Shared piece. Groups explicit entries by question identity/order, then member/spouse. Contains ApplicantSectionDivider; question content is a supplied slot. | SI, Life, DI, CI and CIR through an application adapter. Standalone member/spouse, spouse-only and restored-answer stories under Forms. Client labels are supplied; the view reads no active Site. Reviewed with automated isolation and answer-independence checks. |
| HealthQuestion | Shared piece. Renders a supplied answer through FieldRenderer, then supplied direct fields or DynamicList records. It selects no policy or participation. | Configured Life/DI/CI/CIR and the source-form previews. Canonical direct-detail, repeated-detail and restored-record stories under Forms. The former ConfiguredHealthQuestions view was replaced by this explicit view; configured entry mapping lives in app/sections. |
| YesNoDetailList / YesNoDetailQuestionFields | Existing shared piece and its named export. The named export renders the legacy Yes/No answer and stored DynamicList mapping. | Generic SI/Life/DI forms. Retains its existing story identity. FieldRenderer now owns the visible label and accessible radio-group label together. No additional field or dialog identity was introduced. |
| FieldRenderer → RadioSelectionGroup / SelectionGroup | Shared field controls and required/error feedback. | Reviewed once in their canonical stories. Health supplies unique field definitions and storage IDs. Month/year and real calendar-date validation now apply in both direct fields and the detail editor. |
| DynamicList → DynamicListItem / AppModal | Shared repeated-record editor: Add, Edit, Save, Cancel and confirmed Remove. | HealthQuestion and legacy question fields reuse the same editor. Stored field mappings, limits, labels and hidden row values remain intact. Existing stored-surface tests exercise the actual edit dialog. |
| HealthInformationHelp | Shared piece. Owns the chip and local open/close state, using HelpChips and AppDrawer and one shared content string. | All six routes and all source-form previews. Canonical standalone example under Forms. The QD example verifies opening/closing the explanation while the loader remains pending. |
| HelpChips / AppDrawer | Existing shared help trigger and drawer. | HealthInformationHelp shares one prototype explanation and drawer state across all six Health routes and all 18 source-form previews; the help slot belongs to the frame. |
| ProcessingStatusPage / RecoveryAlert | Existing shared pending, completion and timeout surfaces. | QD uses the pending surface. A null timeout is supplied only by the persistent Storybook loader example. Other pending operations retain their existing timers and recovery tests. |

The saved component catalog now records HealthQuestion and HealthQuestionList as canonical shared pieces, including actual source usages, dependencies, parts and examples. There are 101 registered components, 74 with multiple source placements, and none without production placement. Storybook-only form-preview infrastructure is not registered as another production component.

## Application adapters and validation

`ConfiguredHealthQuestionList` supplies saved applicant labels. `ConfiguredHealthQuestions` maps a resolved questionnaire into explicit HealthQuestion entries. The controllers and configuredHealthQuestionnaire resolver retain product/pathway, applicant, gender, jurisdiction, rider and supersession decisions. Standalone views do not install a Site or require an application session.

`healthFieldError` is shared by generic/configured health validation and source-preview validation. It checks required/whitespace answers, available choices, malformed values, valid month/year and actual calendar dates, and authored lengths. Generic follow-ups also enforce configured row limits. Configured forms validate their active direct fields and every active repeated row. Empty required multi-selects and unknown selections fail. Numeric zero remains valid where a number is allowed. Hidden/inactive details do not block progression.

The source preview uses active-question validation rather than depending only on mounted inputs or checking that a row exists. Incomplete or malformed restored records fail; an incomplete alcohol-history branch cannot borrow current-use answers. Preview validation feedback is tied to the checked answer snapshot, so a success message does not remain valid after answers change.

## Corrections made during this review

- Moved active-client label lookup out of HealthQuestionList into its application adapter, and added standalone canonical stories that render while Site/client getters throw.
- Reused HealthQuestion in production configured forms and source previews instead of maintaining two answer/detail compositions. Removed the unused default ConfiguredHealthQuestions list view.
- Added resolved questionnaire collection names to FormRoutePage defaults. Previously, policy-generated detail arrays were absent from the form’s restore path even when the scalar Yes answer restored. The regression test restores separate member/spouse records, toggles No/Yes and verifies the records survive in saved form values.
- Replaced the legacy external-label/hidden-label pair with FieldRenderer’s normal labeled radio control. Previously the radio group used an internal binding name rather than its visible medical question.
- Added the source-prescribed California replacement to ABE’s captured CI-only and combined forms, with separate field IDs, jurisdiction guards and source references. Both variants retain 16 active questions; other jurisdictions keep their existing wording. Saved authoring JSON and the reviewed compiler agree.
- Applied valid month/year and calendar-date checks in the shared editor and health boundary. Impossible restored dates, month 00/13 and whitespace details cannot pass.
- Preserved hidden source-preview answers/records, separated current and past alcohol detail IDs, and added restored-record coverage.
- Corrected the old HealthQuestionLayout fixtures. They expected generic ABE Life/DI questions after the approved source/routing adoption had removed those paths. Generic layout now runs against participating configurations; ABE still suppresses an unassigned spouse DI form.
- Reconciled the Health routing reference and page-coverage matrix, and refreshed catalog, consolidation, field-document and handoff artifacts.

## Supplied forms and explicit boundaries

See [Health Storybook pages](health-storybook-pages.md) for all 18 source sections. Every section has a separate page with member-only and member/spouse examples. Source pages also cover California wording, WAEPAWL’s SI omissions, omitted GPA tobacco and restored supplemental details. The workbook digest and every extracted row are accounted for.

These source previews do not change Site assignments. Existing MCR/captured policies remain authoritative. In particular, adding a WAEPAWL preview does not introduce a production Whole Life route, and previewing every source tobacco question does not add tobacco controls to the production CI page.

The supplied PRS1 source refers to an attached Standard AIDS wording page that is absent. The amended GMA-EZ1 source calls for insertion of a QD tobacco question without supplying its wording. The original notes remain visible, and no missing wording has been fabricated. TELE-SUPP notes sometimes describe both a general Details field and structured repeated details with different length limits; the preview retains those notes alongside its structured controls rather than treating them as authority to collect duplicate answers.

The dedicated incomplete WAEPA CIR source, external QD service/iframe, carrier-form PDFs and signature integration retain their existing deferred scope. Virginia CI certification belongs in Review/Read and Sign under its existing saved notice policy. The source-preview reference is not a new signature or document surface. This review does not assert carrier/PDF parity or live QD integration.

## Verification and disposition

The focused review covers source completeness, all production page examples, canonical standalone isolation, independent adults, conditional details, restored values, stored editor bindings/limits, source state/pathway variants, captured edits, normalized questionnaire submissions and external QD loading. Shared recovery checks verify normal timeout behavior independently of the persistent Storybook preview.

The baseline exposed three stale layout expectations. They were corrected without re-enabling ABE’s generic Life/DI forms. All 165 focused checks across 26 test files now pass; see the [verification register](health-review-evidence.json). TypeScript, scoped ESLint, the Storybook build, generated component/source audit and catalog consistency are checked separately. Both the application and Storybook builds pass against the updated saved catalog. The source audit resolves all 459 current examples to real source and reports zero errors; its remaining global gaps are outside this Health pass. A browser smoke check verified restored adult answers, the shared Edit/Cancel dialog with focus return, and the QD loader.

Engineering disposition: the Health component/documentation pass is complete for the current prototype. Remaining source/service boundaries above are explicitly documented, rather than counted as implemented questions. User visual acceptance and future production integration remain separate from this pass.

## Shared information help follow-up

The user approved extending the existing “How is my health information used?” explanation to every Health page. HealthInformationHelp now owns the chip and local drawer state, using one copy of the existing wording in `src/content/healthInformation.ts`. All six route controllers pass it to the common help slot, including QD while loading; all supplied form previews use it in PageShell’s help slot. Its canonical standalone example is Forms → Health information help. This is prototype wording whose MCR provenance has not been established. The text was retained unchanged.

Follow-up verification: all 39 Health page/source-form checks pass, including one chip per page and opening/closing the QD explanation. TypeScript, scoped lint, Storybook build, source audit and catalog checks pass.

## Next page

The component inventory includes the shared information help follow-up. Continue with [Payment](payment-component-review.md), the next page after the Health route family.
