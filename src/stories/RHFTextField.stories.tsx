import type { Meta, StoryObj } from '@storybook/react';
import RHFTextField from '../components/form/RHFTextField';
import { FormProvider, useForm } from 'react-hook-form';

const meta = {
  title: 'Form/RHFTextField',
  component: RHFTextField,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RHFTextField>;

export default meta;
type Story = StoryObj<typeof meta>;

const RHFTextFieldWithForm = (args: {
  name: string;
  label?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) => {
  const methods = useForm({
    defaultValues: {
      email: '',
      firstName: '',
      phone: '',
    },
  });

  return (
    <FormProvider {...methods}>
      <RHFTextField {...args} />
    </FormProvider>
  );
};

export const Default: Story = {
  render: (args) => <RHFTextFieldWithForm {...args} />,
  args: {
    name: 'email',
    label: 'Email Address',
    type: 'email',
    placeholder: 'Enter your email',
  },
};

export const WithValidation: Story = {
  render: (args) => <RHFTextFieldWithForm {...args} />,
  args: {
    name: 'firstName',
    label: 'First Name',
    placeholder: 'Enter your first name',
    required: true,
  },
};

export const PhoneNumber: Story = {
  render: (args) => <RHFTextFieldWithForm {...args} />,
  args: {
    name: 'phone',
    label: 'Phone Number',
    type: 'tel',
    placeholder: '(555) 123-4567',
  },
};