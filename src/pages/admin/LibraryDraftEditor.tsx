import DerivedBenefitEditor from './DerivedBenefitEditor';
import LibraryCompositionEditor from './LibraryCompositionEditor';
import SiteBuildReview from './SiteBuildReview';
import { editDraftLibraryValue } from '../../domain/libraryDraft';
import { getCoverageAmountChoices } from "../../utils/coverageAmounts";
import { importRateTable } from "../../domain/rateTableImport";
import { resolvePrototypeLibrary } from "../../domain/prototypeLibrary";
import { resolveCoverageJourneyPolicy } from "../../domain/coverageJourneyPolicy";
import { mockRequest, type MockQuote, type MockPayment } from "../../mock/client";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, Box, Button, FormControlLabel, MenuItem, Paper, Stack, Switch, Tabs, Tab, TextField, Typography } from "@mui/material";
import { editDraftExperience, editDraftRiders, editDraftBilling, editDraftField, editDraftRates, type LibraryDraft } from "../../domain/libraryDraft";
import { resolveEffectiveSite } from "../../domain/effectiveSite";
import { resolveRatePresentation, defaultRatePresentation, type ReferenceRateTable } from "../../domain/ratePresentation";
import FieldRenderer from "../../components/forms/FieldRenderer";
import ReferenceRateTableLink from "../../components/ui/ReferenceRateTableLink";

