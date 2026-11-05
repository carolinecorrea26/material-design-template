// Preview notes are documentation only; the canvas contains application UI.
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Typography } from "@mui/material";
import ApplicantSectionDivider, { ApplicantSectionLabel } from "./ApplicantSectionDivider";
import SupervisorAccountRoundedIcon from "@mui/icons-material/SupervisorAccountRounded";

/**
 * ApplicantSectionDivider marks a block of content as belonging to a
 * specific applicant (member/spouse/child), resolving the client-overridable
 * title/icon via getResolvedApplicantSectionTitles. Per the site's
 * applicant-display rule, the member/self label is hidden when only the
 * member is applying (`showLabel={false}`) and shown once another applicant
 * is also applying.
 */
const meta = {
  id: "layout-applicantsectiondivider",
  title: "Components/Layout/Headings and dividers/Applicant heading",
  component: ApplicantSectionDivider,
  parameters: { docs: { description: { component: "Labels an applicant section with an optional supporting note." } }, layout: "padded" },
} satisfies Meta<typeof ApplicantSectionDivider>;

export default meta;

export const MemberSection: StoryObj = {
  render: () => (
    <ApplicantSectionDivider applicant="self">
      <Typography variant="body2">Member's fields go here.</Typography>
    </ApplicantSectionDivider>
  ),
};

export const SpouseSection: StoryObj = {
  render: () => (
    <ApplicantSectionDivider applicant="spouse">
      <Typography variant="body2">Spouse's fields go here.</Typography>
    </ApplicantSectionDivider>
  ),
};

export const WithNote: StoryObj = {
  render: () => (
    <ApplicantSectionDivider applicant="spouse" note="Spouse coverage requires additional health questions.">
      <Typography variant="body2">Spouse's fields go here.</Typography>
    </ApplicantSectionDivider>
  ),
};

export const LabelHiddenMemberOnlyFlow: StoryObj = {
  name: "showLabel=false (member-only flow)",
  render: () => (
    <ApplicantSectionDivider applicant="self" showLabel={false}>
      <Typography variant="body2">Member information</Typography>
    </ApplicantSectionDivider>
  ),
};

export const LabelStandalone: StoryObj = {
  name: "ApplicantSectionLabel (named export, used standalone)",
  render: () => <ApplicantSectionLabel label="Spouse" icon={SupervisorAccountRoundedIcon} />,
};
