import LibraryTag from "./LibraryTag";
import { libraryColumns, libraryTableNames } from "./libraryColumns";
import { UNSAFE_LocationContext } from "react-router-dom";
import { useContext, useState, type ReactNode } from "react";
import { Button, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TablePagination, TableRow, TableSortLabel, TextField } from "@mui/material";
import ResponsiveTableContainer from "./ResponsiveTableContainer";
import ExpandableCell from "./ExpandableCell";
import { downloadLibraryExport, type ExportRelation } from "../../services/libraryExport";

export type BrowseColumn<T> = {
  id: string;
  label: string;
  value: (row: T) => string;
  render?: (row: T) => ReactNode;
  filter?: boolean;
  /** Narrow choices to this parent filter and reset when the parent changes. */
  filterDependsOn?: string;
  /** Explicit categorical presentation; prose is always plain text by default. */
  tag?: boolean;
  /** Explicit evidence gap, distinct from optional or inapplicable values. */
  missingDetails?: (row: T) => string | undefined;
  filterValues?: (row: T) => string[];
  width?: number;
  /** Keep long prose and lists compact without truncating search or exports. */
  expandable?: boolean;
  relations?: (row: T) => ExportRelation[];
};

type BrowseTableProps<T> = { initialFilters?: Record<string, string>; filterControls?: ReactNode; searchOnly?: boolean; stableFilterLayout?: boolean; hiddenColumns?: string[]; identityPosition?: 'first' | 'last'; tableName?: string; label: string; rows: T[]; columns: BrowseColumn<T>[]; rowKey: (row: T) => string; acceptUrlFilters?: boolean };

/** Reset local controls on navigation, including same-domain links and browser history. */
export default function BrowseTable<T>(props: BrowseTableProps<T>) {
  const location = useContext(UNSAFE_LocationContext);
  const urlSearch = location?.location.search ?? "";
  return <BrowseTableView key={`${location?.location.pathname ?? ""}:${urlSearch}`} {...props} urlSearch={urlSearch} />;
}

