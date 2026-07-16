import type { SvgIconComponent } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import {
  applicantSectionTitles,
  sectionTitleIconSx,
  type ApplicantSectionId,
} from "../../config/formSectionTitle";

type FormSectionTitleProps =
  | {
      applicant: ApplicantSectionId;
      icon?: never;
      label?: never;
    }
  | {
      applicant?: never;
      icon?: SvgIconComponent;
      label: string;
    };

export default function FormSectionTitle(props: FormSectionTitleProps) {
  if (props.applicant) {
    const title = applicantSectionTitles[props.applicant];

    return (
      <Box
        sx={{
          background: "rgb(234 242 255 / 84%)",
          padding: "0.5rem 1.25rem",
          borderRadius: "8px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Typography variant="formSectionLabel">{title}</Typography>
      </Box>
    );
  }

  const Icon = props.icon;

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      {Icon ? (
        <Box sx={sectionTitleIconSx}>
          <Icon />
        </Box>
      ) : null}

      <Typography variant="formSectionLabel" sx={{ display: "block" }}>
        {props.label}
      </Typography>
    </Stack>
  );
}
