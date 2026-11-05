import type { Meta, StoryObj } from "@storybook/react-vite";
import EligibilitySections from "./EligibilitySections";
import EligibilityStoryForm from "../../../.storybook/eligibilityStoryForm";

const meta = {
  id: "pages-eligibility-covered-applicants",
  title: "Components/Pages/Eligibility/Sections/Covered applicants",
  component: EligibilitySections,
  parameters: { standalone: true, catalog: { position: 2 }, layout: "fullscreen", docs: { description: { component: "Existing dependent-coverage choices. The combined example reveals the configured spouse and child sections as selections change." } } },
} satisfies Meta<typeof EligibilitySections>;
export default meta;

export const Default: StoryObj = {
  render: () => <EligibilityStoryForm initialValues={{ membership: "yes", dependents: [] }}>
    {props => <EligibilitySections {...props} pageSections={props.pageSections.filter(section => section.id === "dependentSelection")} />}
  </EligibilityStoryForm>,
};
export const WithDependentDetails: StoryObj = {
  render: () => <EligibilityStoryForm initialValues={{ membership: "yes", dependents: [] }}>
    {props => <EligibilitySections {...props} pageSections={props.pageSections.filter(section => (section.id === "dependentSelection" || section.id === "spouseSection" && (Array.isArray(props.watchedValues.dependents) ? props.watchedValues.dependents : []).includes("spouse") || section.id === "childSection" && (Array.isArray(props.watchedValues.dependents) ? props.watchedValues.dependents : []).includes("child")))} />}
  </EligibilityStoryForm>,
};
