import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import LogoUploadField from './LogoUploadField';

export default {
  title: 'Reference/Admin/Site Builder/Logo upload',
  component: LogoUploadField,
  parameters: { standalone: true },
} satisfies Meta<typeof LogoUploadField>;

export const Association: StoryObj<typeof LogoUploadField> = {
  render: function AssociationLogo() {
    const [logo, setLogo] = useState('');
    return <LogoUploadField label="Association logo" value={logo} onChange={setLogo} required />;
  },
};