export default function LibraryDraftEditor({ draft, onSave, onViewChange }: { draft: LibraryDraft; onViewChange?: (view: 'configure' | 'review') => void; onSave: (draft: LibraryDraft) => Promise<LibraryDraft> }) {
  const [current, setCurrent] = useState(draft);
  const [mode, setMode] = useState('configure');
  const [pageKey, setPageKey] = useState(draft.data.sitePages.find(p => p.siteKey === draft.siteKey)?.pageKey ?? "eligibility");
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [valueId, setValueId] = useState('');
  const [valueJson, setValueJson] = useState('');
  const [valueTable, setValueTable] = useState<'configurationValues' | 'contentValues'>('configurationValues');
  const [selectedProduct, setSelectedProduct] = useState("");
  const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  const [mockQuote, setMockQuote] = useState<MockQuote | null>(null), [mockPayment, setMockPayment] = useState<MockPayment | null>(null);
  const [quoteAmount, setQuoteAmount] = useState(100000);
  const [rateTarget, setRateTarget] = useState("product");
  const [referenceKind, setReferenceKind] = useState<"pdf" | "image" | "xml" | "link">("pdf");
  const [importing, setImporting] = useState(false);
  const [importNote, setImportNote] = useState("");
  const [tableUrl, setTableUrl] = useState("");
  const { control, formState: { errors }, handleSubmit } = useForm<Record<string, string | boolean | string[]>>();
  const site = useMemo(() => resolveEffectiveSite(current.data, current.siteKey), [current]);
  const prototype = useMemo(() => resolvePrototypeLibrary(current.data, current.siteKey, current.baseRevision), [current]);
  const experience = prototype.client.applicantExperience ?? {};
  const page = site.configuration.pages.find(p => p.key === pageKey);
  const fields = page?.fields.filter(f => f.included) ?? [];
  const productKey = selectedProduct || site.products[0]?.productKey;
  const journey = productKey ? resolveCoverageJourneyPolicy(site, productKey) : null;
  const rate = productKey ? resolveRatePresentation(site, productKey) : null;
  const policy = site.configuration.ratePresentationPolicies[0]?.value ?? defaultRatePresentation;
  const ratePolicy = policy as typeof defaultRatePresentation;
  const riders = prototype.products.find(p => p.id === productKey)?.riders ?? [];
  const setReference = (table: ReferenceRateTable | null) => rateTarget === "product" ? editDraftRates(current, ratePolicy, productKey, table) : editDraftRiders(current, productKey, riders.map(r => r.id === rateTarget ? { ...r, referenceRateTable: table ?? undefined } : r));
  const update = (fn: () => LibraryDraft) => { try { const next = fn(); resolvePrototypeLibrary(next.data, next.siteKey, next.baseRevision); setCurrent(next); setDirty(true); setSaved(false); setError(""); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } };
  const save = async () => { setSaving(true); try { setCurrent(await onSave(current)); setSaved(true); setDirty(false); setError(""); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setSaving(false); } };
  return <Stack spacing={2}>
    <Typography variant="h6">{site.name.value} · Library prototype configuration</Typography>
    <Alert severity="info">Applicant fields and editing controls resolve this same draft. Saving updates this Site’s working draft after reload. Prototype UAT and production releases use explicit preview links. Majesco activation remains gated.</Alert>
    {saved && <Alert severity="success">Draft saved. Reload the matching prototype to apply this revision.</Alert>}
    {error && <Alert severity="error">{error}</Alert>}
    <Tabs value={mode} onChange={(_, value) => { setMode(value); onViewChange?.(value); }} aria-label="Site build workflow"><Tab value="configure" label="Build / Library editing" /><Tab value="review" label="Site review / Launch" /></Tabs>
    <Stack direction="row" spacing={2}><TextField select label="Page" value={pageKey} onChange={e => setPageKey(e.target.value)} sx={{ minWidth: 220 }}>{site.configuration.pages.filter(p => current.data.pages.find(row => row.key === p.key)?.definition.type !== 'internal').map(p => <MenuItem key={p.key} value={p.key}>{p.key}</MenuItem>)}</TextField><Button disabled={saving} variant="contained" onClick={() => void save()}>Save draft</Button></Stack>
    {mode === 'configure' && import.meta.env.VITE_MOCK_PLATFORM_ENABLED && <Paper variant="outlined" sx={{ p: 2 }}><Stack spacing={1}>
      <Typography variant="h6">PRASE / payment integration test</Typography>
      <TextField label="Test coverage amount" type="number" value={quoteAmount} onChange={e => { setQuoteAmount(Number(e.target.value)); setMockQuote(null); setMockPayment(null); }} />
      <Button disabled={!rate?.praseConfigured || !productKey} onClick={() => void mockRequest<MockQuote>("/rates/quote", { siteKey: current.siteKey, productKey, amount: quoteAmount, frequency: "monthly" }).then(q => { setMockQuote(q); setMockPayment(null); setError(""); }).catch(e => setError(e.message))}>Request estimate</Button>
      {mockQuote && <><Typography>Estimate: ${(mockQuote.premiumCents / 100).toFixed(2)} / {mockQuote.frequency}</Typography><Stack direction="row" spacing={1}>{(["mock-approved", "mock-declined"] as const).map(paymentToken => <Button key={paymentToken} onClick={() => void mockRequest<MockPayment>("/payments/authorize", { quoteId: mockQuote.quoteId, paymentToken, idempotencyKey: crypto.randomUUID() }).then(setMockPayment).catch(e => setError(e.message))}>{paymentToken === "mock-approved" ? "Test approved payment" : "Test declined payment"}</Button>)}</Stack></>}
      {mockPayment && <Typography>Payment: {mockPayment.status}. No funds moved.</Typography>}
    </Stack></Paper>}
    <Typography variant="caption" sx={{ overflowWrap: 'anywhere' }}>Base: {current.baseRevision} · edit {current.editVersion}</Typography>
    {mode === 'configure' && <>
    <LibraryCompositionEditor draft={current} update={update} />
    <DerivedBenefitEditor draft={current} update={update} />
    <Paper variant="outlined" sx={{ p: 2 }}><Stack spacing={2}>
      <Typography variant="h6">Content, configuration and derived values</Typography>
      <Typography variant="body2">Edit stored Site values, including benefit formulas, selection rules, identifiers, email/content settings and billing policies. Inherited definitions remain visible in the Library. Each edit is validated against the same executable resolver used by the journey.</Typography>
      <TextField select label="Library domain" value={valueTable} onChange={e => { setValueTable(e.target.value as typeof valueTable); setValueId(''); setValueJson(''); }}><MenuItem value="configurationValues">Configuration / rules / derived values</MenuItem><MenuItem value="contentValues">Page content</MenuItem></TextField>
      <TextField select label="Stored Site value" value={valueId} onChange={e => { setValueId(e.target.value); setValueJson(JSON.stringify(current.data[valueTable].find(r => r.id === e.target.value)?.value, null, 2)); }}>{current.data[valueTable].filter(r => r.scope === 'site' && r.siteKey === current.siteKey).map(row => <MenuItem key={row.id} value={row.id}>{'configurationKey' in row ? row.configurationKey : row.contentKey}</MenuItem>)}</TextField>
      {valueId && <><TextField multiline minRows={4} maxRows={14} label="Structured Library value (JSON)" value={valueJson} onChange={e => setValueJson(e.target.value)} /><Button onClick={() => update(() => editDraftLibraryValue(current, valueTable, valueId, JSON.parse(valueJson)))}>Apply and validate value</Button></>}
    </Stack></Paper>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 3 }}>
      <Paper variant="outlined" sx={{ p: 2 }}><Stack spacing={2}><Typography variant="h6">Library editing controls</Typography>
        <Typography variant="subtitle1">Applicant experience</Typography>
        <FormControlLabel label="Require the same payment method for all products" control={<Switch checked={experience.payment?.allowSharedMethod ?? false} onChange={(_, checked) => update(() => editDraftExperience(current, { ...experience, payment: { ...experience.payment, allowSharedMethod: checked } }))} />} />
        <FormControlLabel label="Require the same payment frequency for all products" control={<Switch checked={experience.payment?.allowSharedFrequency ?? false} onChange={(_, checked) => update(() => editDraftExperience(current, { ...experience, payment: { ...experience.payment, allowSharedFrequency: checked } }))} />} />
        <FormControlLabel label="Only show eligible states" control={<Switch checked={!!experience.eligibleStatesOnly} onChange={(_, checked) => update(() => editDraftExperience(current, { ...experience, eligibleStatesOnly: checked, eligibleStates: experience.eligibleStates?.length ? experience.eligibleStates : ["NY"] }))} />} />
        <TextField label="Eligible state codes" defaultValue={experience.eligibleStates?.join(", ") ?? ""} key={`${current.siteKey}-states-${experience.eligibleStates?.join()}`} helperText="Comma-separated two-letter codes; shared by state dropdowns and ZIP eligibility validation." onBlur={e => update(() => editDraftExperience(current, { ...experience, eligibleStates: e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) }))} />
        <TextField select label="Child eligibility collection" value={experience.childEligibility?.mode ?? "details"} onChange={e => update(() => editDraftExperience(current, { ...experience, childEligibility: { mode: e.target.value as "details" | "notice-only", note: experience.childEligibility?.note ?? "Child must meet the plan's age requirements." } }))}><MenuItem value="details">Collect child details</MenuItem><MenuItem value="notice-only">Notice only</MenuItem></TextField>
        {experience.childEligibility && <TextField label="Child eligibility note" value={experience.childEligibility.note} onChange={e => update(() => editDraftExperience(current, { ...experience, childEligibility: { ...experience.childEligibility!, note: e.target.value } }))} />}
        {fields.map(f => <Stack key={f.key} spacing={1}><TextField label={`Label · ${f.key}`} value={f.definition.label ?? f.key} onChange={e => update(() => editDraftField(current, pageKey, f.key, { label: e.target.value }))} /><FormControlLabel label="Required" control={<Switch checked={!!f.definition.required} onChange={(_, required) => update(() => editDraftField(current, pageKey, f.key, { required }))} />} /></Stack>)}
        {productKey && <><Typography variant="subtitle1">Rates and reference table</Typography><TextField select label="Pricing product" value={productKey} onChange={e => { setSelectedProduct(e.target.value); setRateTarget("product"); }}>{site.products.map(p => <MenuItem key={p.productKey} value={p.productKey}>{p.productKey}</MenuItem>)}</TextField>{(["praseConfigured", "quoteToolEnabled", "coverageQuoteEnabled"] as const).map(key => <FormControlLabel key={key} label={{ praseConfigured: "Rates configured in PRASE", quoteToolEnabled: "Homepage quote tool", coverageQuoteEnabled: "Coverage estimates" }[key]} control={<Switch checked={ratePolicy[key]} onChange={(_, checked) => update(() => editDraftRates(current, { ...ratePolicy, [key]: checked }, productKey, rate?.referenceTable ?? null))} />} />)}
          {journey && <><Typography variant="subtitle1">Billing</Typography><TextField label="Annual credit" type="number" value={journey.billing.annualCredit} onChange={e => update(() => editDraftBilling(current, productKey, { ...journey.billing, annualCredit: Number(e.target.value) }))} /><TextField label="Bill me fee per collection" type="number" value={journey.billing.feePerCollection["bill-me"]} onChange={e => update(() => editDraftBilling(current, productKey, { ...journey.billing, feePerCollection: { ...journey.billing.feePerCollection, "bill-me": Number(e.target.value) } }))} /></>}
          <Typography variant="subtitle1">Optional benefits / dependent elections</Typography>
          {riders.map(rider => <Stack key={rider.id} spacing={1}><TextField label={`Benefit label · ${rider.id}`} value={rider.name} onChange={e => update(() => editDraftRiders(current, productKey, riders.map(r => r.id === rider.id ? { ...r, name: e.target.value } : r)))} /><TextField select label={`Beneficiary · ${rider.id}`} value={rider.dependentApplicant ?? "base"} onChange={e => update(() => editDraftRiders(current, productKey, riders.map(r => r.id === rider.id ? { ...r, dependentApplicant: e.target.value === "base" ? undefined : e.target.value as "spouse" | "child" } : r)))}><MenuItem value="base">Base applicant</MenuItem><MenuItem value="spouse">Spouse attached benefit</MenuItem><MenuItem value="child">Child attached benefit</MenuItem></TextField><TextField label={`Benefit description · ${rider.id}`} multiline value={rider.description} onChange={e => update(() => editDraftRiders(current, productKey, riders.map(r => r.id === rider.id ? { ...r, description: e.target.value } : r)))} />{rider.hasAmount && <><TextField label={`Amount choices · ${rider.id}`} defaultValue={getCoverageAmountChoices(rider, "member").join(", ")} onBlur={e => update(() => editDraftRiders(current, productKey, riders.map(r => r.id === rider.id ? { ...r, coverageAmounts: [{ scope: { applicantType: "member" }, selections: [{ type: "amountList", values: e.target.value.split(",").map(v => Number(v.trim())) }] }] } : r)))} helperText="Comma-separated positive amounts" /><TextField label={`Default amount · ${rider.id}`} type="number" value={rider.defaultAmount ?? ""} onChange={e => update(() => editDraftRiders(current, productKey, riders.map(r => r.id === rider.id ? { ...r, defaultAmount: Number(e.target.value) } : r)))} /></>}<FormControlLabel label="Included benefit" control={<Switch checked={!!rider.included} onChange={(_, checked) => update(() => editDraftRiders(current, productKey, riders.map(r => r.id === rider.id ? { ...r, included: checked } : r)))} />} /><FormControlLabel label="Display as attached product" control={<Switch checked={!!rider.displayAsProduct} onChange={(_, checked) => update(() => editDraftRiders(current, productKey, riders.map(r => r.id === rider.id ? { ...r, displayAsProduct: checked } : r)))} />} /><FormControlLabel label="Selected by default when eligible" control={<Switch checked={!!rider.defaultSelected || !!rider.included} disabled={rider.included} onChange={(_, checked) => update(() => editDraftRiders(current, productKey, riders.map(r => r.id === rider.id ? { ...r, defaultSelected: checked } : r)))} />} /></Stack>)}
          <TextField select label="Reference table target" value={rateTarget} onChange={e => setRateTarget(e.target.value)}><MenuItem value="product">Base product</MenuItem>{riders.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}</TextField>
          <TextField select label="Reference source type" value={referenceKind} onChange={e => setReferenceKind(e.target.value as typeof referenceKind)}>{(["pdf","image","xml","link"] as const).map(kind => <MenuItem key={kind} value={kind}>{kind}</MenuItem>)}</TextField>
          <TextField label="Reference source URL" value={tableUrl} onChange={e => setTableUrl(e.target.value)} helperText="HTTPS or local asset path. Uploaded tables are previewed before you save." />
          <Button onClick={() => update(() => setReference(tableUrl ? { version: 1, kind: referenceKind, title: "Reference rate table", url: tableUrl } : null))}>Set / remove reference table</Button>
          <Button component="label" disabled={importing}>{importing ? "Extracting reference table…" : "Upload rate table"}<input hidden type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.xml,.csv,.tsv,.html,.json" onChange={async e => { const file = e.target.files?.[0]; e.target.value = ""; if (!file) return; setImporting(true); try { const result = await importRateTable(file); update(() => setReference(result.table)); setImportNote(result.warning); } catch (error) { setError(error instanceof Error ? error.message : String(error)); } finally { setImporting(false); } }} /></Button>
          {importNote && <Alert severity="info">{importNote}</Alert>}
          {rateTarget === "product" && rate?.referenceTable && <ReferenceRateTableLink table={rate.referenceTable} />}
          {rateTarget !== "product" && riders.find(r => r.id === rateTarget)?.referenceRateTable && <ReferenceRateTableLink table={riders.find(r => r.id === rateTarget)!.referenceRateTable!} />}</>}
      </Stack></Paper>
      <Paper variant="outlined" sx={{ p: 2 }}><Stack component="form" spacing={2} onSubmit={handleSubmit(() => setError(""))}><Typography variant="h6">Applicant form preview · {pageKey}</Typography>
        {fields.map(f => <FieldRenderer key={f.key} field={f.definition} control={control} errors={errors} />)}
        {rate?.referenceTable && <ReferenceRateTableLink table={rate.referenceTable as ReferenceRateTable} />}
        {rate && <Typography variant="body2">{rate.praseConfigured ? "PRASE capability enabled. A verified rate response is required to display a premium." : "Calculated rates hidden. Homepage uses the hero image."}</Typography>}
        <Button type="submit" variant="contained">Validate preview fields</Button>
      </Stack></Paper>
    </Box>
    </>}
    {mode === 'review' && import.meta.env.VITE_MOCK_PLATFORM_ENABLED && <SiteBuildReview key={`${current.siteKey}-${current.editVersion}`} draft={current} dirty={dirty} />}
  </Stack>;
}
