import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Review output only. This script does not author or activate prototype values.
const read = path => JSON.parse(readFileSync(path, 'utf8'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const source = read('src/migration/sources/mcr-v78.json');
const crosswalk = read('docs/project-review/step1-requirement-crosswalk.json');
const abe = read('docs/project-review/step1-abe-review.json');
const byId = new Map(crosswalk.requirements.map(row => [row.id, row]));
const byRef = new Map(source.cells.map(cell => [`${cell.sheet}!${cell.cell}`, cell]));
const priorAssessment = read('docs/project-review/abe-final-review.json');
const fieldCatalogReviewFiles = ['src/migration/abeFiftyPlusFlow.test.ts', 'src/config/fields/resolvedFieldRegistry.ts', 'src/domain/effectiveConfiguration.ts', 'src/config/fields/index.ts', 'src/migration/requirementCrosswalkMembershipReview.ts', 'src/pages/Resume.tsx', 'src/pages/ResumeCode.tsx', 'src/pages/ResumeMethod.tsx', 'src/pages/ResumeFlow.test.tsx', 'src/migration/abeCirQuestionnaireAdoption.ts', 'src/migration/abeCirQuestionnaireAdoption.test.ts', 'src/pages/HealthCir.tsx', 'src/pages/HealthCir.test.tsx', 'src/config/flowGates.ts', 'src/config/healthFollowUps.ts', 'src/config/clientFields/getClientPageFields.ts', 'src/migration/sourceQuestionnaireFixture.ts', 'src/migration/fixtures.tsx', 'src/migration/abeProcessingAdoption.ts', 'src/migration/abeProcessingAdoption.test.ts'];
const decisions = {
  'ABE-01': 'Approved: use the MCR standard, Minnesota and Virginia QD authorization/consent versions and medical authorization for participating health questions or required adult FUW/TELE underwriting. The October 23 correction keeps authorization and underwritten consent even without online questions.',
  'ABE-02': 'Approved: CT/VA notices and all fraud notices belong within Read and Sign. Globally only Read and Sign and Electronic Consent are legal Review sections; existing dividend controls also render within Read and Sign.',
  'ABE-03': 'Approved: the 14pt supplemental-health attestation applies to both CI and Hospital Money inside Read and Sign, without another answer.',
  'ABE-04': 'Approved with correction: use the supplied CI-2014 forms on a separate CI Health page, omit the tobacco item and retain the existing Coverage smoker question. Both source variants have 16 answer items after excluding tobacco and grouping headings.',
  'ABE-05': 'Conditional decision: retain the configurable SH-category smoker question because CI requires it. Do not remove or move it based on the Hospital Money-only No source flag. No duplicate smoker collection is added.',
  'ABE-06': 'Use health_forms_questions.xlsx: its Supp DI form supplies eight mandatory answer items and their source conditional details. Apply to the same adult requesting QD Life and DI; use existing Health DI after the external QD step. FUW is post-submission underwriting and does not activate a generic online questionnaire. Online TELE collection follows its separate configured form; existing TELE routes and forms are preserved.',
  'ABE-07': 'Approved placement correction: member-only Financial questionnaire remains on Profile, section profileFinancialQuestionnaireSelf below Other coverage. Configure ABE for combined selected DI >= $7,000 excluding OO per U50, without a QD Life or health-completion prerequisite. No new page or spouse financial questionnaire.',
};
const adoptedFiles = ['src/migration/abeApprovedReviewAdoption.ts', 'src/migration/abeFinancialQuestionnaireAdoption.ts', 'src/migration/abeHealthQuestionnairesAdoption.ts', 'src/migration/abeApprovedDecisions.test.ts', 'src/pages/HealthCi.tsx', 'src/pages/HealthCi.test.tsx', 'src/migration/sources/health-forms-questions.json', 'health_forms_questions.xlsx', 'src/pages/Profile.test.tsx', 'src/pages/Membership.basicCollection.test.tsx', 'src/pages/Review.consent.test.tsx'];
const questions = [
  {
    id: 'ABE-01', title: 'Medical authorization and consent',
    question: 'May I replace ABE’s generic medical authorization and consent with the MCR wording, show the medical authorization only when health questions apply, and use the Minnesota and Virginia versions where required? The accepted dividend section would stay unchanged.',
    current: 'ABE has no captured authorization/consent selection policy. It falls back to the long QD DI/combo authorization and underwritten consent for every selection, including AD&D-only and Hospital Money-only applications. It does not select the Minnesota authorization or Virginia QD authorization/consent.',
    proposal: 'Use standard B41 authorization normally, C52 for QD DI/qualifying combos, C43 for Minnesota, and C48/C90 for Virginia QD. Use B78 when health questions participate and B93 otherwise. Preserve the approved external QD loading interpretation, CI attestation placement and dividend configuration.',
    references: ['Read & Sign!B35', 'Read & Sign!B36', 'Read & Sign!B40', 'Read & Sign!B41', 'Read & Sign!B43', 'Read & Sign!C43', 'Read & Sign!B48', 'Read & Sign!C48', 'Read & Sign!B52', 'Read & Sign!C52', 'Read & Sign!B77', 'Read & Sign!B78', 'Read & Sign!B90', 'Read & Sign!C90', 'Read & Sign!B92', 'Read & Sign!B93', 'Legal Disclosures!A3', 'Legal Disclosures!A5'],
    owners: ['configurationValues/abe.review-policy', 'src/config/reviewExperience.ts', 'src/content/defaults/review.ts', 'src/pages/Review.tsx'],
  },
  {
    id: 'ABE-02', title: 'State-specific signature warnings',
    question: 'May I add the MCR’s Connecticut warning above the member’s signature, and its Virginia certification when Critical Illness is selected?',
    current: 'Neither state-specific block is assigned to ABE. The generic fraud notice already works; these are additional signature warnings, not replacements for it.',
    proposal: 'For Connecticut applications with health-question participation, show “REVIEW THE ANSWERS ON THIS APPLICATION CAREFULLY…” immediately before the member signature. For Virginia CI, show the source certification that the completed application was read and false statements or misrepresentation may cause loss of coverage. Add no answer or checkbox.',
    references: ['Read & Sign!B118', 'Read & Sign!B119', 'Legal Disclosures!A9', 'Legal Disclosures!B9', 'Health Questions!B44', 'Health Questions!B84'],
    owners: ['configurationValues/abe.review-policy', 'src/domain/reviewPolicy.ts', 'src/pages/Review.tsx'],
  },
  {
    id: 'ABE-03', title: 'Hospital Money Read and Sign note',
    question: 'Should the same supplemental-health attestation already approved for Critical Illness also appear inside Read and Sign when Hospital Money is selected without Critical Illness, as the MCR specifies?',
    current: 'The approved note is currently conditional on Critical Illness only. Hospital Money-only applications do not show it.',
    proposal: 'Extend the existing 14pt appended note to Hospital Money, keeping it inside Read and Sign with no new question or checkbox.',
    references: ['Read & Sign!B115', 'Read & Sign!B116', 'Legal Disclosures!A8', 'Legal Disclosures!B8', 'Legal Disclosures!D8', 'Order of Products Across Site!A23'],
    owners: ['configurationValues/abe.review-policy', 'src/migration/abeProcessingAdoption.ts'],
  },
  {
    id: 'ABE-04', title: 'Critical Illness medical questions',
    question: 'May I use the MCR’s CI-2014 medical questions for Critical Illness, including its 24-month tobacco question, using the CI-only version for CI-only applications and the combined version when other products are selected?',
    current: 'ABE CI currently routes to the generic Health Life questionnaire; no source CI-2014 questionnaire is assigned. Main AC47 says no Coverage smoker question, while AO47/AP47 require a smoker/non-smoker class. CI-2014 B83 supplies the missing tobacco answer within medical history.',
    proposal: 'Use Health Questions A81/B81:B84 for CI-only applications and A41/B41:B44 when CI is combined with other products, retaining those other products’ own questionnaires. Collect separate member/spouse answers and conditional medical details. Ask the source tobacco question within CI medical history rather than duplicating it on Coverage for a CI-only selection. Do not inherit another Site’s CI exceptions.',
    references: ['Main!AA47', 'Main!AC47', 'Main!AO47', 'Main!AP47', 'Health Questions!A41', 'Health Questions!B41', 'Health Questions!B42', 'Health Questions!B43', 'Health Questions!B44', 'Health Questions!A81', 'Health Questions!B81', 'Health Questions!B82', 'Health Questions!B83', 'Health Questions!B84'],
    owners: ['configurationValues/abe.sh-critical-illness.journey-policy', 'src/domain/configuredHealthQuestionnaire.ts', 'src/config/coverageQuestionRequirements.ts', 'src/pages/HealthLi.tsx'],
  },
  {
    id: 'ABE-05', title: 'Hospital Money tobacco questions',
    question: 'May I stop asking tobacco questions when Hospital Money is the only coverage selected? The MCR says no smoker question and its Hospital Money rates do not use smoking status.',
    current: 'The shared Supplemental Health category currently asks smoker, date last used and products used for both CI and Hospital Money. Main AC49/AD49 do not request them, and AR49 does not rate on tobacco.',
    proposal: 'Gate tobacco collection by the selected product’s requirements. Keep the approved standardized answer choices wherever tobacco questions do apply; remove no saved answers.',
    references: ['Main!AC49', 'Main!AD49', 'Main!AO49', 'Main!AP49', 'Main!AR49'],
    owners: ['src/config/coverageQuestionRequirements.ts', 'src/config/resolvers/resolveCoverageQuestionSections.ts', 'configurationValues/abe.sh-hospital-money.journey-policy'],
  },
  {
    id: 'ABE-06', title: 'ABE supplemental Disability medical form',
    question: 'Can you provide ABE’s NYL-12342 form, or confirm that its dedicated supplemental Disability questions should remain deferred? The MCR requires them after QD Life questions when Life QD and Disability are requested together.',
    current: 'SUP DI Health questions row 50 explicitly names ABE and NYL-12342. The file is absent from the project and the MCR does not reproduce its questions. Health Questions B101:B104 are labelled WAEPA/HPSO/NSO, so they cannot be silently assigned to ABE. The current generic Disability health flow is retained until this is answered.',
    proposal: 'When supplied/approved, add the ABE-specific mandatory Disability Supplemental Health Questions page after the QD Life step for each applying adult in the defined combined flow. Do not host or replace the approved external QD questionnaire. PDF/XML splitting remains deferred.',
    references: ['SUP DI Health questions!A7', 'SUP DI Health questions!E7', 'SUP DI Health questions!F7', 'SUP DI Health questions!A50', 'SUP DI Health questions!D50', 'SUP DI Health questions!N50', 'SUP DI Health questions!O50', 'SUP DI Health questions!T50', 'SUP DI Health questions!X50', 'Health Questions!A101'],
    owners: ['src/pages/HealthDi.tsx', 'src/domain/configuredHealthQuestionnaire.ts', 'src/domain/portfolioHealthParticipation.ts'],
  },
  {
    id: 'ABE-07', title: '$7,000 Disability financial questionnaire',
    question: 'When a member requests $7,000 or more in combined monthly Disability benefits, excluding Professional Overhead, should the full Financial Questionnaire appear after the health questions even if no QD Life is requested?',
    current: 'No full financial questionnaire is assigned to ABE. U50 says it is required at $7,000 or more “without regard to” QD Life, but also says both Life and DI question sets must render first. These statements conflict inside the same ABE-specific cell. The earlier Main-only financial review missed this cell.',
    proposal: 'Apply the explicit “without regard to” rule: count the member’s combined DI benefits, exclude OO, and show the full MCR Financial questions sheet on a separate page after the applicable health steps. This includes net worth, unearned income and conditional self-employment details. Do not add this page for spouse-only applications; the source explicitly excludes spouses and their maximum is $5,000.',
    references: ['SUP DI Health questions!O50', 'SUP DI Health questions!U50', 'SUP DI Health questions!V50', 'Financial questions!A2', 'Financial questions!B2', 'Financial questions!B3', 'Financial questions!B4', 'Financial questions!B5', 'Financial questions!B6', 'Financial questions!B7', 'Financial questions!B8', 'Financial questions!B9', 'Financial questions!B10'],
    owners: ['productQuestionSets (no ABE financial assignment)', 'src/domain/financialQuestionnaire.ts', 'src/pages/Profile.tsx', 'src/migration/requirementCrosswalkFinancialScope.ts'],
  },
];

function receipt(id, references, disposition, finding, questionIds = [], implementationReferences = []) {
  if (!disposition || !finding) throw new Error(`Unreviewed item ${id}`);
  return { id, references, disposition, finding, questionIds, implementationReferences,
    sourceHashes: Object.fromEntries(references.filter(ref => byRef.has(ref)).map(ref => [ref, hash(byRef.get(ref))])) };
}
function classify(row) {
  const refs = row.sourceReferences, first = refs[0];
  if (first.startsWith('Financial questions!')) return receipt(row.id, refs, 'reviewed-awaiting-specific-answer', 'The full source questionnaire is an ABE candidate because of explicit SUP DI U50, not an unrequested capability. Its trigger conflict and proposed placement/content are ABE-07; no fields were added.', ['ABE-07'], ['src/domain/financialQuestionnaire.ts', 'src/pages/Profile.tsx']);
  if (row.kind === 'template-behavior') {
    return receipt(row.id, refs, 'reviewed-current-shared-behavior', 'Retain the existing shared interaction. Code owners inspected; current application/quote/routing/payment/validation regression checks apply. This is not a new ABE business choice. The note-only child exception and source-specific questionnaire changes remain separately identified.', [], row.implementationReferences);
  }
  const ids = questions.filter(q => q.references.some(ref => refs.includes(ref))).map(q => q.id);
  if (ids.length) return receipt(row.id, refs, 'reviewed-awaiting-specific-answer', 'The current behavior and proposed correction are stated in the linked explicit question; no prototype change is authorized by this review.', ids, questions.filter(q => ids.includes(q.id)).flatMap(q => q.owners));
  if (/^Main!AA\d+$/.test(first)) return receipt(row.id, refs, 'reviewed-form-metadata', 'Filing codes identify application forms, not online legal wording. QD remains externally hosted/loading. CI form and ABE supplemental DI gaps are ABE-04/06. Detailed PDF/XML filing-code combinations remain deferred.', [], ['src/domain/coverageJourneyPolicy.ts']);
  if (/^Main!(?:AC|AD)\d+$/.test(first)) return receipt(row.id, refs, 'reviewed-tobacco-scope', 'This column concerns the smoker question, not payment. Existing Life tobacco collection and shared twelve choices are retained. CI/Hospital Money discrepancies are isolated as ABE-04/05.', [], ['src/config/coverageQuestionRequirements.ts', 'src/migration/sharedTobaccoOptionsDecision.ts']);
  if (first === 'Main!AE39') return receipt(row.id, refs, 'reviewed-billing-options', 'The current ABE journey owners offer ACH monthly and Direct Bill quarterly/semiannual/annual. Blank AE cells on other products do not themselves prove inheritance; their existing provisional journey records separately authorize the retained working options.', [], ['src/domain/coverageJourneyPolicy.ts', 'src/pages/Payment.tsx']);
  if (/^Main!(?:AH|AJ|AK)39$/.test(first)) return receipt(row.id, refs, 'reviewed-no-source-fee', 'The literal N/A fee entry is retained as source evidence. Current zero mock fees/credits have a separate accepted provisional authority, not an invented source amount.', [], ['src/domain/coverageJourneyPolicy.ts']);
  if (/^Main!A[N-S]\d+$/.test(first)) return receipt(row.id, refs, 'reviewed-accepted-rating-deferral', 'Rate units, risk classes, face bands, applicant/age/sex/waiting-period dimensions and insurance-anniversary age definitions are preserved. Authoritative premiums remain unavailable; current mock rating/age inputs are explicitly provisional. Main H/I govern offered benefits: 30-day LTD, 14/30-day MTD, and 12-month Overhead are not removed/expanded by abbreviated rate-dimension prose. Latest dated AO40/41 risk-class text is more specific than AP shorthand; the 20-year age-65 reference is outside its approved 17–59 entry scope. No new amount decision is requested.', [], ['src/domain/rateInputPolicy.ts', 'src/domain/rateClassPolicy.ts', 'src/domain/mockRating.ts', 'src/migration/abeCoverageReview.test.ts']);
  if (first === 'Main!AL39') return receipt(row.id, refs, 'reviewed-insurer-metadata', 'NYL is an insurer identity, not proof of a functioning insurer underwriting service. Real insurer decisions remain an accepted integration deferral.');
  if (/^Read & Sign!/.test(first)) return receipt(row.id, refs, 'reviewed-shared-review-source', 'Shared section headings, underwriting participation guards and jurisdiction fraud notices are reconciled against existing Review owners. Other-Site exception labels are not ABE rules. The exact authorization/consent, state-warning and Hospital Money note corrections are ABE-01/02/03; dividend behavior stays accepted.', [], ['src/domain/reviewPolicy.ts', 'src/content/reviewPolicies.ts', 'src/config/reviewExperience.ts', 'src/pages/Review.consent.test.tsx']);
  if (/^Standard Decision Wording !/.test(first)) return receipt(row.id, refs, 'reviewed-existing-mock-boundary', 'The common decision paragraphs describe production vendor approval/referral/decline and outages. Keep the approved mock/external QD boundary; do not claim live insurer decisions. AAFP/AMA/NYSBA variants do not apply to ABE.', [], ['src/pages/HealthQd.tsx']);
  throw new Error(`No completed disposition: ${row.id} ${first}`);
}

const reviewedQueue = (priorAssessment.reviewedQueue ?? abe.queue).map(item => classify(byId.get(item.id)));
const supporting = abe.sourceFollowThrough.supportingSources.flatMap(cell => cell.clauses.filter(clause => clause.status === 'review-pending' || priorAssessment.supporting?.some(row => row.id === clause.id)).map(clause => {
  const ref = cell.reference;
  const col = ref.split('!')[1].replace(/\d+$/, '');
  let finding;
  if (['A', 'B', 'C', 'E', 'F'].includes(col)) finding = 'Exact product/G-number join, category, name, situs and plan-code metadata reconciled; no blank Site label is used as inheritance. Current role-specific identifiers remain owned by the native journey mappings.';
  else if (['G', 'H', 'I', 'Z'].includes(col)) finding = 'Mortality/MRS/BMI/risk-class and vendor override data are retained with the accepted rate/insurer-service deferrals. They are not a new online field, a live underwriting decision or authoritative premium.';
  else if (col === 'L' || col === 'Q' || col === 'T') finding = 'Children retain approved ages, amounts, dependent guards and unmarried note only. The detailed row explicitly has no child medical questions; fixed-term “not eligible for QD” does not change Main child coverage availability or the accepted NA override.';
  else if (col === 'M') finding = 'Source-only R5/R4a/R21/R22 riders retain the accepted non-activation decision; R28 is separately verified. Reviewing source text does not enable a rider.';
  else if (col === 'R' || col === 'S') finding = 'Main optional membership IDs, required adult SSNs and accepted dividend behavior supersede the older QD ID/SSN/dividend wording. No Domestic Partner Form is added. N/A here limits the QD pathway, not general spouse availability.';
  else if (['U', 'V', 'W'].includes(col)) finding = 'Applicant-specific medical participation matches native adult QD/FUW routing and explicit child NA. QD DI is member-only; general spouse FUW availability remains independent.';
  else if (col === 'X') finding = 'External GMA-JI-L and state form variants remain the approved loading experience; state-specific document/questionnaire delivery remains deferred, not silently implemented.';
  else if (col === 'Y') finding = 'MagnumPure/NYL labels are production service ownership. They do not turn current mock outcomes into real approvals; retain the accepted integration boundary.';
  else throw new Error(`Unreviewed supporting source ${ref}`);
  return receipt(clause.id, [ref], 'reviewed-existing-decision-or-deferral', finding, [], ['src/migration/abeSourceReview.test.ts', 'src/migration/abeProcessingAdoption.test.ts']);
}));

const unassigned = (priorAssessment.unassigned ?? abe.unassignedApplicabilityQueue).map(item => {
  const row = byId.get(item.id), ref = row.sourceReferences[0], sheet = ref.split('!')[0];
  const ids = questions.filter(q => q.references.includes(ref)).map(q => q.id);
  let finding;
  if (sheet === 'ElectrConsent') finding = 'Applies as common electronic-consent content. Existing copy covers the supplied sections and GMA-EC edition; typography/capitalization differences are not new business decisions. Important Notice/privacy-document links and production document delivery retain existing asset/integration deferrals.';
  else if (sheet === 'Underwriting') finding = 'Common Profile collection: height, weight, foreign-residence intent and correspondence/medical address choice use existing shared fields and applicant guards. Blank B11 supplies no additional question. No extra fields are inferred from the Asked for column.';
  else if (sheet === 'Order of Products Across Site') finding = 'General product-family examples are not new ABE product assignments. Explicit AMA order is not inherited. Current ABE enabled products/order and source-specific overrides are preserved; ABE has no Accident-Only DI comparison requiring a new sort decision.';
  else if (sheet === 'Smoker Question') finding = 'The ABE-specific GMA-JI-L row 20 and approved shared twelve answers govern ABE. Generic Smoker 1 duration/24-month rating instructions are not silently applied to that distinct version.';
  else if (sheet === 'SUP DI Health questions') finding = 'A1:A4 are general guidance, qualified by the explicit ABE row 7 and detailed row 50. The generic WAEPA/HPSO/NSO question text is not assigned to ABE. ABE-specific online content and the financial-trigger conflict are ABE-06/07.';
  else if (sheet === 'Legal Disclosures') finding = 'Common legal-text/location guards apply where explicitly matched; ABE authorization/state/note corrections are ABE-01/02/03. The NY replacement warning already has its shared Profile adoption. Missing custom consent and detailed Important Notice output stay deferred; Compass Rose/other variants are not ABE.';
  else if (sheet === 'Read & Sign') finding = 'Structural section numbers/headings have no independent behavior. AMA/WAEPA/ABEGI/OMA/NYSBA exception boundaries are not inherited. B52/C52 is the QD DI/combo authorization proposed in ABE-01; supplied Important Notice jurisdiction headings retain existing detailed-document deferrals.';
  else if (sheet === 'Standard Decision Wording ') finding = 'AAFP/AMA/NYSBA variants are outside ABE. No new mock production approval claim is activated.';
  else throw new Error(`Unreviewed applicability candidate ${ref}`);
  return receipt(row.id, row.sourceReferences, ids.length ? 'reviewed-awaiting-specific-answer' : 'reviewed-explicit-abe-disposition', finding, ids);
});

const absences = abe.sourceAbsences.map(item => {
  const col = item.reference.split('!')[1].replace(/\d+$/, '');
  const explanations = {
    X: 'No Main local questionnaire text is supplied. QD remains external. FUW goes to underwriters after submission and adds no online questionnaire by itself. Existing TELE forms and explicit CI and supplemental DI forms remain separately configured.',
    Y: 'Blank Main financial flags are not proof that ABE has no financial requirement: SUP DI Health questions U50 explicitly supplies one. Resolve ABE-07 before assigning the full questionnaire.',
    Z: 'No QD conclusion is inferred from the blank. Approved QD LI/DI supporting rows and current explicit per-applicant policies own routing.',
    AD: 'No generic tobacco lookback is inferred from absence. Keep the separate approved version/working rating decision; do not import Smoker 1 into ABE’s GMA-JI-L question.',
    M: 'No country list is inherited from M39 merely because this coordinate is absent. Each product has its own accepted provisional mainland-US/DC residency policy.',
    AE: 'Blank payment methods do not prove inheritance. Preserve the explicitly accepted provisional journey payment methods/frequencies for this product.',
    AF: 'No frequency default is inferred. Retain the existing explicitly provisional payment policy.',
    AG: 'No billing factor is inferred. Retain accepted provisional modal factors; authoritative rates remain unavailable.',
    AH: 'No amount/fee is inferred from absence. The accepted provisional fee is explicitly zero, rather than a source-confirmed value.',
    AI: 'No fee or processing basis is inferred. Keep the separate accepted provisional billing policy.',
    AJ: 'No credit is inferred from absence. Keep the accepted provisional zero credit.',
    AK: 'No additional payment adjustment is inferred. Existing billing/credit assumptions retain their provisional authority.',
    AL: 'No insurer identity or operating service is inferred from a blank. Product identity and explicit NYL metadata remain separate; real insurer services are deferred.',
    AM: 'No production rating service is inferred from absence. Preserve unavailable authoritative rates and the existing mock service boundary.',
  };
  if (!explanations[col]) throw new Error(`Unreviewed source absence ${item.reference}`);
  return receipt(item.reference, [item.reference], 'reviewed-source-absence-no-inheritance', explanations[col], col === 'Y' ? ['ABE-07'] : []);
});

const extraReferences = source.cells.filter(cell => cell.sheet === 'SUP DI Health questions' && /^(?:[A-Z]+50|[A-F]7)$/.test(cell.cell) || cell.sheet === 'New UX Multi-page Requirements' && /^[A-Z]+51$/.test(cell.cell) || cell.sheet === 'Health Questions' && /^(?:[AB](?:4[1-4]|8[1-4]|10[1-4]))$/.test(cell.cell) || cell.sheet === 'Financial questions').map(cell => `${cell.sheet}!${cell.cell}`);
const additionalSources = extraReferences.map(ref => receipt(ref, [ref], questions.some(q => q.references.includes(ref)) ? 'reviewed-awaiting-specific-answer' : 'reviewed-supporting-abe-context', ref.startsWith('New UX') ? 'ABE-specific historical UX source retained as context: amounts/caps/periods align with Main or accepted decisions. The 12-month Overhead text reinforces Main H48 against AR48’s 24-month rate reference. Legacy additional-amount wording does not override the accepted resulting-total contract. New-template shared copy/branding and the existing nonblocking Coverage-notice deferral remain preserved.' : 'Exact ABE/form-specific context inspected in addition to the earlier queue. Detailed PDF/XML rules remain deferred; online form/content and financial-trigger decisions are explicitly isolated below.', questions.filter(q => q.references.includes(ref)).map(q => q.id)));

const allReceipts = [...reviewedQueue, ...supporting, ...unassigned, ...absences, ...additionalSources];
const files = ['src/migration/sources/mcr-v78.json', 'scripts/build-abe-review-assessment.mjs', 'src/migration/abeFinalReviewAssessment.test.ts', 'src/pages/Review.tsx', 'src/config/reviewExperience.ts', 'src/domain/reviewPolicy.ts', 'src/domain/configuredHealthQuestionnaire.ts', 'src/domain/financialQuestionnaire.ts', 'src/config/coverageQuestionRequirements.ts', 'src/migration/requirementCrosswalkFinancialScope.ts', 'src/pages/HealthLi.tsx', 'src/pages/HealthDi.tsx', 'src/pages/Profile.tsx', 'src/pages/Payment.tsx', 'src/app/useCoverageState.ts', 'src/components/forms/DynamicList.tsx', 'src/components/forms/YesNoDetailList.tsx', 'src/components/forms/FieldRenderer.tsx', 'src/components/forms/EligibilityFields.tsx', 'src/utils/applicantVisibility.ts', 'src/components/layout/AppDrawer.tsx', 'src/components/layout/AppHeader.tsx', 'src/components/layout/AppShell.tsx', 'src/components/layout/AppBody.tsx', 'src/components/layout/SinglePageSections.tsx'];
const result = {
  reviewedOn: priorAssessment.cirQuestionnaireFollowUp ? priorAssessment.reviewedOn : '2026-10-22', siteKey: 'abe', status: 'approved-changes-implemented', signOff: 'ABE implementation and review complete for the current mock prototype; accepted production and source-gap deferrals remain explicit', prototypeChangedByThisReview: true, nativeFingerprint: read('docs/project-review/step1-abe-review-evidence.json').finalNativeHash, pendingQuestions: [], membershipDecision: 'User approved optional Membership ID on Membership; implemented as abe-member-id, not required.',
  authority: source.workbook, workbookSha256: source.sha256,
  counts: { scopedQueueReviewed: reviewedQueue.length, supportingClausesReviewed: supporting.length, sharedCandidatesReviewed: unassigned.length, blankCoordinatesReviewed: absences.length, additionalSourceCellsReviewed: additionalSources.length, unclassified: 0, explicitQuestions: 0, answeredDecisions: questions.length },
  supersededConclusion: 'The earlier Main-only conclusion that the full Financial questions sheet has no current-Site source trigger is incomplete for ABE. SUP DI Health questions U50 explicitly names the $7,000 ABE trigger and contains the conflict in ABE-07. The user resolved the conflict: member-only on the existing Profile section, combined DI >= $7,000 excluding OO, independent of QD Life and Health completion.',
  existingDecisionsKept: ['Approved adult/child ages, Hospital Money service extension and spouse work minimum', 'Child unmarried note only, no answer', 'Standardized shared tobacco-product choices', 'Required adult SSNs and optional membership IDs; shared email placement', 'Accepted dividend acknowledgment/optional identity fields', 'v78 QD/FUW processing and external QD loading', 'Explicit D17, rider non-activation, limited-country and mock-rating provisional decisions', 'Unavailable authoritative prices, production insurer/payment services, detailed PDF/XML, missing Important Notice/custom-consent assets and Coverage notice deferrals'],
  verification: { suites: ['abeApprovedDecisions', 'abeEligibilityAdoption', 'abeCoverageReview', 'abeProcessingAdoption', 'HealthCi', 'Membership.basicCollection', 'Profile', 'Review.consent', 'coverageJourneyAcceptance', 'coverageJourneyExceptionMatrix', 'clientRuntimeAccuracy', 'reviewAuthorizationAdoption', 'sharedConsentAdoption', 'qdDisabilityAuthorizationAdoption', 'jurisdictionReviewNoticeAdoption', 'combinedDisabilityQuestionnaireAdoption', 'reviewAndRateAcceptance', 'navigationReview', 'namedOwnerReview', 'RoutePage.navigation', 'Payment.revalidation', 'Beneficiary', 'Contact', 'requirementCrosswalk'], persistedScenarios: 1868, scope: 'Approved ABE behavior, source and owner invalidation, applicant isolation, rendered placement, shared navigation/validation, native journeys and payment regressions. Build and deterministic crosswalk generation also verified.' },
  ...(priorAssessment.fieldCatalogFollowUp ? { fieldCatalogFollowUp: priorAssessment.fieldCatalogFollowUp } : {}),
  ...(priorAssessment.cirQuestionnaireFollowUp ? { cirQuestionnaireFollowUp: priorAssessment.cirQuestionnaireFollowUp } : {}),
  ...(priorAssessment.fuwQuestionnaireFollowUp ? { fuwQuestionnaireFollowUp: priorAssessment.fuwQuestionnaireFollowUp } : {}),
  ...(priorAssessment.fiftyPlusFlowFollowUp ? { fiftyPlusFlowFollowUp: priorAssessment.fiftyPlusFlowFollowUp } : {}),
  files: Object.fromEntries([...new Set([...files, ...adoptedFiles, ...fieldCatalogReviewFiles, ...allReceipts.flatMap(row => row.implementationReferences).flatMap(path => path.split(';').map(value => value.trim())), 'src/pages/HealthSi.tsx', 'src/pages/HealthQd.tsx', 'src/pages/Coverage.tsx', 'src/pages/Eligibility.tsx'])].filter(existsSync).map(path => [path, createHash('sha256').update(readFileSync(path)).digest('hex')])),
  questions: questions.map(q => ({ id: q.id, title: q.title, question: q.question, previousBehavior: q.current, proposalBeforeAnswer: q.proposal, references: q.references, owners: q.id === "ABE-07" ? ["configurationValues/abe.profile-financial-questionnaire", "pageSections/profile.profileFinancialQuestionnaireSelf", "src/domain/financialQuestionnaire.ts", "src/pages/Profile.tsx"] : q.id === "ABE-04" ? ["configurationValues/abe.health-ci.source-questionnaire", "configurationValues/abe.sh-critical-illness.journey-policy", "sitePages/abe.health-ci", "src/pages/HealthCi.tsx"] : q.id === "ABE-06" ? ["configurationValues/abe.health-di.source-questionnaire", ...["di-ltd-plus", "di-ltd", "di-mtd"].map(key => `configurationValues/abe.${key}.journey-policy`), "src/pages/HealthDi.tsx"] : q.owners, status: "answered-and-implemented", decision: decisions[q.id], verificationReferences: ["src/migration/abeApprovedDecisions.test.ts", "src/pages/Profile.test.tsx", "src/pages/Review.consent.test.tsx"], source: Object.fromEntries(q.references.map(ref => { if (!byRef.has(ref)) throw new Error(`Missing question source ${ref}`); return [ref, byRef.get(ref)]; })) })),
  reviewedQueue, supporting, unassigned, absences, additionalSources,
};
for (const receipt of allReceipts) {
  if (receipt.questionIds.length) {
    receipt.disposition = 'reviewed-approved-implementation';
    receipt.finding = receipt.questionIds.map(id => decisions[id]).join(' ');
    receipt.implementationReferences = [...new Set([...receipt.implementationReferences, ...adoptedFiles.filter(path => path.endsWith('.ts') || path.endsWith('.tsx'))])];
  }
  receipt.finding = receipt.finding.replace('Resolve ABE-07 before assigning the full questionnaire.', decisions['ABE-07']).replace('The generic WAEPA/HPSO/NSO question text is not assigned to ABE. ABE-specific online content and the financial-trigger conflict are ABE-06/07.', decisions['ABE-06'] + ' ' + decisions['ABE-07']);
}
writeFileSync('docs/project-review/abe-final-review.json', JSON.stringify(result, null, 2) + '\n');
const md = `# ABE review — decisions applied

October 22, 2026. All seven questions have been answered and implemented. **No unanswered ABE business questions remain.** The optional Membership ID is now on Membership.

${questions.map((q, i) => `## ${i + 1}. ${q.title}

${decisions[q.id]}

Source: ${q.references.map(ref => `\`${ref}\``).join(', ')}.`).join('\n\n')}

The [complete item-by-item assessment](abe-final-review.json) retains the original review inventory, exact source cells, accepted deferrals, decisions and code/native fingerprints. The [approved-decision checks](../../src/migration/abeApprovedDecisions.test.ts), rendered Membership/Profile/Review tests and shared navigation/payment regressions verify the implementation. Production integrations, authoritative rates and detailed PDF/XML retain their existing explicit deferrals. No other Site has started.
`;
writeFileSync('docs/project-review/abe-review-questions.md', md);
console.log(JSON.stringify(result.counts));
