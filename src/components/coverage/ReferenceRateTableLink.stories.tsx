import type { Meta, StoryObj } from '@storybook/react-vite';
import { openOverlay } from '../../../.storybook/previewInteractions';
import ReferenceRateTableLink from './ReferenceRateTableLink';

const meta = {
  id: 'coverage-reference-rate-table',
  title: "Components/Coverage and pricing/Reference rate table",
  component: ReferenceRateTableLink,
  parameters: { standalone: true, layout: 'padded', docs: { description: { component: 'Each supported drawer format opens automatically through View rate table. All formats use generic fictional demonstration data. These examples do not calculate premiums.' } } },
} satisfies Meta<typeof ReferenceRateTableLink>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Image: Story = { play: openOverlay('View rate table'), args: { table: { version: 1, kind: 'image', title: 'Example disability reference rates', url: '/storybook/reference-rates.svg' } } };
export const Pdf: Story = { play: openOverlay('View rate table'), args: { table: { version: 1, kind: 'pdf', title: 'Example disability reference rates (PDF)', url: '/storybook/reference-rates.pdf' } } };
export const HtmlTable: Story = { play: openOverlay('View rate table'), args: { table: { version: 1, kind: 'html-table', title: 'Illustrative reference table', columns: ['Age band', 'Monthly rate per $1,000'], rows: [['30–39', '$0.10'], ['40–49', '$0.20']], notes: ['Fictional values for component review only.'], sources: [{ kind: 'pdf', label: 'Example source PDF', url: '/storybook/reference-rates.pdf' }] } } };
export const Link: Story = { play: openOverlay('View rate table'), args: { table: { version: 1, kind: 'link', title: 'Example reference source', url: '/storybook/reference-rates.pdf' } } };
export const Xml: Story = { play: openOverlay('View rate table'), args: { table: { version: 1, kind: 'xml', title: 'Illustrative XML reference source', url: '/storybook/reference-rates.xml', notes: ['Fictional values for component review only.'] } } };
