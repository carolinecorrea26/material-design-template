import type { ReactNode } from "react";
import { Box } from "@mui/material";

type SelectableOptionRowProps = {
  children: ReactNode;
  htmlFor?: string;
};

export default function SelectableOptionRow({
  children,
  htmlFor,
}: SelectableOptionRowProps) {
  return (
    <Box
      component="label"
      htmlFor={htmlFor}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 2,
        py: 1.5,
        width: "100%",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "8px",
        bgcolor: "white",
        cursor: "pointer",
        transition: "background-color 0.2s ease, border-color 0.2s ease",
        "@media (hover: hover)": {
          "&:hover": {
            bgcolor: "action.hover",
          },
        },
      }}
    >
      {children}
    </Box>
  );
}
