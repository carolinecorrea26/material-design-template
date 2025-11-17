import type { Meta, StoryObj } from '@storybook/react';
import CoverageCategoryChip from '../components/coverage/CoverageCategoryChip';

const meta = {
  title: 'Coverage/CoverageCategoryChip',
  component: CoverageCategoryChip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CoverageCategoryChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LifeInsurance: Story = {
  args: {
    category: 'LI',
    size: 'small',
  },
};

export const DisabilityInsurance: Story = {
  args: {
    category: 'DI',
    size: 'small',
  },
};

export const OtherCoverage: Story = {
  args: {
    category: 'OO',
    size: 'small',
  },
};

export const SupplementalHealth: Story = {
  args: {
    category: 'SH',
    size: 'small',
  },
};

export const MediumSize: Story = {
  args: {
    category: 'LI',
    size: 'medium',
  },
};