import { type ReactNode } from "react";
import {
  Paper,
  type PaperProps,
  type SxProps,
  type Theme,
} from "@mui/material";
import { CARD_RADIUS } from "../../app/theme";

type FormShellProps = Omit<PaperProps, "children" | "sx" | "elevation"> & {
  children: ReactNode;
  sx?: SxProps<Theme>;
};

const baseStyles: SxProps<Theme> = {
  width: "100%",
  borderRadius: CARD_RADIUS,
  boxShadow: "0 8px 16px rgba(52, 59, 72, 0.06)",
};

export default function FormShell({
  children,
  sx,
  ...paperProps
}: FormShellProps) {
  return (
    <Paper
      elevation={0}
      {...paperProps}
      sx={[baseStyles, ...(sx ? (Array.isArray(sx) ? sx : [sx]) : [])]}
    >
      {children}
    </Paper>
  );
}
