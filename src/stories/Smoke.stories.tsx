import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button, Typography } from "@mui/material";

const meta: Meta = { title: "Smoke/Hello" };
export default meta;
type Story = StoryObj;

export const Hello: Story = {
  render: () => (
    <>
      <Typography variant="h4" gutterBottom>Storybook is alive</Typography>
      <Button variant="contained">A Material Button</Button>
    </>
  )
};
