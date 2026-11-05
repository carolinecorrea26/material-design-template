import { useState } from "react";
import ControlledFieldRenderer from "../forms/ControlledFieldRenderer";
import type { Meta } from "@storybook/react-vite";

import FieldGrid from "./FieldGrid";

const meta = {
  id: "layout-fieldgrid",
  title: "Components/Forms/Field groups/Layout",
  component: FieldGrid,
  parameters: { docs: { description: { component: "Fields stack by default. Address and name groups may share a row on larger screens and stack on mobile." } }, layout: "padded" },
} satisfies Meta<typeof FieldGrid>;

export default meta;

export const StackedFields = () => (
  <FieldGrid>
    <ExampleField field={{ id: "first-name", label: "First name", inputType: "text" }} />
    <ExampleField field={{ id: "last-name", label: "Last name", inputType: "text" }} />
  </FieldGrid>
);

export const NameFields = () => (
  <FieldGrid columns="equal">
    <ExampleField field={{ id: "first-name", label: "First name", inputType: "text" }} />
    <ExampleField field={{ id: "last-name", label: "Last name", inputType: "text" }} />
  </FieldGrid>
);

export const StreetAndApartment = () => (
  <FieldGrid columns="wide-narrow">
    <ExampleField field={{ id: "street-address", label: "Street address", inputType: "text" }} />
    <ExampleField field={{ id: "apt--suite", label: "Apt / Suite", inputType: "text" }} />
  </FieldGrid>
);

export const CityStateAndZip = () => (
  <FieldGrid columns="wide-two-narrow">
    <ExampleField field={{ id: "city", label: "City", inputType: "text" }} />
    <ExampleField field={{ id: "state", label: "State", inputType: "text" }} />
    <ExampleField field={{ id: "zip", label: "ZIP", inputType: "text" }} />
  </FieldGrid>
);

function ExampleField(props: Omit<React.ComponentProps<typeof ControlledFieldRenderer>, "value" | "onChange">) {
  const [value, setValue] = useState<string | boolean | string[]>("");
  return <ControlledFieldRenderer {...props} value={value} onChange={setValue} />;
}
