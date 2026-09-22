import type { Meta, StoryObj } from "@storybook/react-vite";
import PageTitle from "./PageTitle";

/**
 * PageTitle is the title + optional subhead + optional back-button
 * primitive underneath both PageHeader (used automatically by
 * FormRoutePage) and PageShell's own title branch. It's also called
 * directly by pages outside the FormRoutePage flow: Resume, ResumeCode,
 * ResumeMethod, Receipt, AdvisorLogin.
 */
const meta = {
  title: "Layout/PageTitle",
  component: PageTitle,
  parameters: { layout: "padded" },
} satisfies Meta<typeof PageTitle>;

export default meta;

export const TitleOnly: StoryObj = {
  render: () => <PageTitle title="Receipt" />,
};

export const WithSubhead: StoryObj = {
  render: () => <PageTitle title="Contact" subhead="How can we reach you?" />,
};

export const WithBackButton: StoryObj = {
  render: () => <PageTitle title="Contact" subhead="How can we reach you?" onBack={() => {}} />,
};
