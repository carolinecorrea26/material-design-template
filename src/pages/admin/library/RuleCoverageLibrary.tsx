import { Stack, Typography } from "@mui/material";
import BrowseTable from "../../../components/docs/BrowseTable";
import { coverageReviewLabels, requirementCoverageRows } from "../../../domain/requirementCoverage";
import { useLibraryCatalog } from "./LibraryCatalogContext";
import LibraryLink from "./LibraryLink";

export default function RuleCoverageLibrary({ siteKey }: { siteKey: string }) {
  const { data } = useLibraryCatalog();
  const rows = requirementCoverageRows(data, siteKey);
  return <Stack spacing={2}>
    <Typography variant="body2" color="text.secondary">Each row reviews one requirement against its stored owner and application behavior. Owner changes reset verified requirements to review pending. Verification covers that requirement only. Areas and requirements absent from this register remain unreviewed.</Typography>
    <BrowseTable label="Rule coverage review" tableName="semanticRequirements" rows={rows} rowKey={row => row.id} columns={[
      { id: "area", label: "Area", value: row => row.area, filter: true },
      { id: "requirement", label: "Requirement", width: 270, value: row => row.title },
      { id: "scope", label: "Site", value: row => row.siteKey, filter: true },
      { id: "product", label: "Product", width: 220, value: row => row.productKey ?? "Site entry", render: row => row.productKey ? <LibraryLink domain="products" filters={{ dataset: "products", q: row.productKey }}>{data.products.find(product => product.key === row.productKey)?.definition.name ?? row.productKey}</LibraryLink> : "Site entry" },
      { id: "expected", label: "Expected behavior", width: 370, value: row => row.expectedBehavior },
      { id: "status", label: "Coverage status", width: 210, value: row => coverageReviewLabels[row.status], filter: true },
      { id: "finding", label: "Finding", width: 370, value: row => row.finding },
      { id: "owner", label: "Owning records", width: 300, value: row => row.owners.map(owner => `${owner.table}/${owner.key}${owner.column ? ` · ${owner.column}` : ""}`).join("; "), render: row => <Stack spacing={0.5}>{row.owners.map(owner => <LibraryLink key={`${owner.table}:${owner.key}`} domain={owner.table === "fields" ? "fields" : owner.table === "sites" ? "client-information" : "rules"} filters={{ q: owner.key }}>{owner.table}/{owner.key}</LibraryLink>)}</Stack> },
      { id: "sources", label: "Source and decisions", width: 280, value: row => row.sourceReferences.join("; ") },
      { id: "evidence", label: "Verification evidence", width: 300, value: row => row.verificationReferences.join("; ") || "Pending" },
    ]} />
  </Stack>;
}
