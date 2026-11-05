import type { DatabaseSchema, Json } from "../persistence/types";
import { isReviewPolicy } from "../domain/reviewPolicy";
import { libraryMetadata } from "../domain/provenance";
import { currentMcrSource } from "./currentMcr";

export const abeApprovedReviewDecisionKey = "business-decision.rules-review.abe-approved-review";
export function applyAbeApprovedReviewAdoption(db: DatabaseSchema) {
  const authority = "User decisions October 22, 2026: replace generic ABE authorization/consent with MCR wording; CT/VA notices and Hospital Money attestation belong inside Read and Sign. Globally legal Review has only Read and Sign and Electronic Consent. Collect optional ABE Membership ID on Membership.";
  const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, authority) });
  const text = (sheet: string, cell: string) => {
    const value = String(currentMcrSource.cells.find(row => row.sheet === sheet && row.cell === cell)?.value ?? "").trim();
    if (!value) throw new Error(`Missing ABE source ${sheet}!${cell}`);
    return value.replace("{Link to IMPORTANT NOTICE}", "IMPORTANT NOTICE");
  };
  const row = db.configurationValues.find(row => row.key === "abe.review-policy");
  if (!row || !isReviewPolicy(row.value)) throw new Error("Invalid ABE Review policy");
  const [minnesota, afterConsentText] = text("Read & Sign", "C43").split(/\nStandard Fraud Notice\nCONSENT: site specific or standard consent\n/).map(part => part.trim());
  row.value.authorization = {
    when: "health-questions-or-underwriting", underwritingTypes: ["FUW", "TELE"], pageIds: ["health-li", "health-si", "health-di", "health-qd", "health-ci"],
    introductoryStatement: text("Read & Sign", "B36"),
    wording: { defaultText: text("Read & Sign", "B41"), variants: [
      { jurisdictions: ["MN"], text: minnesota, afterConsentText },
      { jurisdictions: ["VA"], underwritingTypes: ["QD"], text: text("Read & Sign", "C48") },
    ], processingVariants: [{ when: "qd-disability-or-qd-life-with-disability", text: text("Read & Sign", "C52"), sourceReferences: ["Read & Sign!B52:C52"] }] },
    sourceReferences: ["Read & Sign!B35:B43", "Read & Sign!C43", "Read & Sign!B48:C48", "Read & Sign!B52:C52"],
  };
  row.value.consent = {
    underwrittenWhen: [], underwrittenWhenHealthQuestions: true, underwrittenWhenUnderwritingTypes: ["FUW", "TELE"],
    underwrittenText: text("Read & Sign", "B78"), otherText: text("Read & Sign", "B93"),
    variants: [{ jurisdictions: ["VA"], underwritingTypes: ["QD"], text: text("Read & Sign", "C90") }],
    sourceReferences: ["Read & Sign!B77:B78", "Read & Sign!B92:B93", "Read & Sign!B90:C90"],
  };
  const vaSource = text("Health Questions", "B84"), start = vaSource.indexOf("The undersigned applicant"), end = vaSource.indexOf('"', start);
  if (start < 0 || end < 0) throw new Error("VA CI certification boundary changed");
  const blocks = [
    { key: "connecticut-underwritten-notice", title: "Connecticut notice", paragraphs: [text("Read & Sign", "B119").replace(/^[“"]|[”"]$/g, "")], fields: [], placement: "read-and-sign-appendix" as const, when: { jurisdictions: ["CT"], healthQuestions: true as const }, sourceReferences: ["Read & Sign!B118:B119"] },
    { key: "virginia-ci-certification", title: "Virginia certification", paragraphs: [vaSource.slice(start, end)], fields: [], placement: "read-and-sign-appendix" as const, when: { jurisdictions: ["VA"], products: ["sh-critical-illness"] }, sourceReferences: ["Health Questions!B44", "Health Questions!B84"] },
  ];
  row.value.blocks = [...row.value.blocks.filter(block => !blocks.some(next => next.key === block.key)), ...blocks];
  const fieldKey = "abe-member-id";
  const field = { ...meta("fields", fieldKey), position: 31000, definition: { id: fieldKey, label: "Membership ID", inputType: "text" as const, required: false } };
  const assignment = { ...meta("siteFieldConfigurations", "abe.membership.member-id"), position: 31000, scope: "site" as const, siteKey: "abe", clientKey: null, pageKey: "membership", fieldKey, include: true, hidden: false, values: {} };
  for (const [table, record] of [["fields", field], ["siteFieldConfigurations", assignment]] as const) {
    const rows = db[table] as Array<{ key: string }>, index = rows.findIndex(row => row.key === record.key);
    if (index < 0) rows.push(record); else rows[index] = record;
  }
  const key = abeApprovedReviewDecisionKey, decision = { ...meta("semanticRequirements", key), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "abe", predicate: "approved-abe-review-and-membership", status: "documented", value: {
    authority, approvalStatus: "approved", runtimeActivation: "reviewed-seed", sourceReconciliation: "approved-new-template-interpretation",
    sourceReferences: ["Main!R39:R49", ...row.value.authorization.sourceReferences, ...row.value.consent.sourceReferences, ...blocks.flatMap(block => block.sourceReferences)],
    selected: { authorization: row.value.authorization, consent: row.value.consent, blocks, membershipField: field, membershipPlacement: assignment },
    interpretation: "Health participation or required adult FUW/TELE underwriting selects authorization and underwritten consent independently of online questionnaire collection (user correction October 23, 2026). Minnesota and Virginia QD variants precede processing defaults. All notices and existing dividend controls render within Read and Sign; no additional legal sections. Optional ABE Membership ID is collected on Membership. Existing accepted dividend copy and controls remain intact.",
    destinations: [{ table: "configurationValues", key: row.key, column: "value" }, { table: "fields", key: fieldKey }, { table: "siteFieldConfigurations", key: assignment.key }],
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key); if (index < 0) db.semanticRequirements.push(decision); else db.semanticRequirements[index] = decision;
}
