import type { Meta, StoryObj } from "@storybook/react-vite";
import AdditionalMembershipInformation from "./AdditionalMembershipInformation";
import MembershipStoryForm from "../../../.storybook/membershipStoryForm";

const meta = {
  id: "pages-membership-additional-membership-information",
  title: "Components/Pages/Membership/Sections/Additional membership information",
  component: AdditionalMembershipInformation,
  parameters: { standalone: true, catalog: { position: 3 }, layout: "fullscreen", docs: { description: { component: "Configurable template membership questions grouped under the existing section divider. The example uses the compiled effective field placement. Variations cover member identification, professional education and nursing qualifications using the shared field renderer." } } },
} satisfies Meta<typeof AdditionalMembershipInformation>;
export default meta;

export const MemberId: StoryObj = {
  render: () => <MembershipStoryForm initialValues={{ membership: "yes" }}>
    {({ control, errors, componentFields, values, client, setValue }) => <AdditionalMembershipInformation
      fields={componentFields('AdditionalMembershipInformation')}
      client={client} control={control} errors={errors} setValue={setValue} qualificationValue={values["waepa-attestation"]}
    />}
  </MembershipStoryForm>,
};

export const ProfessionalEducation: StoryObj = {
  render: () => <MembershipStoryForm capability="professionalEducation" initialValues={{ membership: "yes" }}>
    {({ control, errors, componentFields, values, client, setValue }) => <AdditionalMembershipInformation
      fields={componentFields('AdditionalMembershipInformation')}
      client={client} control={control} errors={errors} setValue={setValue} qualificationValue={values["waepa-attestation"]}
    />}
  </MembershipStoryForm>,
};
export const NursingQualification: StoryObj = {
  render: () => <MembershipStoryForm capability="nursingMembership" initialValues={{ membership: "yes" }}>
    {({ control, errors, componentFields, values, client, setValue }) => <AdditionalMembershipInformation
      fields={componentFields('AdditionalMembershipInformation')}
      client={client} control={control} errors={errors} setValue={setValue} qualificationValue={values["waepa-attestation"]}
    />}
  </MembershipStoryForm>,
};
