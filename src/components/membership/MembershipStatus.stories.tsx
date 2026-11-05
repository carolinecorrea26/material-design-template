import type { Meta, StoryObj } from "@storybook/react-vite";
import MembershipStatus from "./MembershipStatus";
import MembershipStoryForm from "../../../.storybook/membershipStoryForm";
import type { TemplateCapability } from "../../dev/storybook/globalTemplate";

const meta = {
  id: "pages-membership-membership-status",
  title: "Components/Pages/Membership/Sections/Membership status",
  component: MembershipStatus,
  parameters: { standalone: true, catalog: { position: 1 }, layout: "fullscreen", docs: { description: { component: "Membership question and its existing eligibility feedback. Uses the configured fields, including association selection and configurable membership choices." } } },
} satisfies Meta<typeof MembershipStatus>;
export default meta;

function StatusExample({ capability, membership }: { capability?: TemplateCapability; membership?: string }) {
  return <MembershipStoryForm capability={capability} initialValues={membership ? { membership } : {}}>
    {({ control, errors, allFields, values, client }) => <MembershipStatus
      membershipField={allFields.find(field => field.id === "membership")}
      client={client} control={control} errors={errors}
      showMembershipIneligibleAlert={values.membership === "no"}
    />}
  </MembershipStoryForm>;
}
export const Default: StoryObj = { render: () => <StatusExample /> };
export const NotAMember: StoryObj = { render: () => <StatusExample capability="standard" membership="no" /> };
export const AssociationSelection: StoryObj = { render: () => <StatusExample capability="associationSelection" /> };
export const Physician: StoryObj = { render: () => <StatusExample capability="physicianMembership" /> };
export const NewOrCurrentMember: StoryObj = { render: () => <StatusExample capability="employmentMembership" /> };
