# Coverage implementation map

Page key: `coverage`. Entry point: [Coverage.tsx](../../src/pages/Coverage.tsx). Reviewed sections, conditional states and whole-page examples: [Coverage component review](../project-review/coverage-component-review.md).

## Page composition

| Review section | Implementation |
| --- | --- |
| Coverage questions | [CoverageQuestions](../../src/components/coverage/CoverageQuestions.tsx): category selection, applicant follow-ups and additional product facts |
| Product reveal | [ProductCatalog](../../src/components/coverage/ProductCatalog.tsx): product/applicant selections, notes, riders, amounts, estimates and combined cost |

Coverage has exactly these two reviewed sections. The shared page header is not another Coverage section. Cart/portfolio drawers, rate controls and reference-rate drawers are shared or conditional pieces. Stored applicant field sections remain data organization and do not define extra review sections.

## Catalog path

The `coverage` entry in [page-maps.json](page-maps.json) identifies direct page, Site, section, field, override, validation, component and flow references. Additional question fields are derived from applicable products and facts by [coverage question requirements](../../src/config/coverageQuestionRequirements.ts).

| Dependency | Catalog / resolver |
| --- | --- |
| Product, category, plan and rider definitions | `configurations/products.json` |
| Site product/applicant participation, eligibility, amounts and underwriting | `rules/rules.json`; [effective Site](../../src/domain/effectiveSite.ts) and [effective configuration](../../src/domain/effectiveConfiguration.ts) |
| Policy values, selection, presentation and reference-rate settings | `configurations/configurations.json`; ownership-aware resolvers |
| Branding, content and entry parameters | `configurations/themes.json`, `content/content.json`, `configurations/url-parameters.json` |
| Page answers, products and runtime decisions | [useCoverageState](../../src/app/useCoverageState.ts), [coverage runtime](../../src/domain/coverageRuntime.ts), [coverage presentation](../../src/domain/coveragePresentation.ts) |

Review `rule-coverage-*` and applicable scoped assignments as a starting point. A direct page map does not enumerate every selected product's conditional dependencies. Retain structured product/amount/eligibility relationships and resolve policy ownership instead of duplicating them inside the component definition.

## Implementation and acceptance

- Category questions lead to product reveal; additional product facts remain inside Coverage questions.
- Preserve per-applicant availability, amount/rider choices, work-hour and other eligibility thresholds, selection conflicts and required-information validation. Current Add behavior remains as documented; continuation validation still applies.
- First addition opens the Coverage added drawer; later additions use snackbar feedback through [CoverageSelectionFeedback](../../src/components/coverage/CoverageSelectionFeedback.tsx).
- Restricted entry selections require explicit removal. Dependent-only continuation uses the existing confirmation dialog. Portfolio access depends on the configured verified state.
- Use the shared [rate display contract](../../src/domain/rateDisplay.ts): available (including valid zero), loading, unavailable, reference table, needs information, provided separately and hidden. Do not render missing/failed rates as zero or produce a misleading partial total.

Whole-page cases cover empty entry scope, unavailable saved selections, dependent-only Cancel/Continue and reference-rate presentation. Reference drawer examples cover image, PDF, HTML table, link and XML. Mock pricing is synthetic. Inline PDF rendering remains browser-dependent and the Open PDF link remains available.

Relevant regression references: [whole-page scenarios](../../src/pages/Coverage.scenarios.test.tsx), [entry scope](../../src/pages/Coverage.entryScope.test.tsx), [runtime integration](../../src/app/coverageRuntime.integration.test.ts), and [saved scenario rules](../../src/components/coverage/coverageStoryScenarios.test.ts). Site-wide visual/accessibility acceptance and production rating integration remain separate boundaries.
