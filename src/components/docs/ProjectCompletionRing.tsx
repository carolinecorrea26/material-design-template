import { Box, CircularProgress, Typography } from "@mui/material";

type ProjectCompletionRingProps = {
  /** 0-100, or null when no tasks are tracked for this project yet. */
  percent: number | null;
  size?: number;
};

export default function ProjectCompletionRing({
  percent,
  size = 64,
}: ProjectCompletionRingProps) {
  const label = percent == null ? "No tasks tracked yet" : `${percent}% complete`;

  return (
    <Box
      role="img"
      aria-label={label}
      sx={{ position: "relative", display: "inline-flex", flexShrink: 0 }}
    >
      <CircularProgress
        aria-hidden
        variant="determinate"
        value={100}
        size={size}
        thickness={4}
        sx={{ color: "background.surface" }}
      />
      <CircularProgress
        aria-hidden
        variant="determinate"
        value={percent ?? 0}
        size={size}
        thickness={4}
        sx={{
          position: "absolute",
          left: 0,
          color: percent == null ? "text.disabled" : "primary.main",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 700 }}>
          {percent == null ? "—" : `${percent}%`}
        </Typography>
      </Box>
    </Box>
  );
}
