// Preview notes are documentation only; the canvas contains application UI.
import { useState } from "react";
import ControlledFieldRenderer from "../forms/ControlledFieldRenderer";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@mui/material";
import PageShell from "./PageShell";
import HelpChips from '../content/HelpChips';

/**
 * PageShell is the generic centered page wrapper (title, error banner, help
 * content, max-width, action row) underneath the shared FormRoutePage
 * template. In practice it's only ever used through FormRoutePage — no page
 * file calls it directly — but it's documented standalone here since it's
 * the real reusable primitive.
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
      <ExampleField field={{ id: "first-name", label: "First name", inputType: "text" }} />
      <ExampleField field={{ id: "last-name", label: "Last name", inputType: "text" }} />
    </PageShell>
  ),
};

export const WithBackButton: StoryObj = {
  render: () => (
    <PageShell title="Profile" onBack={() => {}}>
      <ExampleField field={{ id: "first-name", label: "First name", inputType: "text" }} />
    </PageShell>
  ),
};

export const WithError: StoryObj = {
  render: () => (
    <PageShell title="Profile" error="Please complete the required fields before continuing.">
      <ExampleField field={{ id: "first-name", label: "First name", inputType: "text", required: true }} error="First name is required." />
    </PageShell>
  ),
};

export const WithHelpAndActions: StoryObj = {
  render: () => (
    <PageShell
      title="Coverage"
      subhead="Choose the coverage you'd like to apply for."
      help={<HelpChips items={[{ id: 'coverage-options', label: 'Coverage options' }]} onSelect={() => {}} />}
      actions={<Button variant="contained">Continue</Button>}
    >
      <ExampleField field={{ id: 'coverage-amount', label: 'Coverage amount', inputType: 'number' }} />
    </PageShell>
  ),
};

export const NoTitle: StoryObj = {
  name: "noTitle (title/back/error/help suppressed)",
  render: () => (
    <PageShell title="This title is not rendered" noTitle>
      <ExampleField field={{ id: 'first-name', label: 'First name', inputType: 'text' }} />
    </PageShell>
  ),
};

export const NarrowMaxWidth: StoryObj = {
  name: "maxWidth — narrow (resume-style pages)",
  render: () => (
    <PageShell title="Verify your email" maxWidth={480}>
      <ExampleField field={{ id: "email", label: "Email", inputType: "text" }} />
    </PageShell>
  ),
};

export const FullWidth: StoryObj = {
  name: 'maxWidth="100%" (vertical-stepper pages)',
  render: () => (
    <PageShell title="Coverage" maxWidth="100%">
      <ExampleField field={{ id: 'coverage-amount', label: 'Coverage amount', inputType: 'number' }} />
    </PageShell>
  ),
};

function ExampleField(props: Omit<React.ComponentProps<typeof ControlledFieldRenderer>, "value" | "onChange">) {
  const [value, setValue] = useState<string | boolean | string[]>("");
  return <ControlledFieldRenderer {...props} value={value} onChange={setValue} />;
}
