# Standalone component and application boundaries

October 27, 2026. Applies to Home, Membership, Eligibility, Coverage, Beneficiary and Contact. Contact's blank Residential address story exposed a coupling between section rendering and application participation. This pass corrects that boundary across the earlier reviewed pages and organizes the code accordingly. Contact still awaits user acceptance; Profile follows acceptance.

## Contract

A section receives the fields, content, products, visible sections and presentation state it should render. It does not look up the active Site, install a saved Site, read saved application answers, run participation gates, request rates or navigate an application as a side effect of rendering. Local interactions such as field validation, ZIP-to-state derivation, same-as-home copying, selection callbacks and opening an explicitly supplied drawer remain appropriate component behavior.

Application adapters resolve those decisions before passing inputs to the component. Rule-driven workflows remain integration examples. A component's ownership role and whether its placement is connected to an application are separate concerns; reuse does not make a workflow a primitive.

Optional presentation contexts supply content, branding and sibling field definitions. Their defaults are static. They contain no Site lookup or participation rules. Theme, router and form state are valid local example infrastructure; an application session is not required to demonstrate a section.

## Code organization

| Location | Responsibility |
| --- | --- |
| `src/components/<area>/` | Standalone views, their local UI state and colocated stories. Contact now contains ResidentialAddress, BusinessInformation, SpouseContact and their composition. |
| `src/components/forms/AddressFields.tsx` | Shared street/apartment and city/state/ZIP rows used by residential and business addresses. |
| `src/app/sections/Configured*.tsx` | Application adapters for section visibility, labels, stored field surfaces, product presentation, rate suppression, cart persistence and navigation. These are not duplicate component identities. |
| `src/app/workflows/QuoteCalculator.tsx` | Connected quote workflow: saved answers, product rules, rating and apply/navigation transitions. It composes standalone form/card/summary views. |
| `src/pages/` | Page orchestration, participation, validation, persistence and workflow dialogs. |
| `.storybook/forms/` | Local form harness; no application provider or section participation gate. |
| `.storybook/fixtures/` | Detached authored example definitions, never installed as the active Site. |
| `.storybook/applicationPageExample.tsx` | Deliberately connected whole-page examples, with configured rules and local fictional application answers. |

## Reviewed-page audit

| Page | Standalone boundary | Application boundary preserved |
| --- | --- | --- |
| Home | Hero receives quote definitions, description and paths. Coverage browser receives products/configuration/content. Other marketing sections receive content; shared explanatory content has static defaults. | ConfiguredHomeHero and ConfiguredHomeCoverageSection resolve application inputs. Quote calculator is a workflow under `app/workflows`. |
| Membership | Status, member information, additional information and help render supplied fields/content/callbacks. Member information needs no membership answer to appear in its story. Additional-question stories provide explicit field sets; their example state is separate from application eligibility. | Membership page retains its field/qualification gates. ConfiguredMembershipHelp connects actual help contents and the quote workflow. |
| Eligibility | EligibilitySections renders the sections supplied to it, including spouse/children without requiring dependent answers in isolated examples. Child collection, notes, labels and state restrictions are explicit inputs. | ConfiguredEligibilitySections resolves section visibility, saved child collection, notice-only policy and notes. |
| Coverage | Questions receive resolved sections/facts. Product cards/catalog receive presentation and values. Cart drawer receives entries and callbacks. EstimatedRate, TotalCostSummary, EstimatorProductCard and CoverageNeedsCalculator no longer read a Site to render. | Configured adapters retain question resolution, product names, aggregate notices, rate alternatives/suppression and cart updates/routing. Existing rule scenarios still use useCoverageState and real application adapters. |
| Beneficiary | BeneficiaryProductRecords renders explicit records, notes, capacity feedback and actions. Empty/individual/trust examples need no selected coverage. | Page retains beneficiary participation, record bindings, allocation validation, copy flow, dialogs and persistence. |
| Contact | Three section views share AddressFields. ContactSections composes supplied sections; isolated examples use local form state without coverage answers or Site setup. | ConfiguredContactSections resolves applicant participation and labels. Contact page still resolves product/correspondence business policy and carry-forward. |

## Storybook and catalog

