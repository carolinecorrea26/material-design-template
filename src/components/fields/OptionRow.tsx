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
        padding: "16.5px 14px",
        width: "100%",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "16px",
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
