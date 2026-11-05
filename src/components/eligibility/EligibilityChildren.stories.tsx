import type { Meta, StoryObj } from "@storybook/react-vite";
import EligibilitySections from "./EligibilitySections";
import EligibilityStoryForm from "../../../.storybook/eligibilityStoryForm";

const meta = {
  id: "pages-eligibility-children-information",
  title: "Components/Pages/Eligibility/Sections/Children information",
  component: EligibilitySections,
  parameters: { standalone: true, catalog: { position: 4 }, layout: "fullscreen", docs: { description: { component: "Existing child eligibility note and repeatable child records. Add, edit and remove use the shared DynamicList and its real dialogs and validation." } } },
} satisfies Meta<typeof EligibilitySections>;
export default meta;

export const Empty: StoryObj = {
  render: () => <EligibilityStoryForm initialValues={{ dependents: ["child"], children: [] }}>
    {props => <EligibilitySections {...props} pageSections={props.pageSections.filter(section => section.id === "childSection")} />}
  </EligibilityStoryForm>,
};
export const WithChild: StoryObj = {
  render: () => <EligibilityStoryForm initialValues={{ dependents: ["child"], children: [{ firstName: "Avery", lastName: "Morgan", birthDate: "2015-05-14", gender: "female" }] }}>
    {props => <EligibilitySections {...props} pageSections={props.pageSections.filter(section => section.id === "childSection")} />}
  </EligibilityStoryForm>,
};

export const NoticeOnly: StoryObj = {
  render: () => <EligibilityStoryForm capability='occupationAndChildNotice' initialValues={{ dependents: ['child'] }}>{props => <EligibilitySections {...props} pageSections={props.pageSections.filter(section => section.id === 'childSection')} />}</EligibilityStoryForm>,
};
export const ChildStudentAndMaritalStatus: StoryObj = {
  render: () => <EligibilityStoryForm capability='multipleTerms' initialValues={{ dependents: ['child'] }}>{props => <EligibilitySections {...props} pageSections={props.pageSections.filter(section => section.id === 'childSection')} />}</EligibilityStoryForm>,
};
export const ChildServiceEligibility: StoryObj = {
  render: () => <EligibilityStoryForm capability='optionalBeneficiaries' initialValues={{ dependents: ['child'] }}>{props => <EligibilitySections {...props} pageSections={props.pageSections.filter(section => section.id === 'childSection')} />}</EligibilityStoryForm>,
};
