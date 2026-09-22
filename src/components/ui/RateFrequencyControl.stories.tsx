import { useState } from "react";
import type { Meta } from "@storybook/react-vite";
import RateFrequencyControl, { type RateFrequency } from "./RateFrequencyControl";

const meta = {
  title: "Coverage & Commerce/RateFrequencyControl",
  component: RateFrequencyControl,
  parameters: { layout: "padded" },
} satisfies Meta<typeof RateFrequencyControl>;

export default meta;

export const Interactive = () => {
  const [value, setValue] = useState<RateFrequency>("monthly");
  return <RateFrequencyControl value={value} onChange={setValue} />;
};

export const EndAligned = () => (
  <RateFrequencyControl
    value="annual"
    onChange={() => {}}
    justifyContent="end"
  />
);
