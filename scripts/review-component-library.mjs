import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { readCatalogParts } from './catalog-parts.mjs';
import { componentRoleLabels, componentRoles } from '../src/domain/componentCatalog.ts';

// Review decisions reference canonical component names; this is not another inventory.
const families = [
  { name: 'Receipt sections', members: ['ReceiptConfirmation', 'ReceiptCoverageDecision', 'ReceiptDecisions', 'ReceiptNextSteps', 'ReceiptApplicationSummary'], assessment: 'Keep', next: 'Receipt resolves submission identity, product/applicant decisions, document actions and client payment guidance; sections render explicit content and callbacks.' },
  { name: 'Payment composition', members: ['PaymentSections', 'SharedPaymentControls'], assessment: 'Keep', next: 'Page resolves collection, product policy, field definitions, rate display and submission. Standalone sections and shared controls receive explicit inputs; canonical per-product bindings remain independent.' },
  { name: 'Site chrome', members: ['AppShell', 'AppBody', 'AppHeader', 'AppFooter', 'AppMenu', 'ClientHelpBanner', 'OfflineBanner'], assessment: 'Keep', next: 'Distinct site chrome responsibilities; keep program support separate from help-ribbon/sales actions.' },
  { name: 'Page layout and navigation', members: ['FormRoutePage', 'PageShell', 'FormShell', 'PageHeader', 'PageTitle', 'PageNav', 'ProgressStep'], assessment: 'Keep', next: 'Preserve layout, application state and navigation boundaries.' },
  { name: 'Section surfaces', members: ['ApplicantSectionDivider', 'SectionDivider', 'CategoryCard', 'CategoryHeader', 'ProductCard', 'DetailsTable', 'FieldGrid'], assessment: 'Keep', next: 'Use shared surfaces and data-driven labels; retain applicant/category semantics.' },
  { name: 'Generic form controls', members: ['PhoneField', 'AddressFields', 'Button', 'Link', 'FieldRenderer', 'ControlledFieldRenderer', 'SelectionGroup', 'RadioSelectionGroup', 'ConditionalGroup'], assessment: 'Keep', next: 'Use FieldRenderer for application fields; adapters/compositions must reuse its controls. Buttons and links use the existing MUI owners under Actions.' },
  { name: 'Repeated records', members: ['BeneficiaryProductRecords', 'DynamicList', 'DynamicListItem', 'YesNoDetailList', 'HealthQuestion', 'HealthQuestionList'], assessment: 'Keep', next: 'YesNoDetailList already composes DynamicList; DynamicList already composes DynamicListItem and FieldRenderer.' },
  { name: 'Quote and coverage', members: ['ApplicationEstimate', 'CoverageCart', 'CoverageCategorySelector', 'CoverageNeedsCalculator', 'CoverageOptionsPanel', 'CoverageQuestions', 'EstimatorProductCard', 'EligibilityFields', 'ProductCatalog', 'ProductCostBreakdown', 'QuoteCalculator', 'RateFrequencyControl', 'RateFrequencyToggle', 'TotalCostSummary', 'EstimatedRate', 'FeaturedBadge'], assessment: 'Keep', next: 'Preserve quote/full-application differences; share field, price and summary primitives.' },
  { name: 'QuickDecision content and marks', members: ['QuickDecisionExplainer', 'QuickDecisionIndicator', 'QuickDecisionInfoBox'], assessment: 'Keep', next: 'Shared explainer/brand mark with distinct compact indicator, expandable panel and full explanation.' },
  { name: 'Content and documents', members: ['HealthInformationHelp', 'ApplicationReviewDrawerContent', 'ApplicationDocumentPreview', 'HelpChips', 'LegalDocList', 'ReferenceRateTableLink'], assessment: 'Keep', next: 'Distinct preview, contextual-help and disclosure-list tasks.' },
  { name: 'Feedback and recovery', members: ['ApplicationErrorState', 'ApplicationRecoveryActions', 'SiteSupport', 'SessionExpiryAlert', 'RecoveryAlert', 'PageAlert', 'AppSnackbar', 'ProgressSavedSnackbar', 'EmptyState', 'ExpiringCodeAlert', 'ResendCountdownRow', 'CoverageSelectionFeedback'], assessment: 'Keep', next: 'Use the common recovery vocabulary, actions and Site support; preserve feedback timing and scope.' },
  { name: 'Transitions', members: ['PageTransitionSkeleton', 'ProcessingStatusPage'], assessment: 'Keep', next: 'Distinguish layout-preserving navigation placeholders from external-operation processing.' },
  { name: 'Dialogs and drawers', members: ['AppDrawer', 'AppModal', 'ConfirmationDialog', 'CookieDialog', 'SendApplicationDialog', 'CoveragePortfolioDrawer', 'MemberVerification'], assessment: 'Keep', next: 'Keep one modal/drawer foundation; domain workflows compose it rather than become shell variants.' },
  { name: 'Reviewed Home sections', members: ['HomeHero', 'HomeCoverageSection', 'AssociationIntroduction', 'UnderwriterCredentials', 'HowApplyingWorksPanel', 'ApplicationPreview', 'MobilePreviewFrame'], assessment: 'Keep', next: 'Match actual Home composition and clearly identify illustrative content.' },
  { name: 'Reviewed Membership sections', members: ['MembershipHelp', 'MembershipStatus', 'MemberInformation', 'AdditionalMembershipInformation'], assessment: 'Keep', next: 'These are sections of one page, not competing form libraries.' },
  { name: 'Profile personal fields', members: ['ProfilePersonalInformation'], assessment: 'Keep', next: 'Shared adult personal-field composition with independent member/spouse IDs and local license/residence/travel follow-ups.' },
  { name: 'Review composition', members: ['ReviewSections', 'ReviewStatement', 'LegalReviewSection'], assessment: 'Keep', next: 'Page controller resolves saved legal/coverage policy and edit routes. Standalone sections receive copy/fields/callbacks; both legal sections share one surface.' },
  { name: 'Profile sections', members: ['ProfileSections'], assessment: 'Keep', next: 'One production composition for personal, physician, Other coverage and financial questionnaire sections. Page resolves participation and coverage policy; standalone examples receive explicit inputs.' },
  { name: 'Reviewed Contact sections', members: ['ContactSections', 'ResidentialAddress', 'BusinessInformation', 'SpouseContact'], assessment: 'Keep', next: 'Standalone residential, business/employer and spouse views share AddressFields. ContactSections composes supplied sections; application adapters resolve participation.' },
  { name: 'Eligibility and physician sections', members: ['EligibilitySections', 'PhysicianInformation'], assessment: 'Keep', next: 'Keep page-specific policy and applicant structure above shared fields; PhysicianInformation has canonical member/spouse fields; Profile composition and scenarios are documented in profile-component-review.md.' },
];

