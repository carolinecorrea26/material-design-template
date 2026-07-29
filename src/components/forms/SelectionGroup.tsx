import type { ReactNode, MouseEventHandler, KeyboardEventHandler } from "react";
import { Box } from "@mui/material";

type SelectionGroupProps = {
  children: ReactNode;
  htmlFor?: string;
  role?: string;
  "aria-checked"?: boolean;
  tabIndex?: number;
  onClick?: MouseEventHandler<HTMLElement>;
  onKeyDown?: KeyboardEventHandler<HTMLElement>;
};

/**
 * SelectionGroup renders a full-width, bordered, clickable row — the shared
 * visual container for both checkbox and radio option rows.
 *
 * Font weight for selected/unselected labels is defined in the theme via
 * MuiCssBaseline global styles, keyed on .SelectionGroup-root and
 * .SelectionGroup-label class names.
 */
export default function SelectionGroup({
  children,
  htmlFor,
  role,
  "aria-checked": ariaChecked,
  tabIndex,
  onClick,
  onKeyDown,
}: SelectionGroupProps) {
  return (
    <Box
      component="label"
      htmlFor={htmlFor}
      role={role}
      aria-checked={ariaChecked}
      tabIndex={tabIndex}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className="SelectionGroup-root"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        padding: "16.5px 14px",
        width: "100%",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "16px",
        bgcolor: "white",
        cursor: "pointer",
        transition: "background-color 0.2s ease, border-color 0.2s ease",
        "&:focus-visible": {
          outline: (theme) => `2px solid ${theme.palette.primary.main}`,
          outlineOffset: "2px",
        },
        "@media (hover: hover)": {
          "&:hover": { bgcolor: "action.hover" },
        },
      }}
    >
      {children}
    </Box>
  );
}
