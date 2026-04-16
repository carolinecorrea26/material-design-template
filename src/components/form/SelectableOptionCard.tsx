import type { ReactNode } from "react";
import { Box } from "@mui/material";

type SelectableOptionCardProps = {
  children: ReactNode;
  onClick?: () => void;
};

export default function SelectableOptionCard({
  children,
  onClick,
}: SelectableOptionCardProps) {
  return (
    <Box
      onClick={onClick}
      sx={(theme) => ({
        display: "flex",
        alignItems: "flex-start",
        gap: 2,
        px: 2,
        py: 2,
        width: "100%",
        border: "1px solid",
        borderColor: theme.palette.divider,
        borderRadius: "8px",
        bgcolor: theme.palette.background.paper,
        cursor: onClick ? "pointer" : "default",
        transition:
          "border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          boxShadow: theme.shadows[1],
        },
        "&:focus-visible": {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: 2,
        },
      })}
    >
      {children}
    </Box>
  );
}
