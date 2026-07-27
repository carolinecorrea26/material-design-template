import { type ReactNode } from "react";
import { Box, type BoxProps, type SxProps, type Theme } from "@mui/material";

type CoverageCardProps = Omit<BoxProps, "children" | "sx"> & {
  children: ReactNode;
  /** Highlights the card border when a product or applicant is selected. */
  selected?: boolean;
  sx?: SxProps<Theme>;
};

const baseStyles: SxProps<Theme> = {
  borderRadius: "16px",
  border: "1px solid",
  borderColor: "divider",
  background:
    "linear-gradient(135deg, rgb(244, 248, 255) 0%, rgb(255, 255, 255) 52%, rgb(247, 251, 255) 100%)",
  p: 2.5,
};

export default function CoverageCard({
  children,
  selected,
  sx,
  ...boxProps
}: CoverageCardProps) {
  return (
    <Box
      {...boxProps}
      sx={[
        baseStyles,
        selected ? { borderColor: "primary.main" } : {},
        ...(sx ? (Array.isArray(sx) ? sx : [sx]) : []),
      ]}
    >
      {children}
    </Box>
  );
}
