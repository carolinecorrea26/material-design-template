# Receipt fresh-start review

November 14, 2026. Global template and effective ASCE Site. CHG-074 closes the final Receipt review. All three user decisions are resolved; no Receipt policy decision is deferred.

**Current email contract — CHG-122 and CHG-124, November 18, 2026:** the user's explicit email correction supersedes the historical confirmation-only restrictions recorded below. Applicant submission emails now begin with the shared named salutation, thank the applicant for trusting the association and New York Life, introduce the request summary, render the current products and explicit decisions through ReceiptCoverageDecision, and close with Thank you and the effective TPA acronym / Group Sponsored Insurance Program / Insurance Administrator signature. Decision descriptions render their configured JSON text unchanged, without amount/product substitutions or injected applicant/coverage facts. The compact email variation shares the page's decision content; page-only payment details and document controls remain on the page. Shared Questions email alerts contain administrator contacts and available reference context; technical-support wording and its link appear on pages only. Actual email delivery remains outside the prototype. Receipt's global document notice and canonical email rules reflect this change; the obsolete email-reference sentence is retired from saved catalogs too.

## Ownership and composition

`requirements/parked/receipt.json` owns the page definition, component tree, content references and two ordered fieldless sections. `mappings/page-sections/receipt.json` lists confirmation and coverage decisions; the old separate application-summary and client-help section identities are removed. The controller renders the compiled sections. PageShell/FormShell own the frame; Receipt has no editable portal fields or Back/Next action.

| Area | Shared owner and behavior |
| --- | --- |
| Confirmation and documents | ReceiptConfirmation composes InformationAlert and configured buttons, with one application-level reference. Payment PDF appears only for an active allowed payment method/frequency, including Bill me; optional opt-out, disabled collection and stale-only data hide it. Downloads remain explicit prototype placeholders; production supplies the applicable completed documents. |
| Decisions | ReceiptDecisions composes the readout and responsive SiteSupport slot. ReceiptCoverageDecision uses ProductCard, ApplicantSectionDivider and shared EstimatedRate states. |
| Order and participation | Current offered selections only, in the effective category/product/featured order supplied to the shared selector; member, spouse, child order within a product. Removed products and stale applicant maps do not create decisions. |
| Attached benefits | Reconciled riders remain under their owner’s outcome, with applicable applicant labels, amounts and applicant-scoped descriptions. They share the owning coverage decision. |
| Coverage/payment facts | Requested amount, estimate in the selected period and payment method remain with the corresponding product/applicant. Estimates remain fictional and never indicate that payment was taken. Receipt no longer overrides the shared estimate font size/state presentation. |
| Feedback and support | AppSnackbar handles document-placeholder feedback. SiteSupport supplies the same configured support info alert as other pages; no Receipt-specific help/support component is added. |
| Technical failures | Missing/unrecognized QD outcomes or unresolved underwriting use the existing ApplicationErrorState technical-error template. No new error page, automatic routing or real service is added. |
| Empty view | An information message replaces the product readout; shared support remains. This is a prototype inspection state, not proof of production submission. |

Receipt’s three named compositions retain meaningful confirmation/document or decision/readout behavior. They reuse existing surfaces rather than creating new wrappers for a Site or person. Canonical standalone examples remain optional; whole-page scenarios use the shared source projection.

## Content and MCR reconciliation

Global defaults are in `global/content/receipt.json`. Effective Sites may override declared slots for payment/download guidance, next-step heading, optional underwriting note, decision labels/descriptions and confirmation-email wording. The standard ExamOne underwriting note and its wording are global defaults. ASCE inherits them without a Site content assignment. Effective overrides represent genuine provider or wording differences; the ASCE MCR remains provenance. Labels, decision identities and fallback wording retain global definitions; content selections do not create new outcome types. Decision descriptions are literal configured text. CHG-124 removes the former amount/coverage substitutions; amounts stay in separate page details and are omitted from email.

| Evidence | Current reconciliation |
| --- | --- |
| Standard Decision Wording!B2 | Conditional approval retains vendor verification, requested coverage/amount, administrator eligibility review and the usual few-day follow-up. It is not final approval. |
| Standard Decision Wording!B3 | Referred wording retains possible contact to verify medical details and later coverage-request communication. |
| Standard Decision Wording!B4 | Unable-to-offer wording no longer promises automatic standard underwriting. Final download and administrator/other-options guidance remain. |
| Standard Decision Wording!B5 | The explicit database-unavailable outcome retains the vendor-contact and follow-up wording. It must not be inferred merely from a missing result. |
| Earlier decision-screen instructions | “Provide payment information” and “continue to the final page” are adjusted for this terminal Receipt, after Payment and completed signing. No extra payment step or second submission action is introduced. |
| ASCE New UX Multi-page Requirements!AU21 | Confirmation email contains the confirmation number only; documents are downloaded, not emailed. The shared ExamOne/underwriting next-step note appears only for applicable adult coverage sent for review (standard FUW/SI/TELE or explicit QD referred/database-unavailable), using the shared product-based underwriting applicability flag. It is omitted for all-approved/all-declined results and AD&D/child-only coverage without adult medical review. |

