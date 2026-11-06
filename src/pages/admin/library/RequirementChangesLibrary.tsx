import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import changelog from "../../../../requirements/changelog.json";

export const requirementChanges: { id: string; description: string; reason: string }[] = changelog.changes;

/** Agreed requirement changes from the fresh-start migration, read from requirements/changelog.json. */
export default function RequirementChangesLibrary() {
  return <TableContainer>
    <Table size="small" aria-label="Requirement changes">
      <TableHead><TableRow><TableCell>Change</TableCell><TableCell>Description</TableCell><TableCell>Reason</TableCell></TableRow></TableHead>
      <TableBody>{requirementChanges.map(change => <TableRow key={change.id}>
        <TableCell sx={{ whiteSpace: "nowrap", verticalAlign: "top" }}><Typography variant="body2" sx={{ fontFamily: "monospace" }}>{change.id}</Typography></TableCell>
        <TableCell sx={{ verticalAlign: "top" }}>{change.description}</TableCell>
        <TableCell sx={{ verticalAlign: "top" }}>{change.reason}</TableCell>
      </TableRow>)}</TableBody>
    </Table>
  </TableContainer>;
}
