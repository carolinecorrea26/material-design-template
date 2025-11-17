import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ParityDialog } from "../components/parity/ParityDialog";
import { useState } from 'react';
import { Button, Typography, Box } from '@mui/material';

const meta: Meta<typeof ParityDialog> = {
  title: "Parity/ParityDialog",
  component: ParityDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ParityDialog>;

const ParityDialogWithState = (args: {
  title?: string;
  children?: React.ReactNode;
  primaryAction?: { label: string; onClick: () => void; disabled?: boolean };
  secondaryAction?: { label: string; onClick: () => void; disabled?: boolean };
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Open Dialog
      </Button>
      <ParityDialog
        {...args}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
};

export const Basic: Story = {
  render: (args) => <ParityDialogWithState {...args} />,
  args: {
    title: "Sample Dialog",
    children: "This is a sample dialog content",
    primaryAction: { label: "OK", onClick: () => {} },
    secondaryAction: { label: "Cancel", onClick: () => {} }
  }
};

export const WithScroll: Story = {
  render: (args) => <ParityDialogWithState {...args} />,
  args: {
    title: "Dialog with Long Content",
    children: Array(20).fill("This is a long content that will cause scrolling. ").join("\n"),
    primaryAction: { label: "Close", onClick: () => {} }
  }
};

export const WithoutTitle: Story = {
  render: (args) => <ParityDialogWithState {...args} />,
  args: {
    children: (
      <Box>
        <Typography paragraph>
          This dialog doesn't have a title but still provides important information.
        </Typography>
        <Typography>
          You can still close it using the X button in the corner.
        </Typography>
      </Box>
    ),
    primaryAction: {
      label: 'OK',
      onClick: () => console.log('OK clicked'),
    },
  },
};
