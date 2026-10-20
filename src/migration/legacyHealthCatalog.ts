import source from './sources/legacy-health-catalog.json';

/** Source intake only. Embedded instructions are evidence, not executable
 * configuration or approval to assign a form to a Site. */
export const legacyHealthCatalog = source;
export function legacyHealthForm(key: string) {
  const matches = source.forms.filter(form => form.key === key);
  if (matches.length !== 1) throw new Error(`Unknown or ambiguous legacy health form: ${key}`);
  return matches[0];
}
export const legacyHealthApplicabilityEvidence = [
  { form: 'GPA-DI-EZ-3', associations: ['AAOSI'], products: [], notes: [], sourceReference: 'supplied screenshot 2: Health Questions table' },
  { form: 'GPA-DI EZ-3 as amended by GMA-EZ-4', associations: ['APWU', 'NAR'], products: ['STD'], notes: [], sourceReference: 'supplied screenshot 2: Health Questions table' },
  { form: 'GMA-EZ1 as amended by GPA-DI-EZ-3', associations: ['AMASI', 'ISIExpress'], products: [], notes: [], sourceReference: 'supplied screenshot 2: Health Questions table' },
  { form: 'GMA-L/H-TELE-SUPP', associations: ['WAEPA', 'HPSO', 'NSO', 'ISITrust', 'ATPE', 'NCSFA'], products: [], notes: ['Q9 should be asked when applying for CI and other products'], sourceReference: 'supplied screenshot 2: Health Questions table' },
  { form: 'Supp DI', associations: ['WAEPA', 'HPSO', 'NSO', 'AAFP', 'ACS', 'ISTrust'], products: ['all DI and OO/BOE with Tele-Supp questions'], notes: ['questions should render when applying for QD LI and FUW DI/ FUW OO/BOE'], sourceReference: 'supplied screenshot 2: Health Questions table' },
  { form: 'GPA-DI-EZ-3 variants', associations: ['AAOSI', 'AVMAStudent', 'AVMALIFEGI'], products: [], notes: ['AVMAStudent third/fourth year students and VETSTEPP when UW is True', 'AVMALifeGI: omit tobacco question f online and PDF'], sourceReference: 'supplied screenshot 2: Health Questions table' },
  { form: 'WAEPAWL', associations: ['WAEPAWL'], products: ['G-30282-0'], notes: ['SI and FUW; omit questions 1, 4 and 14 for SI'], sourceReference: 'supplied screenshot 2: Health Questions table' },
  { form: 'EZ-4 for AKC', associations: ['AKC'], products: [], notes: [], sourceReference: 'supplied screenshot 2: Health Questions table' },
] as const;

/** Empty until identities, versions, applicants and states have been reviewed. */
export const adoptedLegacyHealthAssignments: readonly { siteKey: string; productKey: string; applicantKey: string; formKey: string; approvalReference: string }[] = [];
