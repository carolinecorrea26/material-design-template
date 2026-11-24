import type { Meta, StoryObj } from "@storybook/react-vite";
import MembershipStatus from "./MembershipStatus";
import MembershipStoryForm from "../../../.storybook/membershipStoryForm";
import type { MembershipExampleConfiguration } from "../../dev/storybook/globalTemplate";
import { isMembershipAttestationStop } from '../../config/clientFields/membershipFollowUpVisibility';

const meta = {
  id: "pages-membership-membership-status",
  title: "Components/Pages/Membership/Sections/Membership status",
  component: MembershipStatus,
  parameters: { standalone: true, catalog: { position: 1 }, layout: "fullscreen", docs: { description: { component: "Membership question and its existing eligibility feedback. Uses the configured fields, including association selection and configurable membership choices." } } },
} satisfies Meta<typeof MembershipStatus>;
export default meta;

function StatusExample({ configuration, membership }: { configuration?: MembershipExampleConfiguration; membership?: string }) {
  return <MembershipStoryForm membership={configuration} initialValues={membership ? { membership } : {}}>
    {({ control, errors, allFields, values, client }) => <MembershipStatus
      membershipField={allFields.find(field => field.id === "membership")}
      client={client} control={control} errors={errors}
      showMembershipIneligibleAlert={isMembershipAttestationStop(allFields.find(field => field.id === 'membership'), values.membership)}
    />}
  </MembershipStoryForm>;
}
export const Default: StoryObj = { render: () => <StatusExample /> };
export const NotAMember: StoryObj = { render: () => <StatusExample membership="no" /> };
export const AssociationSelection: StoryObj = { render: () => <StatusExample configuration={{ configuration: 'association' }} /> };
export const NewOrCurrentMember: StoryObj = { render: () => <StatusExample configuration={{ configuration: 'new-or-current' }} /> };
export const CategoryMembership: StoryObj = { render: () => <StatusExample configuration={{ configuration: 'category', options: [
  { value: 'professional', label: 'Professional member', outcome: 'member' },
  { value: 'joining', label: 'Joining the association', outcome: 'new-member' },
] }} /> };