Standalone stories set `standalone: true`, bypassing Site installation and the application-session provider. They can use detached authored data to avoid duplicating field definitions, but do not execute Site participation conditions to reveal the component. The Coverage Product reveal default is now a standalone interactive view; its other scenarios explicitly describe application integration behavior. Whole-page IDs remain stable.

The catalog retains all 86 prior canonical identities and adds six real production components: AddressFields, ResidentialAddress, BusinessInformation, SpouseContact, BeneficiaryProductRecords and ApplicationReviewDrawerContent. The inventory now recognizes an application workflow source under `src/app/workflows` without treating application adapters as competing component records. Role, usages, source, composition and examples are regenerated from the same production code.

## Verification and acceptance

`src/components/standaloneSections.test.tsx` renders the reviewed sections without an application provider while active Site/client/library getters throw. It checks actual fields, record actions and prices, so a hidden/empty section cannot satisfy it. `src/dev/storybook/standaloneStories.test.tsx` also mounts the actual Contact and Member information story exports, verifies their controls and business-address copying, and asserts that no Site is installed. Runtime regression checks separately cover Contact's copying and product policy, Coverage/rider/cart state, quote carry-forward, Membership, Eligibility and Beneficiary bindings/allocation/copy behavior.

The Membership evidence hashes for the changed page wiring were refreshed after bounded Membership and AMA/CSEA dependent-collection tests passed; the evidence now also pins the adapters/views and standalone rendering test. Beneficiary's page hash follows its verified record-view extraction. Entry/presentation hashes and moved quote-workflow references were refreshed after all 58 entry, scope, transition and runtime checks passed; new adapters are included in that evidence. Unrelated pre-existing evidence mismatches are retained: Contact's applicantExperience and applicationTransitions evidence, and Entry's configuration/type and saved entry-test fingerprints. This component refactor does not accept those differences or claim to close the broader requirement crosswalk.

Structural verification does not constitute user acceptance of Contact wording/layout, a new Site policy decision, or Profile acceptance. Existing Site-wide visual/accessibility review boundaries remain in place.

October 28 review convention: shared components are reviewed once in their canonical examples. Page reviews accept composition and page-specific behavior; isolated section stories are optional inspection tools, not repeated approval gates. Contact's whole-page scenarios now lead its sidebar, with review guidance and links to AddressFields/PhoneField outside the production views. Apply this same contract to Profile and subsequent pages as their review proceeds; their component review is not yet complete.

Final validation: focused rendering/runtime regressions passed, along with application and Storybook TypeScript checks, targeted ESLint, application and Storybook builds, catalog/document drift checks and the source/build story audit (358 exports, zero audit errors, zero invalid catalog examples). Browser checks covered standalone Contact validation/copying, Member information, Eligibility spouse fields, Coverage selection/summary, Home coverage options, Beneficiary records and configured Contact business suppression.

## Phone follow-through

The subsequent [unique phone binding review](phone-field-bindings.md) extracts PhoneField, separates business number/type from member and spouse values, and rejects duplicate field identities/shared phone bindings. The current catalog has 93 components and 313 fields; Storybook has 363 exports.

## Profile follow-through

The [Profile component review](profile-component-review.md) extends this contract to Profile. ProfileSections receives visible sections, field definitions, adult coverage flags/labels, replacement notice and disability collection configuration. Local answers control follow-ups; its page controller retains active Site lookup, financial policy and advisor navigation. Standalone section/physician stories use explicit definitions and local form state. Whole-page scenarios retain real saved rules. The standalone rendering and actual-story tests now include Profile. Profile visual/wording acceptance remains open.

Profile reuse follow-through: both adult personal sections use standalone ProfilePersonalInformation; PhysicianInformation shares AddressFields via explicit field-role mappings, preserving existing answer IDs. New canonical examples demonstrate independent adult follow-ups and restored physician addresses without a Site provider.

## Review follow-through

[Review](review-component-review.md) extends this contract to ReviewSections, ReviewStatement, LegalReviewSection and ApplicationDocumentPreview. The page resolves saved legal policy, active fields, adult participation and edit routes. ConfiguredApplicationDocumentPreview builds application display sections and branding; the view receives explicit data and callbacks. Canonical document story IDs remain stable and now use standalone data. Whole-page scenarios keep real policy rules and explicit local session flags; they do not persist submitted/advisor state.
