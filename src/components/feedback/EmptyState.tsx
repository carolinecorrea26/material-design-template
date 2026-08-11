import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";
import { Box, Stack, Typography, type SxProps, type Theme } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";

type EmptyStateProps = {
  /** Icon to display. Defaults to PrivacyTipIcon. */
  icon?: SvgIconComponent;
  /** Primary message. Required. */
  title: string;
  /** Secondary descriptive message. Optional. */
  body?: string;
  sx?: SxProps<Theme>;
};

/**
 * Generic empty state: centered icon + title + optional body text.
 * Used wherever a section or panel has nothing to show yet.
 */
export default function EmptyState({ icon: Icon = PrivacyTipIcon, title, body, sx }: EmptyStateProps) {
  return (
    <Box
      sx={[
        {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          py: 6,
          px: 4,
        },
        ...(sx ? (Array.isArray(sx) ? sx : [sx]) : []),
      ]}
    >
      <Stack spacing={1} alignItems="center">
        <Icon sx={{ fontSize: 40, color: "text.disabled" }} />
        <Typography variant="body1" color="text.secondary">
          {title}
        </Typography>
        {body && (
          <Typography variant="body2" color="text.disabled">
            {body}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
