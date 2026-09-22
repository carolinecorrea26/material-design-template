import type { ReactNode } from "react";
import { Box } from "@mui/material";

export default function IconListItem({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Box
      component="li"
      sx={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        columnGap: 1.5,
        alignItems: "start",
      }}
    >
      <Box component="span" sx={{ fontWeight: 500, textAlign: "right" }}>
        {icon}
      </Box>
      {children}
    </Box>
  );
}
