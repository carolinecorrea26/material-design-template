import { useState } from "react";
import type { Meta } from "@storybook/react-vite";
import RateFrequencyControl, { type RateFrequency } from "./RateFrequencyControl";

const meta = {
  id: "coverage-commerce-ratefrequencycontrol",
  title: "Components/Coverage and pricing/Rate frequency/Selector",
  component: RateFrequencyControl,
  parameters: { standalone: true, docs: { description: { component: "Labeled monthly/annual control shared by quote and cart cost summaries." } }, layout: "padded" },
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
