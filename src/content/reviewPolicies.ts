import source from "./reviewNoticeSource.json";
import type { ReviewPolicy } from "../domain/reviewPolicy";
const cells = source.cells;
const fraudRows: Record<string, keyof typeof cells> = { CO: "C56", CA: "C57", AL: "C58", AR: "C59", LA: "C60", PA: "C61", RI: "C62", MD: "C63", DC: "C64", FL: "C65", KS: "C66", ME: "C67", NJ: "C68", NY: "C69", OK: "C70", PR: "C71", TN: "C72", WA: "C73", VA: "C74", VT: "C76" };
export const defaultReviewPolicy: ReviewPolicy = { version: 1, fraud: { defaultText: cells.C55, byJurisdiction: Object.fromEntries(Object.entries(fraudRows).map(([state, cell]) => [state, cells[cell]])), sourceReferences: ["Read & Sign!B53:C76"] }, blocks: [] };
export const abeReviewPolicy: ReviewPolicy = { ...defaultReviewPolicy, blocks: [
  { key: "dividend-acknowledgement", title: source.dividendScreenshot.title, paragraphs: [...source.dividendScreenshot.paragraphs, cells.C111], fields: ["dividend-acknowledgement"], sourceReferences: ["Read & Sign!C111", "User dividend screenshot", "User: required acknowledgement; always-visible optional identity fields; no election checkbox"], when: { applicant: "member" } },
  { key: "dividend-election", title: "Dividend notice and first-year election", paragraphs: [cells.C125, cells.C126], listItems: [cells.C127, cells.C128, cells.C129, cells.C130, cells.C131, cells.C132, cells.C133, cells.C134, cells.C136, cells.C137, cells.C138].map(text => text.replace(/^[●•\s]*\*/, "").replace(/\n/, "*\n")), afterList: [cells.C139], fields: [ "dividend-first-name", "dividend-last-name", "dividend-birth-date"], sourceReferences: ["Read & Sign!C125:C139", "User dividend screenshot", "User: required acknowledgement; always-visible optional identity fields; no election checkbox"], when: { applicant: "member" } },
] };
export function reviewPolicyForSite(siteKey: string, authored?: ReviewPolicy): ReviewPolicy {
  const policy = authored ?? defaultReviewPolicy;
  if (siteKey === "csea") return { ...policy, fraud: { ...policy.fraud, overrideText: cells.C69 } };
  if (siteKey === "avma") return { ...policy, fraud: { ...policy.fraud, nyAccidentLifeProducts: ["li-term"], sourceReferences: [...policy.fraud.sourceReferences, "Main!H197"] } };
  if (siteKey.startsWith("waepa") || siteKey === "isitrust") return { ...policy, fraud: { ...policy.fraud, nyAccidentLifeProducts: ["li-group-term"] } };
  return policy;
}
