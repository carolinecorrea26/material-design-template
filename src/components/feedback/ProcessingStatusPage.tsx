import type { ReactNode } from "react";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";

type ProcessingStatusPageProps = {
  heading: ReactNode;
  body: ReactNode;
  mark?: ReactNode;
};

/** Centered in-page processing status used while an external decision completes. */
export default function ProcessingStatusPage({
  heading,
  body,
  mark,
}: ProcessingStatusPageProps) {
  return (
    <Box
      role="status"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 6,
        px: 3,
      }}
    >
      <Stack spacing={3} alignItems="center" sx={{ maxWidth: 400 }}>
        <CircularProgress size={48} thickness={4} aria-hidden />
        <Stack spacing={1} alignItems="center">
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            {mark}
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {heading}
            </Typography>
          </Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center", lineHeight: 1.6 }}
          >
            {body}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}
