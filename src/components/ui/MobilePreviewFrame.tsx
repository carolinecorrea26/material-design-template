import type { ReactNode } from "react";
import { Box } from "@mui/material";

export type MobilePreviewFrameProps = {
  children: ReactNode;
  frameColor?: string;
  maxWidth?: number;
  viewportHeight?: number | { xs: number; sm: number };
  showDeviceChrome?: boolean;
};

/**
 * Presentation-only mobile viewport shared by previews with otherwise
 * unrelated data and interaction models.
 */
export default function MobilePreviewFrame({
  children,
  frameColor = "grey.200",
  maxWidth = 390,
  viewportHeight = 680,
  showDeviceChrome = true,
}: MobilePreviewFrameProps) {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth,
        mx: "auto",
        p: { xs: 0.75, sm: 1 },
        boxSizing: "border-box",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 4,
        bgcolor: frameColor,
        boxShadow: "0 10px 24px rgba(15, 23, 42, 0.12)",
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: viewportHeight,
          overflow: "hidden",
          borderRadius: 3,
          bgcolor: "background.paper",
        }}
      >
        {showDeviceChrome && (
          <Box
            aria-hidden="true"
            sx={{
              position: "absolute",
              zIndex: 2,
              top: 7,
              left: "50%",
              width: 44,
              height: 4,
              borderRadius: 99,
              bgcolor: "rgba(53, 59, 72, 0.22)",
              transform: "translateX(-50%)",
            }}
          />
        )}
        {children}
      </Box>
    </Box>
  );
}
