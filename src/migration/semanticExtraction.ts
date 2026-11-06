import { parseBenefitFormula } from "./benefitFormula";
import type { DatabaseSchema, Json } from '../persistence/types';
import type { SourceRequirements } from '../persistence/types/provenanceCanonical';
import { libraryMetadata, libraryDisplayId } from '../domain/provenance';
import { identity, globalScope } from './values';
import { classifySourceUnknown } from './reviewCategories';
import { parseAmount } from './amountParser';

type Source = { cells: Array<{ sheet: string; cell: string; value: Json }>; sheets: Array<{ name: string; mergedRanges: string[] }> };
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const metadata = (table: string, key: string, source: string) => ({ ...identity(key), ...libraryMetadata(table, key, source) });
const normalized = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
export const normalizeIdentifier = (s: string) => s.toUpperCase().replace(/[\s–—]/g, '').replace(/^G-?/, 'G');
const isNA = (s: string) => /^(n\/?a|none|not applicable)$/i.test(s.trim());
export function parseAge(s: string) {
  const m = /^(\d+)\s*(?:-\s*)?(?:through\s*)?(?:age\s*)?(?:[-–]\s*)?(\d+)$/i.exec(s.trim());
  return m && Number(m[1]) <= Number(m[2]) ? { minimumAgeYears: Number(m[1]), maximumAgeYears: Number(m[2]) } : null;
}
/** Deterministic row/column extraction; evidence may support several canonical facts. */
export function extractMcrSemantics(db: DatabaseSchema, source: Source) {
  const evidence = new Map(db.sourceRequirements.map(r => [`${r.sheetKey}!${r.cell}`, r]));
  const cells = new Map(source.cells.map(c => [`${c.sheet}!${c.cell}`, String(c.value ?? '').trim()]));
  const value = (sheet: string, col: string, row: number) => cells.get(`${sheet}!${col}${row}`) ?? '';
  const get = (sheet: string, col: string, row: number) => evidence.get(`${slug(sheet)}!${col}${row}`);
  const rows = (sheet: string) => [...new Set(source.cells.filter(c => c.sheet === sheet).map(c => Number(c.cell.replace(/[A-Z]/g, ''))))].filter(n => n > 1).sort((a, b) => a - b);
  const targetKeys = new Set(db.requirementTargets.map(t => t.key));
  const factKeys = new Set(db.semanticRequirements.map(f => f.key));
  function link(r: SourceRequirements | undefined, table: string, key: string, column: string, complete = true) {
    if (!r) return;
    const targetKey = `${r.key}.semantic.${table}.${key}.${column}`;
    if (!targetKeys.has(targetKey)) { targetKeys.add(targetKey); db.requirementTargets.push({ ...metadata('requirementTargets', targetKey, r.sourceReference!), requirementKey: r.key, targetTable: table, targetKey: key, targetColumn: column }); }
    if (complete && !classifySourceUnknown(`${r.value}\n${r.reason}`) && !['SOURCE_CONFLICT', 'IMAGE_REVIEW_REQUIRED', 'IDENTITY_CONFLICT'].includes(r.classification)) {
      r.classification = 'MAPPED'; r.reason = `Semantically represented by ${table}.${column}.`;
    }
  }
  function fact(r: SourceRequirements | undefined, domain: string, subjectTable: string, subjectKey: string, predicate: string, value: Json, complete = true) {
    if (!r) return;
    const key = `${subjectKey}.${predicate}.${libraryDisplayId('semantic', JSON.stringify(value))}`;
    if (!factKeys.has(key)) { factKeys.add(key); db.semanticRequirements.push({ ...metadata('semanticRequirements', key, r.sourceReference!), domain, subjectTable, subjectKey, predicate, value, status: complete ? 'documented' : 'partial' }); }
    link(r, 'semanticRequirements', key, 'value', complete);
  }
  // Reclassify the previous generic fallback conservatively; no gap is made a source TBD.
  for (const r of db.sourceRequirements) {
    if (r.classification !== 'UNRESOLVED') continue;
    const explicit = classifySourceUnknown(`${r.value}\n${r.reason}`);
    r.classification = r.cell === 'embedded-images' ? 'IMAGE_REVIEW_REQUIRED' : /absent from supplied source workbook/.test(r.reason) ? 'SOURCE_CONFLICT' : explicit ?? 'UNMAPPED_SEMANTIC';
    if (r.reason === 'Source retained; semantic mapping/conditions require review.') r.reason = 'No complete typed extraction yet for this source requirement; engineering mapping remains required.';
  }
  for (const r of db.sourceRequirements.filter(r => ['qd-li', 'qd-di'].includes(r.sheetKey))) {
    const amounts = String(r.value ?? '').match(/\$[\d,]+/g) ?? [];
    if (amounts.some(v => v.includes(',') && !/^\$\d{1,3}(?:,\d{3})+$/.test(v))) {
      r.classification = 'SOURCE_CONFLICT'; r.reason = 'Malformed monetary grouping in QD schedule; source amount is not silently corrected.';
    }
  }
  // Main: authoritative column semantics. Product identity remains row-specific.
  const scalarColumns: Record<string, [string, string]> = {
    F: ['identity', 'group-policy-situs'], AA: ['documents', 'application-form'], AL: ['underwriting', 'underwriting-entity'],
    AE: ['payment', 'payment-methods'], AF: ['payment', 'skip-payment'], AG: ['payment', 'payment-frequency'], AH: ['payment', 'billing-fees-enabled'],
    AK: ['payment', 'credit-card-processor'], AN: ['rates', 'premium-unit'], AS: ['rates', 'insurance-age-calculation'], Z: ['underwriting', 'quick-decision-enabled'],
  };
  const booleanColumns = new Set(['AF', 'AH', 'Z']);
  for (const n of rows('Main')) {
    const product = db.products.find(p => p.sourceReference === `Main!D${n}`); if (!product) continue;
    const p = product.key;
    for (const [col, [domain, predicate]] of Object.entries(scalarColumns)) {
      const text = value('Main', col, n), r = get('Main', col, n); if (!text || !r) continue;
      if (booleanColumns.has(col)) {
        if (/^(y|yes|n|no)$/i.test(text)) fact(r, domain, 'products', p, predicate, /^(y|yes)$/i.test(text));
        else if (isNA(text)) fact(r, domain, 'products', p, predicate, { applicable: false });
      } else if (isNA(text)) fact(r, domain, 'products', p, predicate, { applicable: false });
      else if (!/\n|\b(if|when|except|confirm|TBD|must|see|rule)\b/i.test(text) && text.length < 160) {
        fact(r, domain, 'products', p, predicate, col === 'AN' && /^\$?[\d,]+$/.test(text) ? Number(text.replace(/[$,]/g, '')) : text);
      }
    }
    for (const [applicant, amountCol, ageCol, uwCol] of [['member','H','O','U'], ['spouse','I','P','V'], ['child','J','Q','W']]) {
      const amount = value('Main', amountCol, n), amountR = get('Main', amountCol, n);
      if (amount && isNA(amount)) {
        const key = `${p}.${applicant}.availability`;
        db.productApplicantEligibility.push({ ...metadata('productApplicantEligibility', key, amountR!.sourceReference!), productKey: p, applicantTypeKey: applicant, siteKey: null, eligible: false, conditionKey: null });
        link(amountR, 'productApplicantEligibility', key, 'eligible');
      }
      const age = parseAge(value('Main', ageCol, n));
      if (age) {
        const key = `${p}.${applicant}.age`;
        db.eligibilityConstraints.push({ ...metadata('eligibilityConstraints', key, `Main!${ageCol}${n}`), productKey: p, siteKey: null, applicantTypeKey: applicant, minimumAgeDays: null, ...age, studentMaximumAgeYears: null, minimumWorkHours: null });
        link(get('Main', ageCol, n), 'eligibilityConstraints', key, 'maximumAgeYears');
      } else if (isNA(value('Main', ageCol, n))) fact(get('Main', ageCol, n), 'eligibility', 'products', p, `${applicant}.age-applicability`, false);
      const uw = value('Main', uwCol, n);
      if (/^(yes|no|n\/?a)$/i.test(uw)) fact(get('Main', uwCol, n), 'underwriting', 'products', p, `${applicant}.medical-underwriting`, /^yes$/i.test(uw));
      if (amountR?.classification === 'UNMAPPED_SEMANTIC') {
        const code = /^(D\d+[a-z]?|OE\d+)$/i.exec(amount);
        if (!code && !parseAmount(amount)) { amountR.classification = 'PARSER_GAP'; amountR.reason = 'Amount schedule contains unparsed conditions, formula, bands, or selection grammar; no inferred amount behavior.'; }
      }
    }
    // Known empty domain values are semantic absence, not discarded source records.
    for (const col of ['K','L','M','N','R','S','T','X','Y','AB','AC','AD','AI','AJ','AM','AO','AP','AQ','AR','AT']) {
      if (isNA(value('Main', col, n))) fact(get('Main', col, n), 'product-configuration', 'products', p, `${slug(value('Main', col, 1))}.applicable`, false);
    }
    const clientName = get('Main', 'A', n);
    const owner = db.productClients.find(r => r.productKey === p);
    if (owner && clientName && normalized(String(clientName.value)).includes(normalized(db.clients.find(c => c.key === owner.clientKey)!.acronym))) link(clientName, 'productClients', owner.key, 'clientKey');
  }
  // Reconcile overlays using the intersection of independently normalized identifiers.
  const identifiers = new Map<string, string[]>();
  for (const i of db.productIdentifiers) {
    if (typeof i.definition === 'object' && i.definition !== null && !Array.isArray(i.definition) && typeof i.definition.primary === 'string') {
      const key = `${i.productKey}.${i.kind}`;
      identifiers.set(key, [...(identifiers.get(key) ?? []), normalizeIdentifier(i.definition.primary)]);
    }
  }
  const identifier = (p: string, kind: string) => identifiers.get(`${p}.${kind}`) ?? [];

  const products = db.products.filter(p => p.key.startsWith('mcr.'));
  for (const sheet of ['QD LI', 'QD DI']) {
  let clientSection = '';
  for (const n of rows(sheet)) {
    if (value(sheet, 'A', n)) clientSection = value(sheet, 'A', n);
    const g = value(sheet, 'D', n), plan = value(sheet, 'F', n), name = value(sheet, 'C', n);
    if (!name && !g && !plan) continue;
    const gMatches = g ? products.filter(p => identifier(p.key, 'gNumber').includes(normalizeIdentifier(g))) : [];
    const planMatches = plan ? products.filter(p => identifier(p.key, 'planCode').includes(normalizeIdentifier(plan))) : [];
    let candidates = g && plan ? gMatches.filter(p => planMatches.includes(p)) : g ? gMatches : planMatches;
    let strategy = g && plan ? 'g-number+plan-code' : g ? 'g-number' : 'plan-code';
    if (candidates.length > 1 && clientSection) {
      const byClient = candidates.filter(p => {
        const sourceRow = Number(/D(\d+)$/.exec(p.sourceReference ?? '')?.[1]);
        return normalized(value('Main', 'B', sourceRow)) === normalized(clientSection);
      });
      if (byClient.length === 1) { candidates = byClient; strategy = 'semantic-key'; }
    }
    if (candidates.length > 1) {
      const exact = candidates.filter(p => normalized(p.definition.name) === normalized(name));
      if (exact.length === 1) { candidates = exact; strategy = 'exact'; }
    }
    const key = `mcr.identity.${slug(sheet)}.${n}`;
    db.identityResolutions.push({ ...metadata('identityResolutions', key, `${sheet}!C${n}:F${n}`), sheetKey: slug(sheet), sourceRow: n, strategy: candidates.length > 1 ? 'multi-match' : candidates.length === 0 ? 'no-match' : strategy, candidateKeys: candidates.map(p => p.key), productKey: candidates.length === 1 ? candidates[0].key : null, explanation: candidates.length === 1 ? 'Unique normalized identifier match; no fuzzy name or client inference.' : 'Cannot safely identify a unique catalog product from the supplied identifiers.' });
    if (candidates.length !== 1) {
      for (const col of ['C','D','F']) { const r = get(sheet, col, n); if (r) { r.classification = 'IDENTITY_CONFLICT'; r.reason = `${key}: ${candidates.length} candidates; unsafe overlay assignment blocked.`; } }
      continue;
    }
    const productKey = candidates[0].key;
    for (const col of ['B','E','H','I','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']) {
      const text = value(sheet, col, n), r = get(sheet, col, n);
      if (isNA(text)) fact(r, 'underwriting', 'products', productKey, `QD.${slug(sheet)}.${slug(value(sheet, col, 1))}.applicable`, false);
      else if (['U','V','W'].includes(col) && /^(y|yes|n|no)$/i.test(text)) fact(r, 'underwriting', 'products', productKey, `QD.${{ U: 'member', V: 'spouse', W: 'child' }[col]}.enabled`, /^(y|yes)$/i.test(text));
    }
    for (const col of ['C','D','F']) link(get(sheet, col, n), 'identityResolutions', key, 'productKey');
    for (const [amountCol, ageCol, applicant] of [['J','O','member'], ['K','P','spouse'], ['L','Q','child']]) {
      const amountText = value(sheet, amountCol, n), ageText = value(sheet, ageCol, n);
      const parsed = parseAmount(amountText), age = parseAge(ageText);
      const schedule = [...amountText.matchAll(/(?:^|\n)(Core QD|Expanded QD Fluidless Eligible|Expanded QD FUW)\s+(\d+)-(\d+):\s*(?:>=\$([\d,]+)\s*-\s*)?<=?\$([\d,]+)\s*(?=\n|$)/g)];
      const completeSchedule = schedule.length > 0 && amountText.replace(/(?:^|\n)(Core QD|Expanded QD Fluidless Eligible|Expanded QD FUW)\s+(\d+)-(\d+):\s*(?:>=\$([\d,]+)\s*-\s*)?<=?\$([\d,]+)\s*(?=\n|$)/g, '').trim() === '';
      const bands = completeSchedule ? schedule.filter(m => /^\d{1,3}(,\d{3})*$/.test(m[5]) && (!m[4] || /^\d{1,3}(,\d{3})*$/.test(m[4]))).map(m => ({ pathway: m[1], minAge: Number(m[2]), maxAge: Number(m[3]), min: m[4] ? Number(m[4].replaceAll(',', '')) : null, max: Number(m[5].replaceAll(',', '')) })) : parsed && age && parsed.amountType !== 'none' ? [{ pathway: 'QD', minAge: age.minimumAgeYears, maxAge: age.maximumAgeYears, min: parsed.minimum, max: parsed.maximum }] : [];
      if (completeSchedule && bands.length !== schedule.length) {
        const r = get(sheet, amountCol, n)!; r.classification = 'SOURCE_CONFLICT'; r.reason = 'Malformed monetary grouping in QD schedule; e.g. $1,5000,000 is not silently corrected.'; continue;
      }
      for (const [i, b] of bands.entries()) {
        const bandKey = `${key}.${applicant}.${i}`;
        db.underwritingBands.push({ ...metadata('underwritingBands', bandKey, `${sheet}!${amountCol}${n}/${ageCol}${n}`), productKey, applicantTypeKey: applicant, siteKey: null, pathway: b.pathway, minimumAge: b.minAge, maximumAge: b.maxAge, minimumAmount: b.min, maximumAmount: b.max, minimumAmountExclusive: false, applicantClass: null, mortalityMorbidity: null, conditionKey: null, status: 'documented' });
        link(get(sheet, amountCol, n), 'underwritingBands', bandKey, 'maximumAmount');
        if (age || ageText === amountText) link(get(sheet, ageCol, n), 'underwritingBands', bandKey, 'maximumAge');
      }
      if (isNA(amountText)) fact(get(sheet, amountCol, n), 'underwriting', 'products', productKey, `QD.${applicant}.applicable`, false);
      else if (!bands.length) { const r = get(sheet, amountCol, n); if (r?.classification === 'UNMAPPED_SEMANTIC') { r.classification = 'PARSER_GAP'; r.reason = 'QD conditional amount schedule requires additional structured parsing.'; } }
    }
    const mortality = get(sheet, 'G', n);
    if (mortality && !isNA(String(mortality.value))) { mortality.classification = 'REQUIRES_UW_CONFIRMATION'; mortality.reason = 'Worksheet G1 explicitly says Check with UW; amount/age extraction does not confirm mortality/morbidity.'; }
    const residency = get(sheet, 'N', n);
    if (residency && !isNA(String(residency.value))) { residency.classification = 'REQUIRES_CONTRACTS_CONFIRMATION'; residency.reason = 'Worksheet N1 explicitly requests Contracts confirmation of Jet Issue exclusions.'; }
  }
  }
  // Resolve rider references using the actual catalog identifier, never a junction key.
  const riderCodes = new Map<string, typeof db.riders>();
  for (const rider of db.riders.filter(r => r.key.startsWith('mcr.'))) {
    const n = Number(/A(\d+)/.exec(rider.sourceReference!)?.[1]);
    const code = /^(R\d+[a-z]?)/i.exec(value('Riders', 'A', n))?.[1].toUpperCase();
    if (code) riderCodes.set(code, [...(riderCodes.get(code) ?? []), rider]);
  }
  for (const n of rows('Main')) {
    const product = db.products.find(p => p.sourceReference === `Main!D${n}`); if (!product) continue;
    for (const col of ['L', 'AT']) {
      const text = value('Main', col, n), codes = [...text.matchAll(/\bR\d+[a-z]?\b/gi)].map(m => m[0].toUpperCase());
      for (const code of new Set(codes)) {
        const candidates = riderCodes.get(code) ?? [];
        if (candidates.length !== 1) continue;
        const rider = candidates[0], key = `${product.key}.${rider.key}`;
        if (!db.productRiders.some(r => r.key === key)) db.productRiders.push({ ...metadata('productRiders', key, `Main!${col}${n}`), ...globalScope, productKey: product.key, riderKey: rider.key, position: db.productRiders.length });
        link(get('Main', col, n), 'productRiders', key, 'riderKey', /^(?:R\d+[a-z]?[\s,;/]*)+$/i.test(text) && codes.every(c => riderCodes.get(c)?.length === 1));
      }
    }
  }
  for (const rider of db.riders.filter(r => r.key.startsWith('mcr.'))) {
    const n = Number(/A(\d+)/.exec(rider.sourceReference ?? '')?.[1]);
    for (const [col, predicate] of Object.entries({ F: 'residency-exclusions', G: 'member.age', H: 'spouse.age', I: 'child.age', J: 'member.custom-rules', K: 'spouse.custom-rules', L: 'child.custom-rules', M: 'member.underwriting', N: 'spouse.underwriting', O: 'child.underwriting' })) {
      const text = value('Riders', col, n), r = get('Riders', col, n);
      if (isNA(text)) fact(r, 'riders', 'riders', rider.key, `${predicate}.applicable`, false);
      else if (['M','N','O'].includes(col) && /^(yes|no)$/i.test(text)) fact(r, 'riders', 'riders', rider.key, predicate, /^yes$/i.test(text));
      else if (['G','H','I'].includes(col)) { const age = parseAge(text); if (age) fact(r, 'riders', 'riders', rider.key, predicate, age); }
    }
    for (const col of ['C','D','E']) {
      const r = get('Riders', col, n);
      if (r?.classification === 'UNMAPPED_SEMANTIC') { r.classification = 'PARSER_GAP'; r.reason = 'Rider amount or election includes unparsed inheritance, cap, dependency, or visibility conditions.'; }
    }
  }
  for (const n of rows('Associations')) {
    const acronym = value('Associations', 'C', n), clients = db.clients.filter(c => normalized(c.acronym) === normalized(acronym));
    if (clients.length !== 1) continue;
    for (const col of ['E','F','G','H']) if (isNA(value('Associations', col, n))) fact(get('Associations', col, n), 'associations', 'clients', clients[0].key, `${slug(value('Associations', col, 1))}.applicable`, false);
  }
  // Deduplicate exact question wording, preserving every evidence link and set membership.
  const questions = new Map<string, string>();
  const replacements = new Map<string, string>();
  for (const q of db.questionDefinitions) {
    const signature = normalized(q.text), existing = questions.get(signature);
    if (existing) replacements.set(q.key, existing); else questions.set(signature, q.key);
    if (/\b(yes\s*\/\s*no|yes[\s□]*no|Y\/N)\b/i.test(q.text)) q.responseType = 'boolean';
  }
  for (const link of db.questionSetQuestions) link.questionKey = replacements.get(link.questionKey) ?? link.questionKey;
  for (const target of db.requirementTargets) if (target.targetTable === 'questionDefinitions') target.targetKey = replacements.get(target.targetKey) ?? target.targetKey;
  db.questionDefinitions = db.questionDefinitions.filter(q => !replacements.has(q.key));
  // Only standalone question text is complete; compound question/instruction cells remain gaps.
  for (const [sheet, column] of [['Health Questions','B'], ['Financial questions','B'], ['Underwriting','B'], ['Smoker Question','B'], ['WAEPA CIR questions','A']]) for (const n of rows(sheet)) {
    const r = get(sheet, column, n); if (!r) continue;
    const target = db.requirementTargets.find(t => t.requirementKey === r.key && t.targetTable === 'questionDefinitions');
    const text = String(r.value);
    if (target && /\?\s*$/.test(text) && !/\b(if|render|omit|see|checkbox|rule|hide)\b|\n\s*[a-z][.)]/i.test(text)) {
      const question = db.questionDefinitions.find(q => q.key === target.targetKey)!;
      question.status = 'documented'; link(r, 'questionDefinitions', question.key, 'text');
    }
  }
  // Financial form sections express field defaults, arithmetic, and display dependencies.
  const financialSet = 'mcr.financial-questions';
  const financialFacts: Array<[string, number, string, Json]> = [
    ['A', 2, 'calculation-defaults', { defaultValue: 0, whenAnyOperandBlank: 0, displayFormat: '$0.00' }],
    ['B', 2, 'net-worth', { responseType: 'currency', expression: { operation: 'subtract', operands: ['liquid-assets', 'liabilities'] } }],
    ['B', 3, 'annual-unearned-income', { responseType: 'currency', period: 'annual', basis: 'IRS-reported', examples: ['interest', 'dividends', 'royalties', 'rental-income'] }],
    ['B', 4, 'self-employment', { responseType: 'boolean', whenTrue: { show: ['income-sources'], options: ['sole-proprietor-or-partner', 'professional-corporation'], selection: 'multiple', showAllSelectedSections: true }, whenFalse: { hide: ['income-sources', 'self-employment-duration', 'work-from-home'] } }],
    ['B', 5, 'sole-proprietor-section', { visibleWhen: { fact: 'income-sources', operator: 'includes', value: 'sole-proprietor-or-partner' } }],
    ['B', 6, 'sole-proprietor-income', { period: 'past-12-months-or-fiscal-year-ending', fields: ['gross-earned-income-share', 'business-expenses-share'], result: 'net-earned-income-before-personal-income-tax', expression: { operation: 'subtract', operands: ['gross-earned-income-share', 'business-expenses-share'] } }],
    ['B', 7, 'professional-corporation-income', { visibleWhen: { fact: 'income-sources', operator: 'includes', value: 'professional-corporation' }, responseType: 'currency', fields: ['annual-salary', 's-corp-distribution-share', 'dividends-share', 'bonus', 'commission', 'corporate-paid-benefits'], bonusAndCommissionFrequency: ['one-time', 'annual'], expression: { operation: 'sum', operands: ['annual-salary', 's-corp-distribution-share', 'dividends-share', 'bonus', 'commission', 'corporate-paid-benefits'] }, result: 'total-annual-earned-income' }],
    ['B', 8, 'self-employed-follow-ups', { visibleWhen: { fact: 'self-employed', operator: 'equals', value: true }, questions: ['self-employment-duration', 'work-from-home'] }],
    ['B', 9, 'self-employment-duration', { text: 'How long have you been self-employed?', visibleWhen: { fact: 'self-employed', operator: 'equals', value: true } }],
  ];
  for (const [col, n, predicate, definition] of financialFacts) fact(get('Financial questions', col, n), 'financial-questions', 'questionSets', financialSet, predicate, definition);
  const home = get('Financial questions', 'B', 10);
  if (home) {
    fact(home, 'financial-questions', 'questionSets', financialSet, 'work-from-home', { responseType: 'boolean', followUp: { when: true, text: 'Is any work conducted outside of the home?', explanation: { responseType: 'text', include: 'average-days-per-week-clients-seen', maximumLength: null } } });
    home.classification = 'SOURCE_TBD'; home.reason = 'Source explicitly leaves the explanation text-area maximum character count as a question; no limit invented.';
  }
  // CIR has applicant-specific boolean responses and reflexive explanations.
  for (let n = 3; n <= 8; n++) {
    const r = get('WAEPA CIR questions', 'A', n), target = db.requirementTargets.find(t => t.requirementKey === r?.key && t.targetTable === 'questionDefinitions');
    if (!target) continue;
    const question = db.questionDefinitions.find(q => q.key === target.targetKey)!;
    question.responseType = 'boolean'; question.status = 'documented';
    fact(r, 'cir-questions', 'questionDefinitions', question.key, 'response-and-scope', { applicants: ['member', 'spouse'], responseType: 'boolean', lookback: { value: n === 6 ? 6 : 5, unit: n === 6 ? 'months' : 'years' }, followUpWhen: true });
    const explanation: Json = n <= 4 ? { kind: 'per-selected-condition', responseType: 'checkbox', fields: ['month-year-of-onset', 'conditions-and-details', 'physician-name-and-address'], required: true } : { kind: 'explanation', visibleWhen: true, required: true };
    fact(get('WAEPA CIR questions', 'B', n), 'cir-questions', 'questionDefinitions', question.key, 'follow-up', explanation);
  }
  const cirHeading = get('WAEPA CIR questions', 'A', 2);
  fact(cirHeading, 'cir-questions', 'questionSets', 'mcr.waepa-cir-questions', 'explanation-default', { visibleWhen: 'yes', required: true });
  const cirExceptions = get('WAEPA CIR questions', 'B', 2);
  if (cirExceptions) { fact(cirExceptions, 'cir-questions', 'questionSets', 'mcr.waepa-cir-questions', 'explanation-exceptions', { optionalQuestionNumbers: [9, 10] }); cirExceptions.classification = 'SOURCE_CONFLICT'; cirExceptions.reason = 'Source references optional question numbers 9 and 10, but the supplied CIR sheet only includes questions 1–7.'; }
  // Source-backed nicotine threshold, linked to its reusable question definition.
  const nicotine = get('Smoker Question', 'D', 2);
  const smokerQuestion = db.requirementTargets.find(t => t.requirementKey === get('Smoker Question', 'B', 2)?.key && t.targetTable === 'questionDefinitions');
  if (nicotine && smokerQuestion && /24 months or longer, then do not impose smoker rate/i.test(String(nicotine.value))) fact(nicotine, 'nicotine', 'questionDefinitions', smokerQuestion.targetKey, 'rate-classification', { fact: 'months-since-last-use', operator: 'greater-than-or-equal', threshold: 24, outcome: 'non-smoker-rate', applicants: ['member', 'spouse'] });
  // Pure repeated period cells are selections; mixed conditional periods stay visible as gaps.
  for (const [sheet, waiting, benefit] of [['Disability','F','G'], ['Overhead Expense','E','F']]) for (const n of rows(sheet)) {
    const variant = db.coveragePlanVariants.find(v => v.sourceReference === `${sheet}!B${n}`); if (!variant) continue;
    for (const [col, kind] of [[waiting,'waiting'], [benefit,'benefit']]) {
      const text = value(sheet, col, n), r = get(sheet, col, n); if (!text) continue;
      if (isNA(text)) { fact(r, 'coverage-period', 'coveragePlanVariants', variant.key, `${kind}.applicable`, false); continue; }
      const items = text.split(/,|\bor\b/).map(s => s.trim());
      if (!items.every(s => /^\d+\s*[- ]?\s*(days?|months?|years?)?$/i.test(s))) continue;
      const unit = /\b(days?|months?|years?)\s*$/i.exec(text)?.[1].toLowerCase().replace(/s$/, '') + 's';
      if (!['days','months','years'].includes(unit)) continue;
      for (const [position, item] of items.entries()) {
        const key = `${variant.key}.${kind}.${position}`;
        if (!db.planBenefitPeriods.some(p => p.key === key)) db.planBenefitPeriods.push({ ...metadata('planBenefitPeriods', key, r!.sourceReference!), variantKey: variant.key, kind, unit, value: Number(/^\d+/.exec(item)![0]), position });
        link(r, 'planBenefitPeriods', key, 'value');
      }
    }
    const col = sheet === 'Disability' ? 'E' : 'D', formula = value(sheet, col, n), r = get(sheet, col, n);
    if (/^(n\/?a|no formula)$/i.test(formula)) fact(r, 'benefit-formula', 'coveragePlanVariants', variant.key, 'formula-applicable', false);
    else {
      const parsed = parseBenefitFormula(formula);
      if (parsed) {
        fact(r, 'benefit-formula', 'coveragePlanVariants', variant.key, 'maximum-benefit-expression', parsed.expression);
        if (r && parsed.conflicts.length) { r.classification = 'SOURCE_CONFLICT'; r.reason = parsed.conflicts.join(' '); }
      } else if (r?.classification === 'UNMAPPED_SEMANTIC') { r.classification = 'PARSER_GAP'; r.reason = 'Benefit formula or exception requires typed operands, cap precedence and boundary handling; source formula retained.'; }
    }
  }
  // URL catalog and explicit usage, independent of runnable Site provisioning.
  for (const n of rows('URLs')) {
    const ownerLabel = value('URLs', 'A', n);
    const owners = db.clients.filter(c => normalized(c.acronym) === normalized(ownerLabel));
    for (const [col, usage] of [['B','production'], ['C','test'], ['D','pre-production'], ['E','automation'], ['G','featured-product'], ['I','campaign'], ['K','bypass-landing-production'], ['M','bypass-landing-test'], ['O','verification-without-analytics']]) {
      const r = get('URLs', col, n), text = value('URLs', col, n);
      if (!r || !/^https?:\/\/\S+$/.test(text)) continue;
      let url: URL; try { url = new URL(text); } catch { continue; }
      const key = `mcr.url.${libraryDisplayId('url', text)}`;
      if (!db.urlDefinitions.some(u => u.key === key)) db.urlDefinitions.push({ ...metadata('urlDefinitions', key, r.sourceReference!), url: text, protocol: url.protocol, host: url.host, pathname: url.pathname, parameters: Object.fromEntries(url.searchParams) });
      const usageKey = `${r.key}.usage`;
      db.urlUsages.push({ ...metadata('urlUsages', usageKey, r.sourceReference!), urlKey: key, clientKey: owners.length === 1 ? owners[0].key : null, usage, sourceOwner: ownerLabel, status: owners.length === 1 ? 'documented' : 'unresolved' });
      link(r, 'urlDefinitions', key, 'url');
      link(r, 'urlUsages', usageKey, 'usage');
      if (owners.length === 1) link(get('URLs', 'A', n), 'urlUsages', usageKey, 'clientKey');
      else { const owner = get('URLs', 'A', n); if (owner && owner.classification === 'UNMAPPED_SEMANTIC') { owner.classification = 'IDENTITY_CONFLICT'; owner.reason = 'URL is cataloged, but source site label has no unique canonical client; no Site is fabricated.'; } }
    }
  }
  // Read & Sign derives state from selected coverage, not a page/client branch.
  for (const cell of ['B3', 'B4']) {
    const r = evidence.get(`read-sign!${cell}`);
    fact(r, 'flags', 'flagDefinitions', 'application.has-underwritten-coverage', 'derivation', {
      operator: 'any-selected', clauses: [
        { category: 'LI', applicants: ['member', 'spouse'] },
        { category: 'DI', applicants: ['member', 'spouse'] },
        { category: 'OO', applicants: ['member', 'spouse'] },
      ], otherwise: false,
    });
  }
  for (const n of rows('Legal Disclosures')) {
    const source = get('Legal Disclosures', 'A', n); if (!source) continue;
    const content = db.contentEntries.find(c => c.key === source.key); if (!content) continue;
    const rule = value('Legal Disclosures', 'B', n), location = get('Legal Disclosures', 'C', n);
    if (location) fact(location, 'disclosures', 'contentEntries', content.key, 'placement', String(location.value));
    if (/^always$/i.test(rule)) fact(get('Legal Disclosures', 'B', n), 'disclosures', 'contentEntries', content.key, 'visibility', true);
    const flag = /^Underwriting = (true|false)$/i.exec(rule);
    if (flag) {
      const ruleKey = `rule-${content.key}.visibility` as const;
      db.rules.push({ ...metadata('rules', ruleKey, `Legal Disclosures!B${n}`), position: db.rules.length, definition: { id: ruleKey, area: 'Read & Sign', rule: 'Conditional disclosure visibility', behavior: rule, ref: `Legal Disclosures!B${n}`, type: 'conditional' } });
      db.ruleFlags.push({ ...metadata('ruleFlags', ruleKey, `Legal Disclosures!B${n}`), ruleKey, flagKey: 'application.has-underwritten-coverage', operator: 'equals', value: flag[1].toLowerCase() === 'true' });
      fact(get('Legal Disclosures', 'B', n), 'disclosures', 'contentEntries', content.key, 'visible-when-rule', { ruleKey });
      link(get('Legal Disclosures', 'B', n), 'ruleFlags', ruleKey, 'value');
    }
  }
  // Consent document content and the supported signing/retention requirements share evidence.
  const consentCells = source.cells.filter(c => c.sheet === 'ElectrConsent' && /^A\d+$/.test(c.cell) && Number(c.cell.slice(1)) <= 69 && String(c.value ?? '').trim());
  const consentKey = 'mcr.electronic-consent.standard';
  db.contentEntries.push({ ...metadata('contentEntries', consentKey, 'ElectrConsent!A2:A69'), position: db.contentEntries.length, definition: { path: null } });
  db.contentValues.push({ ...metadata('contentValues', consentKey, 'ElectrConsent!A2:A69'), ...globalScope, contentKey: consentKey, value: consentCells.map(c => String(c.value)).join('\n\n'), position: 0 });
  db.documentDefinitions.push({ ...metadata('documentDefinitions', consentKey, 'ElectrConsent!A2:A69'), position: db.documentDefinitions.length, definition: { contentKey: consentKey, productKey: null, source: 'ElectrConsent!A2:A69' } });
  for (const c of consentCells) link(get('ElectrConsent', 'A', Number(c.cell.slice(1))), 'documentDefinitions', consentKey, 'definition');
  for (const [n, predicate, definition] of [
    [27, 'execution', { method: 'electronic-signature', documents: 'application-forms' }],
    [29, 'acknowledgement', { action: 'submit-and-electronic-signature', effect: 'equivalent-to-handwritten-signature' }],
    [31, 'delivery', { method: 'electronic', documents: ['application-forms', 'important-notice', 'online-privacy-policy'] }],
    [46, 'document-access', { format: 'PDF', mustAccessAndRetain: true, acknowledgeOn: 'submit' }],
    [57, 'validity', { startsOn: 'submit', endsOnFirst: ['consent-withdrawal', 'certificate-issued'] }],
    [61, 'withdrawal', { method: 'written', before: 'certificate-issued', fee: 0, terminatesApplication: true, effectiveOn: 'withdrawal-signature-date', subjectToPriorActions: true }],
  ] as Array<[number, string, Json]>) fact(get('ElectrConsent', 'A', n), 'electronic-consent', 'documentDefinitions', consentKey, predicate, definition);
  // A referenced custom consent is not supplied by its name alone.
  for (const n of [71, 72]) { const r = get('ElectrConsent', 'A', n); if (r) { r.classification = 'SOURCE_TBD'; r.reason = 'Custom consent reference is supplied, but its content is absent from the supplied workbook.'; } }

  // Health form identifiers delimit reusable sets; product links require exact identities.
  let healthSet: string | null = null;
  const healthSets = new Map<string, string>();
  for (const n of rows('Health Questions')) {
    const identifier = value('Health Questions', 'A', n);
    if (identifier) {
      const key = `mcr.health-form.${libraryDisplayId('health-form', identifier)}`;
      if (!db.questionSets.some(q => q.key === key)) db.questionSets.push({ ...metadata('questionSets', key, `Health Questions!A${n}`), name: identifier, questionType: 'health', version: null, description: 'Application-form-specific health question set; source rule cells remain separately tracked.' });
      healthSet = key; healthSets.set(normalized(identifier), key);
      link(get('Health Questions', 'A', n), 'questionSets', key, 'name', !/\n|\b(use|see|for)\b/i.test(identifier));
    }
    const r = get('Health Questions', 'B', n), question = db.requirementTargets.find(t => t.requirementKey === r?.key && t.targetTable === 'questionDefinitions');
    if (healthSet && question) {
      const key = `${healthSet}.${question.targetKey}`;
      if (!db.questionSetQuestions.some(q => q.key === key)) db.questionSetQuestions.push({ ...metadata('questionSetQuestions', key, r!.sourceReference!), questionSetKey: healthSet, questionKey: question.targetKey, position: n, conditionKey: null });
      link(r, 'questionSetQuestions', key, 'questionKey', false);
    }
  }
  for (const n of rows('Main')) {
    const product = db.products.find(p => p.sourceReference === `Main!D${n}`); if (!product) continue;
    for (const [col, setKey] of [['X', healthSets.get(normalized(value('Main', 'X', n)))], ['Y', /^(yes|y)$/i.test(value('Main', 'Y', n)) ? financialSet : undefined]] as const) {
      if (!setKey) continue;
      const key = `${product.key}.${setKey}`;
      db.productQuestionSets.push({ ...metadata('productQuestionSets', key, `Main!${col}${n}`), productKey: product.key, questionSetKey: setKey, applicantTypeKey: null });
      link(get('Main', col, n), 'productQuestionSets', key, 'questionSetKey');
    }
  }
  // Decision status and presentation copy have independent identities.
  let decisionOwner = 'global';
  const statusKeys: Record<string, string> = { 'conditionally approved': 'approve', 'referred': 'refer', 'soft declined': 'reject', 'decline': 'reject', 'declined': 'reject', 'accepted (verified by api)': 'approve', 'conditionally accepted': 'approve', 'database error message': 'error', 'database unavailable error': 'error' };
  for (const n of rows('Standard Decision Wording ')) {
    const label = value('Standard Decision Wording ', 'A', n), text = value('Standard Decision Wording ', 'B', n);
    if (label && !text) { decisionOwner = label; continue; }
    const status = statusKeys[normalized(label)], r = get('Standard Decision Wording ', 'A', n), contentSource = get('Standard Decision Wording ', 'B', n);
    if (!status || !contentSource) continue;
    const content = db.contentEntries.find(c => c.key === contentSource.key); if (!content) continue;
    fact(r, 'decision-wording', 'contentEntries', content.key, 'decision-status', { flagKey: 'qd.decision', value: status, sourceOwner: decisionOwner });
  }
  // New UX sheets remain a lossless source archive; no implicit content or configuration extraction.

  // Persist composite amount ASTs alongside the existing relational amount model.
  for (const pattern of db.coverageAmountPatterns.filter(p => p.key.startsWith('mcr.'))) {
    const reference = /^(.+)!([A-Z]+)(\d+)$/.exec(pattern.sourceReference ?? '');
    if (!reference) continue;
    const parsed = parseAmount(value(reference[1], reference[2], Number(reference[3])));
    if (parsed?.schedule) fact(get(reference[1], reference[2], Number(reference[3])), 'coverage-amount', 'coverageAmountPatterns', pattern.key, 'selection-schedule', parsed.schedule);
    for (const [position, amount] of (parsed?.options ?? []).entries()) {
      if (!db.amountOptions.some(o => o.amountPatternKey === pattern.key && o.position === position)) db.amountOptions.push({ ...metadata('amountOptions', `${pattern.key}.${position}`, pattern.sourceReference!), amountPatternKey: pattern.key, value: String(amount), label: String(amount), position });
    }
  }

}
