import Chip from "../../../components/docs/LibraryTag";
import { libraryRepository } from "../../../repositories/libraryRepository";
import { useLibraryScope } from "./LibraryScope";
import { useMemo } from "react";
import {  Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";

import ResponsiveTableContainer from "../../../components/docs/ResponsiveTableContainer";
import { useLibrarySite } from "./LibrarySiteSelector";

const cmsEntries = libraryRepository.read("cmsEntries");

export default function DocumentsLibrary() {
  const [siteId] = useLibrarySite();
  const scope = useLibraryScope();
  const documents = useMemo(() => cmsEntries.filter((entry) => entry.type === "Document"), []);
  return <Stack spacing={2.5}>
    <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Document references</Typography><Typography variant="body2" color="text.secondary">Legal, disclosure, application, and product documents already represented by CMS and coverage configuration.</Typography></Paper>
    <ResponsiveTableContainer libraryTable="documentDefinitions"><Table size="small"><TableHead><TableRow><TableCell>Document</TableCell><TableCell>Location / association</TableCell><TableCell>Global</TableCell><TableCell>Effective Site value</TableCell><TableCell>Source</TableCell></TableRow></TableHead><TableBody>{documents.map((entry) => { const value = scope === "global" ? entry.globalValue : entry.effectiveValue(siteId); const overridden = scope === "effective" && entry.overridden(siteId); return <TableRow key={entry.id}><TableCell><Typography variant="body2" sx={{ fontWeight: 700 }}>{entry.component}</Typography><Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>{entry.id}</Typography></TableCell><TableCell>{entry.page}</TableCell><TableCell sx={{ maxWidth: 320, wordBreak: "break-word" }}>{entry.globalValue}</TableCell><TableCell sx={{ maxWidth: 360, wordBreak: "break-word" }}>{value}{overridden && <Chip size="small" label="Site override" color="warning" sx={{ ml: 1 }} />}</TableCell><TableCell>CMS / coverage configuration</TableCell></TableRow>; })}</TableBody></Table></ResponsiveTableContainer>
  </Stack>;
}

