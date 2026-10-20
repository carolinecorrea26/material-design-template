import { useState } from "react";
import { Box, Link, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import AppDrawer from "../layout/AppDrawer";
import { isReferenceRateTable, type ReferenceRateTable } from "../../domain/ratePresentation";

/** Candidate consumer; install in applicant pricing areas at the later cutover. */
export default function ReferenceRateTableLink({ table }: { table: ReferenceRateTable }) {
  const [open, setOpen] = useState(false);
  if (!isReferenceRateTable(table)) return null;
  return <>
    <Link component="button" type="button" variant="body2" onClick={() => setOpen(true)} sx={{ fontWeight: 400, fontStyle: "normal", textTransform: "none", textAlign: "left" }}>View rate table</Link>
    <AppDrawer open={open} onClose={() => setOpen(false)} title={table.title}>
      <Typography variant="body2" sx={{ mb: 2 }}>Reference rates. Your actual premium may depend on the plan and applicant details.</Typography>
      {table.kind === "image" && <Box component="img" src={table.url} alt={table.title} sx={{ width: "100%", height: "auto" }} />}
      {table.kind === "pdf" && <><Box component="iframe" title={table.title} src={table.url} sandbox="allow-same-origin" referrerPolicy="no-referrer" sx={{ width: "100%", height: "65vh", border: 0 }} /><Link href={table.url} target="_blank" rel="noopener noreferrer">Open PDF</Link></>}
      {["link", "xml"].includes(table.kind) && "url" in table && <Link href={table.url} target="_blank" rel="noopener noreferrer">Open reference source</Link>}
      {table.kind === "html-table" && <Box sx={{ overflowX: "auto" }}><Table size="small" aria-label={table.title}><TableHead><TableRow>{table.columns.map((column, index) => <TableCell key={index}>{column}</TableCell>)}</TableRow></TableHead><TableBody>{table.rows.map((row, index) => <TableRow key={index}>{row.map((cell, column) => <TableCell key={column}>{cell}</TableCell>)}</TableRow>)}</TableBody></Table></Box>}
      {table.notes?.map((note, index) => <Typography key={index} variant="body2" sx={{ mt: 1.5, fontWeight: 400 }}>{note}</Typography>)}
      {table.sources?.map(source => <Box key={source.url} sx={{ mt: 1 }}><Link href={source.url} target="_blank" rel="noopener noreferrer" variant="body2">{source.label}</Link></Box>)}
    </AppDrawer>
  </>;
}
