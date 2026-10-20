import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import type { ClientSupport } from "../domain/configuration";
import { mcrSource } from "./mcr";

const reference = "docs/project-review/ownership-and-cleanup-plan.md#october-19-user-decisions";

/** Explicit user decisions supersede imported interpretations, preserving raw MCR cells. */
export function applyStep1BusinessDecisions(db: DatabaseSchema) {
  const abe = db.clients.find(client => client.key === "abe")!;
  const administrator = db.organizations.find(organization => organization.id === abe.organizationId)!;
  // Preserve the existing ID and links rather than inventing a second TPA.
  administrator.name = "ABA";
  administrator.providedBy = null;
  administrator.sourceReference = reference;
  const profile = db.organizationProfiles.find(row => row.organizationKey === administrator.key);
  if (profile) {
    profile.definition = { ...profile.definition, name: "ABA", acronym: "ABA", provisional: false };
    profile.sourceReference = reference;
  }
  applyApprovedProgramContacts(db);
  const decisions: Array<[string, Json]> = [
    ["abe-identity", { associationKey: "abe", associationName: "American Bar Endowment", tpaName: "ABA", organizationId: administrator.id }],
    ["avma-identity", { associationKey: "avma", associationName: "AVMA LIFE Trust", tpaName: "Pearl Insurance" }],
    ["ama-step-rated", { siteKey: "ama", productKey: "di-step-rated", sourceRow: 118, enabled: true }],
    ["isi-product-restrictions", { siteKey: "isitrust", productKeys: ["sh-hospital-income", "sh-critical-illness"], excludedAssociationKeys: ["student-osteopathic-medical-association", "national-press-club"] }],
    ["waepa-contact", { siteKeys: ["waepa", "waepa-gi"], hideBusinessAddress: true, hideCorrespondence: true }],
  ];
  for (const [key, selected] of decisions) {
    const id = `business-decision.step1.${key}`;
    db.semanticRequirements.push({ id, key: id, ...libraryMetadata("semanticRequirements", id, reference),
      domain: "approved-business-decision", subjectTable: "sites", subjectKey: key.startsWith("abe") ? "abe" : key.startsWith("avma") ? "avma" : key.startsWith("ama") ? "ama" : key.startsWith("isi") ? "isitrust" : "waepa",
      predicate: key, status: "documented", value: { approvalStatus: "approved", authority: "User clarification, October 19, 2026", selected, reference } });
  }
  const id = "provisional-decision.isitrust.st-louis-affiliation";
  db.semanticRequirements.push({ id, key: id, ...libraryMetadata("semanticRequirements", id, reference),
    domain: "provisional-source-decision", subjectTable: "sites", subjectKey: "isitrust", predicate: "association-affiliation",
    status: "documented", value: { authority: "User explicitly kept pending, October 19, 2026", associationKey: "bar-association-of-metropolitan-st-louis", selected: "Preserve existing assignment provisionally", revisit: true, sourceReconciliation: "pending", reference } });
}

/** Source-backed contact dispositions already accepted in the ownership review.
 * Keep superseded copies as evidence, not as another executable contact source.
 */
function applyApprovedProgramContacts(db: DatabaseSchema) {
  const changes: Array<{ clientKey: string; source: string; evidence: string[]; patch: Partial<ClientSupport> }> = [
    { clientKey: "asce", source: "D16", evidence: ["1-800-650-ASCE (2723)"], patch: { phone: "8006502723", phoneDisplay: "800-650-2723" } },
    { clientKey: "ama", source: "D15", evidence: ["(800) 458-5736", "60611-5885"], patch: { phone: "8004585736", phoneDisplay: "800-458-5736", helpPhone: { phone: "8886275902", phoneDisplay: "888-627-5902" }, address: { street: "330 North Wabash Avenue Suite 39300", city: "Chicago", state: "Illinois", zip: "60611-5885" } } },
    { clientKey: "csea", source: "D60", evidence: ["12 Cornell Road, Latham, NY 12110", "www.pearlcarroll.com/csea"], patch: { website: "www.pearlcarroll.com/csea", address: { organization: "Pearl Carroll & Associates, LLC", street: "12 Cornell Road", city: "Latham", state: "New York", zip: "12110" } } },
    { clientKey: "waepa", source: "D346", evidence: ["433 Park Ave, Falls Church, VA 22046", "info@waepa.org"], patch: { email: "info@waepa.org", address: { street: "433 Park Ave", city: "Falls Church", state: "Virginia", zip: "22046" } } },
    { clientKey: "isitrust", source: "D387", evidence: ["AIS Administrators, Inc.", "(855) 283-7651", "assist@aisadmin.com"], patch: { contactName: "AIS Administrators, Inc.", phone: "8552837651", phoneDisplay: "855-283-7651", email: "assist@aisadmin.com", address: { organization: "AIS Administrators, Inc.", street: "P.O. Box 12009", city: "Cheshire", state: "Connecticut", zip: "06410" } } },
  ];
  for (const change of changes) {
    const sourceReference = `Associations!${change.source}`;
    const source = mcrSource.cells.find(cell => cell.sheet === "Associations" && cell.cell === change.source);
    const sourceValue = source?.value;
    if (typeof sourceValue !== "string" || change.evidence.some(value => !sourceValue.includes(value))) throw new Error(`Approved contact source changed: ${sourceReference}`);
    if (change.clientKey === "ama") for (const cell of ["AX43", "BA43"]) {
      const help = mcrSource.cells.find(row => row.sheet === "New UX Multi-page Requirements" && row.cell === cell)?.value;
      if (typeof help !== "string" || !help.includes("888-627-5902")) throw new Error(`Approved help-phone source changed: ${cell}`);
    }
    const profiles = db.supportProfiles.filter(row => row.scope === "client" && row.clientKey === change.clientKey);
    if (profiles.length !== 1) throw new Error(`Missing or ambiguous program support: ${change.clientKey}`);
    const support = profiles[0];
    const previous = structuredClone(support.definition);
    support.definition = { ...support.definition, ...change.patch };
    if (change.clientKey === "isitrust") {
      support.definition.salesContact = previous;
      // The source does not establish an administrator website or sales hours.
      delete support.definition.website;
      delete support.definition.phoneHours;
    }
    support.sourceReference = change.clientKey === "ama" ? `${sourceReference}; New UX Multi-page Requirements!AX43; New UX Multi-page Requirements!BA43` : sourceReference;
    support.providedBy = null;
    const id = `business-decision.step1.${change.clientKey}-program-contact`;
    db.semanticRequirements.push({ id, key: id, ...libraryMetadata("semanticRequirements", id, reference),
      domain: "approved-business-decision", subjectTable: "clients", subjectKey: change.clientKey,
      predicate: "program-contact-source", status: "documented", value: { approvalStatus: "approved", authority: "Accepted MCR-first program-contact reconciliation, October 19, 2026", sourceReference, previousSupport: previous as Json, destination: { table: "supportProfiles", key: support.key }, purpose: "Program administrator; separate sales/help purposes retained" } });
  }
}
