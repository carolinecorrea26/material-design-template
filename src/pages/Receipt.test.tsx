import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { receiptDefaults } from "../content/defaults/receipt";
import { sharedDefaults } from "../content/defaults/shared";
import { coverages } from "../config/coverages";
import type { CoverageDefinition } from "../config/coverages/types";
import type { SelectedCoverageEntry } from "../utils/coverageDecisions";
import { downloadApplicationPdf } from "../utils/applicationPdf";
import { sendReceiptMockEmail } from "../utils/mockEmail";
import Receipt from "./Receipt";

let content = { receipt: structuredClone(receiptDefaults), shared: structuredClone(sharedDefaults) };
let products: CoverageDefinition[];
const values: Record<string, unknown> = { "mock-submission-id": "DEMO-123" };
vi.mock("../content", () => ({ getContent: () => content }));
vi.mock("../config/pages", () => ({ getPageTitle: () => "Receipt" }));
vi.mock("../app/ApplicationFormContext", () => ({ useApplicationForm: () => ({ values }) }));
vi.mock("../config/client/getActiveClientCoverages", () => ({ getActiveClientCoverages: () => products }));
vi.mock("../utils/coverageDecisions", async importOriginal => ({
  ...await importOriginal<typeof import("../utils/coverageDecisions")>(),
  getOrderedDecisionEntries: (_: unknown, currentProducts: CoverageDefinition[]) => currentProducts.flatMap(coverage => ((values.productApplicants as Record<string, Array<'member' | 'spouse' | 'child'>> | undefined)?.[coverage.id] ?? ['member']).map(applicant => ({ coverage, coverageId: coverage.id, applicant }))) as SelectedCoverageEntry[],
}));
vi.mock("../utils/mockEmail", () => ({ sendReceiptMockEmail: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../utils/applicationPdf", () => ({ downloadApplicationPdf: vi.fn() }));
vi.mock("../components/layout/SiteSupport", () => ({ default: ({ confirmationId }: { confirmationId?: string }) => <div>Site support {confirmationId}</div> }));
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
  products = [{ ...coverages[0], name: "Current site coverage", underwritingType: "FUW", riders: [] }];
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it("resolves receipt copy, decision text, applicants and products again on rerender", async () => {
  await act(async () => root.render(<Receipt />));
  expect(container.textContent).toContain("Current site coverage");
  expect(container.textContent).toContain(receiptDefaults.decisionStatuses.fullyUnderwritten.description);
  content.receipt.confirmationNumberLabel = "Updated reference:";
  content.receipt.documentDownloadLabels.application = "Updated application download";
  content.receipt.receivedMessage = "Updated acknowledgement";
  content.receipt.paymentNotice = "Client-authored payment timing.";
  content.receipt.decisionStatuses.fullyUnderwritten = { label: "Updated decision", description: "Updated decision details" };
  content.receipt.decisionSteps = ["New submission", "New review", "New decision"];
  content.shared.applicantLabels.member = "Updated applicant";
  products = [{ ...products[0], name: "Updated site coverage" }];
  await act(async () => root.render(<Receipt />));
  for (const text of ["Updated reference:", "Updated application download", "Updated acknowledgement", "Client-authored payment timing.", "Updated decision", "Updated decision details", "Updated site coverage"]) {
    expect(container.textContent).toContain(text);
  }
  expect(container.querySelector('[aria-label="Updated applicant coverage decision"]')).not.toBeNull();
  expect(container.textContent).not.toContain("Current site coverage");
  expect(container.textContent).not.toContain(receiptDefaults.decisionStatuses.fullyUnderwritten.description);
  expect(container.textContent).toContain("DEMO-123");
  expect(container.textContent).toContain("Site support DEMO-123");
  expect(container.textContent).not.toContain("What happens next?");
  expect(container.textContent).not.toContain("Your application has been saved.");
});

it("retains both document downloads and has no forward or back navigation", async () => {
  await act(async () => root.render(<Receipt />));
  const buttons = [...container.querySelectorAll("button")];
  await act(async () => buttons.find(button => button.textContent === "Application PDF")!.click());
  await act(async () => buttons.find(button => button.textContent === "Payment PDF")!.click());
  expect(downloadApplicationPdf).toHaveBeenNthCalledWith(1, values);
  expect(downloadApplicationPdf).toHaveBeenNthCalledWith(2, values, true);
  expect(container.querySelectorAll("h1")).toHaveLength(1);
  const warning = container.querySelector('.MuiAlert-standardWarning')!;
  const acknowledgement = container.querySelector('.MuiAlert-standardInfo')!;
  expect(acknowledgement.textContent).toContain(receiptDefaults.receivedMessage);
  expect(acknowledgement.textContent).toContain(receiptDefaults.paymentNotice);
  expect(warning.textContent).toContain(receiptDefaults.documentsNote);
  expect(warning.textContent).not.toContain(receiptDefaults.paymentNotice);
  expect(warning.querySelectorAll('button')).toHaveLength(2);
  expect(warning.querySelectorAll('.MuiButton-text')).toHaveLength(0);
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
  content.receipt.paymentNotice = '';
  await act(async () => root.render(<Receipt />));
  expect(container.textContent).not.toContain(receiptDefaults.paymentNotice);
  expect(container.textContent).toContain(receiptDefaults.receivedMessage);
  expect(container.textContent).toContain(receiptDefaults.coverageDecisions.title);
});

it('separates outcomes from the application receipt and preserves each product payment choice', async () => {
  products = [products[0], { ...products[0], id: 'second-product', name: 'Second coverage' }];
  values[`payment-method:${products[0].id}`] = 'bank-account';
  values['payment-method:second-product'] = 'bill-me';
  await act(async () => root.render(<Receipt />));
  const decisions = [...container.querySelectorAll('article[aria-label="You coverage decision"]')];
  expect(decisions).toHaveLength(2);
  for (const decision of decisions) {
    expect(decision.textContent).toContain(receiptDefaults.decisionStatuses.fullyUnderwritten.label);
    expect(decision.textContent).toContain(receiptDefaults.decisionStatuses.fullyUnderwritten.description);
    expect(decision.querySelector('.MuiStepper-root')).toBeNull();
    expect(decision.querySelector('[data-testid="FindInPageRoundedIcon"]')).not.toBeNull();
    expect(decision.textContent).not.toContain('Payment method');
  }
  const receipt = container.querySelector('[aria-labelledby="application-receipt-heading"]')!;
  const entries = [...receipt.querySelectorAll('[aria-label$="receipt"]')];
  expect(entries).toHaveLength(2);
  expect(entries[0].textContent).toContain('Bank account');
  expect(entries[0].textContent).not.toContain('Bill me');
  expect(entries[1].textContent).toContain('Bill me');
  expect(entries[1].textContent).not.toContain('Bank account');
  expect(receipt.textContent).toContain('Requested coverage');
  expect(receipt.textContent).toContain('Estimated payment');
  expect(receipt.textContent).not.toContain('Paid');
});

it.each([false, true])('uses standard applicant headings only when other applicants participate (dependents: %s)', async withSpouse => {
  if (withSpouse) values.productApplicants = { [products[0].id]: ['member', 'spouse'] };
  else products = [products[0], { ...products[0], id: 'another-member-product' }];
  await act(async () => root.render(<Receipt />));
  const standaloneLabels = [...container.querySelectorAll('.MuiTypography-root')].filter(element => ['You', 'Your Spouse'].includes(element.textContent ?? ''));
  expect(standaloneLabels).toHaveLength(withSpouse ? 4 : 0);
  expect(container.querySelectorAll('svg[data-testid="PersonRoundedIcon"]')).toHaveLength(withSpouse ? 2 : 0);
  expect(container.querySelectorAll('svg[data-testid="SupervisorAccountRoundedIcon"]')).toHaveLength(withSpouse ? 2 : 0);
});
