import { readStoryInventory } from './storybook-inventory.mjs';
import fs from 'node:fs';
import { createComponentUsage } from './component-usage.mjs';
import { libraryMetadata } from '../src/domain/provenance.ts';
import { createComponentAnalyzer, storyForComponent } from './storybook-component-analysis.mjs';
import { catalogPartPath, readCatalogParts, writeCatalogBundle } from './catalog-parts.mjs';
import { componentStructure } from './component-structure.mjs';
import { validateComponentStructure } from '../src/domain/componentCatalog.ts';
const analyzer = createComponentAnalyzer();
const descriptions = {
 EligibilitySections: "Configured Eligibility sections for personal information, covered applicants, spouse details and repeated child records.",
 HomeHero: "Homepage introduction, application and resume actions, with a configured quote card or association image.",
 HomeCoverageSection: "Homepage coverage section with its heading, description, category choices and product information.",
 AssociationIntroduction: "Association logo, tagline and introductory paragraphs on the homepage.",
 UnderwriterCredentials: "Insurer logo, name, ratings, supporting description and footnote.",
 Button: "Standard action button with pill shape by default; supports contained, outlined, text, disabled and loading states.",
 FormRoutePage: "Application frame composing page surfaces, steps, breadcrumbs, heading/Back, help, form validation, transitions, saved values and Next; pages supply their sections.",
 CoverageCategorySelector: "Lets applicants choose the coverage categories they want to explore.", CoveragePortfolioDrawer: "Shows existing member and spouse coverage in a drawer.", EligibilityFields: "Collects and validates applicant eligibility details.", EstimatorProductCard: "Displays a product, applicant selections, coverage amounts, and estimated cost.", MemberVerification: "Collects a verification method and security answers using the standard form fields, then reports the prototype verification result.", AppSnackbar: "Shows a temporary feedback message with an optional action.", EmptyState: "Explains why a section has no items and offers a next action.", PageAlert: "Displays page-level errors, warnings, or informational messages.", PageTransitionSkeleton: "Shows loading placeholders while the next application page opens.", AppHeader: "Displays the portal brand, help actions, application menu, cart, and progress.", ApplicantSectionDivider: "Labels an applicant section with an optional supporting note.", ProgressStep: "Main application steps (Getting started, Choose your coverage and later stages), with Breadcrumbs exported from the same module for pages within the current main step; visibility follows the active flow and template.", PageHeader: "Displays the page title, supporting copy, back action, and contextual help.", ProductCard: "Shared product container with a weight-800 title, optional brochure link, QD indicator, description and page-specific content.", SectionDivider: "Separates and labels groups of related form content.", PageNav: "Provides the application page's Next or submit action.", AppDrawer: "Displays supporting content in a drawer with a close action.", AppModal: "Displays a focused dialog with primary and secondary actions.", SendApplicationDialog: "Lets advisors send an application or request an edit from an applicant.", QuoteCalculator: "Collects eligibility and coverage choices to estimate an applicant's cost.",

 ApplicationDocumentPreview:"Displays application data grouped into readable document sections.", HelpChips:"Opens contextual help and reference content from labeled chips.", QuickDecisionExplainer:"Explains the QuickDecision process and possible outcomes.",
 DynamicList:"Collects repeated records through add, edit and remove actions in a dialog.", DynamicListItem:"Displays one repeated record with its edit and remove controls.", SelectionGroup:"Provides a selectable row or card with the shared selection styling.",
 DetailsTable:"Presents labeled values in a compact details table.", LegalDocList:"Lists application documents and legal disclosures with links.", QuickDecisionIndicator:"Marks coverages that support QuickDecision with the configured client icon.", CoverageNeedsCalculator:"Estimates life insurance needs from financial obligations and available resources.", CoverageOptionsPanel:"Explains available coverage categories and products on the homepage or in a drawer.", CoverageQuestions:"Category question with its configured member/spouse follow-ups and additional product eligibility facts.", HowApplyingWorksPanel:"Explains the three application steps using images or a configured animated preview.", PhysicianInformation:"Collects physician name, phone and facility details from supplied member or spouse fields.", ProductCatalog:"Product boxes with coverage and rider notes/options for each applicant, plus the combined cost of all selected products.", ProductCostBreakdown:"Displays premium details and supplemental fees for a product.", ProgressSavedSnackbar:"Confirms that application progress has been saved.", ResendCountdownRow:"Shows the resend countdown and action for a verification message.", FieldRenderer:"Renders a configured field with its input, validation and conditional behavior.", ApplicationPreview:"Decorative homepage illustration of coverage, health, and receipt scenes; its drawn controls do not collect application answers.", AppBody:"Provides the main application content container and responsive spacing.", AppFooter:"Displays administrator, insurer, support and legal details.", AppMenu:"Provides application navigation and informational drawers.", ClientHelpBanner:"Provides client-configured phone, chat and other support actions.", FormShell:"Provides the visual form surface; FormRoutePage owns form state and navigation.", PageShell:"Provides a shared page container and layout.", PageTitle:"Displays the page heading, subtitle and supporting actions.", ConfirmationDialog:"Requests confirmation before continuing a consequential application action.", CookieDialog:"Displays cookie information and consent controls."
};
const rows = new Map();
const saved = readCatalogParts();
const usage = createComponentUsage(analyzer, saved.data.pages);
const modules = readStoryInventory().filter(story => story.file.startsWith('src/components/') && !/\/(admin|docs)\//.test(story.file) || story.file === 'src/app/RoutePage.stories.tsx');
const storyExamples = new Map();
for (const story of modules) {
 const renderedStories = analyzer.stories(story.file);
 const components = [...story.components, ...story.packageComponents];
 if (story.file === 'src/app/RoutePage.stories.tsx') components.push({ name: 'FormRoutePage', source: 'src/app/RoutePage.tsx', ownsStory: true });
 for (const component of components) {
  const { name, source, ownsStory, packageImport } = component;
  const example = packageImport ? renderedStories.find(story => story.elements.some(element => element.origin === packageImport.module && element.symbol === packageImport.symbol)) : storyForComponent(renderedStories, source);
  if (!example) throw new Error(`No actual render found for ${source} in ${story.file}`);
  const examples = storyExamples.get(source) ?? new Map();
  const page = saved.data.pages.find(page => {
    const section = `Components / Pages / ${page.definition.displayName}`;
    return story.section === section || story.section.startsWith(`${section} / `);
  });
  examples.set(story.title, { label: story.title.split('/').at(-1), storyId: example.id, section: story.section, ...(page && story.pagePosition !== undefined ? { pageKey: page.key, position: story.pagePosition } : {}) });
  for (const [exportName, pageKey] of Object.entries(story.pageStories)) {
   const page = saved.data.pages.find(row => row.key === pageKey);
   const example = renderedStories.find(row => row.export === exportName);
   if (!page || !example) throw new Error(`Invalid page story: ${story.file} ${exportName} ${pageKey}`);
   examples.set(`${story.title}:${pageKey}`, { label: page.definition.displayName, storyId: example.id, section: `Components / Pages / ${page.definition.displayName} / Whole page`, pageKey, position: 0 });
  }
  storyExamples.set(source, examples);
  if (rows.has(name) && !ownsStory) continue;
  const text = packageImport ? '' : fs.readFileSync(source, 'utf8');
  const doc = text.match(/\/\*\*([\s\S]*?)\*\//)?.[1]?.replace(/\*/g,'').replace(/@\w+[\s\S]*/,'').trim().replace(/\s+/g,' ');
  rows.set(name, { id: 'component-'+name.replace(/([a-z0-9])([A-Z])/g,'$1-$2').toLowerCase(), name, section: story.section, description: descriptions[name] || doc || name.replace(/([a-z])([A-Z])/g,'$1 $2')+' component used by the portal.', storyId: example.id, source, ...(packageImport ? { packageImport } : {}) });
 }
}
const sectionOrder = ['Components', 'Reference'];
const catalog = [...rows.values()].map(row => ({ ...row, ...componentStructure(row, [...rows.values()], analyzer), usages: usage(row.source, row.packageImport), examples: [...storyExamples.get(row.source).values()] }))
 .sort((a,b)=>sectionOrder.indexOf(a.section.split(' / ')[0])-sectionOrder.indexOf(b.section.split(' / ')[0])||a.section.localeCompare(b.section)||a.name.localeCompare(b.name));
// Page-only story modules compose existing registered components through their
// actual controllers. Link their explicit page examples without inventing a
// component identity for a page or its Storybook harness.
for (const module of modules.filter(module => !module.components.length && Object.keys(module.pageStories).length)) {
 const rendered = analyzer.stories(module.file);
 for (const [exportName, pageKey] of Object.entries(module.pageStories)) {
  const page = saved.data.pages.find(page => page.key === pageKey);
  const example = rendered.find(story => story.export === exportName);
  if (!page || !example) throw new Error(`Invalid page story: ${module.file} ${exportName} ${pageKey}`);
  const reachable = new Set(example.components.map(component => component.source));
  for (const source of reachable) for (const child of analyzer.trace(source, analyzer.module(source).ast).components) reachable.add(child.source);
  const owners = catalog.filter(component => reachable.has(component.source));
  if (!owners.length) throw new Error(`Page story has no registered production components: ${example.id}`);
  for (const owner of owners) owner.examples.push({ label: page.definition.displayName, storyId: example.id, section: `Components / Pages / ${page.definition.displayName} / Whole page`, pageKey, position: 0 });
 }
}
for (const row of catalog) if (row.usages.length === 0) throw new Error(`Component has no production usage: ${row.name}. Remove its implementation and story instead of keeping a reference-only component.`);
validateComponentStructure(catalog.map(row => ({ key: row.id, definition: row })));
if (process.argv.includes('--check')) {
 for (const { id, ...definition } of catalog) {
  const row = saved.data.components.find(row => row.key === id);
  if (!row || JSON.stringify(row.definition) !== JSON.stringify({ ...definition, storybookPath: `?path=/story/${definition.storyId}` })) throw new Error('Saved component catalog is stale. Run node scripts/generate-component-catalog.mjs --write-catalog.');
 }
 if (saved.data.components.length !== catalog.length) throw new Error('Saved component identities differ from the generated catalog.');
}
if (process.argv.includes('--write-catalog')) {
 const additions = catalog.filter(row => !saved.data.components.some(saved => saved.key === row.id));
 const removed = saved.data.components.filter(row => !catalog.some(next => next.id === row.key));
 if (removed.length || additions.length && !process.argv.includes('--add-records')) throw new Error(`Component identities changed; additions: ${additions.map(row => row.id).join(', ') || 'none'}; removals: ${removed.map(row => row.key).join(', ') || 'none'}. Reconcile new records explicitly with --add-records.`);
 for (const row of catalog) {
  let target = saved.data.components.find(saved => saved.key === row.id);
  if (!target) {
   target = { id: row.id, key: row.id, position: saved.data.components.length, ...libraryMetadata('components', row.id, row.source) };
   saved.data.components.push(target);
  }
  const { id, ...definition } = row;
  target.definition = { ...definition, storybookPath: `?path=/story/${row.storyId}` };
  target.sourceReference = row.source;
 }
 fs.writeFileSync(`public/catalog/${catalogPartPath('components')}`, JSON.stringify({ components: saved.data.components }, null, 2)+'\n');
 writeCatalogBundle();
}
console.log(`Cataloged ${rows.size} components; ${catalog.filter(row => row.usages.length >= 2).length} used in multiple places`);
