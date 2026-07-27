import { type ReactNode } from "react";
import { Box, type BoxProps, type SxProps, type Theme } from "@mui/material";

type PageCardProps = Omit<BoxProps, "children" | "sx"> & {
  children: ReactNode;
  sx?: SxProps<Theme>;
};

const baseStyles: SxProps<Theme> = {
  width: "100%",
  borderRadius: "16px",
  backgroundColor: "background.paper",
  boxShadow: "0 8px 16px rgba(52, 59, 72, 0.06)",
};

export default function PageCard({ children, sx, ...boxProps }: PageCardProps) {
  return (
    <Box
      {...boxProps}
      sx={[baseStyles, ...(sx ? (Array.isArray(sx) ? sx : [sx]) : [])]}
    >
      {children}
    </Box>
  );
}
