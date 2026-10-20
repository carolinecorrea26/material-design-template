import Chip from "./LibraryTag";
import { useState } from "react";
import { Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import ResponsiveTableContainer from "./ResponsiveTableContainer";
import ResizableHeaderCell from "./ResizableHeaderCell";
import SearchField from "./SearchField";
import PageFilterSelect, { ALL_PAGES } from "./PageFilterSelect";
import useResizableColumns from "./useResizableColumns";
import { CLIENT_HIGHLIGHT_BG } from "./ClientNote";
import type { ResolvedConfiguration } from "../../config/resolvers";
import TruncatedString from "./TruncatedString";
import { getSiteDetailsPageLabel } from "../../config/resolvers/resolveClientPages";
import { getSiteDetailsPageOrder } from "../../config/resolvers";
import { getConfigurationRequirement } from "../../content/docs/configurations";
import ConfigurationPageLinks from "./ConfigurationPageLinks";
import LibraryLink from "../../pages/admin/library/LibraryLink";
import { fieldCatalog } from "../../config/fields";

function formatConfigValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length ? value.map(v => typeof v === "object" ? JSON.stringify(v) : String(v)).join(", ") : "None";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

const columns = [
  { id: "page", label: "Page", width: 160 },
  { id: "setting", label: "Setting", width: 400 },
  { id: "defaultValue", label: "Default value", width: 240 },
  { id: "effective", label: "Effective", width: 280 },
  { id: "status", label: "Status", width: 130 },
  { id: "setup", label: "Setup", width: 130 },
];

/** Shared Global/Effective table. The metadata adapter supplies its sole ID column last. */
export default function ResolvedConfigurationList({ rows, global = false }: { rows: ResolvedConfiguration[]; global?: boolean }) {
  const [filter, setFilter] = useState("");
  const [pageFilter, setPageFilter] = useState(ALL_PAGES);
  const { widths, resize } = useResizableColumns(Object.fromEntries(columns.map(column => [column.id, column.width])));
  const pageOrder = getSiteDetailsPageOrder();
  const rank = (id: string) => id === "global" ? pageOrder.length : pageOrder.indexOf(id as typeof pageOrder[number]);
  const orderedRows = [...rows].sort((a, b) => rank(a.page.id) - rank(b.page.id));
  const pageOptions = Array.from(new Map(orderedRows.flatMap(row => (row.page.pageIds ?? [row.page.id]).map(id => [id, { value: id, label: id === "global" ? "Global" : getSiteDetailsPageLabel(id as typeof pageOrder[number]) }] as const))).values());
  const filteredRows = orderedRows.filter(row => (pageFilter === ALL_PAGES || (row.page.pageIds ?? [row.page.id]).includes(pageFilter)) && `${row.configurationId} ${row.page.label} ${row.label} ${row.key} ${row.global.description}`.toLowerCase().includes(filter.toLowerCase()));
  if (!rows.length) return null;
  return <Stack spacing={1.5}>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
      <SearchField value={filter} onChange={setFilter} placeholder="Search configuration…" />
      <PageFilterSelect value={pageFilter} onChange={setPageFilter} options={pageOptions} />
    </Stack>
    <ResponsiveTableContainer libraryTable="configurationDefinitions">
      <Table aria-label="Configurations" size="small" sx={{ tableLayout: "fixed", width: "max-content" }}>
        <colgroup>{columns.map(column => <col key={column.id} style={{ width: widths[column.id] }} />)}</colgroup>
        <TableHead><TableRow>{columns.map(column => <ResizableHeaderCell key={column.id} width={widths[column.id]} onResize={width => resize(column.id, width)}>{column.label}</ResizableHeaderCell>)}</TableRow></TableHead>
        <TableBody>{filteredRows.map(row => <TableRow key={row.configurationId} sx={!global && row.status === "overridden" ? { bgcolor: CLIENT_HIGHLIGHT_BG } : undefined}>
          <TableCell><ConfigurationPageLinks page={row.page} /></TableCell>
          <TableCell><Typography variant="body2" sx={{ fontWeight: 700 }}>{row.label}</Typography><Typography component="div" variant="body2" color="text.secondary" sx={{ mt: 0.5 }}><TruncatedString value={row.global.description} threshold={220} /></Typography></TableCell>
          <TableCell><TruncatedString value={row.global.defaultDisplay} threshold={150} /></TableCell>
          <TableCell>{global ? "—" : row.key === "ClientConfig.fields.membership.extra" && Array.isArray(row.effective) && row.effective.length ? <Stack spacing={0.5}>{row.effective.map(id => <LibraryLink key={String(id)} domain="fields" filters={{ page: "membership", q: String(id) }}>{fieldCatalog[id as keyof typeof fieldCatalog]?.label ?? String(id)}</LibraryLink>)}</Stack> : <TruncatedString value={formatConfigValue(row.effective ?? row.global.defaultValue ?? row.global.defaultDisplay)} threshold={180} />}</TableCell>
          <TableCell><Chip label={global ? "Global" : row.status === "overridden" ? "Overridden" : "Inherited"} /></TableCell>
          <TableCell><Chip label={getConfigurationRequirement({ name: row.key })} /></TableCell>
        </TableRow>)}</TableBody>
      </Table>
    </ResponsiveTableContainer>
  </Stack>;
}
