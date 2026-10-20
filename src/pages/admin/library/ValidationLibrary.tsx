import { Stack, Typography } from "@mui/material";
import BrowseTable from "../../../components/docs/BrowseTable";
import { getSiteDetailsPageLabel } from "../../../config/resolvers/resolveClientPages";
import { errorMessages } from "../../../content/docs/errorMessages";
import { fieldValidationChecks } from "../../../utils/fieldValidation";
import type { PageId } from "../../../types";
import LibraryLink from "./LibraryLink";
import { useLibraryCatalog } from "./LibraryCatalogContext";
import { storedFieldRows, storedFieldVisibility, storedLibraryRows } from "./storedLibraryModel";

type ValidationRow = { id: string; page: string; field: string | null; label: string; level: string; rule: string; message: string; when: string; required: boolean | null };
export default function ValidationLibrary({ siteKey }: { siteKey: string }) {
  const catalog = useLibraryCatalog();
  const fields = storedFieldRows(catalog, siteKey);
  const pages = storedLibraryRows(catalog, "pages", siteKey).map(row => String(row.key));
  const rows: ValidationRow[] = fields.flatMap(field => field.placements.flatMap(placement => fieldValidationChecks(field.definition).map((check, index) => ({
    id: `${placement.page}:${field.key}:${index}`, page: placement.page, field: field.key, label: field.definition.label,
    level: "Field", rule: check.rule, message: check.message, when: storedFieldVisibility(catalog, field, fields), required: !!field.definition.required,
  }))));
  for (const [index, entry] of errorMessages.entries()) {
    if (entry.level === "Page" && (entry.page === "global" || pages.includes(entry.page))) rows.push({ id: `page-validation:${index}`, page: entry.page, field: null, label: "Page", level: "Page", rule: entry.trigger, message: entry.message, when: entry.trigger, required: null });
  }
  rows.sort((a, b) => (a.page === "global" ? -1 : pages.indexOf(a.page)) - (b.page === "global" ? -1 : pages.indexOf(b.page)));
  const pageLabel = (page: string) => page === "global" ? "All pages" : getSiteDetailsPageLabel(page as PageId);
  return <Stack spacing={2}>
    <Typography variant="body2" color="text.secondary">Field checks use the same validation definitions as the form. Page rules include their trigger and displayed error message.</Typography>
    <BrowseTable label="Validation" tableName="validation" hiddenColumns={["displayId"]} rows={rows} rowKey={row => row.id} columns={[
      { id: "pages", label: "Page", width: 180, value: row => row.page, filter: true, render: row => row.page === "global" ? "All pages" : <LibraryLink domain="pages" filters={{ q: row.page }}>{pageLabel(row.page)}</LibraryLink> },
      { id: "field", label: "Field", width: 240, value: row => `${row.label} ${row.field ?? ""}`, render: row => row.field ? <><LibraryLink domain="fields" filters={{ pages: row.page, q: row.field }}>{row.label}</LibraryLink><Typography variant="caption" display="block" color="text.secondary">{row.field}</Typography></> : "Whole page" },
      { id: "level", label: "Applies to", width: 120, value: row => row.level, filter: true, tag: true },
      { id: "required", label: "Required", width: 110, value: row => row.required === null ? "—" : row.required ? "Yes" : "No", filter: true, tag: true },
      { id: "rule", label: "Validation rule", width: 300, value: row => row.rule },
      { id: "message", label: "Error message", width: 340, value: row => row.message },
      { id: "when", label: "When it applies", width: 320, value: row => row.when },
    ]} />
  </Stack>;
}
