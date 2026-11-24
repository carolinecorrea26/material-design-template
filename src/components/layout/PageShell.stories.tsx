// Preview notes are documentation only; the canvas contains application UI.
import { useState } from "react";
import ControlledFieldRenderer from "../forms/ControlledFieldRenderer";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@mui/material";
import PageShell from "./PageShell";
import PageHelpChips from '../content/PageHelpChips';
import { resolveMappedFields } from '../../domain/requirementFields';
import { requirementValidationMessage } from '../../domain/requirementValidations';
const fields = [...resolveMappedFields({ component: 'membership' }), ...resolveMappedFields({ component: 'quote-calculator' })];

/**
 * PageShell is the generic centered page wrapper (title, error banner, help
 * content, max-width, action row) underneath the shared FormRoutePage
 * template and StandaloneFormPage. The header and page feedback delegate
 * to PageHeader and PageAlert.
 */
const meta = {
  id: "layout-pageshell",
  title: "Components/Layout/Containers/Page container",
  component: PageShell,
  parameters: { docs: { description: { component: "Provides a shared page container and layout." } }, layout: "fullscreen" },
} satisfies Meta<typeof PageShell>;

export default meta;

export const Default: StoryObj = {
  render: () => (
    <PageShell title="Profile" subhead="Tell us a bit about yourself.">
      <ExampleField fieldId="first-name" />
      <ExampleField fieldId="last-name" />
    </PageShell>
  ),
};

export const WithBackButton: StoryObj = {
  render: () => (
    <PageShell title="Profile" onBack={() => {}}>
      <ExampleField fieldId="first-name" />
    </PageShell>
  ),
};

export const WithError: StoryObj = {
  render: () => (
    <PageShell title="Profile" error="Please complete the required fields before continuing.">
      <ExampleField fieldId="first-name" error={requirementValidationMessage("required-fields", { label: "First name" })} />
    </PageShell>
  ),
};

export const WithHelpAndActions: StoryObj = {
  render: () => (
    <PageShell
      title="Coverage"
      subhead="Choose the coverage you'd like to apply for."
      help={<PageHelpChips items={[{ id: 'coverage-options', label: 'Coverage options' }]} onSelect={() => {}} />}
      actions={<Button variant="contained">Continue</Button>}
    >
      <ExampleField fieldId="average-monthly-income" />
    </PageShell>
  ),
};

export const NoTitle: StoryObj = {
  name: "noTitle (title/back/error/help suppressed)",
  render: () => (
    <PageShell title="This title is not rendered" noTitle>
      <ExampleField fieldId="first-name" />
    </PageShell>
  ),
};

export const NarrowMaxWidth: StoryObj = {
  name: "maxWidth — narrow (resume-style pages)",
  render: () => (
    <PageShell title="Verify your email" maxWidth={480}>
      <ExampleField fieldId="email" />
    </PageShell>
  ),
};

export const FullWidth: StoryObj = {
  name: 'maxWidth="100%" (vertical-stepper pages)',
  render: () => (
    <PageShell title="Coverage" maxWidth="100%">
      <ExampleField fieldId="average-monthly-income" />
    </PageShell>
  ),
};

function ExampleField({ fieldId, ...props }: Omit<React.ComponentProps<typeof ControlledFieldRenderer>, "field" | "value" | "onChange"> & { fieldId: string }) {
  const [value, setValue] = useState<string | boolean | string[]>("");
  return <ControlledFieldRenderer field={fields.find(field => field.id === fieldId)!} {...props} value={value} onChange={setValue} />;
}
