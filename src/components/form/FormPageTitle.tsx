import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

type FormPageTitleProps = {
  title: ReactNode;
  subhead?: ReactNode;
  compact?: boolean;
};

export default function FormPageTitle({
  title,
  subhead,
  compact,
}: FormPageTitleProps) {
  return (
    <Box>
      <Typography variant={compact ? "formPageTitleCompact" : "formPageTitle"}>
        {title}
      </Typography>
      {subhead ? (
        <Typography component="p" variant="subtitle2">
          {subhead}
        </Typography>
      ) : null}
    </Box>
  );
}
