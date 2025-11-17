import type { Meta, StoryObj } from '@storybook/react';
import CoverageCategoryCard from '../components/coverage/CoverageCategoryCard';

const meta = {
  title: 'Coverage/CoverageCategoryCard',
  component: CoverageCategoryCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CoverageCategoryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LifeInsurance: Story = {
  args: {
    category: 'LI',
    description: 'Protect your family\'s financial future with life insurance coverage.',
    products: [
      { name: 'Term Life Insurance', quickDecision: true, href: '/coverage/term-life' },
      { name: 'Whole Life Insurance', href: '/coverage/whole-life' },
      { name: 'Universal Life Insurance', href: '/coverage/universal-life' },
    ],
  },
};

export const DisabilityInsurance: Story = {
  args: {
    category: 'DI',
    description: 'Stay protected against loss of income due to disability.',
    products: [
      { name: 'Short-Term Disability', quickDecision: true, href: '/coverage/short-term-di' },
      { name: 'Long-Term Disability', href: '/coverage/long-term-di' },
    ],
  },
};

export const WithCustomBackground: Story = {
  args: {
    category: 'OO',
    description: 'Comprehensive coverage for unexpected medical expenses.',
    products: [
      { name: 'Major Medical', quickDecision: true, href: '/coverage/major-medical' },
      { name: 'Hospital Indemnity', href: '/coverage/hospital-indemnity' },
    ],
    backgroundColor: '#f5f5f5',
  },
};