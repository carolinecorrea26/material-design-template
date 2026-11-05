# Previously reviewed pages: structure checkpoint

October 27, 2026. Reconciled Home, Membership, Eligibility, Coverage and Beneficiary against the [component documentation contract](component-documentation.md), their React implementations, Storybook sources and saved component graph. This checkpoint concerns ownership and review organization; the original visual/accessibility and Site-wide acceptance boundaries remain open.

| Page | Frame | Content in page order | Canonical implementation owners |
| --- | --- | --- | --- |
| [Home](home-component-review.md) | `AppShell`; marketing composition | Hero (quote/image variants), How applying works, Coverage options, Association introduction, insurer credentials | `HomeHero`, shared `HowApplyingWorksPanel`, `HomeCoverageSection`, `AssociationIntroduction`, `UnderwriterCredentials`. A shared piece can compose a page section without changing its primary role. Quote inputs, calculator, help drawers and artwork retain their existing owners. |
| [Membership](membership-component-review.md) | `AppShell` + `FormRoutePage`; `MembershipHelp` supplies contextual help | Membership status, Member information, Additional membership information | `MembershipStatus`, `MemberInformation`, `AdditionalMembershipInformation`; shared fields, physician composition and overlays stay referenced once. The contextual-help example shows the frame heading only as context and preserves its story ID. |
| [Eligibility](eligibility-component-review.md) | `AppShell` + `FormRoutePage` | Your information, Covered applicants, Spouse information, Children information | One `EligibilitySections` implementation renders configured sections. `EligibilityFields`, `FieldRenderer`, applicant dividers and `DynamicList` remain shared pieces. The duplicate Introduction heading example is removed. |
| [Coverage](coverage-component-review.md) | `AppShell` + `FormRoutePage` | Coverage questions, Product reveal | `CoverageQuestions` and `ProductCatalog`. Category choice stays inside questions; applicant/rider controls, rates and inline cost summary stay inside reveal. Portfolio, first-add drawer, snackbar and dependent-only confirmation retain their existing owners. |
| [Beneficiary](beneficiary-component-review.md) | `AppShell` + `FormRoutePage` | Optional participation when configured; applicant/coverage beneficiary records | Local page renderer in `src/pages/Beneficiary.tsx` composes `FieldRenderer`, applicant/category/product containers and record rows. Add/edit, allocation and copy dialogs stay within the beneficiary flow; whole-page scenarios are examples, not new component definitions. |

## Changes and compatibility

- All five reviews explicitly identify their application frame before page content.
- Membership’s help example is named Contextual help; `pages-membership-introduction-and-help--default` remains stable. Eligibility’s frame-only Introduction example is removed from the section inventory and sidebar; the canonical `layout-pageheader--default` example remains.
- Canonical component identities, three roles, production dependencies and internal parts remain in the saved catalog. No new applicant component or business rule was needed.
- Existing review tables and their historical verification results remain available. Source accounting is separate from completed visual/state acceptance.

## Continuation

[Contact](contact-component-review.md) is prepared next with six real-page scenarios and explicit local section ownership. Continue its wording/layout review before Profile. Header API consolidation, field-group naming and the six previously missing component examples remain separate follow-ups.

The October 28 [review convention](component-documentation.md#required-review-format) carries shared-component acceptance forward across these pages. Sections describe usage and distinct behavior; they do not add approval gates for unchanged shared controls. Use Contact's whole-page scenarios as the next review entry point, with its isolated sections available for optional inspection. The current source audit has four missing examples, belonging to later Health, Review and Payment pages.

## Verification

All 45 focused checks passed across component graph/read-model integrity, Library page presentation, source tracing and usage analysis, Membership, EligibilityFields, Beneficiary and Contact (the two changed section expectations passed on rerun). TypeScript and targeted ESLint passed. The clean Storybook build contains all 318 audited non-admin story exports, with zero audit errors and zero invalid saved component examples. Catalog and generated handoff drift checks passed. Browser checks verified Contact’s business-address copying and the Standard WAEPA business section with hidden correspondence, and WAEPA GI suppression of business/correspondence.

## Shared standards and Contact section follow-through

Address and name groups are approved responsive-row exceptions to stacked fields. Conditional behavior, validation and presentation are shared form standards, not new decisions for each page. Contact now has isolated residential, business/employer and spouse examples using the same extracted ContactSections implementation as its live page. Main-step and breadcrumb state examples are recorded in [the navigation review](navigation-state-review.md).

## Standalone boundary correction

The [Home-through-Contact audit](standalone-component-boundaries.md) supersedes the earlier section-renderer coupling in this checkpoint. Components receive render-ready inputs; application adapters own saved Site and applicant rules. Beneficiary records now have a standalone production view, and Contact has three independent sections sharing AddressFields. Previous whole-page rule scenarios remain integration examples.

## Profile continuation

The [Profile review](profile-component-review.md) is now prepared using the same contract. `AppShell` + `FormRoutePage` own its frame. `ProfileSections` renders member personal → physician → Other coverage → conditional financial questionnaire → spouse personal → physician → Other coverage in configured order. Its controller resolves Site participation and coverage policies and owns advisor handoff. Seven whole-page scenarios lead its sidebar; standalone section examples and PhysicianInformation support optional inspection. This extends the structure checkpoint without recording user acceptance.

## Review continuation

The [Review page](review-component-review.md) now follows the same convention: shared application frame → guidance and document → Read and Sign → Electronic Consent → adult acknowledgements. ReviewSections receives resolved inputs; the page owns legal/coverage policy and edit workflows. Document display is standalone behind its application adapter; both legal surfaces share LegalReviewSection. Ten whole-page scenarios lead the review, with optional section examples and canonical shared pieces. This records preparation, not user acceptance.
