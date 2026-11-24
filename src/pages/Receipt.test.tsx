import { readFileSync } from "node:fs";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { receiptDefaults } from "../content/defaults/receipt";
import { sharedDefaults } from "../content/defaults/shared";
import { getPrototypeLibrary } from "../domain/prototypeLibrary";
import type { CoverageDefinition } from "../config/coverages/types";
import type { SelectedCoverageEntry } from "../utils/coverageDecisions";
import { downloadApplicationPdf } from "../utils/applicationPdf";
import { sendReceiptMockEmail } from "../utils/mockEmail";
import Receipt from "./Receipt";
import type { RateDisplayState } from '../domain/rateDisplay';

let content = { receipt: structuredClone(receiptDefaults), shared: structuredClone(sharedDefaults) };
let products: CoverageDefinition[];
const values: Record<string, unknown> = { "mock-submission-id": "DEMO-123" };
const estimateItems: Array<{ id: string; period: string; display: RateDisplayState }> = [];
vi.mock("../content", () => ({ getContent: () => content }));
vi.mock("../config/pages", () => ({ getPageTitle: () => "Receipt", getPageSubhead: () => "Receipt introduction" }));
vi.mock("../app/ApplicationFormContext", () => ({ useApplicationForm: () => ({ values }) }));
vi.mock("../config/client/getActiveClientCoverages", () => ({ getActiveClientCoverages: () => products }));
vi.mock('../app/estimates/useApplicationEstimates', async importOriginal => ({
  ...await importOriginal<typeof import('../app/estimates/useApplicationEstimates')>(),
  useApplicationEstimates: () => ({ items: estimateItems }),
}));
vi.mock("../utils/coverageDecisions", async importOriginal => ({
  ...await importOriginal<typeof import("../utils/coverageDecisions")>(),
  getOrderedDecisionEntries: (_: unknown, currentProducts: CoverageDefinition[]) => currentProducts.flatMap(coverage => ((values.productApplicants as Record<string, Array<'member' | 'spouse' | 'child'>> | undefined)?.[coverage.id] ?? ['member']).map(applicant => ({ coverage, coverageId: coverage.id, applicant, underwriting: { status: "resolved", underwritingType: coverage.underwritingType } }))) as SelectedCoverageEntry[],
}));
vi.mock("../utils/mockEmail", () => ({ sendReceiptMockEmail: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../utils/applicationPdf", () => ({ downloadApplicationPdf: vi.fn() }));
vi.mock("../components/feedback/ApplicationErrorState", () => ({ default: ({ status }: { status: string }) => <div>Shared error: {status}</div> }));
vi.mock("../components/layout/SiteSupport", () => ({ default: ({ confirmationId }: { confirmationId?: string }) => <div data-testid="site-support">Site support {confirmationId}</div> }));
vi.mock("../app/sections/ConfiguredApplicantSectionDivider", () => ({ default: ({ children }: { children: ReactNode }) => children }));

let root: Root, container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubEnv("VITE_MOCK_PLATFORM_ENABLED", "");
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  vi.mocked(downloadApplicationPdf).mockClear();
  vi.mocked(sendReceiptMockEmail).mockResolvedValue(undefined);
  content = { receipt: structuredClone(receiptDefaults), shared: structuredClone(sharedDefaults) };
  for (const key of Object.keys(values)) if (key !== 'mock-submission-id') delete values[key];
  installPrototypeLibrary(resolvePrototypeLibrary(JSON.parse(readFileSync("public/catalog/portal.json", "utf8")).data, "asce", "receipt-unit"));
  vi.mocked(sendReceiptMockEmail).mockClear();
  products = [{ ...getPrototypeLibrary()!.products.find(product => product.id === "li-term")!, name: "Current site coverage", underwritingType: "FUW", riders: [] }];
  estimateItems.length = 0;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  installPrototypeLibrary(null);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it("resolves receipt copy, decision text, applicants and products again on rerender", async () => {
  Object.assign(values, { 'payment-information-opt-in': 'yes', coverageSelections: [products[0].id], coverageAmounts: { [`${products[0].id}:member`]: 100000 }, [`payment-method:${products[0].id}`]: 'bank-account', [`payment-frequency:${products[0].id}`]: 'monthly' });
  await act(async () => root.render(<Receipt />));
  expect(container.textContent).toContain("Current site coverage");
  expect(container.textContent).toContain(receiptDefaults.decisionStatuses.fullyUnderwritten.description);
  content.receipt.confirmationNumberLabel = "Updated reference:";
  content.receipt.documentDownloadLabels.application = "Updated application download";
  content.receipt.paymentNotice = "Client-authored payment timing.";
  content.receipt.decisionStatuses.fullyUnderwritten = { label: "Updated decision", description: "Updated decision details" };
  content.shared.applicantLabels.member = "Updated applicant";
  products = [{ ...products[0], name: "Updated site coverage" }];
  await act(async () => root.render(<Receipt />));
  for (const text of ["Updated reference:", "Updated application download", "Client-authored payment timing.", "Updated decision", "Updated decision details", "Updated site coverage"]) {
    expect(container.textContent).toContain(text);
  }
  expect(container.querySelector('[aria-label="Updated applicant coverage decision"]')).not.toBeNull();
  expect(container.textContent).not.toContain("Current site coverage");
  expect(container.textContent).not.toContain(receiptDefaults.decisionStatuses.fullyUnderwritten.description);
  expect(container.textContent).toContain("DEMO-123");
  expect(sendReceiptMockEmail).not.toHaveBeenCalled();
  expect(container.textContent).toContain("Site support DEMO-123");
  expect(container.textContent).toContain("What happens next?");
  expect(container.textContent).not.toContain("Your application has been saved.");
});

it("keeps document actions as placeholders and has no forward or back navigation", async () => {
  values['payment-information-opt-in'] = 'yes';
  values.coverageSelections = [products[0].id];
  values.coverageAmounts = { [`${products[0].id}:member`]: 100000 };
  values[`payment-method:${products[0].id}`] = 'bank-account';
  values[`payment-frequency:${products[0].id}`] = 'monthly';
  await act(async () => root.render(<Receipt />));
  const buttons = [...container.querySelectorAll("button")];
  await act(async () => buttons.find(button => button.textContent === "Application PDF")!.click());
  await act(async () => buttons.find(button => button.textContent === "Payment PDF")!.click());
  expect(downloadApplicationPdf).not.toHaveBeenCalled();
  expect(document.body.textContent).toContain("Document downloads are placeholders in this prototype.");
  expect(container.querySelectorAll("h1")).toHaveLength(1);
  const notice = [...container.querySelectorAll('.MuiAlert-standardInfo')].find(alert => alert.textContent?.includes(receiptDefaults.whatHappensNext.title))!;
  expect(notice.textContent).toContain(receiptDefaults.paymentNotice);
  expect(notice.textContent).toContain(receiptDefaults.documentsNote);
  expect(notice.querySelectorAll('button')).toHaveLength(2);
  expect(notice.querySelectorAll('.MuiButton-text')).toHaveLength(0);
  expect(container.querySelector('[aria-label="Application estimate and actions"]')).toBeNull();
  expect(container.textContent).toContain('Requested coverage');
  expect(container.textContent).not.toContain('You · Requested coverage');
  expect(buttons.some(button => /^(Next|Back)$/.test(button.textContent ?? ""))).toBe(false);
});

it("retains the empty coverage state", async () => {
  products = [];
  await act(async () => root.render(<Receipt />));
  expect(container.textContent).toContain(receiptDefaults.coverageDecisions.noSelectionsMessage);
  expect(container.textContent).toContain("Site support");
});

it('allows a client to omit the payment guidance notice', async () => {
  Object.assign(values, { 'payment-information-opt-in': 'yes', coverageSelections: [products[0].id], coverageAmounts: { [`${products[0].id}:member`]: 100000 }, [`payment-method:${products[0].id}`]: 'bank-account', [`payment-frequency:${products[0].id}`]: 'monthly' });
  content.receipt.paymentNotice = '';
  await act(async () => root.render(<Receipt />));
  expect(container.textContent).not.toContain(receiptDefaults.paymentNotice);
  expect(container.textContent).toContain(receiptDefaults.whatHappensNext.title);
  expect(container.textContent).toContain(receiptDefaults.coverageDecisions.title);
  expect([...container.querySelectorAll('button')].some(button => button.textContent === 'Payment PDF')).toBe(true);
});

it.each([
  ['bank account', 'yes', 'bank-account', 'monthly', true, 'optional', true],
  ['Bill me', 'yes', 'bill-me', 'monthly', true, 'optional', true],
  ['required collection', undefined, 'bank-account', 'monthly', true, 'required', true],
  ['optional opt-out', 'no', 'bank-account', 'monthly', true, 'optional', false],
  ['unanswered optional collection', undefined, 'bank-account', 'monthly', true, 'optional', false],
  ['disabled collection', 'yes', 'bank-account', 'monthly', true, 'none', false],
  ['removed product', 'yes', 'bank-account', 'monthly', false, 'optional', false],
  ['incomplete frequency', 'yes', 'bank-account', undefined, true, 'optional', false],
  ['invalid frequency', 'yes', 'bank-account', 'weekly', true, 'optional', false],
  ['invalid method', 'yes', 'unsupported', 'monthly', true, 'optional', false],
] as const)('keeps Site payment copy subject to global active-payment applicability: %s', async (_label, optIn, method, frequency, selected, requirement, expected) => {
  const id = products[0].id;
  getPrototypeLibrary()!.site.configuration.pages.find(page => page.key === 'payment')!.requirement = requirement;
  Object.assign(values, { 'payment-information-opt-in': optIn, coverageSelections: selected ? [id] : [], coverageAmounts: { [`${id}:member`]: 100000 }, [`payment-method:${id}`]: method, [`payment-frequency:${id}`]: frequency });
  content.receipt.paymentNotice = 'Configured payment guidance.';
  await act(async () => root.render(<Receipt />));
  expect(container.textContent?.includes('Configured payment guidance.')).toBe(expected);
  expect([...container.querySelectorAll('button')].some(button => button.textContent === 'Payment PDF')).toBe(expected);
  expect(container.textContent).toContain(receiptDefaults.documentsNote);
  expect(container.textContent).toContain(receiptDefaults.whatHappensNext.title);
  if (requirement === 'optional' && expected) {
    values['payment-information-opt-in'] = 'no';
    await act(async () => root.render(<Receipt />));
    expect(container.textContent).not.toContain('Configured payment guidance.');
    expect([...container.querySelectorAll('button')].some(button => button.textContent === 'Payment PDF')).toBe(false);
  }
});

it('places each product’s coverage and payment details below its decision and aligns support beside the section', async () => {
  values['payment-information-opt-in'] = 'yes';
  products = [products[0], { ...products[0], id: 'li-10yr', name: 'Second coverage' }];
  values[`payment-method:${products[0].id}`] = 'bank-account';
  values['payment-method:li-10yr'] = 'bill-me';
  values.coverageSelections = products.map(product => product.id);
  values[`payment-frequency:${products[0].id}`] = 'monthly';
  values['payment-frequency:li-10yr'] = 'annually';
  values.coverageAmounts = { [`${products[0].id}:member`]: 100000, 'li-10yr:member': 200000 };
  estimateItems.push({ id: `${products[0].id}:member`, period: 'monthly', display: { status: 'available', amount: 10 } }, { id: 'li-10yr:member', period: 'annually', display: { status: 'available', amount: 240 } });
  await act(async () => root.render(<Receipt />));
  const decisions = [...container.querySelectorAll('article[aria-label="You coverage decision"]')];
  expect(decisions).toHaveLength(2);
  for (const decision of decisions) {
    expect(decision.textContent).toContain(receiptDefaults.decisionStatuses.fullyUnderwritten.label);
    expect(decision.textContent).toContain(receiptDefaults.decisionStatuses.fullyUnderwritten.description);
    expect(decision.querySelector('.MuiStepper-root')).toBeNull();
    expect(decision.textContent).toContain('Decision:');
    expect(decision.textContent).toContain('Payment method');
    expect(decision.textContent).toContain('Requested coverage');
    expect(decision.textContent).toContain('Estimated payment');
    const details = decision.querySelector('dl')!;
    expect(details).not.toBeNull();
    expect(decision.textContent!.indexOf(receiptDefaults.decisionStatuses.fullyUnderwritten.description)).toBeLessThan(decision.textContent!.indexOf('Requested coverage'));
    expect(decision.textContent).not.toContain('Paid');
  }
  expect(decisions[0].textContent).toContain('Bank account');
  expect(decisions[0].textContent).not.toContain('Bill me');
  expect(decisions[0].textContent).toContain('$100,000');
  expect(decisions[0].textContent).toContain('$10.00/mo');
  expect(decisions[1].textContent).toContain('Bill me');
  expect(decisions[1].textContent).not.toContain('Bank account');
  expect(decisions[1].textContent).toContain('$200,000');
  expect(decisions[1].textContent).toContain('$240.00/yr');
  expect(container.querySelector('[aria-labelledby="application-receipt-heading"]')).toBeNull();
  const decisionSection = container.querySelector('[aria-labelledby="receipt-decisions-heading"]')!;
  expect(decisionSection.nextElementSibling?.firstElementChild).toBe(container.querySelector('[data-testid="site-support"]'));
});

it.each([false, true])('uses standard applicant headings only when other applicants participate (dependents: %s)', async withSpouse => {
  if (withSpouse) values.productApplicants = { [products[0].id]: ['member', 'spouse'] };
  else products = [products[0], { ...products[0], id: 'another-member-product' }];
  await act(async () => root.render(<Receipt />));
  const standaloneLabels = [...container.querySelectorAll('.MuiTypography-root')].filter(element => ['You', 'Your Spouse'].includes(element.textContent ?? ''));
  expect(standaloneLabels).toHaveLength(withSpouse ? 2 : 0);
  expect(container.querySelectorAll('svg[data-testid="PersonRoundedIcon"]')).toHaveLength(withSpouse ? 1 : 0);
  expect(container.querySelectorAll('svg[data-testid="SupervisorAccountRoundedIcon"]')).toHaveLength(withSpouse ? 1 : 0);
});

it('keeps member and spouse amounts and estimates with their own decisions', async () => {
  const id = products[0].id;
  values.productApplicants = { [id]: ['member', 'spouse'] };
  values.coverageAmounts = { [`${id}:member`]: 300000, [`${id}:spouse`]: 100000 };
  values[`payment-method:${id}`] = 'bank-account';
  estimateItems.push({ id: `${id}:member`, period: 'monthly', display: { status: 'available', amount: 30 } }, { id: `${id}:spouse`, period: 'monthly', display: { status: 'available', amount: 15 } });
  await act(async () => root.render(<Receipt />));
  const member = container.querySelector('article[aria-label="You coverage decision"]')!;
  const spouse = container.querySelector(`article[aria-label="${content.shared.applicantLabels.spouse} coverage decision"]`)!;
  expect(member.textContent).toContain('$300,000');
  expect(member.textContent).toContain('$30.00/mo');
  expect(member.textContent).not.toContain('$15.00/mo');
  expect(spouse.textContent).toContain('$100,000');
  expect(spouse.textContent).toContain('$15.00/mo');
  expect(spouse.textContent).not.toContain('$30.00/mo');
});

it('retains suppressed estimates and unavailable selection details without implying payment was taken', async () => {
  estimateItems.push({ id: `${products[0].id}:member`, period: 'monthly', display: { status: 'hidden' } });
  await act(async () => root.render(<Receipt />));
  const decision = container.querySelector('article')!;
  expect(decision.textContent).not.toContain('Estimated payment');
  expect(decision.textContent).toContain('Not available');
  expect(decision.textContent).toContain('Not selected');
  expect(decision.textContent).not.toContain('Paid');
});

it('ignores stale QD results on products without the QD badge', async () => {
  const base = { ...products[0], underwritingBands: [] };
  products = [{ ...base, id: 'qd', name: 'QD coverage', underwritingType: 'QD' }, { ...base, id: 'standard', name: 'Standard coverage', underwritingType: 'FUW' }];
  values.qdDecisions = { 'qd:member': 'conditionally-approved', 'standard:member': 'conditionally-approved' };
  await act(async () => root.render(<Receipt />));
  const articles = [...container.querySelectorAll('article')];
  expect(articles.find(article => article.textContent?.includes('QD coverage'))?.textContent).toContain('Conditionally approved');
  const standard = articles.find(article => article.textContent?.includes('Standard coverage'))!;
  expect(standard.textContent).toContain('Sent for review');
  expect(standard.textContent).not.toContain('Conditionally approved');
});

it.each([undefined, 'unknown'])('uses the shared technical-error template for a missing or unrecognized QD result: %s', async result => {
  products = [{ ...products[0], underwritingType: 'QD' }];
  values.qdDecisions = { [`${products[0].id}:member`]: result };
  await act(async () => root.render(<Receipt />));
  expect(container.textContent).toBe('Shared error: technical-error');
  expect(container.querySelector('article')).toBeNull();
});
it('hides Payment PDF without active payment answers and displays configured underwriting guidance only for review', async () => {
  content.receipt.underwritingNote = { title: 'Review next step', text: 'Configured medical-review guidance.' };
  await act(async () => root.render(<Receipt />));
  expect(container.textContent).toContain('Configured medical-review guidance.');
  expect([...container.querySelectorAll('button')].some(button => button.textContent === 'Payment PDF')).toBe(false);
  products = [{ ...products[0], underwritingType: 'QD' }];
  values.qdDecisions = { [`${products[0].id}:member`]: 'conditionally-approved' };
  await act(async () => root.render(<Receipt />));
  expect(container.textContent).not.toContain('Configured medical-review guidance.');
});
