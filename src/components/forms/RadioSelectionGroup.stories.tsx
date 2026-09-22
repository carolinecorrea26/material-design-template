import { useState } from "react";
import type { Meta } from "@storybook/react-vite";
import RadioSelectionGroup from "./RadioSelectionGroup";

const meta = {
  title: "Forms/RadioSelectionGroup",
  component: RadioSelectionGroup,
  parameters: { layout: "padded" },
} satisfies Meta<typeof RadioSelectionGroup>;

export default meta;

const options = [
  { value: "text", label: "Text message" },
  { value: "voice", label: "Voice call" },
];

export const Interactive = () => {
  const [value, setValue] = useState("text");
  return (
    <RadioSelectionGroup
      name="delivery-method"
      label="Delivery method"
      options={options}
      value={value}
      onChange={setValue}
      required
    />
  );
};

export const Disabled = () => (
  <RadioSelectionGroup
    name="beneficiary-type"
    label="Beneficiary type"
    options={[
      { value: "individual", label: "Individual" },
      { value: "trust", label: "Trust" },
    ]}
    value="individual"
    onChange={() => {}}
    disabled
  />
);
