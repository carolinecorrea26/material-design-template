import type { SxProps, Theme } from "@mui/material";
import { CARD_RADIUS } from "../app/theme";

/** Standard yes/no option set for form radio/select fields. */
export const YES_NO_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

/** Shared elevated surface styling used on landing page cards. */
export const SURFACE_SX: SxProps<Theme> = {
  border: "1px solid rgba(52, 59, 72, 0.10)",
  borderRadius: 4,
  backgroundColor: "background.paper",
  boxShadow: "0 18px 40px rgba(52, 59, 72, 0.06)",
};

/** Category section card background styling. */
export const CATEGORY_SECTION_SX: SxProps<Theme> = {
  p: "1rem",
  background: "#f9fafd",
  borderRadius: CARD_RADIUS,
};
