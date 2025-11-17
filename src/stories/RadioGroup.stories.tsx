import type { Meta, StoryObj } from '@storybook/react';
import RadioGroup from '../components/form/RadioGroup';
import { useState } from 'react';

const meta = {
  title: 'Form/RadioGroup',
  component: RadioGroup,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const RadioGroupWithState = (args: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  fullWidth?: boolean;
}) => {
  const [value, setValue] = useState(args.value || '');
  return <RadioGroup {...args} value={value} onChange={setValue} />;
};

export const Default: Story = {
  render: (args) => <RadioGroupWithState {...args} />,
  args: {
    label: 'Select an option',
    value: 'option1',
    options: [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
      { label: 'Option 3', value: 'option3' },
    ],
  },
};

export const TwoOptions: Story = {
  render: (args) => <RadioGroupWithState {...args} />,
  args: {
    label: 'Choose coverage type',
    value: 'basic',
    options: [
      { label: 'Basic Coverage', value: 'basic' },
      { label: 'Premium Coverage', value: 'premium' },
    ],
  },
};

export const NotFullWidth: Story = {
  render: (args) => <RadioGroupWithState {...args} />,
  args: {
    label: 'Payment method',
    value: 'credit',
    options: [
      { label: 'Credit Card', value: 'credit' },
      { label: 'Bank Transfer', value: 'bank' },
      { label: 'PayPal', value: 'paypal' },
    ],
    fullWidth: false,
  },
};