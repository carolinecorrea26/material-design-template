import type { ReactNode, MouseEventHandler, KeyboardEventHandler } from "react";
import { Box } from "@mui/material";

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
 * the :has(:checked) CSS in the theme handles the selected state.
 */
export default function SelectionGroup({
  children,
  htmlFor,
  component = "label",
  role,
  "aria-checked": ariaChecked,
  tabIndex,
  checked,
  onClick,
  onKeyDown,
}: SelectionGroupProps) {
  return (
    <Box
      component={component}
      htmlFor={htmlFor}
      role={role}
      aria-checked={ariaChecked}
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
        borderColor: "rgba(52, 59, 72, 0.23)",
        borderRadius: "16px",
        bgcolor: "white",
        cursor: "pointer",
        transition: "background-color 0.2s ease, border-color 0.2s ease",
        // Selected state via data-checked (icon rows with no native input)
        "&[data-checked='true']": {
          borderColor: theme.palette.primary.main,
          bgcolor: `${theme.palette.primary.main}1A`,
          "& .SelectionGroup-label": { fontWeight: 700, color: "#353b48" },
          "& .SelectionGroup-icon": { color: theme.palette.primary.main },
        },
        // Selected state via :has(:checked) (native checkbox/radio rows) — also
        // uses theme here so the correct primary is applied regardless of client.
        "&:has(:checked)": {
          borderColor: theme.palette.primary.main,
          bgcolor: `${theme.palette.primary.main}1A`,
          "& .SelectionGroup-label": { fontWeight: 700, color: "#353b48" },
          "& .SelectionGroup-icon": { color: theme.palette.primary.main },
        },
        "@media (hover: hover)": {
          "&:hover": { bgcolor: "action.hover" },
          "&[data-checked='true']:hover": {
            bgcolor: `${theme.palette.primary.main}33`,
          },
          "&:has(:checked):hover": {
            bgcolor: `${theme.palette.primary.main}33`,
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