Exactly four QD outcomes remain: conditionally-approved, referred, soft-declined and database-unavailable. The index-based sample fallback is removed. Explicit results are per product/applicant and independent of product order; non-QD products ignore retained QD results. The user confirmed that absent/unrecognized results are technical failures handled by the existing technical-error template. They do not become a new pending decision, invented referral or inferred database outage. Whole-page examples supply their results explicitly. User decision November 23, 2026: completing the resolved Health page (QD images or an assigned questionnaire) explicitly records conditionally-approved for active QD elections that have no result. The global prototype fixture owns that default; explicit Dev Tools outcomes remain unchanged. Receipt still treats absent or invalid results as technical failures. No live assessment service is wired.

## Confirmation, email and storage

Production Receipt uses the authoritative reference returned after required signing and successful submission. The prototype prefers an explicitly supplied mock submission ID; otherwise `receiptConfirmation.ts` keeps a local reference by Site and saved application. Rerenders/revisits keep it stable; a different application or Start new application creates another reference. Reset clears the current Site’s cache and old unscoped cache without clearing another Site. Malformed cache values and old unscoped references are not reused. These references are not signing or production submission evidence.

Receipt no longer calls a mock email function on mount or rerender. Production sends its confirmation email once per successful submission, without resending when Receipt is revisited. Manually opened local email previews use source-owned confirmation-only content: no applicant answers, requested amounts, coverage decisions, medical or bank details, or application/payment documents. Generic Site/support wording remains. The earlier preview contained decision details; it did not attach PDFs.

The page adds no answer fields or duplicate application record. Existing selected products, active applicant/rider elections, QD results and canonical per-product payment bindings remain their respective owners. Receipt and payment document generation share applicationPaymentAnswers, which removes inactive products, disabled/declined collection, disallowed choices and hidden bank details before use. Payment document availability additionally requires an allowed frequency for an active method. Image/signature/submission evidence is not manufactured by Receipt. Actual signing, delivery and document production remain production requirements that this prototype does not execute.

## Verification

Focused checks cover all four explicit outcomes; missing/unrecognized/malformed results; mixed decisions; adult, child and AD&D medical-note applicability; active Bank account/Bill me documents; disabled/declined/stale/invalid payment data; content rerendering; shared placeholder actions; applicant/owner grouping; amounts and period-specific estimates; empty/hidden states; configured order; Site/application reference isolation; reset; and confirmation-only manual email previews. Actual Receipt stories render through the compiled global or ASCE projection and restore their fixture afterwards.

Fresh-start checks reconstruct the two fieldless sections without superseded records, reject field placement without a mapping, expose all shared rules under global/Site filters, preserve independent effective email wording overrides and verify global ExamOne inheritance for ASCE and a synthetic Site, with isolated synthetic wording overrides. Final build verification is recorded in the CHG-074 checkpoint.

CHG-074 verification: all 65 fresh-start checks and 54 focused page, decision, payment/PDF, reference, reset, email, order and actual-story checks pass. TypeScript, focused lint, requirement mappings, component registration/reuse evidence and prototype/Storybook production builds pass. Browser inspection confirms the ASCE medical-review note, inactive-payment download omission and existing technical-error presentation. Public Library, prototype build and Storybook catalog files have identical hashes. No new live routing or production service is implemented.

CHG-075 ownership correction: the ExamOne wording is global, as confirmed by the user November 14, 2026. Removed the ASCE content override and duplicate ASCE-only note example; generic Receipt scenarios inherit the same wording. Display applicability is unchanged.

CHG-075 verification: all 66 fresh-start checks and 38 focused Receipt/decision/actual-story checks pass. Prototype and Storybook builds, TypeScript, focused lint, requirement mappings and component evidence pass. Library, prototype and Storybook catalog hashes match.


## Client configuration and copy review (CHG-084)

User individual decisions November 15, 2026. Receipt exposes **18 Site content slots**, inheriting global definitions/defaults. Values belong in `parked/sites/<site>/pages/receipt.json` → `content`; ASCE inherits unchanged values.

