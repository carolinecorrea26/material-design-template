import type { Meta, StoryObj } from "@storybook/react-vite";
import AdditionalMembershipInformation from "./AdditionalMembershipInformation";
import MembershipStoryForm from "../../../.storybook/membershipStoryForm";
import type { TemplateCapability } from "../../dev/storybook/globalTemplate";

const meta = {
  id: "pages-membership-additional-membership-information",
  title: "Components/Pages/Membership/Sections/Additional membership information",
  component: AdditionalMembershipInformation,
  parameters: { standalone: true, catalog: { position: 3 }, layout: "fullscreen", docs: { description: { component: "Configurable template membership questions grouped under the existing section divider. Examples supply explicit authored field sets; they are section examples, not separate implementations." } } },
} satisfies Meta<typeof AdditionalMembershipInformation>;
export default meta;

/** Explicit example field sets; application branch rules are covered by Whole page. */
function exampleFields(capability: TemplateCapability, qualification: unknown) {
  const groups: Partial<Record<TemplateCapability, string[]>> = {
    multipleTerms: ['member-id'], optionalBeneficiaries: ['abe-member-id'],
    professionalEducation: ['avma-vet-college', 'avma-graduation-year', 'avma-occupation'],
    physicianMembership: ['ama-physician-type', 'ama-physician-title', 'ama-physician-first-name', 'ama-physician-last-name', 'ama-physician-birth-date', 'ama-physician-email'],
    nursingMembership: ['nurse-type'], occupationAndChildNotice: ['csea-occupation-group'],
    membershipStatus: ['membership-status', 'membership-referral-source'],
  };
  if (capability !== 'employmentMembership') return groups[capability] ?? [];
  const followups = qualification === 'federal-active' ? ['waepa-employer', 'waepa-start-date'] : qualification === 'former-federal' ? ['waepa-retired-employer', 'waepa-retirement-date'] : typeof qualification === 'string' && qualification.endsWith('-associate') ? ['waepa-member-first-name', 'waepa-member-middle-initial', 'waepa-member-last-name', 'waepa-member-id'] : [];
  return ['waepa-declaration', 'waepa-attestation', ...followups, 'active-military', 'membership-referral-source'];
}

function AdditionalExample({ capability, initialValues }: { capability: TemplateCapability; initialValues: Record<string, string> }) {
  return <MembershipStoryForm capability={capability} initialValues={initialValues}>
    {({ control, errors, allFields, values, client, setValue }) => <AdditionalMembershipInformation
      fields={allFields.filter(field => exampleFields(capability, values["waepa-attestation"]).includes(field.id))}
      client={client} control={control} errors={errors} setValue={setValue} qualificationValue={values["waepa-attestation"]}
    />}
  </MembershipStoryForm>;
}
export const MemberId: StoryObj = { render: () => <AdditionalExample capability="multipleTerms" initialValues={{ membership: "yes" }} /> };
export const ProfessionalInformation: StoryObj = { render: () => <AdditionalExample capability="professionalEducation" initialValues={{ membership: "yes" }} /> };
export const PhysicianSpouse: StoryObj = { render: () => <AdditionalExample capability="physicianMembership" initialValues={{ membership: "spouse" }} /> };
export const NewMember: StoryObj = { render: () => <AdditionalExample capability="employmentMembership" initialValues={{ membership: "new" }} /> };
export const ActiveFederalEmployee: StoryObj = { render: () => <AdditionalExample capability="employmentMembership" initialValues={{ membership: "new", "waepa-attestation": "federal-active" }} /> };
export const AssociateMember: StoryObj = { render: () => <AdditionalExample capability="employmentMembership" initialValues={{ membership: "new", "waepa-attestation": "spouse-associate" }} /> };

export const OptionalMemberReference: StoryObj = { render: () => <AdditionalExample capability="optionalBeneficiaries" initialValues={{ membership: "yes" }} /> };
export const NurseType: StoryObj = { render: () => <AdditionalExample capability="nursingMembership" initialValues={{ membership: "yes" }} /> };
export const OccupationGroup: StoryObj = { render: () => <AdditionalExample capability="occupationAndChildNotice" initialValues={{ membership: "yes" }} /> };
export const MembershipStatusAndReferral: StoryObj = { render: () => <AdditionalExample capability="membershipStatus" initialValues={{ membership: "yes" }} /> };
export const FormerFederalEmployee: StoryObj = { render: () => <AdditionalExample capability="employmentMembership" initialValues={{ membership: "new", "waepa-attestation": "former-federal" }} /> };
export const AdultChildAssociate: StoryObj = { render: () => <AdditionalExample capability="employmentMembership" initialValues={{ membership: "new", "waepa-attestation": "child-associate" }} /> };
export const ParentAssociate: StoryObj = { render: () => <AdditionalExample capability="employmentMembership" initialValues={{ membership: "new", "waepa-attestation": "parent-associate" }} /> };
export const SiblingAssociate: StoryObj = { render: () => <AdditionalExample capability="employmentMembership" initialValues={{ membership: "new", "waepa-attestation": "sibling-associate" }} /> };
