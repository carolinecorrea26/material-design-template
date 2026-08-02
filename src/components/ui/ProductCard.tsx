import { type ReactNode } from "react";
import { Box, type BoxProps, type SxProps, type Theme } from "@mui/material";

type ProductCardProps = Omit<BoxProps, "children" | "sx"> & {
  children: ReactNode;
  /** Green border + tinted bg when any applicant is selected. */
  selected?: boolean;
  sx?: SxProps<Theme>;
};

const baseStyles: SxProps<Theme> = {
  borderRadius: "16px",
  border: "1px solid",
  borderColor: "divider",
  backgroundColor: "#ffffff",
  p: 2.5,
};

const selectedStyles: SxProps<Theme> = {
  borderColor: "#009465",
  borderWidth: "1px",
  boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
  backgroundColor: "#fbfffd",
};

export default function ProductCard({
  children,
  selected,
  sx,
  ...boxProps
}: ProductCardProps) {
  return (
    <Box
      {...boxProps}
      sx={[
        baseStyles,
        selected ? selectedStyles : {},
        ...(sx ? (Array.isArray(sx) ? sx : [sx]) : []),
      ]}
    >
      {children}
    </Box>
  );
}