| Slot | Site wording override |
| --- | --- |
| `page.receipt.title` | Yes |
| `page.receipt.subhead` | Yes |
| `receipt.decision-statuses.fully-underwritten.label` | Yes |
| `receipt.decision-statuses.fully-underwritten.description` | Yes |
| `receipt.decision-statuses.conditionally-approved.label` | Yes |
| `receipt.decision-statuses.conditionally-approved.description` | Yes |
| `receipt.decision-statuses.referred.label` | Yes |
| `receipt.decision-statuses.referred.description` | Yes |
| `receipt.decision-statuses.soft-declined.label` | Yes |
| `receipt.decision-statuses.soft-declined.description` | Yes |
| `receipt.decision-statuses.database-unavailable.label` | Yes |
| `receipt.decision-statuses.database-unavailable.description` | Yes |
| `receipt.payment-notice` | Yes; optional |
| `receipt.what-happens-next.title` | Yes |
| `receipt.underwriting-note` | Existing title/text object override for a genuine provider/wording difference; optional |
| `receipt.email.subject` | Yes |
| `receipt.email.title` | Yes; separate from subject |
| `receipt.email.intro` | Yes; retains supported Site-name substitution |

The individually reviewed `receipt.documents-note`, `receipt.coverage-decisions.description` and `receipt.email.reference` remain **global**, and their former Site content slots are removed. The email-reference sentence continues to substitute the confirmation number. Confirmation-number/download labels, shared support, fallback/validation/system wording and actions retain their global/shared contracts. Superseded stored Site values cannot restore the three removed permissions or their wording.

ReceiptConfirmation now renders the authored introduction beneath its title; previously it was stored but never displayed. The page and standalone confirmation examples use the effective header, and the default adapter imports global Receipt content. Existing global components remain the owners; no separate Site/header/next-steps component is introduced.

Copy never changes the five status identities (standard review plus four QD outcomes), decision meaning, active coverage/applicant selection, product order, document/payment applicability, confirmation reference, shared ExamOne display rule or confirmation-only email privacy. Provider-note defaults remain global. Email wording is the documented production template and its supported local preview; the prototype delivers no email. This completes Receipt's copy classification with no open copy decision.


## Non-copy configuration review (CHG-110)

November 17, 2026: the eighteen individually approved Site copy slots remain the complete Receipt page-copy configuration contract. ASCE inherits the global wording. Page inclusion/order/route, the two fieldless sections, status identities/technical handling, active product/applicant/rider selection, ordering, confirmation reference, document availability, medical-note applicability and confirmation-email privacy/delivery rules remain global. Shared product presentation, underwriting and payment policy values retain their existing effective-Site owners; Receipt does not duplicate those configurations. There are no Receipt input fields or field overrides, new outcome types, configurable reference formats, independent document toggles or post-submission navigation controls.

The user confirmed one display gap: nonempty configured payment guidance appears only when at least one selected product/applicant has an active allowed payment method and frequency, including Bill me. The shared active-payment selector used for Payment PDF also supplies this fact to ReceiptConfirmation. Disabled collection, optional opt-out/unanswered collection, removed products and incomplete/invalid choices suppress the notice, including retained answers. A Site can still change or omit its approved notice wording; it cannot bypass this global condition. Other next-step content, the document/security note, medical guidance and shared support keep their independent display rules. No price, payment processing or outcome is changed.

ReceiptConfirmation keeps its meaningful confirmation/document composition and now accepts the explicit active-payment fact. Its existing two standalone examples show payment-active documents/guidance versus application-only documents without payment guidance. Whole-page examples continue through the same Fresh-start projection; no additional wrapper or duplicate scenario is introduced. Production email/document/signing requirements remain documented; the prototype executes no real delivery, signed-document generation or payment processing.

CHG-110 verification: **91 Fresh-start checks and 59 focused checks passed**. Coverage includes Bank account/Bill me, required/optional/disabled collection, opt-out and unanswered collection, retained/removed/invalid/incomplete choices, Site wording and blank omission, rerendered opt-out, independent guidance, all four outcomes, shared medical-note applicability, reference isolation, confirmation-only email, ordering and actual Receipt stories. Fresh-start reconstruction verifies the global rule under global/ASCE Library filters and keeps all eighteen approved copy slots. TypeScript, focused ESLint, requirements mapping, component-reuse and catalog/Storybook/icon/handoff gates pass. Prototype and Storybook builds pass; public, prototype and Storybook catalogs share SHA-256 `31d503fb562b3c2bb5f17188f5d1506bbf9f14b826dd74364e066d23bd07d09e`. Receipt configuration review is complete with no open decisions.
