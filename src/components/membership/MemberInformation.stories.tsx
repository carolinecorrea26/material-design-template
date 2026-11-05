import type { Meta, StoryObj } from "@storybook/react-vite";
import MemberInformation from "./MemberInformation";
import MembershipStoryForm from "../../../.storybook/membershipStoryForm";

const meta = {
  id: "pages-membership-member-information",
  title: "Components/Pages/Membership/Sections/Member information",
  component: MemberInformation,
  parameters: { standalone: true, catalog: { position: 2 }, layout: "fullscreen", docs: { description: { component: "Applicant name, email and phone. Title appears only when configured. These fields are revealed by the membership answer on the live page." } } },
} satisfies Meta<typeof MemberInformation>;
export default meta;
export const Default: StoryObj = {
  render: () => <MembershipStoryForm>
    {({ control, errors, allFields }) => <MemberInformation fields={allFields} control={control} errors={errors} />}
  </MembershipStoryForm>,
};
export const WithTitle: StoryObj = {
  render: () => <MembershipStoryForm capability="physicianMembership">
    {({ control, errors, allFields }) => <MemberInformation fields={allFields} control={control} errors={errors} />}
  </MembershipStoryForm>,
};
