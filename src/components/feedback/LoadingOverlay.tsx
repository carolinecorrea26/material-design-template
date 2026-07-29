import { Box, CircularProgress, Typography } from "@mui/material";

type LoadingOverlaySize = "sm" | "md" | "lg" | "fullscreen";

type LoadingOverlayProps = {
  /**
   * Size variant:
   * - "sm"         Small inline spinner; use inside a button or tight UI region.
   * - "md"         Section-level spinner; overlays a card or form section.
   * - "lg"         Page-level spinner; fills the content area.
   * - "fullscreen" Blocks the entire viewport; use for navigation to external
   *                pages (E-Sign, QuickDecision) or global submission flows.
   */
  size?: LoadingOverlaySize;
  /** Optional status message shown below the spinner. */
  message?: string;
};

const sizeMap: Record<
  LoadingOverlaySize,
  { spinner: number; minHeight: string | number; position: "relative" | "fixed" }
> = {
  sm: { spinner: 20, minHeight: "auto", position: "relative" },
  md: { spinner: 36, minHeight: 160, position: "relative" },
  lg: { spinner: 48, minHeight: 320, position: "relative" },
  fullscreen: { spinner: 56, minHeight: "100vh", position: "fixed" },
};

export default function LoadingOverlay({
  size = "md",
  message,
}: LoadingOverlayProps) {
  const { spinner, minHeight, position } = sizeMap[size];

  const isFullscreen = size === "fullscreen";

  return (
    <Box
      role="status"
      aria-live="polite"
      aria-label={message ?? "Loading"}
      sx={{
        position,
        ...(isFullscreen
          ? { inset: 0, zIndex: 1400 }
          : { width: "100%", minHeight }),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        bgcolor: isFullscreen ? "rgba(255, 255, 255, 0.85)" : "transparent",
        backdropFilter: isFullscreen ? "blur(2px)" : "none",
      }}
    >
      <CircularProgress size={spinner} aria-hidden="true" />
      {message && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: "center" }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
}
