import { Button, Link, Stack, Typography } from "@mui/material";
import BrowseTable from "../../../components/docs/BrowseTable";
import { getSiteDetailsPageLabel } from "../../../config/resolvers/resolveClientPages";
import { getSitePagePrototypeUrl } from "../../../config/sitePrototype";
import type { PageId } from "../../../types";
import { useLibraryCatalog } from "./LibraryCatalogContext";
import { storedApplicationPageRows } from "./storedLibraryModel";

export default function StoredPagesLibrary({ siteKey }: { siteKey: string }) {
  const catalog = useLibraryCatalog();
  const effective = siteKey !== "all";
  return <Stack spacing={2}>
    <Stack spacing={1}>
      <Typography variant="subtitle2">Error page previews</Typography>
      <Stack direction="row" spacing={1}>
        {[404, 500].map(status => <Button key={status} variant="outlined" size="small" href={getSitePagePrototypeUrl(effective ? siteKey : "demo", "home", `/${status}`)} target="_blank" rel="noopener noreferrer">Preview {status}</Button>)}
      </Stack>
    </Stack>
    <BrowseTable label="Pages" tableName="pages" hiddenColumns={["displayId"]}
    rows={storedApplicationPageRows(catalog, siteKey)} rowKey={row => String(row.key)} columns={[
      { id: "page", label: "Page", width: 260, value: row => `${getSiteDetailsPageLabel(String(row.key) as PageId)} ${row.key}`, render: row => <Link fontWeight={700} href={getSitePagePrototypeUrl(effective ? siteKey : "demo", String(row.key) as PageId, row.route)} target="_blank" rel="noopener noreferrer">{getSiteDetailsPageLabel(String(row.key) as PageId)}</Link> },
      { id: "flow", label: "Flow", width: 160, value: row => row.flow, filter: true },
      { id: "sequence", label: "Application order", width: 180, value: row => row.sequence },
      { id: "route", label: "Route", width: 240, value: row => row.route },
      ...(effective ? [
        { id: "enabled", label: "Enabled", width: 120, value: (row: ReturnType<typeof storedApplicationPageRows>[number]) => row.enabled ? "Yes" : "No", filter: true, tag: true },
        { id: "requirement", label: "Page requirement", width: 180, value: (row: ReturnType<typeof storedApplicationPageRows>[number]) => row.requirement, filter: true, tag: true },
      ] : []),
    ]} />
  </Stack>;
}
