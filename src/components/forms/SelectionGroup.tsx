import type { ReactNode, MouseEventHandler, KeyboardEventHandler } from "react";
import { Box } from "@mui/material";
import { alpha } from "@mui/material/styles";

type SelectionGroupProps = {
  children: ReactNode;
  htmlFor?: string;
  /** Override the root element. Use "div" for icon-toggle rows that contain no native input. */
  component?: "label" | "div";
  role?: string;
  "aria-checked"?: boolean;
  tabIndex?: number;
  /** Drive selected visual state explicitly (for rows with no native checked input inside). */
  checked?: boolean;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLElement>;
  onKeyDown?: KeyboardEventHandler<HTMLElement>;
};

/**
 * SelectionGroup renders a full-width, bordered, clickable row — the shared
 * visual container for checkbox, radio, and icon-toggle option rows.
 *
 * Renders as <label> by default so click events propagate to any native input
 * (checkbox/radio) inside. Pass component="div" for icon-toggle rows that
 * contain no native input and use onClick directly.
 *
 * Pass `checked` to drive selected visual state when there is no native
 * checked input inside (e.g. icon category toggles). For native-input rows
 * the :has(:checked) selector below handles the selected state.
 */
export default function SelectionGroup({
  children,
  htmlFor,
  component = "label",
  role,
  "aria-checked": ariaChecked,
  tabIndex,
  checked,
  disabled = false,
  onClick,
  onKeyDown,
}: SelectionGroupProps) {
  return (
    <Box
      component={component}
      htmlFor={htmlFor}
      role={role}
      aria-checked={ariaChecked}
      aria-disabled={disabled || undefined}
      tabIndex={tabIndex}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className="SelectionGroup-root"
      data-checked={checked ? "true" : undefined}
      sx={(theme) => ({
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        padding: "16.5px 14px",
        width: "100%",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        bgcolor: "background.paper",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? theme.palette.action.disabledOpacity : 1,
        pointerEvents: disabled ? "none" : undefined,
        transition: theme.transitions.create(["background-color", "border-color"]),
        "& .SelectionGroup-label": { fontWeight: 500, fontSize: "0.875rem" },
        // Share selected styles for explicit state and native checkbox/radio inputs.
        "&[data-checked='true'], &:has(:checked)": {
          borderColor: theme.palette.primary.main,
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          "& .SelectionGroup-label": { fontWeight: 500, color: "text.primary" },
          "& .SelectionGroup-icon": { color: theme.palette.primary.main },
        },
        "@media (hover: hover)": disabled ? undefined : {
          "&:hover": { bgcolor: "action.hover" },
          "&[data-checked='true']:hover, &:has(:checked):hover": {
            bgcolor: alpha(theme.palette.primary.main, 0.2),
          },
        },
        "&:focus-visible": {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: "2px",
        },
      })}
    >
      {children}
    </Box>
  );
}
