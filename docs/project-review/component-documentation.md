# Component documentation contract

Use **application frame → page sections → shared pieces** to explain composition and primary ownership. Keep one canonical component identity, even when it appears on several pages or in several examples. The sidebar roots are **Foundations / Components / Reference**. Pages live under **Components → Pages** alongside the functional component families. Reuse is measured from production placements independently of role.

Components are grouped by function: Actions; Forms; Navigation; Layout; Content and data display; Coverage and pricing; Feedback and overlays. Feedback and overlays contains Banners, Alerts, Notifications, Dialogs and drawers (Containers and Application dialogs), Loading and processing, and Empty states. There are no separate Dialogs, Transitions or Reusable components roots and no Pages/Shared catch-all. Generic containers use minimal example content; application components use the actual implementation and configured content with fictional answers. Page-specific statements, payment compositions and Health help/questions sit beside their Pages examples. Every component's states remain with that component rather than becoming unrelated navigation items.

Forms → Field groups lists Name (without title, with title, with middle initial, and existing physician variants), Phone (number/type), Address (street, apartment/suite, city, state, ZIP), Height (feet/inches) and Layout. Use actual definitions and existing production arrangements; related fields need not share a horizontal row. Controlled values is an integration example under Forms → Individual fields; feedback guidance sits under Feedback and overlays → Alerts. There is no separate Implementation notes sidebar section. Buttons and links belong together under Components → Actions. Standard MUI shadows have no separate review story; review any relevant elevation on its actual owner.

Field-group sections use SectionDivider's subsection preset: an uppercase label with 0.06em letter spacing above the shared rounded FieldGroup surface. Untitled groups use FieldGroup directly, including Membership's attestation/name/contact fields, Eligibility, residential/spouse contact, coverage selections and facts, and health-question fields. Group backgrounds match the theme's page background; input backgrounds are white and selected option rows retain their existing selected treatment. Titled sections retain 32px bottom spacing and can place informational notes above the field surface. FormShell uses a 16px radius with 16px mobile and 24px larger-screen padding. The prototype and Storybook share these components.

Implementation explanations, debug readouts and review instructions belong in story metadata, source notes or Reference, never inside the rendered application/admin/preview UI. Do not add such notes to production views. The generated inventory and source/build checks must stay aligned with the actual registered production components. Moving examples preserves their existing story IDs and prior approvals.

Alert adoption follow-up (engineering only): PageAlert wraps MUI Alert with standard page spacing, conditional rendering, dismissal and severity-based live-region roles. Some current views still use Alert directly, including ResumeCode, ResumeMethod, ApplicationEditConfirmation and the quote workflow. Both receive the shared MUI theme; direct use does not itself establish a visual defect. The historical Phase 1 estimate of roughly 13 pages is not a current inventory. Review semantics and layout at each call site before deciding whether migration is appropriate. No production alert migration or new approval requirement is implied by this documentation cleanup.

Every page family uses the same **Whole page / Sections** structure. Whole-page examples compose the actual page controller; section examples expose its registered sections in context. Dialog and drawer examples start open. Workflow-owned overlays use Storybook play interactions to open the actual owning UI; container examples use minimal content. Closing an isolated overlay may expose a Reopen action. Named application dialogs belong under Feedback and overlays, while whole-page stories retain the normal application triggers. `catalog:check` enforces page structure, registered section coverage, stable unique IDs and required named dialog examples.

## Icons

Foundations → Icons is the source-derived applicant icon set. The gallery is a single alphabetical list labeled with exact MUI export names, without functional sections or renamed action labels. `npm run icons:audit` generates its entries and `docs/project-review/icon-audit.json` from TypeScript imports and references, including named barrel imports. The report separately accounts for applicant, Admin, developer/reference and example/test usages and records source paths/lines. `catalog:check` rejects stale inventory and retired applicant variants. These are source references rather than proof of every runtime state; MUI internal control glyphs remain owned by MUI.

Use rounded variants for explicit icons. `CircleOutlined` is retained for an unreached/unselected step: it is the hollow-circle state and has no corresponding rounded-outline export. Next/Continue uses ArrowForwardRounded; breadcrumb separators retain the smaller 16px ArrowRightRounded; retry/resend uses LoopRounded; add uses AddCircleOutlineRounded; close, delete, phone, cart, calculator and completion each have one shared treatment. Distinct meanings such as Back, Help, Info, selected and unselected retain distinct symbols. Stock coverage badges and QuickDecision keep their configured artwork/fallback owners.