/** Search/filter state belongs to one table, never every table on the destination page. */
function BrowseTableView<T>({ initialFilters = {}, filterControls, searchOnly = false, stableFilterLayout = true, label, rows, columns: suppliedColumns, rowKey, tableName, hiddenColumns = [], identityPosition = 'last', acceptUrlFilters = true, urlSearch }: BrowseTableProps<T> & { urlSearch: string }) {
  const identity = tableName ?? libraryTableNames[label] ?? label.toLowerCase().replaceAll(" ", "-");
  const columns = libraryColumns(identity, suppliedColumns, rowKey, identityPosition).filter(column => !hiddenColumns.includes(column.id));
  const incoming = new URLSearchParams(urlSearch);
  const search = acceptUrlFilters && (!incoming.has("table") || incoming.get("table") === identity) ? incoming : new URLSearchParams();
  // Site/scope describe the Library, not a row's scope. Explicit filter.* keys avoid collisions.
  const filterParam = (id: string) => ["site", "scope", "table", "q", "flow"].includes(id) ? `filter.${id}` : id;
  const [query, setQuery] = useState(search.get("q") ?? "");
  const [filters, setFilters] = useState<Record<string, string>>(() => searchOnly ? {} : ({ ...initialFilters, ...Object.fromEntries(columns.filter(c => c.filter && search.has(filterParam(c.id))).map(c => [c.id, search.get(filterParam(c.id))!])) }));
  const [sort, setSort] = useState({ id: "", direction: "asc" as "asc" | "desc" });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const values = (column: BrowseColumn<T>, row: T) => column.filterValues?.(row) ?? [column.value(row)];
  const filtered = rows.filter((row) => columns.every((column) => !filters[column.id] || values(column, row).includes(filters[column.id])) && (rowKey(row).toLowerCase().includes(query.trim().toLowerCase()) || columns.some((column) => `${column.value(row)} ${column.missingDetails?.(row) ? "Details needed" : ""}`.toLowerCase().includes(query.trim().toLowerCase()))));
  const sortColumn = columns.find((column) => column.id === sort.id);
  if (sortColumn) filtered.sort((a, b) => sortColumn.value(a).localeCompare(sortColumn.value(b), undefined, { numeric: true, sensitivity: "base" }) * (sort.direction === "asc" ? 1 : -1));
  const activePage = Math.min(page, Math.max(0, Math.ceil(filtered.length / pageSize) - 1));
  const widths = columns.map((column) => column.width ?? 160);
  return <Stack spacing={1.5}>
    <Stack direction="row" gap={1.5} useFlexGap flexWrap="wrap" alignItems="center" aria-label={`${label} filters`} sx={stableFilterLayout && !searchOnly ? {
      display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      "& > .MuiFormControl-root": { width: "100%", minWidth: 0, maxWidth: "none" },
    } : undefined}>
      <TextField size="small" label={`Search ${label.toLowerCase()}`} value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} sx={{ flex: "1 1 220px", maxWidth: 360 }} />
      {!searchOnly && filterControls}
      {columns.filter((column) => !searchOnly && column.filter).map((column) => <TextField key={column.id} select size="small" label={column.label} slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }} value={filters[column.id] ?? ""} onChange={(event) => { setFilters(Object.fromEntries(Object.entries({ ...filters, [column.id]: event.target.value }).filter(([id]) => !columns.some(c => c.id === id && c.filterDependsOn === column.id)))); setPage(0); }} sx={{ width: 180, flexShrink: 0 }}>
        <MenuItem value="">All</MenuItem>
        {[...new Set(rows.filter(row => { const parent = columns.find(c => c.id === column.filterDependsOn); return !parent || !filters[parent.id] || values(parent, row).includes(filters[parent.id]); }).flatMap((row) => values(column, row)))].sort().map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}
      </TextField>)}
      {(!searchOnly || query) && <Button size="small" variant="contained" color="primary" sx={{ ml: "auto", flexShrink: 0 }} disabled={!query && !Object.values(filters).some(Boolean)} onClick={() => { setQuery(""); setFilters({}); setPage(0); }}>{searchOnly ? "Clear search" : "Clear filters"}</Button>}
    </Stack>
    <Stack direction="row" gap={1} useFlexGap flexWrap="wrap" aria-label={`${label} table actions`}>
      <Button size="small" variant="outlined" onClick={() => downloadLibraryExport({ name: label, rows: filtered, columns }, "csv")}>Export CSV</Button>
      <Button size="small" variant="outlined" onClick={() => downloadLibraryExport({ name: label, rows: filtered, columns }, "xml")}>Export XML</Button>
    </Stack>
    <ResponsiveTableContainer>
      <Table size="small" aria-label={label} sx={{ tableLayout: "fixed", minWidth: widths.reduce((total, width) => total + width, 0) }}>
        <colgroup>{columns.map((column, index) => <col key={column.id} style={{ width: widths[index] }} />)}</colgroup>
        <TableHead><TableRow>{columns.map((column) => <TableCell key={column.id} sortDirection={sort.id === column.id ? sort.direction : false}><TableSortLabel active={sort.id === column.id} direction={sort.id === column.id ? sort.direction : "asc"} onClick={() => { setSort({ id: column.id, direction: sort.id === column.id && sort.direction === "asc" ? "desc" : "asc" }); setPage(0); }}>{column.label}</TableSortLabel></TableCell>)}</TableRow></TableHead>
        <TableBody>{filtered.slice(activePage * pageSize, (activePage + 1) * pageSize).map((row) => <TableRow key={rowKey(row)}>{columns.map((column) => {
          const content = column.render?.(row) ?? (column.tag && column.value(row) !== "—" ? <LibraryTag label={column.value(row)} /> : column.value(row));
          return <TableCell key={column.id} sx={{ whiteSpace: "pre-line", overflowWrap: "anywhere", verticalAlign: "top" }}>{column.missingDetails?.(row) && <div><LibraryTag label="Details needed" title={column.missingDetails(row)} /></div>}{column.expandable ? <ExpandableCell>{content}</ExpandableCell> : content}</TableCell>;
        })}</TableRow>)}
          {!filtered.length && <TableRow><TableCell colSpan={columns.length}>No {label.toLowerCase()} match these filters.</TableCell></TableRow>}
        </TableBody>
      </Table>
    </ResponsiveTableContainer>
    <TablePagination component="div" count={filtered.length} page={activePage} rowsPerPage={pageSize} rowsPerPageOptions={[10, 25, 50, 100]} onPageChange={(_, next) => setPage(next)} onRowsPerPageChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); }} />
  </Stack>;
}
