import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import ControlledFieldRenderer from './ControlledFieldRenderer';

const meta = { id: "forms-controlled-field-adapter",
  title: "Components/Forms/Individual fields/Controlled values", component: ControlledFieldRenderer, parameters: { standalone: true, layout: 'padded', docs: { description: { component: 'Adapts externally owned values to FieldRenderer. This uses the same field controls and validation presentation as application forms; it is an integration example, not a distinct field treatment requiring approval.' } } } } satisfies Meta<typeof ControlledFieldRenderer>;
export default meta;
function Demo() {
  const [value, setValue] = useState<string | boolean | string[]>('');
  return <ControlledFieldRenderer field={{ id: 'controlled-example', label: 'First name', inputType: 'text' }} value={value} onChange={setValue} />;
}
export const Default: StoryObj = { render: () => <Demo /> };