November 4 audit: 50 applicant icons remain. Removed five icon assignments from progress-step configuration because no consumer rendered them. Removed stale Drafts, Secure mail and Support agent from the applicant gallery; SupportAgentRounded is still actually used for Advisor Admin navigation and is accounted for in the Admin report. Consolidated duplicate rounded/plain and duplicate action/completion glyphs at production call sites and in stories, rather than hiding them only in the gallery. Standard MUI internals, configured branding assets and the frequency control's embedded calendar drawings are accounted for separately.

## Navigation terminology

**Main steps** are the overall application stages, such as Getting started and Choose your coverage (`ProgressStep`). **Breadcrumbs** are the pages within the current main step, such as Membership, Eligibility, Beneficiary and Contact (`Breadcrumbs`, exported from the same module). Both belong to the application frame. Desktop/mobile layout does not change these names.

## Roles

| JSON role | Responsibility | Examples |
| --- | --- | --- |
| `application-frame` | Global application chrome and the common page template, surfaces, heading and navigation | AppShell, FormRoutePage, ProgressStep, PageShell, FormShell, PageHeader, PageTitle, PageNav |
| `page-section` | A page's own major content composition, retaining page-specific configuration and behavior | HomeHero, MembershipStatus, EligibilitySections, CoverageQuestions, ProductCatalog |
| `shared-piece` | A reusable control, composition, content block, feedback state or overlay used inside frames and sections | HelpChips, FieldRenderer, EligibilityFields, ProductCard, DynamicList, AppModal, PageAlert |

Role describes a component's primary responsibility, not an exclusive location or a reuse threshold. A section may reuse a frame primitive; a shared piece can have only one current placement. EligibilityFields stays a shared piece even though its canonical story is filed beneath a page. FieldGrid has shared field-group examples under Forms, including stacked fields, name rows and address rows. Home uses the global shell and its own marketing sections; it does not acquire the application form template simply because it has page sections.

## Saved JSON

`public/catalog/components/components.json` owns component records. `portal.json` is its generated deployment bundle. Each component definition includes:

| Field | Meaning |
| --- | --- |
| `role` | One of the three reviewed ownership roles above |
| `contains` | Stable component keys for direct registered production dependencies; generated from source |
| `parts` | Named exports, native elements, actions and caller-supplied slots inside this owner |
| `section` | Canonical documentation browsing category, separate from ownership |
| `usages` | Page/source placements, including conditional paths |
| `source`, `storyId`, `storybookPath`, `examples` | Implementation and review references |

For example, FormRoutePage contains references to PageShell, FormShell, ProgressStep, PageHeader, PageNav and its shared feedback components. Its `parts` describe the native HTML form, page-content slot and contextual-help slot. The Back button is a part of PageTitle, Next is a part of PageNav, and Breadcrumbs is an export within ProgressStep. These parts do not create duplicate component records.

`contains` is a source dependency graph, not an ordered visual tree: dependencies can be conditional, and generic child slots can receive different sections. It includes registered components only; unregistered MUI primitives stay inside their owner. Page usages and page-section examples supply context without copying the common frame into every page record. Existing `pageSections` records continue to own configured section order and field placement; this component graph does not replace them.

Role assignments and internal-part descriptions are maintained in `scripts/component-structure.mjs`. A new component must receive an explicit reviewed role. Generation updates `contains` from source and rejects unclassified components. Generation and browser catalog loading reject unknown roles, orphan/self references, duplicate entries and composition cycles.

## Storybook and Library

Storybook demonstrates global template capabilities, including features currently assigned to only one Site. Generic fixtures use one synthetic template identity; they do not select a customer Site or inherit one from browser state. Saved configuration remains source evidence. See the [global capability review](global-template-review.md).

- **Components → Layout → Application page template** demonstrates the complete application frame. Individual frame stories retain their canonical locations.
- **Components → Pages → [page] → Whole page / Sections** shows complete-page scenarios and contextual section examples. An example of a shared piece in a section is a usage example, not another component definition.
- **Components → Forms → Individual fields** contains all 26 existing field examples and states, implemented by FieldRenderer. Its story IDs and existing links remain stable.
- **Reference → Component inventory → All components** indexes all roles from the saved JSON. **Used in multiple places** lists definitions with multiple recorded placements. This is an inventory reference, not a separate collection of components to approve.
- Storybook owns component browsing, role/composition details and examples. Portal Library has no separate Components section. Its Pages view retains contextual component links directly to Storybook, grouped by role, and Fields retains its control references. Saved component metadata supports these links and the generated Storybook catalog without duplicating the browser in Library. Link is now explicitly registered as its existing MUI package owner, alongside Button; this adds documentation accounting, not a new control implementation.

