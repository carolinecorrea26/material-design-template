import { useRef, type MouseEvent, type ReactNode } from "react";
import { useFlowMeasurement } from "../measure";
import type { Size } from "../layout";
import { Handle, Position } from "@xyflow/react";
import { Box, Paper, Typography } from "@mui/material";
import { FLOW_NODE_MIN_HEIGHT, FLOW_NODE_WIDTH } from "../layout";

export default function FlowNodeShell({
  onInspect,
  onMeasure,
  active,
  label,
  description,
  icon,
  accentColor,
  dashed,
  href,
  onNavigate,
}: {
  layoutHeight?: number;
  onInspect?: () => void;
  onMeasure?: (size: Size) => void;
  active?: boolean;
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
  const ref = useRef<HTMLElement>(null);
  useFlowMeasurement(ref, onMeasure);
  return (
    <Paper
      component={onInspect ? "button" : href ? "a" : "div"}
      ref={(element: HTMLElement | null) => { ref.current = element; }}
      className="nodrag nopan"
      data-flow-node="true"
      variant="outlined"
      {...(onInspect ? { type: "button" as const, onClick: onInspect, "aria-label": label, "aria-pressed": active } : {})}
      {...(!onInspect && href
        ? {
            href,
            onClick: (e: MouseEvent) => {
              e.preventDefault();
              onNavigate?.();
            },
          }
        : {})}
      sx={{
        width: FLOW_NODE_WIDTH,
        height: "auto",
        minHeight: FLOW_NODE_MIN_HEIGHT,
        textAlign: "left",
        font: "inherit",
        boxSizing: "border-box",
        position: "relative",
        display: "block",
        px: 1.5,
        py: 1.25,
        borderRadius: 2,
        borderStyle: dashed ? "dashed" : "solid",
        borderColor: active ? accentColor : "divider",
        "&:focus-visible": { outline: "3px solid", outlineColor: accentColor, outlineOffset: 3 },
        borderLeftWidth: 4,
        borderLeftColor: accentColor,
        backgroundColor: "background.paper",
        ...((onInspect || href)
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
      <Handle type="target" position={Position.Top} style={{ visibility: "hidden", width: 0, height: 0, minWidth: 0, minHeight: 0, border: 0 }} />
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.75 }}>
        <Box sx={{ color: accentColor, display: "flex", mt: "1px", flexShrink: 0 }}>{icon}</Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, lineHeight: 1.35, overflowWrap: "anywhere", whiteSpace: "normal", textDecoration: !onInspect && href ? "underline" : "none" }}
          >
            {label}
          </Typography>
          {!onInspect && description && (
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
      <Handle type="source" position={Position.Bottom} style={{ visibility: "hidden", width: 0, height: 0, minWidth: 0, minHeight: 0, border: 0 }} />
    </Paper>
  );
}
