import type { Meta, StoryObj } from '@storybook/react';
import CollapsibleSection from '../components/common/CollapsibleSection';
import { Typography, Box } from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';

const meta = {
  title: 'Common/CollapsibleSection',
  component: CollapsibleSection,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CollapsibleSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Coverage Details',
    children: (
      <Box>
        <Typography paragraph>
          This section contains detailed information about your coverage options.
        </Typography>
        <Typography paragraph>
          You can expand or collapse this section to show or hide the content.
        </Typography>
      </Box>
    ),
  },
};

export const WithIcon: Story = {
  args: {
    title: 'Important Information',
    icon: <InfoIcon color="primary" />,
    children: (
      <Box>
        <Typography paragraph>
          Please review this important information carefully before proceeding.
        </Typography>
        <Typography paragraph>
          This content is critical for understanding your policy terms.
        </Typography>
      </Box>
    ),
  },
};

export const CollapsedByDefault: Story = {
  args: {
    title: 'Additional Options',
    defaultExpanded: false,
    children: (
      <Box>
        <Typography paragraph>
          These are optional features you can add to your policy.
        </Typography>
        <Typography paragraph>
          They are collapsed by default to keep the interface clean.
        </Typography>
      </Box>
    ),
  },
};

export const HighElevation: Story = {
  args: {
    title: 'Premium Features',
    elevation: 4,
    children: (
      <Box>
        <Typography paragraph>
          This section uses higher elevation to draw attention.
        </Typography>
        <Typography paragraph>
          The elevated card stands out more prominently.
        </Typography>
      </Box>
    ),
  },
};