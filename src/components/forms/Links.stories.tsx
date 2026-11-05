import type { Meta, StoryObj } from '@storybook/react-vite';
import { Link, Stack } from '@mui/material';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';

const meta = { title: 'Components/Actions/Links', component: Link, parameters: { standalone: true, layout: 'centered' } } satisfies Meta<typeof Link>;
export default meta;
// This documents the existing shared MUI Link styling; it is not a new control.
export const Standard: StoryObj = { render: () => <Stack spacing={2} alignItems="flex-start">
  <Link href="#details" onClick={event => event.preventDefault()}>View details</Link>
  <Link href="#document" onClick={event => event.preventDefault()} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>View document <OpenInNewRoundedIcon fontSize="inherit" /></Link>
</Stack> };
