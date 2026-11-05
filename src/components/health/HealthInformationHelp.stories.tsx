import type { Meta, StoryObj } from '@storybook/react-vite';
import HealthInformationHelp from './HealthInformationHelp';

const meta = {
  id: "forms-health-information-help",
  title: "Components/Pages/Health/Sections/Health-information help", component: HealthInformationHelp,
  parameters: { standalone: true, layout: 'padded', docs: { description: { component: 'Shared health-information chip and drawer on all six Health routes and all supplied form previews. Retains the existing prototype wording; no MCR provenance is asserted.' } } },
} satisfies Meta<typeof HealthInformationHelp>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