## Prototype

The prototype renders the same React implementations used in component/page stories. Saved Site configuration supplies page participation, section/field placements, wording, product rules, flow and theme. FormRoutePage owns shared form state, validation, value restoration, save handling, navigation, transitions and analytics. Each page supplies its content and page-specific gates.

The `components` inventory documents ownership and composition; it does not dynamically instantiate a page or decide business rules. Single-page and multi-page modes reuse page implementations while adapting progress and navigation presentation. Recorded usage does not mean a component is always visible in every mode or Site.

## Standalone rendering and application adapters

Standalone views render explicit fields, content, products and presentation state. Page participation, Site rules, saved answers, rating and application navigation belong in `src/app/sections/Configured*.tsx`, application workflows or page controllers. A view must not consult the active Site to decide whether its own example appears. Optional content/branding/field-definition contexts have static defaults and carry presentation data only.

Section stories use local form state and `standalone: true`; they skip Site installation and application sessions. Whole-page and explicitly described integration scenarios keep the real rules. See the [six-page boundary audit and code organization](standalone-component-boundaries.md). This supersedes the earlier assumption that every section example should run saved section-participation rules itself.

## Field identity and reusable UI

Each distinct answer owns a unique field ID/storage binding. Reuse belongs in controls and compositions, which receive explicit definitions and values. A compound control must not fall back to another answer's binding. Phone number/type pairs follow this contract through the standalone PhoneField and the [phone binding audit](phone-field-bindings.md). Existing repeated records preserve their own scopes; carrying the same answer between pages does not create another field identity.

## Shared form standards

Ordinary text links use the shared theme's always-underlined Link style, with a consistent underline offset. Contact links, document/product links, recovery links, inline help and footer links follow that standard. Email text links use the same underline treatment in their email-safe markup. Buttons, tabs, navigation items, linked cards and logos retain their semantic control styles. Do not add local hover-only or no-underline overrides to ordinary text links.

Conditional section visibility applies at the application composition boundary. Page adapters resolve saved conditions and policies before passing sections to standalone views; reviewing a page records that behavior rather than requesting a new decision. Field controls, validation feedback, layout surfaces and presentation remain shared owners.

Fields stack by default. Address and name groups are approved exceptions that may use responsive rows. Other intentional field groups can be recorded during review; the default is not an address-only rule and does not require flattening every group.

Main-step and breadcrumb states have explicit real-component examples in [the navigation state review](navigation-state-review.md). Page reviews link to that frame coverage rather than repeat it.

## Final application pages

Review displays each coverage's estimated rate inside its applicant coverage preview using the shared EstimatedRate component and existing prototype estimates. Missing, loading, unavailable, reference-table, provided-separately and hidden rates remain distinct. Review and subsequent pages have no floating estimated-cost bar. PageNav uses the ordinary page navigation layout. Payment retains each product's selected billing period and cost; Receipt retains per-coverage estimated payments with the selected billing suffix.

Review uses the resolved remaining form flow to name Health questions, Payment and DocuSign only when they participate. Its application preview uses the page scroll, and a separate consent section retains the authored legal statements, notice blocks and individual acknowledgements. The page resolves content on render instead of holding module-time Site wording.

ReceiptDecisions places the Coverage decisions heading and all outcomes inside one light-primary container derived from the active theme, alongside the separate white Application receipt and standard SiteSupport cards. ReceiptCoverageDecision presents a product heading, applicant where relevant, outcome and configured explanation; Sent for review uses FindInPageRounded (document with magnifier). No timeline or status pill is rendered. ReceiptApplicationSummary lists requested coverage, estimated payments at each saved frequency and saved payment-method labels; all three values use bold regular text color. It does not imply a payment has been taken. These sections stack on mobile. Attached rider benefits remain with their owner's outcome. ReceiptConfirmation has a regular informational thank-you alert containing the configurable payment/welcome-kit guidance, followed by a separate download/security warning with both working PDF buttons inside it. ReceiptNextSteps renders that shared acknowledgement alert using `receipt.receivedMessage` and `receipt.paymentNotice`; an empty payment notice omits the guidance but retains the thank-you. Member-only receipts omit visible applicant labels, including multiple member products. If any non-member applicant or dependent rider participates, decisions and receipt entries use the existing ApplicantSectionDivider with configured client titles/icons. Receipt presentation approved November 5; this does not imply acceptance of other revised pages or the icon audit.

