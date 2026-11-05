import { resolveRatePresentation } from "../../../domain/ratePresentation";
import ReferenceRateTableLink from "../../../components/coverage/ReferenceRateTableLink";
import { useMemo } from "react";
import { Alert, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import ResponsiveTableContainer from "../../../components/docs/ResponsiveTableContainer";
import { PortalDataProvider, usePortalData } from "../../../app/PortalDataProvider";
import type { PortalDataRepository } from "../../../repositories/portalDataRepository";
import { createStoredLibraryRepository } from "../../../repositories/storedLibraryRepository";
import { inspectSiteAggregates } from "../../../domain/aggregateInspection";

export default function CoverageAggregateLibrary({ siteKey, repository }: { siteKey: string | null; repository?: PortalDataRepository }) {
  const storedRepository = useMemo(() => repository ?? createStoredLibraryRepository(siteKey ?? "all"), [repository, siteKey]);
  return <PortalDataProvider repository={storedRepository}><AggregateRows siteKey={siteKey} /></PortalDataProvider>;
}

function AggregateRows({ siteKey }: { siteKey: string | null }) {
  const data = usePortalData();
  if (data.status === "loading") return <Typography>Loading reviewed aggregate limits…</Typography>;
  if (data.status === "error") return <Alert severity="error">Aggregate limits could not be loaded: {data.error.message}</Alert>;
  try {
    const sites = data.revision.query("sites").rows.filter(site => site.status === "active" && !site.deletedAt && (siteKey === null || site.key === siteKey));
    if (siteKey !== null && sites.length !== 1) throw new Error(`Unavailable Site: ${siteKey}`);
    const resolved = sites.map(site => data.revision.resolveSite(site.key).site);
    const rows = resolved.flatMap(inspectSiteAggregates);
    return <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6">Aggregate limits by Site</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Stored Library configuration · unpublished. Limits apply to the listed products and applicants.</Typography>
      <ResponsiveTableContainer><Table size="small" aria-label="Reviewed aggregate limits"><TableHead><TableRow>
        <TableCell>Client / Site</TableCell><TableCell>Category</TableCell><TableCell>Applicants</TableCell><TableCell>Aggregate maximum</TableCell><TableCell>Included products</TableCell><TableCell>Excluded products / conditions</TableCell>
      </TableRow></TableHead><TableBody>{rows.map(row => <TableRow key={row.key}>
        <TableCell>{row.clientKey}<div>{row.siteKey}</div></TableCell><TableCell>{row.category}</TableCell><TableCell>{row.applicants}</TableCell><TableCell>{row.maximum}</TableCell>
        <TableCell>{row.included.length ? row.included.map(product => <div key={product}>{product}</div>) : "—"}</TableCell>
        <TableCell>{row.excluded.length > 0 && <div>Excluded: {row.excluded.join(", ")}</div>}{row.notes.map(note => <div key={note}>{note}</div>)}{row.sources.length > 0 && <details><summary>Source evidence</summary>{row.sources.map(source => <div key={source}>{source}</div>)}</details>}</TableCell>
      </TableRow>)}</TableBody></Table></ResponsiveTableContainer>
      {!rows.length && <Typography>No reviewed aggregate policies for this Site.</Typography>}
      <Typography variant="h6" sx={{ mt: 3 }}>Rate presentation by Site</Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>PRASE capability enables quote options; calculated premiums still require a verified rate response. Reference tables open in a drawer.</Typography>
      <ResponsiveTableContainer><Table size="small" aria-label="Reviewed rate presentation"><TableHead><TableRow><TableCell>Site</TableCell><TableCell>Rates in PRASE</TableCell><TableCell>Presentation</TableCell><TableCell>Reference tables</TableCell></TableRow></TableHead><TableBody>{resolved.map(site => {
        const presentation = resolveRatePresentation(site, site.products[0]?.productKey ?? "");
        return <TableRow key={site.siteKey}><TableCell>{site.siteKey}</TableCell><TableCell>{presentation.status === "unresolved" ? "Invalid configuration" : presentation.praseConfigured ? "Yes" : "No"}</TableCell><TableCell>{presentation.hideCalculatedRates ? "Hero image homepage; quote tool and calculated rates hidden" : `Quote tool ${presentation.quoteToolEnabled ? "enabled" : "disabled"}; Coverage estimates ${presentation.coverageQuoteEnabled ? "enabled" : "disabled"} when rates are available`}</TableCell><TableCell>{site.products.map(product => {
          const productPresentation = resolveRatePresentation(site, product.productKey);
          return productPresentation.referenceTable ? <div key={product.productKey}>{product.productKey}: <ReferenceRateTableLink table={productPresentation.referenceTable} /></div> : null;
        })}{site.configuration.products.every(product => !product.referenceRateTables.length) && "Not configured"}</TableCell></TableRow>;
      })}</TableBody></Table></ResponsiveTableContainer>
    </Paper>;
  } catch (reason) {
    return <Alert severity="error">Aggregate limits could not be resolved: {reason instanceof Error ? reason.message : String(reason)}</Alert>;
  }
}
