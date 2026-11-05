import type { Meta, StoryObj } from '@storybook/react-vite';
import Coverage from '../../pages/Coverage';
import CoveragePageExample, { coveragePageScenarios } from '../../../.storybook/coveragePageExample';
import { readSharedCatalog, type SharedCatalog } from '../../persistence/sharedCatalog';

const meta = {
  id: 'pages-coverage-whole-page',
  title: "Components/Pages/Coverage/Whole page",
  component: Coverage,
  loaders: [async () => ({ catalog: await readSharedCatalog() })],
  parameters: { layout: 'fullscreen', docs: { description: { component: 'The complete Coverage page with its real form template, question validation, product reveal, Next gating, notices and overlays. Uses the saved catalog, fictional applicant answers and local synthetic rates.' } } },
} satisfies Meta<typeof Coverage>;
export default meta;

export const Interactive: StoryObj = { render: (_args, context) => <CoveragePageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={coveragePageScenarios.interactive}><Coverage /></CoveragePageExample> };
export const EntryLinkWithoutProducts: StoryObj = { render: (_args, context) => <CoveragePageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={coveragePageScenarios.emptyEntry}><Coverage /></CoveragePageExample> };
export const EntryLinkWithUnavailableSelections: StoryObj = { render: (_args, context) => <CoveragePageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={coveragePageScenarios.restrictedEntry}><Coverage /></CoveragePageExample> };
export const DependentOnlyConfirmation: StoryObj = { render: (_args, context) => <CoveragePageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={coveragePageScenarios.dependentOnly}><Coverage /></CoveragePageExample> };
export const ReferenceRateTable: StoryObj = { render: (_args, context) => <CoveragePageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={coveragePageScenarios.referenceRates}><Coverage /></CoveragePageExample> };
