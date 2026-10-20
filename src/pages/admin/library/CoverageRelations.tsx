import { riderEntityKey } from "../../../domain/riderIdentity";
import { Stack, Typography } from "@mui/material";
import BrowseTable from "../../../components/docs/BrowseTable";
import type { CoverageDefinition } from "../../../domain/coverage";
import { libraryMetadata } from "../../../domain/provenance";

/** Read-only projections of current runtime authoring data; no migration fixture imports. */
export default function CoverageRelations({ products, siteKey }: { products: CoverageDefinition[]; siteKey: string | null }) {
  const amounts = products.flatMap(product => (product.coverageAmounts ?? []).map((amount, index) => {
    const key = `${siteKey ?? "global"}.${product.id}.amount.${index}`;
    return { key, product, amount, ...libraryMetadata("productAmountRules", key, `prototype:${key}`) };
  }));
  const riders = products.flatMap(product => (product.riders ?? []).map(rider => {
    const key = `${product.id}.${rider.id}`;
    return { key, product, rider, riderKey: riderEntityKey(product.id, rider), ...libraryMetadata("productRiders", key, `prototype:${key}`) };
  }));
  const definitions = [...new Map(riders.map(r => [r.riderKey, r])).values()];
  return <Stack spacing={2}>
    <Typography variant="h6">Coverage amount definitions</Typography>
    <BrowseTable label="Coverage amounts" rows={amounts} rowKey={r => r.key} columns={[
      { id: "displayId", label: "ID #", value: r => String(r.displayId) },
      { id: "key", label: "Key", value: r => r.key, width: 280 },
      { id: "product", label: "Product", value: r => r.product.name, filter: true, render: r => <a href={`#product-${r.product.id}`}>{r.product.name}</a>, relations: r => [{ table: "products", key: r.product.id, label: r.product.name }] },
      { id: "applicant", label: "Applicant", value: r => r.amount.scope?.applicantType ?? "All eligible", filter: true },
      { id: "class", label: "Class", value: r => r.amount.scope?.applicantClassId ?? "" },
      { id: "schedule", label: "Schedules / options", value: r => (r.amount.selections ?? []).map(s => s.type === "range" ? `${s.min}–${s.max}; increment ${s.increment}` : s.type === "amountList" ? s.values.join(", ") : s.options.map(o => `${o.value}: ${o.label}`).join("; ")).join("\n"), width: 300 },
      { id: "derived", label: "Base / calculation", value: r => r.amount.derivedFrom ? `${r.amount.derivedFrom.applicantType}: ${r.amount.derivedFrom.calculation.type} ${r.amount.derivedFrom.calculation.value}` : "" },
      { id: "providedBy", label: "Provided by", value: r => r.providedBy ?? "" },
      { id: "source", label: "Source", value: r => r.sourceReference ?? "" },
    ]} />
    <Typography variant="h6">Product / rider relationships</Typography>
    <BrowseTable label="Product riders" rows={riders} rowKey={r => r.key} columns={[
      { id: "displayId", label: "ID #", value: r => String(r.displayId) },
      { id: "key", label: "Key", value: r => r.key, width: 260 },
      { id: "product", label: "Product", value: r => r.product.name, filter: true, render: r => <a href={`#product-${r.product.id}`}>{r.product.name}</a>, relations: r => [{ table: "products", key: r.product.id, label: r.product.name }] },
      { id: "rider", label: "Rider", value: r => r.rider.name, render: r => <a href={`#${r.riderKey}`}>{r.rider.name}</a>, relations: r => [{ table: "riders", key: r.riderKey, label: r.rider.name }] },
      { id: "applicants", label: "Eligible applicants", value: r => r.rider.applicants?.join(", ") ?? "" },
      { id: "providedBy", label: "Provided by", value: r => r.providedBy ?? "" },
      { id: "source", label: "Source", value: r => r.sourceReference ?? "" },
    ]} />
    <Typography variant="h6">Rider definitions</Typography>
    <BrowseTable label="Rider definitions" tableName="riders" rows={definitions.map(r => ({ ...r.rider, key: r.riderKey }))} rowKey={r => r.key} columns={[
      { id: "name", label: "Rider", value: r => r.name, render: r => <span id={r.key}>{r.name}</span> },
      { id: "key", label: "Canonical key", value: r => r.key, width: 350 },
      { id: "description", label: "Description", value: r => r.description ?? "", width: 350 },
    ]} />
  </Stack>;
}
