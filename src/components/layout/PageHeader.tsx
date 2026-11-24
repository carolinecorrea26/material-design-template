import { Box, Stack, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";
import PageTitle from "./PageTitle";

type PageHeaderProps = {
  title: ReactNode;
  subhead?: ReactNode;
  onBack?: () => void;
  /** Optional help chips, info links, or contextual UI rendered below the title. */
  help?: ReactNode;
  feedback?: ReactNode;
  spacing?: number;
  sx?: SxProps<Theme>;
};

/**
 * PageHeader wraps the page title, optional subtitle, and optional helper
 * content (chips, info links, etc.) at the top of a form page's content area.
 *
 * Renders inside PageCard, above the form body.
 */
export default function PageHeader({
  title,
  subhead,
  onBack,
  help, feedback, spacing = 0, sx,
}: PageHeaderProps) {
  return (
    <Box sx={[{ mb: "1rem" }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}>
      <Stack spacing={spacing}><PageTitle title={title} subhead={subhead} onBack={onBack} />
      {feedback}{help}</Stack>
    </Box>
  );
}
