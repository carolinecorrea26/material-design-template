import type { Meta, StoryObj } from "@storybook/react-vite";
import EligibilitySections from "./EligibilitySections";
import EligibilityStoryForm from "../../../.storybook/eligibilityStoryForm";

const meta = {
  id: "pages-eligibility-children-information",
  title: "Components/Pages/Eligibility/Sections/Children information",
  component: EligibilitySections,
  parameters: { standalone: true, catalog: { position: 3 }, layout: "fullscreen", docs: { description: { component: "Existing child eligibility note and repeatable child records. Add, edit and remove use the shared DynamicList and its real dialogs and validation." } } },
} satisfies Meta<typeof EligibilitySections>;
export default meta;

export const Empty: StoryObj = {
  render: () => <EligibilityStoryForm initialValues={{ dependents: ["child"], children: [] }}>
    {props => <EligibilitySections {...props} pageSections={props.pageSections.filter(section => section.id === "childSection")} />}
  </EligibilityStoryForm>,
};
export const WithChild: StoryObj = {
  render: () => <EligibilityStoryForm initialValues={{ dependents: ["child"], children: [{ "child-first-name": "Avery", "child-last-name": "Morgan", "child-birth-date": "2015-05-14", "child-gender": "female", "child-full-time-student": "yes" }] }}>
    {props => <EligibilitySections {...props} pageSections={props.pageSections.filter(section => section.id === "childSection")} />}
  </EligibilityStoryForm>,
};

export const NoticeOnly: StoryObj = {
  render: () => <EligibilityStoryForm eligibility={{ childMode: 'notice-only' }} initialValues={{ dependents: ['child'] }}>{props => <EligibilitySections {...props} pageSections={props.pageSections.filter(section => section.id === 'childSection')} />}</EligibilityStoryForm>,
};
export const WithoutStudentQuestion: StoryObj = {
  render: () => <EligibilityStoryForm eligibility={{ includeStudent: false }} initialValues={{ dependents: ['child'] }}>{props => <EligibilitySections {...props} pageSections={props.pageSections.filter(section => section.id === 'childSection')} />}</EligibilityStoryForm>,
};
export const AdditionalChildQuestions: StoryObj = {
  render: () => <EligibilityStoryForm eligibility={{ includeStudent: true, includeArmedForces: true }} initialValues={{ dependents: ['child'] }}>{props => <EligibilitySections {...props} pageSections={props.pageSections.filter(section => section.id === 'childSection')} />}</EligibilityStoryForm>,
};
