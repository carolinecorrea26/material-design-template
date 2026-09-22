import type { Meta, StoryObj } from "@storybook/react-vite";
import RateFrequencyToggle from "./RateFrequencyToggle";

/**
 * RateFrequencyToggle is a styled MUI Switch with no props of its own beyond
 * Switch's — the monthly/annual meaning comes entirely from how a consumer
 * wires `checked`/`onChange`, which is why every story below builds that
 * wiring. The complete labeled Monthly/Annual pattern now lives in the
 * adjacent RateFrequencyControl story and is what real consumers use.
 */
const meta = {
  title: "Coverage & Commerce/RateFrequencyToggle",
  component: RateFrequencyToggle,
  parameters: { layout: "centered" },
} satisfies Meta<typeof RateFrequencyToggle>;

export default meta;

export const Unchecked: StoryObj = {
  render: () => <RateFrequencyToggle inputProps={{ "aria-label": "Rate frequency" }} />,
};

export const Checked: StoryObj = {
  render: () => <RateFrequencyToggle defaultChecked inputProps={{ "aria-label": "Rate frequency" }} />,
};