const decisions = {
  ProductCard: ['Composition; aligned', 'Owns the shared product title, weight 800, optional brochure link/QD mark, description and content slot across Coverage, Beneficiary, Payment, quote estimates and Receipt.'],
  PageHeader: ['Consolidate next', 'Make PageHeader the single title/subtitle/back/help composition used by PageShell and FormRoutePage.'],
  PageTitle: ['Consolidate next', 'Retain as an internal heading primitive if needed; avoid two public header APIs with overlapping title/back/subhead props.'],
  PageShell: ['Consolidate next', 'Delegate its duplicate header/error/help arrangement to PageHeader and PageAlert; keep width/actions/layout ownership here.'],
  FormShell: ['Internal primitive', 'A styled Paper with width only. Keep internal to the page composition rather than implying a second form engine.'],
  FieldGrid: ['Composition; approved exceptions', 'Stack fields by default; address and name groups may use explicit responsive rows. Preserve other intentional groups as they are reviewed; do not enforce an address-only exception.'],
  ControlledFieldRenderer: ['Adapter; aligned', 'Moved to Forms with its own adapter example. It already calls FieldRenderer; keep one field/control implementation.'],
  RadioSelectionGroup: ['Composition; already shared', 'Already composes SelectionGroup. Keep radio semantics, labels and helper/error state separate from the visual row.'],
  DynamicListItem: ['Internal primitive', 'Already used by DynamicList. Keep as its record-summary/action row instead of another list manager.'],
  DynamicList: ['Keep; grouping aligned', 'The add/edit dialog retains configured first/last-name rows on larger screens and stacks them on mobile. Other fields remain stacked. Retain one list editor and existing remove confirmation.'],
  YesNoDetailList: ['Composition; already shared', 'Already uses FieldRenderer and DynamicList for yes/no follow-up records. Do not reimplement medical list controls.'],
  EligibilityFields: ['Composition; aligned', 'The application Eligibility page and quote tools share ZIP/State/Birthday rendering and manual-State behavior; their adapters retain value and validation ownership.'],
  CoverageSelectionFeedback: ['Composition; aligned', 'Shared AppDrawer/CoverageCart for the first addition and AppSnackbar for subsequent additions; keep selection state and feedback timing at the caller.'],
  ReferenceRateTableLink: ['Composition; aligned', 'One shared drawer supports saved image, PDF, HTML table, link and XML reference formats; preserve reference pricing separately from calculated estimates.'],
  EstimatorProductCard: ['Consolidate selectively', 'Share the product surface, stored field controls and EstimatedRate. Keep its member-only quote behavior distinct from ProductCatalog.'],
  ProductCatalog: ['Consolidate selectively', 'Owns applicant/rider/product policy. Extract repeated view fragments only; do not turn the quote card into the full business-policy orchestrator.'],
  RateFrequencyToggle: ['Internal primitive', 'Styled switch inside RateFrequencyControl; expose monthly/annual examples through the labeled control rather than treating both as separate workflows.'],
  RateFrequencyControl: ['Composition; already shared', 'Already owns labels/options and delegates to RateFrequencyToggle. Keep as the public coverage-frequency control.'],
  EstimatedRate: ['Composition; already shared', 'Already handles amount/unavailable/calculating across cards and totals, including reserved dimensions. Reuse this instead of local price spinners.'],
  ProductCostBreakdown: ['Consolidate selectively', 'Line items and fees differ from a grand-total summary. Share label/value/amount rows if their markup drifts; retain fee/disclosure semantics.'],
  TotalCostSummary: ['Consolidate selectively', 'Keep its product/grand-total role. EstimatedRate is already shared with breakdown/card prices.'],
  QuickDecisionIndicator: ['Internal primitive', 'Thin preset around QuickDecisionIcon. Keep one configured artwork source; this is a useful compact semantic preset, not a new brand implementation.'],
  QuickDecisionInfoBox: ['Consolidate selectively', 'Already reuses the explainer/mark, but its promotional lead sentence is local. Put shared explanation copy in one content source when the Coverage page is reviewed.'],
  ProgressSavedSnackbar: ['Internal primitive', 'A semantic AppSnackbar preset. Keep confirmed-save timing at callers; do not show Saved for an unacknowledged request.'],
  RecoveryAlert: ['Composition; aligned', 'One RecoveryAlert uses stable local codes and approved copy, preserves answers/focus, and carries the same opaque support reference into the full page and support drawer.'],
  ApplicationErrorState: ['Composition; aligned', 'One card-contained utility-page layout renders large primary-colored error codes or state icons, messages, plain recovery links and the standard SiteSupport card. Maintenance has no navigation actions; 404 Home/Resume links preserve application state.'],
  SiteSupport: ['Consolidated now', 'Receipt, maintenance and errors share the standard support card. Emails share its resolver/copy while retaining table markup suitable for email clients.'],
  ApplicationRecoveryActions: ['Composition; aligned', 'One compact responsive action row. Maintenance has no navigation actions. Only explicit Start new invokes the reset callback; retries require an explicit local callback.'],
  ProcessingStatusPage: ['Composition; aligned', 'A bounded local status now leads to completion or recovery feedback. Unconfirmed payment/submission examples use the full recovery page without repeat actions.'],
  PageTransitionSkeleton: ['Keep distinct', 'Preserves form layout during navigation. It serves a different purpose from a generic spinner or long-running operation status.'],
  MobilePreviewFrame: ['Illustration infrastructure', 'Used inside the Home illustration. It is not the applicant viewport or form layout; group its examples with decorative Home content.'],
  ApplicationPreview: ['Illustration', 'Decorative simulated controls do not collect answers. Keep separate from real form controls and do not count them as field coverage.'],
  OfflineBanner: ['Keep distinct', 'AppShell owns the full-width connection bar above the header. Initial browser connectivity, online/offline events and reported OFFLINE incidents control visibility; no support reference or navigation actions.'],
  ClientHelpBanner: ['Keep distinct', 'Compact global help ribbon may use a help-specific number, chat or scheduling; SiteSupport uses the administrator contact. Do not replace one contact role with another.'],
  AppFooter: ['Consolidate selectively', 'Keep legal/underwriter identity and address content. Share contact resolution for any Questions card, without merging the complete footer into that card.'],
};

