import type { Meta, StoryObj } from '@storybook/react-vite';
import PageHelp from './PageHelp';
import { pageHelpExampleItems } from '../../../.storybook/pageHelpExample';
const meta = {
  title: 'Components/Content and data display/Help and support/Page help', component: PageHelp,
  parameters: { standalone: true, layout: 'padded', docs: { description: { component: 'Shared page-help interaction with explicit topics, labels and drawer content. Pages select their topics in fresh-start source.' } } },
} satisfies Meta<typeof PageHelp>;
export default meta;
type Story = StoryObj<typeof meta>;
export const MultipleTopics: Story = { args: { items: pageHelpExampleItems } };
export const SingleTopic: Story = { args: { items: pageHelpExampleItems.slice(0, 1) } };
export const NoTopics: Story = { args: { items: [] } };
