import type { MouseEvent, ReactNode } from "react";
import { Handle, Position } from "@xyflow/react";
import { Box, Paper, Typography } from "@mui/material";
import { FLOW_NODE_MIN_HEIGHT, FLOW_NODE_WIDTH } from "../layout";

export default function FlowNodeShell({
  label,
  description,
  icon,
  accentColor,
  dashed,
  href,
  onNavigate,
}: {
  label: string;
  description?: string;
  icon: ReactNode;
  /** MUI theme color path, e.g. "primary.main" — used for the icon and left accent stripe. */
  accentColor: string;
  dashed?: boolean;
  /**
   * When set, the whole card (not just the label text) becomes a real
   * anchor — a much larger, easier click/tap target than a bolded label
   * would be on its own, especially once fitView has zoomed a tall flow
   * down significantly.
   */
  href?: string;
  onNavigate?: () => void;
}) {
  return (
    <Paper
      variant="outlined"
      {...(href
        ? {
            component: "a" as const,
            href,
            onClick: (e: MouseEvent) => {
              e.preventDefault();
              onNavigate?.();
            },
          }
        : {})}
      sx={{
        width: FLOW_NODE_WIDTH,
        minHeight: FLOW_NODE_MIN_HEIGHT,
        boxSizing: "border-box",
        position: "relative",
        display: "block",
        px: 1.5,
        py: 1.25,
        borderRadius: 2,
        borderStyle: dashed ? "dashed" : "solid",
        borderColor: "divider",
        borderLeftWidth: 4,
        borderLeftColor: accentColor,
        backgroundColor: "background.paper",
        ...(href
          ? {
              textDecoration: "none",
              color: "inherit",
              cursor: "pointer",
              "&:hover": { borderColor: accentColor },
              pointerEvents: "auto",
            }
          : {}),
      }}
    >
      <Handle type="target" position={Position.Top} style={{ visibility: "hidden" }} />
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.75 }}>
        <Box sx={{ color: accentColor, display: "flex", mt: "1px", flexShrink: 0 }}>{icon}</Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, lineHeight: 1.25, textDecoration: href ? "underline" : "none" }}
          >
            {label}
          </Typography>
          {description && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 0.5, whiteSpace: "normal", overflowWrap: "anywhere" }}
            >
              {description}
            </Typography>
          )}
        </Box>
      </Box>
      <Handle type="source" position={Position.Bottom} style={{ visibility: "hidden" }} />
    </Paper>
  );
}
