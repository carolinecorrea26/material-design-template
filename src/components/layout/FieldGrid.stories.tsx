import type { Meta } from "@storybook/react-vite";
import { TextField } from "@mui/material";
import FieldGrid from "./FieldGrid";

const meta = {
  title: "Layout/FieldGrid",
  component: FieldGrid,
  parameters: { layout: "padded" },
} satisfies Meta<typeof FieldGrid>;

export default meta;

export const EqualColumns = () => (
  <FieldGrid>
    <TextField label="First name" />
    <TextField label="Last name" />
  </FieldGrid>
);

export const WideAndNarrow = () => (
  <FieldGrid columns="wide-narrow">
    <TextField label="Street address" />
    <TextField label="Apt / Suite" />
  </FieldGrid>
);

export const WideAndTwoNarrow = () => (
  <FieldGrid columns="wide-two-narrow">
    <TextField label="City" />
    <TextField label="State" />
    <TextField label="ZIP" />
  </FieldGrid>
);