Storybook includes complete Review/Payment/Receipt controllers, a no-health Review route, all distinct decision outcomes (standard review, conditional approval, referral, unable to offer, service unavailability, unresolved requirements), mixed applicants/frequencies, rider benefits, empty selections and rate-state references. Explicit page examples use a local synthetic quote transport and fictional submissions; they neither authorize payments nor submit/sign an application. Presentation acceptance and service acceptance remain separate.

## Shared estimated prices

EstimatedRate owns numeric price formatting and presentation: bold (700), primary color, 1.25rem by default. Its summary appearance uses 0.875rem with the same weight/color; the coverage-summary drawer uses it for applicant costs and totals. Requested-coverage values match that size, weight and color, and their caption labels match the estimated-cost labels. Product cards, Payment, summaries, breakdowns and cart totals reuse the shared owner. Receipt facts intentionally use regular text color for both requested amounts and estimated payments, matching the selected payment method. Inline appearance inherits its context. Loading, unavailable, missing-information, reference-table and hidden states stay in the same shared component. Drawer product headers use ProductCard's shared title and expose only Remove beside the title, without a repeated upper-right estimate.

## Required review format

Keep every site component and useful configuration/state example in Storybook. Story coverage is not an individual approval checklist. The reviewer assesses site-specific presentation, wording, composition and meaningful custom behavior; routine MUI states and previously accepted shared treatments remain reference/verification examples without separate approval gates. Technical verification remains the implementer's responsibility, with evidence and unresolved gaps recorded separately. State the specific decision needed from the reviewer for each preview.

Track presentation acceptance separately from behavioral verification. For each applicable component, account for interaction/value updates, keyboard/focus and accessible labeling, required/invalid/disabled/restored states, authored configuration/bindings, responsive/theme behavior and page integration. Cite existing tests and canonical state examples; identify gaps without treating a visible default story or user approval as proof that all dimensions passed. Standalone stories demonstrate local behavior; persistence, conditional participation and service outcomes require their page or integration checks. Review guidance belongs in story metadata or the review record, not banners in the preview.

Review distinct field types and meaningful states once. Text formats such as email and currency are examples of the shared text-field owner, not separate component identities or repeated visual approval gates. Carry accepted text styling forward; inspect format-specific behavior when needed. Use actual configured fields for examples of configuration-dependent treatments such as long external labels.

Show the actual page or state in a visible preview before requesting user acceptance. Explain the specific review focus, then wait for explicit approval or requested changes before advancing to the next review item. Preparing examples or passing checks does not constitute user acceptance. Record acceptance only for the item the user approved.

Review each shared component's presentation and local interactions once in its canonical example. Page acceptance covers wording, placement, section order, field bindings and page-specific behavior. Refer to the accepted shared component rather than asking for another approval of the same control or layout. Reopen shared-component review when its implementation or contract changes, and review a new variation where it first appears.

Whole-page scenarios are the primary page acceptance examples. Isolated sections remain optional development/debugging examples, not additional approval gates. Keep them standalone and preserve existing story IDs. In Storybook, `parameters.review` can identify `shared-component`, `page-composition` or `section-example`, with a short focus and links to canonical stories; this metadata stays outside the visible preview. Scenario descriptions and review guidance must not render as banners inside the canvas; previews show the application UI. Contact, AddressFields and PhoneField demonstrate the convention.

For each page, identify its frame, then list the page's main sections in order. For each section record its shared pieces, page-specific behavior, conditional states and examples. Keep title/back/help/form/Next details in the frame reference unless the page has a meaningful variation. Name the implementation owner for dialogs, feedback, actions and named exports rather than promoting every element to a new component.

For each canonical component, document purpose, role, contained components/internal parts, placements, variations and states, examples and review status. The generated consolidation register covers every current component. Existing historical inventories remain evidence of their original audit, with a link to this current contract.

After a component/source/story change, run `npm run storybook:catalog`, `npm run components:review`, `npm run docs:handoff` and `npm run catalog:check`. Focused tests verify graph integrity, saved/read-model consistency and Library presentation. Visual/state/accessibility acceptance remains a separate review boundary.

Review follow-through: FormRoutePage accepts caller-resolved `runtimeFields` for policy-generated controls that the page actually renders. They participate in defaults, restoration, validation registration through their rendered controls and development fill. `devFillFields` retains its existing saved-placement filter and remains separate from that runtime contract. Review uses this for adult acknowledgements and active notice-block fields; policy selection stays in its controller. See [the Review correction](review-component-review.md#restoration-correction-found-during-browser-review).
