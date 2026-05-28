import { Box, Typography, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";

type FormPageTitleProps = {
  title: ReactNode;
  subhead?: ReactNode;
  compact?: boolean;
};

const titleSx: SxProps<Theme> = {
  fontWeight: 700,
  fontSize: { xs: "1.25rem", md: "1.75rem" },
  lineHeight: 1.25,
  letterSpacing: "-0.025em",
};

const compactTitleSx: SxProps<Theme> = {
  fontWeight: 700,
  fontSize: { xs: "1.15rem", md: "1.35rem" },
  lineHeight: 1.3,
  letterSpacing: "-0.02em",
};

export default function FormPageTitle({
  title,
  subhead,
  compact,
}: FormPageTitleProps) {
  return (
    <Box>
      <Typography component="h1" sx={compact ? compactTitleSx : titleSx}>
        {title}
      </Typography>
      {subhead ? (
        <Typography
          component="p"
          sx={{
            mt: 0.75,
            maxWidth: 760,
            color: "text.secondary",
            fontSize: { xs: "0.95rem", md: "1rem" },
            lineHeight: 1.6,
          }}
        >
          {subhead}
        </Typography>
      ) : null}
    </Box>
  );
}
