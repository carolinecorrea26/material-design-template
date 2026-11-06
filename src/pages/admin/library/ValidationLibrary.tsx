import { Stack, Tab, Tabs, Typography } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import BrowseTable from "../../../components/docs/BrowseTable";
import { getSiteDetailsPageLabel } from "../../../config/resolvers/resolveClientPages";
import { errorMessages } from "../../../content/docs/errorMessages";
import { fieldValidationChecks } from "../../../utils/fieldValidation";
import type { PageId } from "../../../types";
import LibraryLink from "./LibraryLink";
import { useLibraryCatalog } from "./LibraryCatalogContext";
import { storedFieldRows, storedFieldVisibility, storedLibraryRows } from "./storedLibraryModel";
import { fieldSurfaceRows, type FieldSurfaceRow } from "./fieldSurfaceRows";
import RecoveryStatesLibrary from "./RecoveryStatesLibrary";

type ValidationRow = { id: string; page: string; field: string | null; label: string; level: string; rule: string; message: string; when: string; required: boolean | null };
export function requirementsFieldValidationRows(usages: FieldSurfaceRow[]): ValidationRow[] {
  return usages.filter(usage => usage.source === "requirements-json").flatMap(usage =>
    usage.pages.flatMap(page => fieldValidationChecks(usage.field).map((check, index) => ({
      id: `requirements:${usage.surface}:${page}:${usage.field.id}:${index}`,
      page, field: usage.definitionKey ?? usage.field.id, label: usage.field.label,
      level: "Field", rule: check.rule, message: check.message,
      when: `When ${usage.surface} displays this field`, required: !!usage.field.required,
    }))));
}
export default function ValidationLibrary({ siteKey }: { siteKey: string }) {
  const catalog = useLibraryCatalog();
  const [search, setSearch] = useSearchParams();
  const requested = search.get('view');
  const view = requested === 'states' || requested === 'fields' || requested === 'pages' ? requested : search.has('q') ? 'fields' : 'pages';
  const fields = storedFieldRows(catalog, siteKey);
  const referenced = new Set(fields.flatMap(field => field.placements.map(placement => `${placement.page}:${field.key}`)));
  const usageConditions = new Map<string, string>();
  const usages = fieldSurfaceRows(catalog, siteKey);
  // Questionnaire, collection and tool references reuse saved definitions even
  // when they have no flat page_fields relationship.
  for (const usage of usages) {
    if (usage.source === "requirements-json") continue;
    if (!usage.definitionKey) continue;
    const saved = catalog.data.fields.find(field => field.key === usage.definitionKey);
    if (!saved) continue;
    for (const page of usage.pages) {
      const identity = `${page}:${saved.key}`;
      if (referenced.has(identity)) continue;
      referenced.add(identity);
      fields.push({ ...saved, definition: { ...usage.field, id: saved.key }, placements: [{ page, section: usage.surface, order: 0, collection: "" }] });
      usageConditions.set(identity, `When ${usage.surface} displays this field`);
    }
  }
  const pages = storedLibraryRows(catalog, "pages", siteKey).map(row => String(row.key));
  const rows: ValidationRow[] = fields.flatMap(field => field.placements.flatMap(placement => fieldValidationChecks(field.definition).map((check, index) => ({
    id: `${placement.page}:${field.key}:${index}`, page: placement.page, field: field.key, label: field.definition.label,
    level: "Field", rule: check.rule, message: check.message, when: usageConditions.get(`${placement.page}:${field.key}`) ?? storedFieldVisibility(catalog, field, fields), required: !!field.definition.required,
  }))));
  rows.push(...requirementsFieldValidationRows(usages));
  for (const [index, entry] of errorMessages.entries()) {
    if (entry.level === "Page" && (entry.page === "global" || pages.includes(entry.page))) rows.push({ id: `page-validation:${index}`, page: entry.page, field: null, label: "Page", level: "Page", rule: entry.trigger, message: entry.message, when: entry.trigger, required: null });
  }
  for (const [page, rule, message] of [
    ['beneficiary', 'Individual beneficiary shares must be positive and total no more than 100% for each designation.', 'Enter valid shares totaling at most 100% for {designation} beneficiaries.'],
    ['payment', 'A shared payment method must be available for every selected product.', 'Choose a payment method available for all products.'],
    ['payment', 'A shared payment frequency must be available for every selected product.', 'Choose a payment frequency available for all products.'],
    ['payment', 'Payment authorization must match the current application selections before submission.', 'Authorize payment for your current selections before submitting.'],
    ['review', 'Applicant type must resolve the applicable consent before continuing.', 'A valid applicant type is required to select the applicable consent.'],
  ]) {
    if (pages.includes(page)) rows.push({ id: `cross-field:${page}:${rule}`, page, field: null, label: 'Page', level: 'Page', rule, message, when: rule, required: null });
  }
  rows.sort((a, b) => (a.page === "global" ? -1 : pages.indexOf(a.page)) - (b.page === "global" ? -1 : pages.indexOf(b.page)));
  const pageLabel = (page: string) => page === "global" ? "All pages" : getSiteDetailsPageLabel(page as PageId);
  return <Stack spacing={2}>
    <Tabs value={view} aria-label="Validation types" variant="scrollable" scrollButtons="auto" onChange={(_, next: string) => setSearch({ site: siteKey, view: next })}><Tab value="pages" label="Page errors" /><Tab value="fields" label="Field errors" /><Tab value="states" label="States" /></Tabs>
    {view === 'states' ? <RecoveryStatesLibrary /> : <>
    <Typography variant="body2" color="text.secondary">Field checks use the same validation definitions as the form. Page rules include their trigger and displayed error message.</Typography>
    <BrowseTable label="Validation" tableName="validation" hiddenColumns={["displayId"]} rows={rows.filter(row => row.level === (view === 'fields' ? 'Field' : 'Page'))} rowKey={row => row.id} columns={[
      { id: "pages", label: "Page", width: 180, value: row => row.page, filter: true, render: row => row.page === "global" ? "All pages" : <LibraryLink domain="pages" filters={{ q: row.page }}>{pageLabel(row.page)}</LibraryLink> },
      { id: "field", label: "Field", width: 240, value: row => `${row.label} ${row.field ?? ""}`, render: row => row.field ? <><LibraryLink domain="fields" filters={{ pages: row.page, q: row.field }}>{row.label}</LibraryLink><Typography variant="caption" display="block" color="text.secondary">{row.field}</Typography></> : "Whole page" },
      { id: "level", label: "Applies to", width: 120, value: row => row.level, filter: true, tag: true },
      { id: "required", label: "Required", width: 110, value: row => row.required === null ? "—" : row.required ? "Yes" : "No", filter: true, tag: true },
      { id: "rule", label: "Validation rule", width: 300, value: row => row.rule },
      { id: "message", label: "Error message", width: 340, value: row => row.message },
      { id: "when", label: "When it applies", width: 320, value: row => row.when },
    ]} />
    </>}
  </Stack>;
}