const catalog = readCatalogParts();
const rows = catalog.data.components.map(row => {
  const definition = row.definition;
  const matches = families.filter(family => family.members.includes(definition.name));
  if (matches.length !== 1) throw new Error(`Component needs exactly one review family: ${definition.name}`);
  const family = matches[0];
  const [assessment, next] = decisions[definition.name] ?? [family.assessment, family.next];
  const sources = [...new Set((definition.usages ?? []).map(usage => usage.source))].sort();
  return { key: row.key, name: definition.name, section: definition.section, role: definition.role, contains: definition.contains, parts: definition.parts, source: definition.source, storyId: definition.storyId,
    purpose: definition.description, family: family.name, assessment, next, sourceConsumers: sources,
    sourcePlacements: definition.usages?.length ?? 0,
    sourceHash: fs.existsSync(definition.source) ? createHash('sha256').update(fs.readFileSync(definition.source)).digest('hex') : null };
}).sort((a, b) => a.family.localeCompare(b.family) || a.name.localeCompare(b.name));
const referenced = new Set(rows.map(row => row.name));
for (const family of families) for (const name of family.members) if (!referenced.has(name)) throw new Error(`Reviewed component no longer exists: ${name}`);

const cell = value => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
const changes = rows.filter(row => /Consolidate|Clarify|Reference|Illustration|aligned|corrected/.test(row.assessment));
const markdown = `# Component representation and consolidation review

Reviewed ${rows.length} canonical component records from public/catalog/components/components.json against their source modules and generated production placement references. Every component has an explicit family and review decision. This is a source review; source paths include conditional variants and do not prove that every variant has been visually reviewed or mounted. Review source hashes and regenerate with npm run components:review after changes.

## Component structure

Application frame → page sections → shared pieces describes primary ownership; Storybook category and reuse count are separate. Contains references direct registered source dependencies, including conditional paths; internal parts describe exports, native elements, actions and slots without inventing extra component identities. See [the documentation contract](component-documentation.md).

| Role | Components |
| --- | --- |
${componentRoles.map(role => `| ${componentRoleLabels[role]} | ${rows.filter(row => row.role === role).length} |`).join('\n')}

| Component | Role | Contains components | Internal parts |
| --- | --- | --- | --- |
${rows.map(row => `| ${row.name} | ${componentRoleLabels[row.role]} | ${row.contains.map(key => catalog.data.components.find(component => component.key === key).definition.name).join(', ') || '—'} | ${row.parts.map(part => cell(`${part.name} (${part.kind}): ${part.description}`)).join('<br>') || '—'} |`).join('\n')}

## Findings

- Consolidated now: SiteSupport replaces the receipt's local Questions block and appears on maintenance and every error page. Email and site share contact resolution/copy. Existing email transport markup remains separate.
- Aligned now: shared recovery copy/actions prevent different recovery wording and duplicate alerts on the full page; local incident context carries safe support references without service calls. The controlled field adapter is documented under Forms. Configured name groups share a responsive row on larger screens and stack on mobile, with no extra vertical grid gap.
- Highest-value next consolidation: PageHeader/PageTitle/PageShell header APIs and legacy grid metadata/address layout naming. LoadingOverlay was deleted because it had no production usage; catalog generation now rejects unused components. ProcessingStatusPage has bounded pending, complete and timeout variants.
- Already shared: radio rows use SelectionGroup; controlled fields use FieldRenderer; yes/no detail records use DynamicList; frequency control uses its styled switch; modal workflows use shared shells; price surfaces use EstimatedRate. These are layers of composition, not independent duplicate implementations.
- Preserve distinctions: help-ribbon contact vs administrator support; quote card vs full applicant/rider catalog; transient snackbar vs persistent page alert; skeleton vs external processing; business policy vs visual surface. Merge only repeated markup/data that has the same meaning.
- ApplicationPreview and MobilePreviewFrame represent decorative Home artwork. Their simulated fields are not application answers or actual applicant screen layouts.
- Home, Membership, Eligibility and Coverage have reviewed section examples. Coverage also has whole-page scenarios and reference-rate format examples. Beneficiary has real whole-page scenarios with local section ownership documented in its page review. Contact has both isolated section examples and real whole-page scenarios using ContactSections. Profile now has seven whole-page scenarios and standalone section examples with its own page review. Review now has standalone document/legal pieces, section examples and real whole-page policy scenarios. Later application pages still require the planned page-by-page review; source references alone are not completed section/state coverage.

## Consolidation queue

| Component | Decision | Next step |
| --- | --- | --- |
${changes.map(row => `| ${row.name} | ${row.assessment} | ${cell(row.next)} |`).join('\n')}

## Full component review

Consumers counts distinct production source compositions, not rendered instances or unconditional routes. Open the canonical Storybook example from each component's saved story ID. Machine-readable evidence, source hashes and consumer paths are recorded in component-consolidation-review.json.

| Component | Family | Consumers | Decision | Assessment / next step |
| --- | --- | --- | --- | --- |
${rows.map(row => `| ${fs.existsSync(row.source) ? `[${row.name}](../../${row.source})` : row.name} | ${row.family} | ${row.sourceConsumers.length} | ${row.assessment} | ${cell(row.next)} |`).join('\n')}

## Next review sequence

1. Continue the remaining state matrix in recovery-state-plan.md using the implemented shared recovery contract.
2. Consolidate page header APIs with focused before/after examples, preserving catalog identities or providing explicit aliases.
3. Review the prepared Review whole-page scenarios, then continue Health, Payment, E-sign and Receipt. Beneficiary examples and the prior-page structure checkpoint are documented in their page reviews. Capture empty, populated, invalid, loading, unavailable and recovery variants where meaningful for each page.
4. Promote a new shared component only when repeated production markup/behavior establishes the need. A small semantic preset or an adapter can remain internal to its family.
`;
const json = JSON.stringify({ componentCount: rows.length, reviewType: 'source-and-composition', rows }, null, 2) + '\n';
const outputs = [['docs/project-review/component-consolidation-review.md', markdown], ['docs/project-review/component-consolidation-review.json', json]];
for (const [file, text] of outputs) {
  if (process.argv.includes('--check')) { if (fs.readFileSync(file, 'utf8') !== text) throw new Error(`Stale component review: ${file}`); }
  else fs.writeFileSync(file, text);
}
console.log(`Reviewed ${rows.length} components across ${families.length} families; ${rows.filter(row => row.sourcePlacements === 0).length} without production placements.`);
