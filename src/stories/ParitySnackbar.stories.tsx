import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button, Stack } from "@mui/material";
import { ParitySnackbar } from "../components/parity/ParitySnackbar";
import type { AlertColor } from "@mui/material/Alert";

const meta: Meta<typeof ParitySnackbar> = {
  title: "Parity/ParitySnackbar",
  component: ParitySnackbar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: { severity: { control: "select", options: ["success","info","warning","error"] } }
};
export default meta;

type Story = StoryObj<typeof ParitySnackbar>;

export const Playground: Story = {
  render: () => {
    const [open, setOpen] = React.useState(false);
    const [severity, setSeverity] = React.useState<AlertColor>("success");
    return (
      <Stack spacing={2}>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => { setSeverity("success"); setOpen(true); }}>Success</Button>
          <Button variant="outlined" onClick={() => { setSeverity("info"); setOpen(true); }}>Info</Button>
          <Button variant="outlined" onClick={() => { setSeverity("warning"); setOpen(true); }}>Warning</Button>
          <Button variant="outlined" onClick={() => { setSeverity("error"); setOpen(true); }}>Error</Button>
        </Stack>
        <ParitySnackbar open={open} onClose={() => setOpen(false)} message="Saved!" severity={severity} />
      </Stack>
    );
  }
};

export const Inline: Story = {
  args: {
    message: 'This is an inline alert that stays visible.',
    severity: 'info',
    inline: true,
    open: true,
    onClose: () => {},
  },
};
