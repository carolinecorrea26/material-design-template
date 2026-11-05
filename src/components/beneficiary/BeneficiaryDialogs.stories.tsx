import type { Meta, StoryObj } from '@storybook/react-vite';
import Beneficiary from '../../pages/Beneficiary';
import BeneficiaryPageExample, { type BeneficiaryPageScenario } from '../../../.storybook/beneficiaryPageExample';
import { beneficiaryScenarios } from '../../../.storybook/beneficiaryScenarios';
import { readSharedCatalog, type SharedCatalog } from '../../persistence/sharedCatalog';
import { openOverlay } from '../../../.storybook/previewInteractions';
import { userEvent, within } from 'storybook/test';

const meta = {
  id: 'pages-beneficiary-whole-page',
  title: 'Components/Feedback and overlays/Dialogs and drawers/Application dialogs/Beneficiary',
  component: Beneficiary, loaders: [async () => ({ catalog: await readSharedCatalog() })],
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Actual Beneficiary dialogs, opened through their real page actions using the same saved configuration and fictional scenario as the whole-page examples.' } } },
} satisfies Meta<typeof Beneficiary>;
export default meta;
const example = (scenario: BeneficiaryPageScenario): StoryObj => ({ render: (_args, context) => <BeneficiaryPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={scenario}><Beneficiary /></BeneficiaryPageExample> });
export const AddBeneficiaryDialog: StoryObj = { ...example(beneficiaryScenarios.empty), name: 'Add individual or trust', play: openOverlay('Add Beneficiary') };
export const EditIndividualDialog: StoryObj = { ...example(beneficiaryScenarios.completed), name: 'Edit individual', play: openOverlay('Edit Alex Example (50%)') };
export const EditTrustDialog: StoryObj = { ...example(beneficiaryScenarios.completed), name: 'Edit trust', play: openOverlay('Edit Example Family Trust') };
export const ApplyToOtherCoverages: StoryObj = { ...example(beneficiaryScenarios.empty), name: 'Apply beneficiary to other coverages', play: async context => {
  await openOverlay('Add Beneficiary')(context);
  const screen = within(context.canvasElement.ownerDocument.body);
  await userEvent.type(await screen.findByLabelText(/First Name/), 'Jordan');
  await userEvent.type(await screen.findByLabelText(/Last Name/), 'Example');
  await userEvent.click(await screen.findByRole('combobox', { name: /Relationship/ }));
  await userEvent.click(await screen.findByRole('option', { name: 'Sibling' }));
  await userEvent.click(await screen.findByRole('button', { name: '100%' }));
  await userEvent.click(await screen.findByRole('button', { name: 'Save Beneficiary' }));
  await screen.findByRole('button', { name: 'Apply to Selected' });
} };
