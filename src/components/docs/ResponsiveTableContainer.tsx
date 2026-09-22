import type { ReactNode } from "react";
import { Paper, TableContainer } from "@mui/material";

export default function ResponsiveTableContainer({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{
        overflowX: "auto",
        width: "100%",
        "& td, & th": { fontSize: { xs: "0.75rem", md: "0.8125rem" } },
        "& td": { whiteSpace: "nowrap" },
        "& th": { whiteSpace: "nowrap", fontWeight: 700 },
      }}
    >
      {children}
    </TableContainer>
  );
}
