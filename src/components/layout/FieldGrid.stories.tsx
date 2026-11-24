import { resolveMappedFields } from '../../domain/requirementFields';
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
    <ExampleField id="first-name" />
    <ExampleField id="last-name" />
  </FieldGrid>
);

export const EqualColumns = () => (
  <FieldGrid columns="equal">
    <ExampleField id="first-name" />
    <ExampleField id="last-name" />
  </FieldGrid>
);

export const StreetAndApartment = () => (
  <FieldGrid columns="wide-narrow">
    <ExampleField id="street-address" />
    <ExampleField id="apt-suite" />
  </FieldGrid>
);

export const CityStateAndZip = () => (
  <FieldGrid columns="wide-two-narrow">
    <ExampleField id="city" />
    <ExampleField id="state" />
    <ExampleField id="zip-code" />
  </FieldGrid>
);

const fields = [...resolveMappedFields({ component: 'membership' }, { includeAll: true }), ...resolveMappedFields({ page: 'contact' }, { includeAll: true })];
function ExampleField({ id }: { id: string }) {
  const field = fields.find(field => field.id === id);
  if (!field) throw new Error(`Missing fresh-start layout field: ${id}`);
  const [value, setValue] = useState<string | boolean | string[]>("");
  return <ControlledFieldRenderer field={field} value={value} onChange={setValue} />;
}
