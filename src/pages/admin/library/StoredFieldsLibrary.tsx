import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Link, Typography } from "@mui/material";
import BrowseTable from "../../../components/docs/BrowseTable";
import { getFieldStorybookReference } from "../../../content/docs/fieldStorybook";
import { getStorybookStoryUrl } from "../../../config/storybook";
import { useLibraryCatalog } from "./LibraryCatalogContext";
import { fieldSurfaceRows } from "./fieldSurfaceRows";

export default function StoredFieldsLibrary({ siteKey }: { siteKey: string }) {
  const catalog = useLibraryCatalog();
  const [search] = useSearchParams();
  const selectedPage = search.get("pages");
  const rows = useMemo(() => fieldSurfaceRows(catalog, siteKey).filter(row => !selectedPage || row.pages.includes(selectedPage)), [catalog, siteKey, selectedPage]);
  return <BrowseTable label="Fields" tableName="fields" hiddenColumns={["displayId"]}
    rows={rows} rowKey={row => row.key} columns={[
      { id: "field", label: "Field", width: 280, value: row => `${row.field.label} ${row.field.id}`, render: row => {
        const story = getFieldStorybookReference(row.field);
        return <><Typography variant="body2" fontWeight={700}>{story ? <Link href={getStorybookStoryUrl(story.storyId)} target="_blank" rel="noopener noreferrer">{row.field.label}</Link> : row.field.label}</Typography><Typography variant="caption" display="block" color="text.secondary">{row.field.id}</Typography></>;
      } },
      { id: "input", label: "Input type", width: 160, value: row => row.field.inputType, filter: true, tag: true },
      { id: "component", label: "Component / Storybook", width: 220, value: row => getFieldStorybookReference(row.field)?.label ?? "Not documented", missingDetails: row => !getFieldStorybookReference(row.field) ? "No matching Storybook control reference is documented." : undefined, render: row => {
        const story = getFieldStorybookReference(row.field);
        return story ? <Link href={getStorybookStoryUrl(story.storyId)} target="_blank" rel="noopener noreferrer">{story.label}</Link> : "Not documented";
      } },
      { id: "appearance", label: "Where it appears", width: 280, value: row => row.surface, filter: true, filterValues: row => [row.surface] },
      { id: "order", label: "Order", width: 100, value: row => row.order === null ? "—" : String(row.order) },
      { id: "required", label: "Requirement", width: 160, value: row => row.field.required ? "Required" : "Optional", filter: true, tag: true },
      { id: "options", label: "Options", width: 260, value: row => row.field.options?.map(option => option.label).join("; ") || row.optionsNote || "—", render: row => {
        const options = row.field.options ?? [];
        const list = <Typography component="ul" variant="body2" sx={{ m: 0, pl: 2 }}>{options.map((option, index) => <li key={`${option.value}:${index}`}>{option.label}</li>)}</Typography>;
        return options.length > 5 ? <details><summary>{options.length} options</summary>{list}</details> : options.length ? list : row.optionsNote || "—";
      } },
    ]} />;
}
