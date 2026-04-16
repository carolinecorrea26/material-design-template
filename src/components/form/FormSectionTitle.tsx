import type { SvgIconComponent } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import {
  applicantIcons,
  applicantSectionTitles,
  sectionTitleIconSx,
  shouldShowSectionLabelIcon,
  type ApplicantSectionId,
} from "../../config/formSectionTitle";

type FormSectionTitleProps =
  | {
      applicant: ApplicantSectionId;
      icon?: never;
      label?: never;
      showIcon?: boolean;
    }
  | {
      applicant?: never;
      icon: SvgIconComponent;
      label: string;
      showIcon?: boolean;
    };

export default function FormSectionTitle(props: FormSectionTitleProps) {
  const Icon = props.applicant ? applicantIcons[props.applicant] : props.icon;
  const title = props.applicant
    ? applicantSectionTitles[props.applicant]
    : props.label;
  const showIcon = shouldShowSectionLabelIcon(
    props.applicant ? "applicant" : "section",
    props.showIcon,
  );

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      {showIcon ? (
        <Box sx={sectionTitleIconSx}>
          <Icon />
        </Box>
      ) : null}

      <Typography
        sx={{
          lineHeight: 2.66,
          textTransform: "uppercase",
          color: "#4a6081",
          display: "block",
          fontWeight: 700,
          fontSize: "0.75rem",
          letterSpacing: "1px",
        }}
      >
        {title}
      </Typography>
    </Stack>
  );
}
