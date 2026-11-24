import { useState } from 'react';
import { Button } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react-vite';
import PageHelpDrawer from './PageHelpDrawer';
import { pageHelpExampleItems } from '../../../.storybook/pageHelpExample';
const meta = {
  title: 'Components/Feedback and overlays/Dialogs and drawers/Page help drawer', component: PageHelpDrawer,
  parameters: { standalone: true, layout: 'fullscreen', docs: { description: { component: 'Shared controlled help drawer. Title and content are supplied; AppDrawer owns responsive layout and closing.' } } },
} satisfies Meta<typeof PageHelpDrawer>;
export default meta;
function Example() {
  const [open, setOpen] = useState(true);
  return <><Button onClick={() => setOpen(true)}>{pageHelpExampleItems[0].label}</Button><PageHelpDrawer item={open ? pageHelpExampleItems[0] : null} onClose={() => setOpen(false)} /></>;
}
export const Default: StoryObj = { render: () => <Example /> };
