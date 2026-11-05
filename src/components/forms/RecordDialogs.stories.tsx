import type { Meta, StoryObj } from '@storybook/react-vite';
import DynamicList from './DynamicList';
import Example from '../../../.storybook/CompanyRecordExample';
import { openOverlay } from '../../../.storybook/previewInteractions';

const meta = { id: 'forms-dynamiclist', title: 'Components/Feedback and overlays/Dialogs and drawers/Application dialogs/Repeated records',
  component: DynamicList, parameters: { standalone: true, layout: 'padded' },
} satisfies Meta<typeof DynamicList>;
export default meta;
export const AddRecord: StoryObj = { render: () => <Example />, play: openOverlay('Add Company') };
export const EditRecord: StoryObj = { render: () => <Example populated />, play: openOverlay('Edit Example Carrier') };
export const RemoveRecord: StoryObj = { render: () => <Example populated />, play: openOverlay('Remove Example Carrier') };
