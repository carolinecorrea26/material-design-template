import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack, Typography } from "@mui/material";
import FormRoutePage, { type FormRouteRenderProps } from "./RoutePage";
import {
  ApplicationFormContext,
  type ApplicationFormValues,
} from "./ApplicationFormContext";
import FieldRenderer from "../components/forms/FieldRenderer";

/**
 * FormRoutePage is the application's de-facto page template. Seventeen
 * routed pages use it to compose PageShell, FormShell, PageHeader, PageNav,
 * ProgressStep, react-hook-form state, validation feedback, transitions,
 * autosave persistence, and back/next routing. The individual pieces have
 * component stories; this page documents the real composition that binds
 * them together.
 */
const meta = {
  title: "Application Patterns/Application Page Template",
  component: FormRoutePage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof FormRoutePage>;

export default meta;

type Story = StoryObj;

function withValues(values: ApplicationFormValues, children: ReactNode) {
  return (
    <ApplicationFormContext.Provider
      value={{ values, setPageValues: () => {}, resetValues: () => {} }}
    >
      {children}
    </ApplicationFormContext.Provider>
  );
}

function DemoFields({
  control,
  errors,
  allFields,
}: FormRouteRenderProps) {
  return (
    <Stack spacing={2.5}>
      {allFields.slice(0, 3).map((field) => (
        <FieldRenderer
          key={field.id}
          field={field}
          control={control}
          errors={errors}
        />
      ))}
    </Stack>
  );
}

export const StandardFormPage: Story = {
  name: "Standard form page",
  render: () =>
    withValues(
      {},
      <FormRoutePage pageId="membership">
        {(props) => <DemoFields {...props} />}
      </FormRoutePage>,
    ),
  parameters: {
    docs: {
      description: {
        story:
          "The real first application step with live client field configuration. It demonstrates the complete template: responsive progress navigation and breadcrumbs, page heading, react-hook-form fields, validation summary, and the shared Continue action. Submit it empty to see field-level and page-level validation together.",
      },
    },
  },
};

export const InitialTransition: Story = {
  name: "Initial transition state",
  render: () =>
    withValues(
      {},
      <FormRoutePage
        pageId="membership"
        initialTransitionMessage="Loading your membership application..."
      >
        {(props) => <DemoFields {...props} />}
      </FormRoutePage>,
    ),
  parameters: {
    docs: {
      description: {
        story:
          "FormRoutePage temporarily replaces the heading and form with PageTransitionSkeleton, then restores the standard template. The transition is intentionally live rather than a static imitation.",
      },
    },
  },
};

export const StandaloneVariant: Story = {
  name: "Standalone variant — no progress or actions",
  render: () =>
    withValues(
      {},
      <FormRoutePage
        pageId="advisor-login"
        title="Standalone form"
        subhead="The same template can omit flow navigation and provide a custom submit action."
        formMaxWidth={500}
        hideActions
      >
        <Typography variant="body2" color="text.secondary">
          Advisor and confirmation routes use these template options when the
          main application stepper and shared Continue action do not apply.
        </Typography>
      </FormRoutePage>,
    ),
};
