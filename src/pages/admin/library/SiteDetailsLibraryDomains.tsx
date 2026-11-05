import Chip from "../../../components/docs/LibraryTag";
import { formatConditionVisibilityTargets } from "../../../config/conditions/conditionTargets";
import { riderEntityKey } from "../../../domain/riderIdentity";
import { coverageQuestionRequirements } from "../../../config/coverageQuestionRequirements";
import LibraryLink from "./LibraryLink";
import { ruleDisplayType, ruleRelations, getLibraryRules, getLibraryFieldIds, getLibraryPages } from "./libraryInspection";
import { useSearchParams } from "react-router-dom";
import { formatConditionDefinition } from "../../../config/conditions";
import { libraryRepository } from "../../../repositories/libraryRepository";
import BrowseTable from "../../../components/docs/BrowseTable";
import { CLIENT_HIGHLIGHT_BG } from "../../../components/docs/ClientNote";
import { formatCoverageRequirements, formatCoverageDetails } from "../../../utils/coverageRequirements";
import CoverageRelations from "./CoverageRelations";
import { useLibraryScope } from "./LibraryScope";
import { formatCoverageAmounts } from "../../../utils/coverageAmounts";
import { formatProductIdentifiers } from "../../../utils/coverageIdentifiers";
import TruncatedString from "../../../components/docs/TruncatedString";
import { lazy, Suspense, type ReactNode } from "react";
import { Box,  Paper, Stack,  Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
const CoverageAggregateLibrary = lazy(() => import("./CoverageAggregateLibrary"));






import { getAssociationsForSite, getClientForSite, getSite, getTpaForClient, resolveEffectiveBranding, resolveSite, resolveSiteConfigurations, resolveSiteCoverage } from "../../../data";
import ResponsiveTableContainer from "../../../components/docs/ResponsiveTableContainer";
import ResolvedConfigurationList from "../../../components/docs/ResolvedConfigurationList";

import ValidationReferenceList from "../../../components/docs/ValidationReferenceList";
import { useLibrarySite } from "./LibrarySiteSelector";

const coverages = libraryRepository.read("coverages");
const coverageCategories = libraryRepository.read("coverageCategories");
const urlParameters = libraryRepository.read("urlParameters");


function ScopeTabs({ global, effective }: { global: ReactNode; effective: ReactNode }) {
  const scope = useLibraryScope();
  return <Box>{scope === "global" ? global : effective}</Box>;
}

function ScopedSiteContent({ children }: { children: (siteId: string) => ReactNode }) {
  const [siteId] = useLibrarySite();
  return <Stack spacing={2.5}>{children(siteId)}</Stack>;
}

export function SiteOverviewLibrary() {
  return <ScopedSiteContent>{(siteId) => {
    const site = getSite(siteId)!;
    const client = getClientForSite(siteId)!;
    const tpa = getTpaForClient(client.id)!;
    const resolved = resolveSite(siteId);
    const branding = resolveEffectiveBranding({ siteId });
    const associations = getAssociationsForSite(siteId);
    return <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>TPA → Client → Site</Typography><ResponsiveTableContainer><Table size="small"><TableBody>
        <TableRow><TableCell sx={{ fontWeight: 700, width: 200 }}>TPA</TableCell><TableCell>{tpa.name} <Typography component="span" variant="caption" sx={{ fontFamily: "monospace" }}>({tpa.id})</Typography></TableCell></TableRow>
        <TableRow><TableCell sx={{ fontWeight: 700 }}>Client</TableCell><TableCell>{client.name} ({client.acronym}) <Typography component="span" variant="caption" sx={{ fontFamily: "monospace" }}>({client.id})</Typography></TableCell></TableRow>
        <TableRow><TableCell sx={{ fontWeight: 700 }}>Site</TableCell><TableCell>{site.name} <Typography component="span" variant="caption" sx={{ fontFamily: "monospace" }}>({site.id})</Typography></TableCell></TableRow>
        <TableRow><TableCell sx={{ fontWeight: 700 }}>Template</TableCell><TableCell>{site.templateType}</TableCell></TableRow>
        <TableRow><TableCell sx={{ fontWeight: 700 }}>Resolution</TableCell><TableCell><Chip size="small" label={resolved.status} color={resolved.status === "overridden" ? "warning" : "default"} /></TableCell></TableRow>
      </TableBody></Table></ResponsiveTableContainer></Paper>
      <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>Effective identity, branding, and support</Typography><ResponsiveTableContainer><Table size="small"><TableBody>
        <TableRow><TableCell sx={{ fontWeight: 700, width: 200 }}>Brand name</TableCell><TableCell>{branding.name}</TableCell></TableRow>
        <TableRow><TableCell sx={{ fontWeight: 700 }}>Logo</TableCell><TableCell sx={{ wordBreak: "break-word" }}>{branding.logo} · {branding.logoAlt}</TableCell></TableRow>
        <TableRow><TableCell sx={{ fontWeight: 700 }}>Support phone</TableCell><TableCell>{resolved.effective.support.phoneDisplay ?? resolved.effective.support.phone ?? "—"}</TableCell></TableRow>
        <TableRow><TableCell sx={{ fontWeight: 700 }}>Support email</TableCell><TableCell>{resolved.effective.support.email ?? "—"}</TableCell></TableRow>
        <TableRow><TableCell sx={{ fontWeight: 700 }}>Support website</TableCell><TableCell>{resolved.effective.support.website ?? "—"}</TableCell></TableRow>
        <TableRow><TableCell sx={{ fontWeight: 700 }}>Associations</TableCell><TableCell>{associations.length ? associations.map((entry) => entry.name).join(", ") : "—"}</TableCell></TableRow>
      </TableBody></Table></ResponsiveTableContainer></Paper>
    </Stack>;
  }}</ScopedSiteContent>;
}

export function ConfigurationsLibrary() {
  return <ScopedSiteContent>{(siteId) => <ScopeTabs global={<ResolvedConfigurationList global rows={resolveSiteConfigurations("demo")} />} effective={<ResolvedConfigurationList rows={resolveSiteConfigurations(siteId)} />} />}</ScopedSiteContent>;
}

export function RulesLibrary() {
  const [siteId] = useLibrarySite();
  const scope = useLibraryScope();
  const rules = getLibraryRules(scope, siteId);
  const fieldIds = getLibraryFieldIds(scope, siteId);
  return <BrowseTable hiddenColumns={scope === "global" ? ["ruleScope", "applicability"] : []} label="Rules" tableName="rules" rows={rules} rowKey={r => r.id} columns={[
    { id: "id", label: "Rule ID", value: r => r.id, width: 240 },
    { id: "rule", label: "Rule", value: r => r.rule, width: 230 },
    { id: "area", label: "Area", value: r => r.area, filter: true },
    { id: "type", label: "Type", value: ruleDisplayType, missingDetails: r => ruleDisplayType(r) === "Unclassified" ? "Rule type has not been classified." : undefined, filter: true, tag: true },
    { id: "ruleScope", label: "Scope", value: r => r.scope ?? "global", filter: true, tag: true },
    { id: "applicability", label: "Site applicability", value: r => [...r.siteIds ?? [], ...r.clientIds ?? []].join(", ") || "All", filter: true },
    { id: "status", label: "Status", value: r => r.conditionIds?.length ? "Executable condition" : "Documented behavior", filter: true, tag: true },
    { id: "target", label: "Target", value: r => ruleRelations(r).map(ref => ref.key).join(", ") || "Not modeled", filter: true, filterValues: r => ruleRelations(r).map(ref => ref.key), render: r => <>{ruleRelations(r).map(ref => <div key={`${ref.domain}:${ref.key}`}>{(ref.domain === "fields" ? fieldIds.has(ref.key) : getLibraryPages(scope, siteId).some(p => p.id === ref.key)) ? <LibraryLink domain={ref.domain} filters={{ [ref.filter]: ref.key }}>{ref.key}</LibraryLink> : <span>{ref.key} (not in this Library scope)</span>}</div>)}</> },
    { id: "behavior", label: "Behavior", value: r => r.behavior, width: 340, render: r => <TruncatedString value={r.behavior} threshold={200} /> },
    { id: "conditions", label: "Conditions", value: r => (r.conditionIds ?? []).map(id => `${formatConditionDefinition(id)} → ${formatConditionVisibilityTargets(id)}`).join("; "), width: 300 },
    { id: "ref", label: "Source", value: r => r.ref, width: 260 },
  ]} />;
}

export function CoverageLibrary() {
  const [siteId] = useLibrarySite();
  const scope = useLibraryScope();
  const [search] = useSearchParams();
  const effective = resolveSiteCoverage(siteId).filter(row => row.status !== "disabled");
  const config = resolveSite(siteId).effective;
  const categoryRows = scope === "global" ? coverageCategories : coverageCategories.filter(category => effective.some(row => row.effective.categoryId === category.id));
  const productRows = scope === "global" ? coverages.filter(c => !search.get("category") || c.categoryId === search.get("category")).map((coverage) => ({ coverage, status: "global", diffs: [] })) : effective.filter(r => !search.get("category") || r.effective.categoryId === search.get("category")).map((row) => ({ coverage: row.effective, status: row.status, diffs: row.clientDiffs }));
  return <Stack spacing={2.5}>
    {scope === "effective" && config.applicantClassifications && <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="subtitle2">Applicant classifications</Typography>{config.applicantClassifications.map((entry) => <Typography key={entry.id} variant="body2">{entry.label} ({entry.id}) · {entry.applicantType}</Typography>)}</Paper>}
    <CoverageTable rows={productRows} />
    <CoverageRelations products={productRows.map(row => row.coverage)} siteKey={scope === "global" ? null : siteId} />
    <Suspense fallback={<Typography>Loading reviewed aggregate limits…</Typography>}><CoverageAggregateLibrary siteKey={scope === "global" ? null : siteId} /></Suspense>
    <Typography variant="h6">Coverage categories</Typography>
    <ResponsiveTableContainer libraryTable="coverageCategories"><Table size="small"><TableBody>{categoryRows.map((category, index) => <TableRow key={category.id} id={`category-${category.id}`}><TableCell>{index + 1}. <LibraryLink domain="coverage" filters={{ category: category.id }}>{category.label} ({category.id}) products</LibraryLink></TableCell></TableRow>)}</TableBody></Table></ResponsiveTableContainer>
  </Stack>;
}

function CoverageTable({ rows }: { rows: Array<{ coverage: (typeof coverages)[number]; status: string; diffs: string[] }> }) {
  const scope = useLibraryScope();
  const [siteId] = useLibrarySite();
  const fieldIds = getLibraryFieldIds(scope, siteId);
  const effective = scope === "effective";
  return <ResponsiveTableContainer libraryTable="products"><Table size="small" aria-label="Coverage products" sx={{ tableLayout: "fixed", minWidth: effective ? 2020 : 1660 }}><colgroup>{[220, 120, 220, 300, 340, 300, 160, ...(effective ? [140, 220] : [])].map((width, index) => <col key={index} style={{ width }} />)}</colgroup><TableHead><TableRow><TableCell>Product / category sequence</TableCell><TableCell>Category</TableCell><TableCell>Identifiers / situs</TableCell><TableCell>Amounts</TableCell><TableCell>Underwriting / requirements</TableCell><TableCell>Notes / options</TableCell><TableCell>Applicants</TableCell>{effective && <TableCell>Resolution</TableCell>}{effective && <TableCell>Differences</TableCell>}</TableRow></TableHead><TableBody>{rows.map(({ coverage, status, diffs }) => <TableRow key={coverage.id} id={`product-${coverage.id}`} sx={status === "disabled" ? { opacity: 0.55 } : undefined}><TableCell><Typography variant="body2" sx={{ fontWeight: 700 }}>{coverage.name}</Typography><div>Category position: {rows.filter(r => r.coverage.categoryId === coverage.categoryId).findIndex(r => r.coverage.id === coverage.id) + 1}</div><Typography variant="caption" sx={{ fontFamily: "monospace" }}>{coverage.id}</Typography><details><summary>Riders</summary>{coverage.riders?.map(r => <div key={r.id}><a href={`#${riderEntityKey(coverage.id, r)}`}>{r.name}</a></div>)}</details></TableCell><TableCell><a href={`#category-${coverage.categoryId}`}>{coverage.categoryId}</a><details><summary>Related questions</summary>{Object.values(coverageQuestionRequirements[coverage.categoryId]).flat().map(field => <div key={field}>{fieldIds.has(field) ? <LibraryLink domain="fields" filters={{ q: field }}>{field}</LibraryLink> : <span>{field} (not in this Library scope)</span>}</div>)}</details></TableCell><TableCell sx={{ minWidth: 160, whiteSpace: "pre-line", bgcolor: diffs.some((key) => ["gNumber", "planCode", "groupPolicySitus"].includes(key)) ? CLIENT_HIGHLIGHT_BG : undefined }}><TruncatedString value={`Code: ${coverage.code}\nG-number: ${formatProductIdentifiers(coverage.gNumber)}\nPlan: ${formatProductIdentifiers(coverage.planCode)}\nSitus: ${coverage.groupPolicySitus ?? "—"}`} threshold={180} /></TableCell><TableCell sx={{ minWidth: 240, whiteSpace: "pre-line", bgcolor: diffs.some((key) => ["coverageAmounts", "riders"].includes(key)) ? CLIENT_HIGHLIGHT_BG : undefined }}><TruncatedString value={`${formatCoverageAmounts(coverage)}`} threshold={220} /></TableCell><TableCell sx={{ minWidth: 280, whiteSpace: "pre-line", bgcolor: diffs.some((key) => ["underwritingType", "underwritingBands", "requirements"].includes(key)) ? CLIENT_HIGHLIGHT_BG : undefined }}><TruncatedString value={`${coverage.underwritingType}\n${(coverage.underwritingBands ?? []).map((band) => `${band.scope.applicantType}: ${band.label}; ages ${band.minimumAgeYears}–${band.maximumAgeYears}; ${band.minimumAmountExclusive ? ">" : ""}${band.minimumAmount}–${band.maximumAmount}`).join("\n")}\n${formatCoverageRequirements(coverage.requirements)}`} threshold={260} /></TableCell><TableCell sx={{ minWidth: 240 }}><TruncatedString value={formatCoverageDetails(coverage)} threshold={220} />{coverage.brochureUrl && <a href={coverage.brochureUrl} target="_blank" rel="noopener noreferrer">Brochure</a>}</TableCell><TableCell>{coverage.applicants.join(", ")}</TableCell>{effective && <TableCell><Chip size="small" label={status} /></TableCell>}{effective && <TableCell>{diffs.join(", ") || "—"}</TableCell>}</TableRow>)}</TableBody></Table></ResponsiveTableContainer>;
}

export function UrlParametersLibrary() {
  return <ScopedSiteContent>{(siteId) => { const inUse = new Set(resolveSite(siteId).effective.urlParametersInUse ?? []); return <ScopeTabs global={<UrlParametersTable />} effective={<Stack spacing={1.5}><Typography variant="body2" color="text.secondary">Parameters explicitly recorded for this Site are marked “In use.” Unrecorded does not change the global behavior definition.</Typography><UrlParametersTable inUse={inUse} /></Stack>} />; }}</ScopedSiteContent>;
}

function UrlParametersTable({ inUse }: { inUse?: ReadonlySet<string> }) {
  return <ResponsiveTableContainer libraryTable="urlParameters"><Table size="small"><TableHead><TableRow><TableCell>Parameter</TableCell><TableCell>Values</TableCell><TableCell>Behavior</TableCell><TableCell>Status</TableCell>{inUse && <TableCell>Site usage</TableCell>}</TableRow></TableHead><TableBody>{urlParameters.map((row) => <TableRow key={row.parameter}><TableCell sx={{ fontFamily: "monospace", fontWeight: 700 }}>{row.parameter}</TableCell><TableCell>{row.newValues.join(", ")}</TableCell><TableCell>{row.newBehavior.join(" ")}</TableCell><TableCell><Chip size="small" label={row.status} /></TableCell>{inUse && <TableCell>{inUse.has(row.parameter) ? <Chip size="small" color="success" label="In use" /> : "—"}</TableCell>}</TableRow>)}</TableBody></Table></ResponsiveTableContainer>;
}

export function ValidationLibrary({ level }: { level?: "Page" | "Field" } = {}) {
  return <ScopedSiteContent>{(siteId) => { const included = new Set(getLibraryPages("effective", siteId).map(page => page.id)); return <ScopeTabs global={<ValidationReferenceList level={level} />} effective={<ValidationReferenceList level={level} includedPageIds={included} />} />; }}</ScopedSiteContent>;
}






