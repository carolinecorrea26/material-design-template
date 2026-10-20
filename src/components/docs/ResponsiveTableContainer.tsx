import { withLibraryMetadata } from "./LibraryTableMetadata";
import type { ReactNode } from "react";
import { Paper, TableContainer } from "@mui/material";

export default function ResponsiveTableContainer({
  children, libraryTable,
}: {
  children: ReactNode; libraryTable?: string;
}) {
  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{
        overflowX: "auto",
        width: "100%",
        "& td, & th": { fontSize: { xs: "0.75rem", md: "0.8125rem" }, minWidth: 120 },
        "& td": { whiteSpace: "normal", overflowWrap: "break-word", wordBreak: "normal", verticalAlign: "top", maxWidth: 400 },
        "& td .MuiTypography-root, & td a": { overflowWrap: "break-word" },
        "& td a:not(.MuiLink-root)": { color: "primary.main", textDecoration: "underline" },
        "& td .MuiChip-root": { width: "fit-content", maxWidth: "100%", minWidth: 0, minHeight: 24, height: "auto" },
        "& td .MuiChip-label": { whiteSpace: "normal", overflowWrap: "anywhere", lineHeight: 1.4, py: "3px" },
        "& th": { whiteSpace: "nowrap", overflowWrap: "normal", fontWeight: 700 },
      }}
    >
      {libraryTable ? withLibraryMetadata(children, libraryTable) : children}
    </TableContainer>
  );
}
