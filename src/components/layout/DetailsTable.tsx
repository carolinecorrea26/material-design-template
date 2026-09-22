import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from "@mui/material";

export type DetailsTableRow = { label: ReactNode; value: ReactNode };

export default function DetailsTable({ rows }: { rows: DetailsTableRow[] }) {
  return (
    <TableContainer
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <Table size="small">
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={typeof row.label === "string" ? row.label : index}>
              <TableCell
                component="th"
                scope="row"
                sx={{
                  fontWeight: 700,
                  color: "text.secondary",
                  width: "40%",
                  fontSize: 13,
                }}
              >
                {row.label}
              </TableCell>
              <TableCell sx={{ fontSize: 13 }}>{row.value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
