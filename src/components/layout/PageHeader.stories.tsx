import type { Meta, StoryObj } from "@storybook/react-vite";
import PageHeader from "./PageHeader";
import FormHelpChips from "../content/HelpChips";

/**
 * PageHeader composes PageTitle with optional help content. It's rendered
 * automatically by FormRoutePage for every application page — no page file
 * calls it directly.
 */
const meta = {
  title: "Layout/PageHeader",
  component: PageHeader,
  parameters: { layout: "padded" },
} satisfies Meta<typeof PageHeader>;

export default meta;

export const Default: StoryObj = {
  render: () => <PageHeader title="Contact" subhead="How can we reach you?" />,
};

export const WithBackButton: StoryObj = {
  render: () => <PageHeader title="Contact" onBack={() => {}} />,
};

export const WithHelpChips: StoryObj = {
  render: () => (
    <PageHeader
      title="Coverage"
      subhead="Choose the coverage you'd like to apply for."
      help={
        <FormHelpChips
          items={[
            { id: "how-much", label: "How much does it cost?" },
            { id: "quick-decision", label: "About QuickDecision" },
          ]}
          onSelect={() => {}}
        />
      }
    />
  ),
};

export const TitleOnly: StoryObj = {
  render: () => <PageHeader title="Review" />,
};
