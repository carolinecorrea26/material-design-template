import { resolveMappedFields } from '../../domain/requirementFields';
import { useState } from "react";
import type { Meta } from "@storybook/react-vite";
import RadioSelectionGroup from "./RadioSelectionGroup";

const meta = {
  id: "forms-radioselectiongroup",
  title: "Components/Forms/Selection rows/Radio rows",
  component: RadioSelectionGroup,
  parameters: { standalone: true, docs: { description: { component: "Accessible radio rows using the app's canonical SelectionGroup surface." } }, layout: "padded" },
} satisfies Meta<typeof RadioSelectionGroup>;

export default meta;

const field = resolveMappedFields({ page: 'beneficiary' }, { person: 'beneficiary' }).find(field => field.id === 'beneficiary-type')!;
const options = field.options!;

export const Interactive = () => {
  const [value, setValue] = useState("individual");
  return (
    <RadioSelectionGroup
      name={field.id}
      label={field.label}
      options={options}
      value={value}
      onChange={setValue}
      required
    />
  );
};

export const Disabled = () => (
  <RadioSelectionGroup
    name={field.id}
    label={field.label}
    options={options}
    value="individual"
    onChange={() => {}}
    disabled
  />
);
