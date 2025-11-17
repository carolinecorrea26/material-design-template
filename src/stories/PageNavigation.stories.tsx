import type { Meta, StoryObj } from '@storybook/react';
import PageNavigation from '../components/layout/PageNavigation';

const meta = {
  title: 'Layout/PageNavigation',
  component: PageNavigation,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PageNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    showBack: true,
    showContinue: true,
    continueText: 'Continue',
  },
};

export const NoBackButton: Story = {
  args: {
    showBack: false,
    showContinue: true,
    continueText: 'Continue',
  },
};

export const CustomContinueText: Story = {
  args: {
    showBack: true,
    showContinue: true,
    continueText: 'Submit Application',
  },
};