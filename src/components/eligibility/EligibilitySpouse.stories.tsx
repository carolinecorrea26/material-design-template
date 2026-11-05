import type { Meta, StoryObj } from "@storybook/react-vite";
import EligibilitySections from "./EligibilitySections";
import EligibilityStoryForm from "../../../.storybook/eligibilityStoryForm";

const meta = {
  id: "pages-eligibility-spouse-information",
  title: "Components/Pages/Eligibility/Sections/Spouse information",
  component: EligibilitySections,
  parameters: { standalone: true, catalog: { position: 3 }, layout: "fullscreen", docs: { description: { component: "Existing spouse section divider, configured membership question, first/last name and date of birth. Fields appear only when spouse coverage is selected." } } },
} satisfies Meta<typeof EligibilitySections>;
export default meta;

export const Default: StoryObj = {
  render: () => <EligibilityStoryForm initialValues={{ dependents: ["spouse"] }}>
    {props => <EligibilitySections {...props} pageSections={props.pageSections.filter(section => section.id === "spouseSection")} />}
  </EligibilityStoryForm>,
};
export const Completed: StoryObj = {
  render: () => <EligibilityStoryForm initialValues={{ dependents: ["spouse"], "spouse-membership": "no", "spouse-first-name": "Jordan", "spouse-last-name": "Morgan", "spouse-birth-date": "1992-08-26" }}>
    {props => <EligibilitySections {...props} pageSections={props.pageSections.filter(section => section.id === "spouseSection")} />}
  </EligibilityStoryForm>,
};

export const SeparateMembershipRestriction: StoryObj = {
  render: () => <EligibilityStoryForm capability='employmentMembership' initialValues={{ dependents: ['spouse'], 'spouse-membership': 'yes' }}>{props => <EligibilitySections {...props} pageSections={props.pageSections.filter(section => section.id === 'spouseSection')} />}</EligibilityStoryForm>,
};
