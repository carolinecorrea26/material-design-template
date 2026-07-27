import { Box, type SxProps, type Theme } from "@mui/material";
import {
  applicantSectionTitles,
  type ApplicantSectionId,
} from "../../config/formSectionTitle";
import FormSectionTitle from "./SectionTitle";

type ApplicantSectionTitleProps = {
  applicant: ApplicantSectionId;
  sx?: SxProps<Theme>;
};

export default function ApplicantSectionTitle({
  applicant,
  sx,
}: ApplicantSectionTitleProps) {
  const title = applicantSectionTitles[applicant];

  return (
    <Box
      sx={[
        {
          backgroundColor: "rgb(234 242 255 / 84%)",
          padding: "0.5rem 1.25rem",
          borderRadius: "8px",
          display: "flex",
          justifyContent: "center",
        },
        ...(sx ? (Array.isArray(sx) ? sx : [sx]) : []),
      ]}
    >
      <FormSectionTitle label={title} />
    </Box>
  );
}
