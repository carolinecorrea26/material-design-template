import { libraryRecordColumns, readableValue } from "./libraryRecordColumns";
import { useSearchParams } from "react-router-dom";
import { Link, MenuItem, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import BrowseTable, { type BrowseColumn } from "../../../components/docs/BrowseTable";
import LibraryTag from "../../../components/docs/LibraryTag";
import LibraryLink from "./LibraryLink";
import { useLibraryCatalog } from "./LibraryCatalogContext";
import { storedDomains, storedLibraryRows, storedFieldRows, storedPageFieldGroups, storedFieldVisibility, storedSectionLabel, childCollection, type StoredRow, type StoredFieldRow } from "./storedLibraryModel";
import { getSitePagePrototypeUrl } from "../../../config/sitePrototype";
import { getSiteDetailsPageLabel } from "../../../config/resolvers/resolveClientPages";
import type { PageId } from "../../../types";
import type { SnapshotTable } from "../../../persistence/snapshot";

function text(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map(text).join(", ") || "—";
  if (typeof value === "object") return Object.entries(value).map(([key, item]) => `${key}: ${text(item)}`).join("; ");
  return String(value);
}
const destinations: Record<string, [string, SnapshotTable]> = {
  pageKey: ["pages", "pages"], fieldKey: ["fields", "fields"], sectionKey: ["pages", "pageSections"], productKey: ["coverage", "products"], riderKey: ["coverage", "riders"], amountPatternKey: ["coverage", "coverageAmountPatterns"], configurationKey: ["configurations", "configurationDefinitions"], contentKey: ["content", "contentEntries"], ruleKey: ["rules", "rules"], conditionKey: ["rules", "conditions"], flowKey: ["flows", "flows"], questionSetKey: ["rules", "questionSets"], patternKey: ["patterns", "patterns"], flagDefinitionKey: ["flags", "flagDefinitions"], emailTemplateKey: ["communications", "emailTemplates"], documentKey: ["content", "documentDefinitions"],
};
export default function StoredLibraryDomain({ domain, siteKey }: { domain: string; siteKey: string }) {
  const catalog = useLibraryCatalog();
  const [search, setSearch] = useSearchParams();
  const datasets = storedDomains[domain];
  const table = datasets.find(([table]) => table === search.get("dataset"))?.[0] ?? datasets[0][0];
  const label = datasets.find(([key]) => key === table)![1];
  const changeDataset = (next: string) => setSearch(previous => { const params = new URLSearchParams(); params.set("site", previous.get("site") ?? "all"); params.set("dataset", next); return params; });
  const collection = childCollection(catalog, siteKey);
  const fields = storedFieldRows(catalog, siteKey);
  const rows: StoredRow[] = table === "fields" ? fields : storedLibraryRows(catalog, table, siteKey);
  const pageGroups = new Map(table === "pages" ? rows.map(row => [String(row.key), storedPageFieldGroups(catalog, siteKey, String(row.key), fields, collection)] as const) : []);
  const recordLabel = (row: StoredRow) => table === "pages" ? getSiteDetailsPageLabel(String(row.key) as PageId) : text((row.definition as Record<string, unknown>)?.label ?? (row.definition as Record<string, unknown>)?.name ?? (row.definition as Record<string, unknown>)?.rule ?? row.name ?? row.key ?? row.id);
  const columns: BrowseColumn<StoredRow>[] = [
    { id: "record", label: ({ fields: "Field", pages: "Page", products: "Product", riders: "Rider", coverageCategories: "Category", features: "Feature", flagDefinitions: "Flag", patterns: "Pattern", urlParameters: "Parameter", conditions: "Condition", questionSets: "Question set", questionDefinitions: "Question", rateTables: "Rate table", contentEntries: "Content" } as Record<string, string>)[table] ?? "Record", width: 260, value: row => `${recordLabel(row)} ${row.key ?? row.id}`, render: row => <><Typography variant="body2" fontWeight={700}>{recordLabel(row)}</Typography><Typography variant="caption" display="block" color="text.secondary">{text(row.key ?? row.id)}</Typography>{table === "pages" && <Link href={getSitePagePrototypeUrl(siteKey === "all" ? "demo" : siteKey, String(row.key) as PageId, (row.definition as { path: string }).path)} target="_blank" rel="noopener noreferrer">Preview page</Link>}</> },
  ];
  if (table === "pages" || table === "pageSections") columns.push({ id: "sequence", label: "Sequence", width: 100, value: row => String(row.sequence ?? Number(row.position ?? 0) + 1) });
  if (table === "pages") columns.push({ id: "sections", label: "Fields by page / section", width: 340,
    value: row => (pageGroups.get(String(row.key)) ?? []).map(group => `${group.section}: ${group.fields.map(field => `${field.definition.label} ${field.key}`).join(", ")}`).join("; "),
    render: row => <Stack spacing={1}>{(pageGroups.get(String(row.key)) ?? []).map((group, index) => <div key={group.key}>
      <Typography variant="body2" fontWeight={600}>{index + 1}. {group.label}{group.collection ? ` · ${group.collection}[]` : ""}</Typography>
      {group.notice ? <><LibraryTag label="Notice only" /><Typography variant="caption" display="block">{group.notice}</Typography></> : group.fields.map(field => <div key={field.key}><LibraryLink domain="fields" filters={{ q: field.key, pages: String(row.key) }}>{field.definition.label}</LibraryLink><Typography variant="caption" color="text.secondary" display="block">{field.key}</Typography></div>)}
    </div>)}{!(pageGroups.get(String(row.key)) ?? []).length && "No input fields"}</Stack> });
  if (table === "fields") {
    columns.unshift({ id: "pages", label: "Page", value: row => text((row.placements as Array<{page: string}>).map(p => p.page)), filter: true, filterValues: row => [...new Set((row.placements as Array<{page: string}>).map(p => p.page))], render: row => <>{[...new Set((row.placements as Array<{page: string}>).map(p => p.page))].map(page => <div key={page}><LibraryLink domain="pages" filters={{ q: page }}>{getSiteDetailsPageLabel(page as PageId)}</LibraryLink></div>)}</> });
    columns.push({ id: "section", label: "Section / collection", value: row => {
      const field = row as StoredFieldRow;
      const placement = field.placements[0];
      return `${storedSectionLabel(catalog, field)}${placement?.collection ? ` · ${placement.collection}[].${String(row.key).replace(/^child-/, "").replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())}` : ""}`;
    }, filter: true, filterValues: row => [storedSectionLabel(catalog, row as StoredFieldRow)] });
    columns.push({ id: "visibility", label: "When shown", width: 280, value: row => storedFieldVisibility(catalog, row as StoredFieldRow, fields) });
    columns.push({ id: "input", label: "Input", value: row => text((row.definition as Record<string, unknown>).inputType), filter: true, tag: true }, { id: "required", label: "Required", width: 100, value: row => text(!!(row.definition as Record<string, unknown>).required), filter: true, tag: true });
  } else {
    if (rows.some(row => row.scope !== undefined || row.siteKey !== undefined)) columns.push({ id: "scope", label: "Scope", width: 180, value: row => text(row.siteKey ?? row.clientKey ?? row.scope ?? "Global"), filter: true, tag: true });
    const classification = (row: StoredRow) => row.status ?? row.kind ?? row.categoryKey ?? (row.definition as Record<string, unknown>)?.type ?? (row.definition as Record<string, unknown>)?.area;
    if (rows.some(row => classification(row) !== undefined)) columns.push({ id: "type", label: "Type / status", value: row => text(classification(row)), filter: true, tag: true });
    if (rows.some(row => typeof row.enabled === "boolean" || typeof row.include === "boolean")) columns.push({ id: "enabled", label: "Enabled", width: 100, value: row => text(row.enabled ?? row.include), filter: true, tag: true });
    if (table === "configurationValues" || table === "contentValues" || table === "flagValues") columns.push({ id: "value", label: "Value", width: 320, value: row => text(row.value), render: row => <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>{readableValue(row.value)}</Typography> });
    if (table === "sites") columns.push({ id: "template", label: "Template", value: row => text(row.templateType), filter: true, tag: true });
  }
  if (rows.some(row => Object.entries(row).some(([key, value]) => destinations[key] && value))) columns.push({ id: "related", label: "Related records", width: 220, value: row => Object.entries(row).filter(([key, value]) => destinations[key] && value).map(([,value]) => text(value)).join(", "), render: row => <>{Object.entries(row).filter(([key, value]) => destinations[key] && value).map(([key, value]) => { const [targetDomain, dataset] = destinations[key]; return <div key={key}><LibraryLink domain={targetDomain} filters={{ dataset, q: String(value) }}>{String(value)}</LibraryLink></div>; })}</> });
  columns.push(...libraryRecordColumns(rows, Object.keys(destinations)));
  return <Stack spacing={2}>
    {domain === "coverage" && <Tabs value={table} onChange={(_, value) => changeDataset(value)} variant="scrollable" scrollButtons="auto" aria-label="Coverage types">{datasets.map(([key, name]) => <Tab key={key} value={key} label={name} />)}</Tabs>}
    <BrowseTable hiddenColumns={["displayId"]} label={label} tableName={domain} rows={rows} rowKey={row => `${row.id}:${table === "fields" ? (row as StoredFieldRow).placements.map(placement => placement.page).join(",") : ""}`} filterControls={datasets.length > 1 && domain !== "coverage" ? <TextField select size="small" label="View" value={table} onChange={event => changeDataset(event.target.value)}>{datasets.map(([table, label]) => <MenuItem key={table} value={table}>{label}</MenuItem>)}</TextField> : undefined} columns={columns} />
  </Stack>;
}
