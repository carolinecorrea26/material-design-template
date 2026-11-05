import type { Meta, StoryObj } from "@storybook/react-vite";
import EligibilitySections from "./EligibilitySections";
import EligibilityStoryForm from "../../../.storybook/eligibilityStoryForm";

const meta = {
  id: "pages-eligibility-your-information",
  title: "Components/Pages/Eligibility/Sections/Your information",
  component: EligibilitySections,
  parameters: { standalone: true, catalog: { position: 1 }, layout: "fullscreen", docs: { description: { component: "The Eligibility page's ZIP/postal code, State/Province and date-of-birth section. Uses the same EligibilityFields group and reserved ZIP-to-state/error feedback as the Home quote card and quote tool." } } },
} satisfies Meta<typeof EligibilitySections>;
export default meta;

export const Default: StoryObj = {
  render: () => <EligibilityStoryForm>
    {props => <EligibilitySections {...props} pageSections={props.pageSections.filter(section => section.id === "selfEligibility")} />}
  </EligibilityStoryForm>,
};
export const ZipDerivedState: StoryObj = {
  parameters: { docs: { description: { story: "ZIP derives State initially. Change State manually to retain your choice; changing ZIP again derives a fresh State, matching the quote input group." } } },
  render: () => <EligibilityStoryForm initialValues={{ "zip-postal-code": "10001", "birth-date": "1990-05-14" }}>
    {props => <EligibilitySections {...props} pageSections={props.pageSections.filter(section => section.id === "selfEligibility")} />}
  </EligibilityStoryForm>,
};

export const AllowedResidencyOptions: StoryObj = {
  render: () => <EligibilityStoryForm capability='occupationAndChildNotice'>{props => <EligibilitySections {...props} pageSections={props.pageSections.filter(section => section.id === 'selfEligibility')} />}</EligibilityStoryForm>,
};
