import type { SvgIconComponent } from "@mui/icons-material";
import { Box, Stack, type SxProps, type Theme } from "@mui/material";
import { sectionTitleIconSx } from "../../config/formSectionTitle";

type FormSectionTitleProps = {
  label: string;
  icon?: SvgIconComponent;
  sx?: SxProps<Theme>;
};

export default function FormSectionTitle({
  label,
  icon: Icon,
  sx,
}: FormSectionTitleProps) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={sx}>
      {Icon ? (
        <Box sx={sectionTitleIconSx}>
          <Icon />
        </Box>
      ) : null}

      <Box
        component="span"
        sx={{
          typography: "formSectionLabel",
          display: "block",
        }}
      >
        {label}
      </Box>
    </Stack>
  );
}
