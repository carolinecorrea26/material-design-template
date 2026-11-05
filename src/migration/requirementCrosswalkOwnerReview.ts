import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { DatabaseSchema } from "../persistence/types";
import { resolveEffectiveSite } from "../domain/effectiveSite";
import { buildPrototypeAssociationContext } from "../domain/prototypeAssociationProjection";
import { buildPrototypeContent } from "../domain/prototypeConfigurationProjection";
import type { CrosswalkRow } from "./requirementCrosswalk";
import evidence from "../../docs/project-review/step1-owner-review-evidence.json";

type Owner = CrosswalkRow["executionOwners"][number];
const ref = (table: string, key: string): Owner => ({ table, key });
const unique = (owners: Owner[]) => owners.filter((owner, index) => owners.findIndex(other => other.table === owner.table && other.key === owner.key) === index);
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
export function reviewedNamedOwnerCodeMatches(read = (path: string) => readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../..", path))) {
  return Object.keys(evidence.files).length > 0 && Object.entries(evidence.files).every(([path, digest]) => createHash("sha256").update(read(path)).digest("hex") === digest);
}

/** Capture effective values AND participating stored records. A new assignment,
 * disabled link, changed definition or rendering change reopens the review. */
export function namedOwnerReviewSnapshot(db: DatabaseSchema, kind: "association" | "ama-notice") {
  const siteKey = kind === "association" ? "isitrust" : "ama";
  const site = resolveEffectiveSite(db, siteKey);
  const page = site.configuration.pages.find(page => page.key === (kind === "association" ? "membership" : "eligibility"))!;
  const field = page.fields.find(field => field.key === "membership");
  if (kind === "association") {
    const links = db.siteAssociations.filter(row => row.siteKey === siteKey);
    const associations = db.associations.filter(row => links.some(link => link.associationKey === row.key));
    const policies = db.sitePolicies.filter(row => row.siteKey === siteKey);
    const owners = unique([...page.provenance, ...(field?.provenance ?? []), ...policies.map(row => ref("sitePolicies", row.key)), ...links.map(row => ref("siteAssociations", row.key)), ...associations.map(row => ref("associations", row.key))]);
    const context = buildPrototypeAssociationContext(db, siteKey);
    return { owners, value: { field, page: { requirement: page.requirement, provenance: page.provenance }, policies, links, associations, selection: context.selection, options: context.associations.map(association => ({ value: association.id, label: association.name })) } };
  }
  const content = site.configuration.content.filter(row => row.key.startsWith("pages.eligibility."));
  const entries = db.contentEntries.filter(row => content.some(value => value.key === row.key));
  const owners = unique([...page.provenance, ...page.fields.flatMap(field => field.provenance), ...page.sections.flatMap(section => [...section.definition.provenance, ...section.fields.flatMap(field => field.provenance)]), ...content.flatMap(value => value.provenance), ...entries.map(row => ref("contentEntries", row.key))]);
  return { owners, value: { page, content, entries, resolvedContent: buildPrototypeContent(db, site).pages.eligibility } };
}
export function namedOwnerReviewHash(db: DatabaseSchema, kind: "association" | "ama-notice") {
  return hash(namedOwnerReviewSnapshot(db, kind));
}
export function reviewNamedOwnerRequirements(db: DatabaseSchema, rows: CrosswalkRow[]) {
  const codeMatches = reviewedNamedOwnerCodeMatches();
  for (const kind of ["association", "ama-notice"] as const) {
    const snapshot = namedOwnerReviewSnapshot(db, kind);
    const matches = codeMatches && hash(snapshot) === evidence.native[kind];
    const ids = kind === "association" ? ["atomic.attestation.isitrust.association-selector"] : ["atomic.ama.di-step-rated.domestic-partner-notice-online", "atomic.ama.di-level-rated.domestic-partner-notice-online"];
    for (const row of rows.filter(row => ids.includes(row.id))) {
      row.executionOwners = snapshot.owners; row.ownerCandidates = []; row.ownerResolution = "recorded-review";
      row.scope.unresolved = []; row.atomization = "reviewed";
      row.implementationReferences = kind === "association" ? ["src/pages/Membership.tsx", "src/config/clientFields/getClientPageFields.ts", "src/domain/prototypeAssociationProjection.ts", "src/data/associationSelection.ts"] : ["src/pages/Eligibility.tsx", "src/config/pages.ts", "src/content/index.ts", "src/domain/prototypeConfigurationProjection.ts"];
      row.verificationReferences = ["src/migration/namedOwnerReview.test.tsx", "src/migration/requirementCrosswalk.test.ts"];
      row.verificationStatus = matches ? "recorded-evidence" : "not-verified";
      row.disposition = matches ? "reviewed-current-template-functionality" : "review-pending";
      row.finding = !matches ? "Stored owner set, effective configuration, source or rendered evidence changed; repeat the named-owner review." : kind === "association"
        ? "Reviewed required ISITRUST searchable Association selector: Site policy chooses select mode; enabled ordered Site/Association links and Association definitions supply 26 captured options, including separately approved ATPE. Shared field validation and Membership retain the selected ID. St. Louis source reconciliation retains its existing pending disposition; this review does not approve that identity. Rate suppression and amount caps have separate owners."
        : "Reviewed AMA online suppression with the spouse section visible for each DI product. Effective Eligibility content, fields and sections contain no Domestic partner/Civil Union notice; the renderer reads this captured content. This is the absence of an assigned notice, not an invented suppression flag. A rendered positive-control notice proves the section was exercised. PDF suppression retains its separate deferred row.";
    }
  }
}
