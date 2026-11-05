import type { Meta, StoryObj } from '@storybook/react-vite';
import Beneficiary from '../../pages/Beneficiary';
import BeneficiaryPageExample, { type BeneficiaryPageScenario } from '../../../.storybook/beneficiaryPageExample';
import { readSharedCatalog, type SharedCatalog } from '../../persistence/sharedCatalog';

import { beneficiaryScenarios as scenarios } from '../../../.storybook/beneficiaryScenarios';

const meta = {
  id: "pages-beneficiary-whole-page",
  title: "Components/Pages/Beneficiary/Whole page",
  component: Beneficiary,
  loaders: [async () => ({ catalog: await readSharedCatalog() })],
  parameters: { layout: 'fullscreen', docs: { description: { component: 'The real Beneficiary page: optional participation, applicant/product cards, beneficiary editing, help and copy dialogs, and Next validation. Saved Site configuration with fictional local answers. Shared layout and controls retain their existing reference stories.' } } },
} satisfies Meta<typeof Beneficiary>;
export default meta;

const example = (scenario: BeneficiaryPageScenario): StoryObj<typeof meta> => ({ render: (_args, context) => <BeneficiaryPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={scenario}><Beneficiary /></BeneficiaryPageExample> });
export const Empty = example(scenarios.empty);
export const IndividualsAndTrust = example(scenarios.completed);
export const MemberAndSpouse = example(scenarios.spouse);
export const OptionalParticipation = example(scenarios.optional);
export const NoApplicableCoverage = example(scenarios.noProducts);
