import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Link, Stack, Typography } from "@mui/material";
import BrowseTable from "../../../components/docs/BrowseTable";
import { getFieldStorybookReference } from "../../../content/docs/fieldStorybook";
import { getStorybookStoryUrl } from "../../../config/storybook";
import { useLibraryCatalog } from "./LibraryCatalogContext";
import { fieldSurfaceRows } from "./fieldSurfaceRows";
import { fieldCatalogRows, fieldInputType, fieldKeyboard, fieldDefaultValue, fieldComponentName } from "./fieldCatalogRows";
import { orderFieldsByPages, pageCatalogRows } from "./pageCatalogRows";
import LibraryLink from "./LibraryLink";

export default function StoredFieldsLibrary({ siteKey }: { siteKey: string }) {
  const catalog = useLibraryCatalog();
  const [search] = useSearchParams();
  const selectedPage = search.get("pages");
  const usages = useMemo(() => fieldSurfaceRows(catalog, siteKey).filter(row => !selectedPage || row.pages.includes(selectedPage)), [catalog, siteKey, selectedPage]);
  const rows = useMemo(() => orderFieldsByPages(
    fieldCatalogRows(catalog, siteKey, usages).filter(row => !selectedPage || usages.some(usage => usage.definitionKey === row.key)),
    pageCatalogRows(catalog, siteKey, usages),
  ), [catalog, siteKey, usages, selectedPage]);
  return <Stack spacing={2}>
    <BrowseTable label="Fields" tableName="fields" identityPosition="first" searchOnly rows={rows} rowKey={row => row.key} columns={[
      { id: "displayId", label: "Field ID", width: 210, value: row => row.field.displayName ?? row.key, expandable: true },
      { id: "field", label: "Input label", width: 300, value: row => row.field.label || "—", expandable: true },
      { id: "input", label: "Input type", width: 140, value: row => fieldInputType(row.field), filter: true },
      { id: "component", label: "Component", width: 180, value: row => fieldComponentName(row.field), render: row => {
        const story = getFieldStorybookReference(row.field);
        return story ? <Link href={getStorybookStoryUrl(story.storyId)} target="_blank" rel="noopener noreferrer">{fieldComponentName(row.field)}</Link> : "—";
      } },
      { id: "keyboard", label: "Keyboard", width: 140, value: row => fieldKeyboard(row.field), filter: true },
      { id: "options", label: "Options", width: 260, expandable: true,
        value: row => row.field.options?.map(option => `${option.label} (value="${option.value}")`).join("\n") || "—", render: row => {
        const options = row.field.options ?? [];
        return options.length ? <Typography component="ul" variant="body2" sx={{ m: 0, pl: 2 }}>{options.map((option, index) => <li key={`${option.value}:${index}`}>{option.label} (value="{option.value}")</li>)}</Typography> : "—";
      } },
      { id: "default", label: "Default option", width: 150, value: row => fieldDefaultValue(row.field) },
      { id: "helper", label: "Helper text", width: 300, value: row => row.field.helperText || "—", expandable: true },
    ]} />
    <details>
      <summary>Page and section usage</summary>
      <Stack spacing={2} sx={{ mt: 2 }}>
        <Typography variant="body2">One definition can be used in several places. Product controls are generated from product configuration and have no separate field record.</Typography>
        <BrowseTable label="Field usage" tableName="field-usage" searchOnly hiddenColumns={["displayId"]} rows={usages} rowKey={row => row.key} columns={[
          { id: "definition", label: "Field reference", width: 240, value: row => row.definitionKey ?? "—", render: row => row.definitionKey ? <LibraryLink domain="fields" filters={{ q: row.definitionKey }}>{row.definitionKey}</LibraryLink> : "—" },
          { id: "label", label: "Label", width: 280, value: row => row.field.label },
          { id: "page", label: "Page", width: 180, value: row => row.pages.join(", ") || "Unassigned", filter: true, filterValues: row => row.pages, render: row => row.pages.map(page => <div key={page}><LibraryLink domain="pages" filters={{ q: page }}>{page}</LibraryLink></div>) },
          { id: "section", label: "Section or tool", width: 280, value: row => row.surface, filter: true },
          { id: "source", label: "Source", width: 160, value: row => row.definitionKey ? "Saved field" : "Product configuration" },
        ]} />
      </Stack>
    </details>
    <Typography variant="body2">Required fields and visibility behavior are documented under <LibraryLink domain="rules">Business rules</LibraryLink> and <LibraryLink domain="validation">Validations</LibraryLink>.</Typography>
  </Stack>;
}
