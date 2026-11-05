import { reviewedAgeCodeMatches, reviewAgeSourceStatements } from "./requirementCrosswalkAgeReview";
import { reviewedTobaccoLookbackCodeMatches } from "./requirementCrosswalkTobaccoReview";
import { reviewedExternalQdCodeMatches } from "./requirementCrosswalkExternalQdReview";
import { reviewedMembershipBasicsCodeMatches } from "./requirementCrosswalkMembershipReview";
import { reviewedEntryCodeMatches } from "./requirementCrosswalkEntryReview";
import { reviewedLookupAndLandingCodeMatches } from "./requirementCrosswalkLookupReview";
import { abeDividendOwnerSnapshot, reviewedAbeReviewCodeMatches } from "./requirementCrosswalkAbeReview";
import { beneficiaryOwnerEvidenceHash, reviewedBeneficiaryCodeMatches } from "./requirementCrosswalkBeneficiaryReview";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { afterEach, beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { buildRequirementCrosswalk, renderAtomicRequirementReview, renderRequirementCrosswalkSummary, requirementClauses, serializeRequirementCrosswalk } from "./requirementCrosswalk";
import type { DatabaseSchema } from "../persistence/types";
import { attestationSourceScopes } from "./requirementCrosswalkSourceScope";
import { currentMcrSource as mcrSource, currentMcrReviewData } from "./currentMcr";
import { reviewedPersistenceUiMatches, reviewedRecoveryServiceMatches } from "./requirementCrosswalkServiceReview";
import { readSignSourceScopes } from "./requirementCrosswalkReviewScope";
import { decisionWordingSourceScopes } from "./requirementCrosswalkDecisionScope";
import { financialQuestionnaireSourceReview } from "./requirementCrosswalkFinancialScope";
import { reviewedContactCodeMatches } from "./requirementCrosswalkContactReview";
import { reviewedProfileCodeMatches, profileOwnerEvidenceHash } from "./requirementCrosswalkProfileReview";
import { reviewSourceMetadata } from "./requirementCrosswalkMetadata";
import { buildAbeSiteReview, renderAbeSiteReview } from "./requirementCrosswalkSites";
import { renderStep1ReviewPhases, step1ReviewPhases } from "./requirementCrosswalkPhases";

let db: DatabaseSchema;
let report: ReturnType<typeof buildRequirementCrosswalk>;
beforeAll(() => { db = createReviewedMigrationDatabase(); report = buildRequirementCrosswalk(db); }, 120000);
// The audit cases do substantial synchronous snapshot work. Give the runner's
// RPC messages an event-loop turn between cases rather than starving them.
afterEach(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

it("records Association caps, conditional NSO Life, WAEPA cleanup and nonblocking missing Coverage copy with native edit invalidation", () => {
  for (const id of ["atomic.adopted.csea.standard-spouse-fields", "atomic.adopted.csea.no-child-records", "atomic.csea.di-ltd.spouse-details", "atomic.csea.di-ltd.child-no-person-records"]) expect(report.requirements.find(row => row.id === id)?.verificationStatus, id).toBe("recorded-evidence");
  for (const suffix of ["dependent-role-collection"]) expect(report.requirements.find(row => row.id === `atomic.adopted.ama.${suffix}`)?.verificationStatus).toBe("recorded-evidence");
  for (const id of ["atomic.adopted.waepa.new-member-collection", "atomic.attestation.waepa.truthfulness-acknowledgement", "atomic.attestation.waepa.unchecked-acknowledgement-error", "atomic.attestation.waepa.active-federal-employer", "atomic.attestation.asce.spouse-question"]) expect(report.requirements.find(row => row.id === id)?.verificationStatus, id).toBe("recorded-evidence");
  expect(reviewedTobaccoLookbackCodeMatches()).toBe(true);
  expect(reviewedTobaccoLookbackCodeMatches(() => Buffer.from("changed lookback code"))).toBe(false);
  for (const suffix of ["general", "atpe"]) expect(report.requirements.find(row => row.id === `atomic.adopted.isitrust.group-term-tobacco.${suffix}`)?.verificationStatus).toBe("recorded-evidence");
  expect(reviewedMembershipBasicsCodeMatches()).toBe(true);
  for (const site of ["isitrust", "waepa"]) expect(report.requirements.find(row => row.id === `atomic.adopted.work-hours.${site}`)?.verificationStatus).toBe("recorded-evidence");
  expect(reviewedMembershipBasicsCodeMatches(() => Buffer.from("changed Membership collection"))).toBe(false);
  for (const id of ["atomic.abe.li-term.membership-id-optional", "atomic.attestation.abe.member-question", "atomic.attestation.abe.spouse-question", "atomic.attestation.asce.member-question", "atomic.attestation.avma.membership-question", "atomic.attestation.avma.graduation-year", "atomic.attestation.avma.occupation", "atomic.attestation.nso.nurse-question", "atomic.csea.di-ltd.membership-gate", "atomic.csea.di-ltd.duties-gate", "atomic.csea.di-ltd.occupation-class", "atomic.csea.di-ltd.child-benefit-disclosure", "atomic.csea.di-ltd.child-benefit-amount", "atomic.csea.di-ltd.child-benefit-settings", "atomic.csea.di-ltd.child-benefit-visit-limit"]) expect(report.requirements.find(row => row.id === id)?.verificationStatus, id).toBe("recorded-evidence");
  const ids = ["atomic.adopted.isitrust.sport-member-cap.li-add", "atomic.adopted.isitrust.sport-member-cap.li-group-term", "atomic.adopted.waepa.associate-member-middle-initial", "atomic.adopted.waepa.membership-notice-cleanup", "atomic.adopted.csea.optional-dependent-benefits", "atomic.adopted.isitrust.spouse-election-notice", "atomic.adopted.abe.firm-member-count", "atomic.adopted.external-qd.prototype-loading-state", "atomic.adopted.ama.source-product-order", "atomic.adopted.work-hours.isitrust"];
  for (const id of ids) expect(report.requirements.find(row => row.id === id)?.verificationStatus, id).toBe("recorded-evidence");
  expect(reviewedExternalQdCodeMatches()).toBe(true);
  expect(reviewedExternalQdCodeMatches(() => Buffer.from("changed external QD ownership"))).toBe(false);
  const nso = report.requirements.find(row => row.id.startsWith("atomic.adopted.nso.combined-life."))!;
  expect(nso.verificationStatus).toBe("recorded-evidence");
  for (const id of ["atomic.attestation.isitrust.li-add-fencing-equestrian-cap", "atomic.attestation.isitrust.li-group-term-fencing-equestrian-cap", "atomic.attestation.waepa.associate-member-first-name", "atomic.attestation.waepa.associate-member-middle-initial", "atomic.attestation.isitrust.atpe-rate-suppression", "atomic.attestation.isitrust.weekly-hours", "atomic.waepa.li-group-term.phone-on-eligibility", "atomic.ama.di-step-rated.nonmember-surcharge", "atomic.ama.membership.physician-categories", "atomic.attestation.nso.nurse-type", "atomic.attestation.waepa-gi.military-yes-block"]) expect(report.requirements.find(row => row.id === id)?.verificationStatus, id).toBe("recorded-evidence");
  expect(report.requirements.find(row => row.id === "atomic.csea.di-ltd.spouse-selected-locked")?.disposition).toBe("superseded-by-user-decision");
  expect(report.requirements.find(row => row.id === "atomic.csea.di-ltd.child-age-attestation")).toMatchObject({ disposition: "accepted-exception", completionBlocking: false });
  for (const suffix of ["cap", "request"]) expect(report.requirements.find(row => row.id === `atomic.attestation.waepa.adult-child-dependent-${suffix}`)?.disposition).toBe("superseded-by-user-decision");
  expect(report.requirements.find(row => row.id === "atomic.unique-hi-ci-coverage-notice")).toMatchObject({ disposition: "deferred-by-user", completionBlocking: false });
  expect(report.requirements.find(row => row.id === "atomic.health.waepa-cir-incomplete-form")).toMatchObject({ disposition: "deferred-by-user", completionBlocking: false });
  expect(report.requirements.filter(row => row.kind === "source-clause" && row.sourceReferences[0]?.startsWith("WAEPA CIR questions!")).every(row => row.completionBlocking === false && row.disposition === "deferred-by-user")).toBe(true);
  const copy = structuredClone(db);
  (copy.configurationValues.find(row => row.key === "isitrust.li-group-term.rate-input-policy")!.value as { tobaccoLookback: { months: number } }).tobaccoLookback.months = 18;
  (copy.siteFieldConfigurations.find(row => row.key === "site:ama.eligibility.dependents.source-presentation")!.values.options as Array<{ label: string }>)[0].label = "Changed source label";
  copy.contentValues.find(row => row.key === "site:waepa.pages.membership.infoNote")!.value = "Restored duplicate";
  (copy.configurationValues.find(row => row.key === "site:ama.coverages.productOrder")!.value as string[]).reverse();
  copy.fields.find(row => row.key === "waepa-member-middle-initial")!.definition.required = true;
  copy.configurationValues.find(row => row.key === "abe.oo-professional.firm-member-eligibility")!.value = [{ fact: "firmMemberCount", minimum: 1, maximum: 10, integer: true }];
  const cap = copy.configurationValues.find(row => row.key === "isitrust.li-add.sport-association-member-amounts")!.value as { associationKeys: string[] };
  cap.associationKeys.pop();
  const journey = copy.configurationValues.find(row => row.key === nso.executionOwners[0].key)!.value as { healthPageForPortfolio?: unknown };
  delete journey.healthPageForPortfolio;
  const edited = buildRequirementCrosswalk(copy);
  for (const id of ["atomic.adopted.ama.dependent-role-collection", "atomic.ama.membership.spouse-option-label", "atomic.adopted.isitrust.group-term-tobacco.general", "atomic.adopted.isitrust.group-term-tobacco.atpe", ids[0], ids[2], ids[3], "atomic.adopted.abe.firm-member-count", "atomic.abe.oo-professional.firm-size", "atomic.adopted.ama.source-product-order", nso.id, "atomic.attestation.isitrust.li-add-fencing-equestrian-cap", "atomic.attestation.waepa.associate-member-middle-initial"]) expect(edited.requirements.find(row => row.id === id)?.verificationStatus, id).toBe("not-verified");
});

it("captures approved WAEPA bands, source forms, combined DI and Review notices with edit invalidation", () => {
  for (const id of ["atomic.adopted.waepa.full-adult-life-questions", "atomic.adopted.qd-disability-authorization.asce", "atomic.adopted.gi-payroll.waepa-gi", "atomic.adopted.gi-payroll.csea"]) expect(report.requirements.find(row => row.id === id)?.verificationStatus, id).toBe("recorded-evidence");
  expect(report.requirements.some(row => row.id.startsWith("atomic.adopted.combined-di.nso.") && row.verificationStatus === "recorded-evidence")).toBe(true);
  expect(reviewedLookupAndLandingCodeMatches()).toBe(true); expect(reviewedAbeReviewCodeMatches()).toBe(true);
  expect(reviewedLookupAndLandingCodeMatches(() => Buffer.from("changed lookup"))).toBe(false);
  expect(reviewedAbeReviewCodeMatches(() => Buffer.from("changed accepted Review"))).toBe(false);
  const copy = structuredClone(db);
  copy.underwritingBands.find(row => row.key === "waepa.li-group-term.member.reviewed-source-1")!.maximumAmount = 900000;
  const policy = copy.configurationValues.find(row => row.key === "waepa-gi.review-policy")!.value as { blocks: Array<{ key: string; paragraphs: string[] }> };
  policy.blocks.find(block => block.key === "guaranteed-issue-certification")!.paragraphs = ["Edited certification"];
  const changed = buildRequirementCrosswalk(copy);
  expect(changed.requirements.find(row => row.id === "atomic.adopted.waepa.life-underwriting.waepa.li-group-term.member.reviewed-source-1")?.verificationStatus).toBe("not-verified");
  expect(changed.requirements.find(row => row.id === "atomic.adopted.gi-payroll.waepa-gi")?.verificationStatus).toBe("not-verified");
  const accepted = copy.configurationValues.find(row => row.key === "abe.review-policy")!.value as { blocks: unknown[] }; accepted.blocks = [];
  expect(buildRequirementCrosswalk(copy).requirements.find(row => row.id === "atomic.abe.li-term.dividend-paragraph-online")?.verificationStatus).toBe("not-verified");
});

it("accounts for every formula/comment/link and flags the unavailable QD document without blocking completion", () => {
  expect(db.semanticRequirements.find(row => row.key === "business-decision.rules-review.qd-state-variation-document-deferral")?.value).toMatchObject({ terminology: { formCode: "GMA-JI-L", meaning: "Quick Decision health questionnaire" } });
  const metadata = report.sourceMetadataReview;
  expect(metadata.counts).toEqual({ formulas: 1, comments: 3, hyperlinks: 1022 });
  expect(metadata.pendingReferences).toEqual([]);
  const sourceCount = mcrSource.cells.reduce((sum, cell) => sum + [cell.formula, cell.comment, cell.hyperlink].filter(Boolean).length, 0);
  expect(metadata.records).toHaveLength(sourceCount);
  expect(metadata.records.find(row => row.reference === "Main!Q53")?.reason).toContain("ACEP");
  expect(metadata.records.find(row => row.reference === "Health Questions!B4")?.disposition).toBe("deferred-by-user");
  expect(report.scope.nonblockingDeferredRequirements.some(row => row.requirementId === "atomic.health.qd-state-variation-document")).toBe(true);
  const changed = structuredClone(mcrSource.cells);
  changed.find(row => row.sheet === "Main" && row.cell === "R379")!.comment = "New instruction";
  expect(reviewSourceMetadata(changed, true).pendingReferences).toContain("Main!R379");
});

it("accounts for drawing anchors, rich-data logos and legacy object icons against pinned media hashes", () => {
  const review = report.drawingSourceReview;
  expect(review.workbookSha256).toBe(mcrSource.sha256);
  const media = new Map([...review.drawings.map(row => [row.mediaPath, row.sha256] as const), ...review.otherMedia.map(row => [row.path, row.sha256] as const)]);
  expect(media.size).toBe(mcrSource.assets.length);
  for (const asset of mcrSource.assets) expect(media.get(asset.path), asset.path).toBe(asset.sha256);
  expect(review.drawings).toHaveLength(210);
  expect(review.embeddedObjects).toHaveLength(5);
  expect(review.drawings.find(row => row.sheet === "Read & Sign")?.sourceLabel).toBe("APWU/APWUADD");
  expect(report.sourceLedger.filter(row => row.reference.endsWith("!embedded-images")).every(row => row.disposition === "reviewed-drawing-source-scope")).toBe(true);
});

it("bounds common and AMA decision wording without adopting source production claims or other Sites", () => {
  const sites = ["abe", "ama", "asce", "avma", "csea", "nso", "isitrust", "waepa", "waepa-gi"];
  const scopes = decisionWordingSourceScopes(mcrSource.cells, sites);
  expect(scopes.get("Standard Decision Wording !B2")?.siteKeys).toEqual(sites.filter(site => site !== "ama"));
  for (const cell of ["B12", "B13", "B14", "B15", "B16", "B17"]) expect(scopes.get(`Standard Decision Wording !${cell}`)?.siteKeys).toEqual(["ama"]);
  for (const cell of ["B7", "B9", "B19", "B20"]) expect(scopes.has(`Standard Decision Wording !${cell}`)).toBe(false);
  const edited = structuredClone(mcrSource.cells);
  edited.find(row => row.sheet === "Standard Decision Wording " && row.cell === "A11")!.value = "Other Site";
  expect(() => decisionWordingSourceScopes(edited, sites)).toThrow("source boundary changed");
  expect(report.requirements.filter(row => row.kind === "source-clause" && row.sourceReferences.includes("Standard Decision Wording !B12")).every(row => row.verificationStatus === "not-verified" && row.scope.siteKeys.join() === "ama")).toBe(true);
});

it("accounts for every source and catalog identity without treating catalog linkage as verification", () => {
  const currentRequirements = currentMcrReviewData(db).data.sourceRequirements;
  expect(new Set(report.sourceLedger.map(row => row.key))).toEqual(new Set(currentRequirements.map(row => row.key)));
  expect(report.sourceLedger).toHaveLength(currentRequirements.length);
  expect(new Set(report.catalog.map(row => row.key))).toEqual(new Set(db.rules.map(row => row.key)));
  expect(report.counts.catalogRecordsWithoutLink).toBe(0);
  expect(new Set(report.requirements.map(row => row.id)).size).toBe(report.requirements.length);
  const requirements = new Map(report.requirements.map(row => [row.id, row]));
  for (const row of report.catalog) {
    expect(row.rationale.length).toBeGreaterThan(0);
    for (const id of row.requirementIds) expect(requirements.get(id)?.ruleKeys).toContain(row.key);
    if (["planned", "source-pattern", "source-reference"].includes(row.catalogStatus)) {
      expect(row.currentTemplateFunctionality).toBeNull();
      expect(row.requirementIds.every(id => requirements.get(id)?.verificationStatus === "not-verified")).toBe(true);
    }
  }
  expect(report.enumerationComplete).toBe(false);
  expect(report.requirements.filter(row => row.disposition === "verified")).toHaveLength(19);
  expect(report.requirements.filter(row => row.kind === "reviewed-requirement" && row.disposition === "accepted-exception")).toHaveLength(3);
  expect(report.requirements.filter(row => row.kind === "decision")).toHaveLength(db.semanticRequirements.filter(row => ["provisional-source-decision", "approved-business-decision"].includes(row.domain)).length);
  expect(report.requirements.find(row => row.decision?.key === "provisional-decision.isitrust.st-louis-affiliation")?.decision?.sourceReconciliation).toBe("pending");
  expect(report.requirements.some(row => row.disposition === "accepted-decision")).toBe(true);
});

it("conserves source text and leaves compound clauses, guards and shared applicability pending", () => {
  const cells = new Map(report.sourceCells.map(cell => [cell.key, cell]));
  const spans = new Map<string, typeof report.clauseSpans>();
  for (const span of report.clauseSpans) spans.set(span.sourceKey, [...(spans.get(span.sourceKey) ?? []), span]);
  const requirements = new Map(report.requirements.map(row => [row.id, row]));
  for (const [sourceKey, clauses] of spans) {
    const text = String(cells.get(sourceKey)!.value ?? "");
    expect(clauses[0].start).toBe(0);
    expect(clauses.at(-1)!.end).toBe(text.length);
    for (const [index, clause] of clauses.entries()) {
      if (index) expect(clause.start).toBe(clauses[index - 1].end);
      const row = requirements.get(clause.requirementId)!;
      expect(row.expectedBehavior).toBe(text.slice(clause.start, clause.end).trim());
      const attestation = row.finding.startsWith("Reviewed attestation source leaf:");
      const structuralAttestation = row.finding.startsWith("Reviewed attestation structural marker:");
      const canonicalAge = row.finding.startsWith("Reviewed unqualified source ages:");
      const nsoAge = row.finding.startsWith("Reviewed NSO accident ages:");
      const asceAge = row.finding.startsWith("Reviewed ASCE approved ages:");
      const tobaccoLookback = row.finding.startsWith("Reviewed tobacco lookback:");
      const amaOrder = row.finding.startsWith("Reviewed AMA product order:");
      const boundedLanding = row.finding.startsWith("Reviewed ABE landing viewer:");
      const acceptedAbe = row.finding.startsWith("User explicitly preserves accepted ABE Review:");
      const financialFlag = /^Main!Y\d+$/.test(row.sourceReferences[0]) && /^(?:no|n\/?a)$/i.test(row.expectedBehavior);
      const outsideVariant = row.verificationReferences.includes("src/migration/requirementCrosswalk.test.ts") && row.finding.startsWith("Reviewed source applicability only.");
      const beneficiarySource = /^Main!AB\d+$/.test(row.sourceReferences[0]) && row.area === "Beneficiary" || row.sourceReferences[0].startsWith("Beneficiary Note!");
      expect(row.atomization).toBe(financialFlag || beneficiarySource || outsideVariant || boundedLanding || acceptedAbe || amaOrder || tobaccoLookback || nsoAge || asceAge || canonicalAge || attestation || structuralAttestation ? "reviewed" : "clause-review-pending");
      if (attestation) expect(["reviewed-current-template-functionality", "superseded-by-user-decision"]).toContain(row.disposition);
      else if (structuralAttestation) expect(row.disposition).toBe("source-reference");
      else if (asceAge) expect(row.disposition).toBe("superseded-by-user-decision");
      else if (boundedLanding || acceptedAbe || amaOrder || tobaccoLookback || nsoAge || canonicalAge) expect(row.disposition).toBe("reviewed-current-template-functionality");
      else if (outsideVariant) expect(row.disposition).toBe("source-reference");
      else if (beneficiarySource) expect(["reviewed-current-template-functionality", "source-reference", "deferred", "review-pending"]).toContain(row.disposition);
      else expect(row.disposition).toBe(financialFlag ? "reviewed-current-template-functionality" : row.sourceReferences[0].startsWith("Financial questions!") ? "reviewed-current-template-functionality" : row.completionBlocking === false ? "deferred-by-user" : "review-pending");
      if (attestation) { expect(row.context).toContain("Reviewed exact leaf mapping:"); expect(row.verificationStatus).toBe("recorded-evidence"); continue; }
      expect(row.executionOwners).toEqual(canonicalAge ? report.requirements.find(atom => atom.id.startsWith("atomic.adopted.canonical-age.") && atom.sourceReferences[0] === row.sourceReferences[0])!.executionOwners : nsoAge ? report.requirements.find(atom => atom.id.startsWith(`atomic.adopted.nso.accident-ages.${row.scope.applicantKeys[0]}.`))!.executionOwners : asceAge ? [{ table: "eligibilityConstraints", key: `asce.${row.scope.productKeys[0]}.approved-eligibility.${row.scope.applicantKeys[0]}` }] : tobaccoLookback ? report.requirements.find(row => row.id === "atomic.adopted.isitrust.group-term-tobacco.general")!.executionOwners : amaOrder ? report.requirements.find(row => row.id === "atomic.adopted.ama.source-product-order")!.executionOwners : boundedLanding ? [{ table: "configurationValues", key: "abe.landingNotice", column: "value" }] : acceptedAbe ? row.sourceReferences[0].startsWith("Legal Disclosures!") ? abeDividendOwnerSnapshot(db).owners : [{ table: "configurationValues", key: "abe.review-policy", column: "value" }] : []);
    }
  }
  const compound = "If Yes:\n  Collect income; require details. If No, continue.\nDo not split $1.50 or R4a, R5 and R6.";
  expect(requirementClauses(compound).map(clause => clause.text).join("")).toBe(compound);
  const sup = report.sourceLedger.find(row => row.reference === "SUP DI Health questions!A1")!;
  expect(sup.clauseIds.length).toBeGreaterThan(0); // A1 is an instruction, not a heading.
  expect(requirements.get(sup.clauseIds[0])!.scope.siteKeys).toEqual([]);
  expect(report.sourceLedger.find(row => row.reference === "Main!R44")!.clauseIds.length).toBeGreaterThan(1);
  expect(report.sourceLedger.find(row => row.reference === "Main!R44")!.relatedReviewedRequirementIds).toContain("coverage-review.abe.di-ltd-plus.work-hours");
  const rows44 = report.requirements.filter(row => row.kind === "source-requirement" && row.sourceReferences.includes("Main!R44"));
  expect(rows44.some(row => row.area === "Contact" && row.expectedBehavior === "Require email on Contact details.")).toBe(true);
  expect(rows44.some(row => row.disposition === "deferred" && row.scope.modes.includes("PDF"))).toBe(true);
});

it("preserves absent native financial assignments while exposing ABE’s supplemental-sheet trigger conflict", () => {
  expect(report.financialSourceReview.status).toBe("reviewed-abe-assignment");
  expect(report.financialSourceReview.currentAssignments).toEqual([]);
  expect(report.financialSourceReview.triggerReferences).toEqual(["Main!R80", "SUP DI Health questions!U50"]);
  expect(report.financialSourceReview.pendingSiteKeys).toEqual([]);
  expect(report.sourceLedger.filter(row => row.reference.startsWith("Financial questions!")).every(row => row.disposition === "reviewed-abe-financial-assignment")).toBe(true);
  const edited = structuredClone(db), assignment = edited.productQuestionSets.find(row => row.questionSetKey === "mcr.financial-questions")!;
  assignment.productKey = "li-group-term";
  expect(financialQuestionnaireSourceReview(edited, mcrSource.cells, report.scope.businessSiteKeys).status).toBe("scope-review-pending");
  const source = structuredClone(mcrSource.cells);
  source.find(row => row.sheet === "Main" && row.cell === "R379")!.value = "Financial questionnaire required";
  expect(financialQuestionnaireSourceReview(db, source, report.scope.businessSiteKeys).status).toBe("scope-review-pending");
});

it("preserves variant boundaries, accepted CSEA mapping, and service ownership", () => {
  const candidates = report.requirements.filter(row => row.kind === "source-clause");
  expect(candidates.filter(row => row.sourceReferences.includes("Main!H386")).every(row => row.scope.siteKeys.join() === "waepa-gi")).toBe(true);
  expect(candidates.filter(row => row.sourceReferences.includes("Main!H379")).every(row => row.scope.siteKeys.join() === "waepa")).toBe(true);
  expect(candidates.find(row => row.sourceReferences.includes("Main!I246"))?.scope.siteKeys).toEqual(["csea"]);
  expect(report.sourceLedger.find(row => row.reference === "Main!I247")?.disposition).toBe("outside-approved-site-scope");
  expect(report.sourceLedger.find(row => row.reference === "Main!H127")?.disposition).toBe("outside-approved-site-scope");
  expect(report.scope.unresolvedIdentities.some(identity => identity.key === "csea.li-add")).toBe(true);
  expect(report.sourceAbsences.find(row => row.reference === "Main!H246")?.siteKey).toBe("csea");
  expect(report.requirements.filter(row => row.kind === "source-requirement").length).toBeGreaterThan(180);
  expect(report.requirements.filter(row => row.serviceOwner)).toHaveLength(10);
  expect(report.requirements.filter(row => row.serviceOwner).every(row => row.verificationStatus === "recorded-evidence")).toBe(true);
  expect(reviewedRecoveryServiceMatches(() => Buffer.from("changed service"))).toBe(false);
  for (const row of report.requirements) {
    for (const owner of [...row.executionOwners, ...row.ownerCandidates]) {
      const records = db[owner.table as keyof DatabaseSchema] as Array<{ key: string } & Record<string, unknown>>;
      const record = records.find(record => record.key === owner.key);
      expect(record, `${row.id}/${owner.table}/${owner.key}`).toBeDefined();
      if (owner.column) expect(Object.hasOwn(record!, owner.column)).toBe(true);
    }
    for (const path of [...row.implementationReferences, ...row.verificationReferences]) expect(existsSync(path), path).toBe(true);
  }
});

it("scopes main-Site attestation cells using explicit labels while preserving adjacent variant boundaries", () => {
  const scopes = attestationSourceScopes(mcrSource.cells);
  expect(new Set([...scopes.values()].map(scope => scope.siteKey)).size).toBe(9);
  expect(scopes.get("Attestation Online and PDF!C122")).toMatchObject({ siteKey: "waepa", mode: "online" });
  expect(scopes.get("Attestation Online and PDF!E122")).toMatchObject({ siteKey: "waepa", mode: "PDF" });
  expect(scopes.get("Attestation Online and PDF!C125")).toMatchObject({ siteKey: "waepa-gi", mode: "online" });
  for (const cell of ["C5", "C8", "C10", "C39", "C40", "C41", "C85", "C126", "C127", "C128"]) expect(scopes.has(`Attestation Online and PDF!${cell}`), cell).toBe(false);
  const changed = structuredClone(mcrSource.cells);
  changed.find(cell => cell.sheet === "Attestation Online and PDF" && cell.cell === "A122")!.value = "WAEPA conference";
  expect(() => attestationSourceScopes(changed)).toThrow("Site label changed");
  const inserted = structuredClone(mcrSource.cells);
  inserted.push({ sheet: "Attestation Online and PDF", cell: "A123", value: "Different Site", formula: null, comment: null, hyperlink: null });
  expect(() => attestationSourceScopes(inserted)).toThrow("scope boundary changed");
  for (const row of report.requirements.filter(row => row.kind === "source-clause" && row.sourceReferences.includes("Attestation Online and PDF!C122"))) {
    expect(row.scope.siteKeys).toEqual(["waepa"]);
    expect(row.scope.modes).toEqual(["online"]);
    expect(["reviewed-current-template-functionality", "source-reference", "superseded-by-user-decision"]).toContain(row.disposition);
    expect(row.verificationStatus).toBe("recorded-evidence");
    expect(row.sourceReferences).toContain("Attestation Online and PDF!A122");
  }
});

it("scopes common and dedicated Review instructions without absorbing adjacent Site variants", () => {
  const sites = report.scope.businessSiteKeys;
  const scopes = readSignSourceScopes(mcrSource.cells, sites);
  expect(scopes.get("Read & Sign!C80")?.siteKeys).toEqual(["ama"]);
  expect(scopes.get("Read & Sign!C97")?.siteKeys).toEqual(["ama"]);
  expect(scopes.get("Read & Sign!C114")?.siteKeys).toEqual(["waepa-gi"]);
  expect(scopes.get("Read & Sign!C86")?.siteKeys).toEqual(["waepa"]);
  expect(scopes.get("Read & Sign!C111")?.siteKeys).toEqual(["abe"]);
  for (const reference of ["C81", "C84", "C95", "C98", "C99", "C100", "C183", "B298"]) expect(scopes.has(`Read & Sign!${reference}`), reference).toBe(false);
  expect(scopes.get("Read & Sign!B7")?.siteKeys).not.toContain("waepa-gi");
  expect(scopes.get("Read & Sign!C69")?.siteKeys).toEqual(sites);
  const changed = structuredClone(mcrSource.cells);
  changed.find(cell => cell.sheet === "Read & Sign" && cell.cell === "B80")!.value = "AMA GI";
  expect(() => readSignSourceScopes(changed, sites)).toThrow("Site label changed");
  const row = report.requirements.find(row => row.kind === "source-clause" && row.sourceReferences.includes("Read & Sign!C80"));
  expect(row).toMatchObject({ disposition: "review-pending", verificationStatus: "not-verified", scope: { siteKeys: ["ama"] } });
});

it("records reusable global authoring targets and explicit Site assignments without activating unique source behavior", () => {
  for (const row of report.requirements.filter(row => row.kind === "source-requirement")) {
    const plan = row.configurationPlan!;
    expect(plan.definitionScope).toBe("global");
    expect(plan.assignmentScope).toBe("site");
    expect(plan.siteKeys).toEqual(row.scope.siteKeys);
    expect(plan.activation).toBe(row.id === "atomic.unique-dividend-notice" ? "reviewed-existing-configuration" : ["adopted-user-decision", "adopted-source-requirement"].includes(row.disposition) ? "adopted-reviewed-seed" : row.disposition === "superseded-by-user-decision" && row.codeOwner ? "superseded-by-user-decision" : row.codeOwner ? "reviewed-existing-code" : "enumerated-only");
    expect(row.verificationStatus).toBe((["adopted-user-decision", "adopted-source-requirement", "reviewed-current-template-functionality"].includes(row.disposition) || row.disposition === "superseded-by-user-decision" && row.codeOwner) ? "recorded-evidence" : "not-verified");
    if (plan.definitionTable === "fields") expect(db.fields.some(field => field.key === plan.definitionKey)).toBe(true);
  }
  expect(report.explicitUniqueMcrRequirements.find(row => row.key === "unique-dividend-notice")?.activeSiteKeys).toEqual(["abe"]);
  expect(report.explicitUniqueMcrRequirements.find(row => row.key === "unique-medical-authorization")?.activeSiteKeys).toEqual([]);
  expect(report.explicitUniqueMcrRequirements.find(row => row.key === "unique-custom-consent")).toMatchObject({ disposition: "deferred-by-user", completionBlocking: false });
  expect(report.requirements.filter(row => row.completionBlocking === false).every(row => ["deferred-by-user", "accepted-exception"].includes(row.disposition))).toBe(true);
  const changedResidency = report.currentSourceChanges.filter(row => /^Main!N28[0-6]$|^Main!N27[89]$/.test(row.reference));
  expect(changedResidency).toHaveLength(9);
  expect(changedResidency.every(row => row.policyReviewRequired === false && row.policyActivation === "reviewed-seed")).toBe(true);
  const editedResidency = structuredClone(db);
  editedResidency.configurationValues.find(row => row.key === "isitrust.oo-professional.journey-residency")!.value = { version: 99 };
  expect(buildRequirementCrosswalk(editedResidency).requirements.find(row => row.id === "atomic.residency.isitrust.oo-professional")).toMatchObject({ disposition: "adopted-user-decision", verificationStatus: "not-verified" });
  const editedAtpe = structuredClone(db);
  editedAtpe.amountBands.find(row => row.key === "shared.range.10000-500000-by-5000.band")!.maximum = 250000;
  expect(buildRequirementCrosswalk(editedAtpe).requirements.find(row => row.id === "atomic.adopted.atpe.li-10yr.spouse.maximum")).toMatchObject({ verificationStatus: "not-verified" });
  expect(report.uniqueSourceSignals.filter(row => row.disposition === "reusable-capability-recorded")).toHaveLength(3);
  expect(report.requirements.find(row => row.id === "atomic.attestation.avma.veterinary-college")?.executionOwners).toContainEqual({ table: "fields", key: "avma-vet-college", column: "definition" });
  expect(report.requirements.find(row => row.id === "atomic.attestation.waepa.adult-child-entry-block")?.context).toContain("conflicting source instruction");
  expect(report.requirements.find(row => row.id === "atomic.attestation.waepa-gi.military-yes-block")?.context).toContain("supersedes");
  expect(report.requirements.find(row => row.id === "atomic.attestation.waepa.adult-child-entry-block")?.disposition).toBe("superseded-by-user-decision");
  expect(report.ruleHierarchy.dependencyFindings).toEqual([]);
  expect(report.catalog.every(row => row.organization.path.length === 3 && row.organization.ordering === "review-only")).toBe(true);
  const captured = report.ownerEvidence.find(owner => owner.table === "fields" && owner.key === "avma-vet-college")!;
  expect(captured.storedValue).toEqual(db.fields.find(field => field.key === "avma-vet-college")!.definition);
  expect(captured.evidenceStatus).toBe("captured-stored-record-only");
  const copy = structuredClone(db);
  const snapshot = buildRequirementCrosswalk(copy);
  copy.fields.find(field => field.key === "avma-vet-college")!.definition.label = "Edited after capture";
  expect(snapshot.ownerEvidence.find(owner => owner.table === "fields" && owner.key === "avma-vet-college")!.storedValue).toEqual(captured.storedValue);
}, 60000);

it("generates deterministic artifacts without changing the reviewed data", () => {
  const before = JSON.stringify(db);
  expect(buildRequirementCrosswalk(db)).toEqual(report);
  expect(JSON.stringify(db)).toBe(before);
  const serialized = JSON.parse(serializeRequirementCrosswalk(report)) as { sourceLedger: Array<{ sourceKeys: string[] }>; requirements: unknown[] };
  const exportedSources = serialized.sourceLedger.flatMap(group => group.sourceKeys);
  const currentRequirements = currentMcrReviewData(db).data.sourceRequirements;
  expect(exportedSources).toHaveLength(currentRequirements.length);
  expect(new Set(exportedSources)).toEqual(new Set(currentRequirements.map(source => source.key)));
  expect(serialized.requirements).toEqual(report.requirements);
  const files = {
    "docs/project-review/step1-abe-review.md": renderAbeSiteReview(db, report),
    "docs/project-review/step1-abe-review.json": JSON.stringify(buildAbeSiteReview(db, report), null, 2) + "\n",
    "docs/project-review/step1-requirement-crosswalk.json": serializeRequirementCrosswalk(report),
    "docs/project-review/step1-requirement-crosswalk.md": renderRequirementCrosswalkSummary(report),
    "docs/project-review/step1-atomic-requirements.md": renderAtomicRequirementReview(report),
    "docs/project-review/step1-review-phases.md": renderStep1ReviewPhases(report),
    "docs/project-review/step1-review-queue.json": JSON.stringify(step1ReviewPhases(report), null, 2) + "\n",
  };
  if (process.env.REQUIREMENT_CROSSWALK_WRITE === "1") for (const [path, content] of Object.entries(files)) writeFileSync(path, content);
  if (process.env.REQUIREMENT_CROSSWALK_CHECK === "1") for (const [path, content] of Object.entries(files)) expect(readFileSync(path, "utf8"), `${path}: run npm run rules:crosswalk`).toBe(content);
});

it("records the implemented entry filters separately from deferred URL work and invalidates changed protocol owners", () => {
  for (const parameter of ["category", "prods", "featured_prod"]) expect(report.requirements.find(row => row.id === `atomic.entry-url.${parameter}`)).toMatchObject({ verificationStatus: "recorded-evidence", ownerResolution: "code-owned", disposition: "adopted-user-decision", configurationPlan: { definitionTable: "urlParameters", target: parameter === "featured_prod" ? "code-owned-featured-presentation" : "code-owned-entry-filter" } });
  expect(reviewedEntryCodeMatches(() => Buffer.from("changed entry executor"))).toBe(false);
  const edited = structuredClone(db); edited.urlParameters.find(row => row.key === "prods")!.parameter = "changed-protocol";
  expect(buildRequirementCrosswalk(edited).requirements.find(row => row.id === "atomic.entry-url.prods")?.verificationStatus).toBe("not-verified");
  expect(db.semanticRequirements.find(row => row.key === "business-decision.rules-review.entry-url-scope")!.value).toMatchObject({ deferredOtherUrlBehavior: { completionBlocking: false, status: "deferred-by-user" } });
  expect((db.semanticRequirements.find(row => row.key === "business-decision.rules-review.entry-url-scope")!.value as { deferredOtherUrlBehavior: { parameterNames: string[] } }).deferredOtherUrlBehavior.parameterNames).not.toContain("featured_prod");
});

it("closes reviewed mock persistence/Contact areas and invalidates edited native owners", () => {
  const shiftedSettings = structuredClone(db);
  for (const row of shiftedSettings.configurationDefinitions) if (["fieldSurfaces", "fieldCollections"].includes(row.definition.path?.join(".") ?? "")) row.position += 1;
  for (const row of shiftedSettings.configurationValues) if (row.configurationKey === "field-surfaces" || row.configurationKey === "field-collections") row.position += 1;
  expect([beneficiaryOwnerEvidenceHash(shiftedSettings), profileOwnerEvidenceHash(shiftedSettings)]).toEqual([beneficiaryOwnerEvidenceHash(db), profileOwnerEvidenceHash(db)]);
  expect(report.areaClosure["Save and resume"]).toBe("Closed for current mock prototype");
  expect(report.areaClosure.Contact).toBe("Closed for current mock prototype");
  expect(beneficiaryOwnerEvidenceHash(db)).toBe("1b1c2f90809f02e859a192e87320eed4b0b455340a13260e436c5eae21410236");
  expect(report.areaClosure.Beneficiary).toBe("Closed for current mock prototype");
  expect(reviewedBeneficiaryCodeMatches(() => Buffer.from("changed Beneficiary code"))).toBe(false);
  const editedBeneficiary = structuredClone(db);
  editedBeneficiary.fields.find(row => row.key === "beneficiary-share")!.definition.required = false;
  const changedBeneficiary = buildRequirementCrosswalk(editedBeneficiary);
  expect(changedBeneficiary.areaClosure.Beneficiary).toBe("Open");
  expect(step1ReviewPhases(changedBeneficiary).priorAreaRegressions).toContain("Beneficiary");
  expect(profileOwnerEvidenceHash(db)).toBe("8daade5dd4a22f838b7341790dcaa0b49c1d5dedf377573a7d0f2bbb66e5e6dd");
  expect(report.areaClosure.Profile).toBe("Closed for current mock prototype");
  expect(reviewedProfileCodeMatches(() => Buffer.from("changed Profile evidence"))).toBe(false);
  const editedProfile = structuredClone(db);
  editedProfile.fields.find(row => row.key === "has-drivers-license")!.definition.label = "Changed after review";
  expect(buildRequirementCrosswalk(editedProfile).areaClosure.Profile).toBe("Open");
  expect(reviewedContactCodeMatches(() => Buffer.from("changed Contact evidence"))).toBe(false);
  const editedContact = structuredClone(db);
  editedContact.configurationValues.find(row => row.key === "site:waepa.applicantExperience.contact.businessAddressProducts")!.value = ["li-group-term"];
  expect(buildRequirementCrosswalk(editedContact).areaClosure.Contact).toBe("Open");

  expect(report.requirements.filter(row => row.area === "Save and resume").every(row => row.verificationStatus === "recorded-evidence")).toBe(true);
  expect(reviewedPersistenceUiMatches(() => Buffer.from("changed UI evidence"))).toBe(false);
  const changed = structuredClone(db);
  changed.fields.find(row => row.key === "health-source-ci-1")!.definition.label = "Changed after review";
  const payment = changed.configurationValues.find(row => row.key === "isitrust.li-group-term.journey-policy")!.value as { payment: { collection: string } };
  payment.payment.collection = "optional";
  const edited = buildRequirementCrosswalk(changed);
  expect(edited.requirements.find(row => row.id === "atomic.adopted.isitrust.li-group-term.payment.collection")?.verificationStatus).toBe("not-verified");
  const question = edited.requirements.find(row => row.id.startsWith("atomic.adopted.atpe.questionnaire.ci-only.") && row.executionOwners.some(owner => owner.key === "health-source-ci-1"));
  expect(question?.verificationStatus).toBe("not-verified");
  expect(report.requirements.find(row => row.id === question!.id)?.verificationStatus).toBe("recorded-evidence");
}, 60000);

it("reconciles exact NSO age bounds and prior ASCE approvals without carrying verification across native edits", () => {
  expect(reviewedAgeCodeMatches()).toBe(true);
  expect(reviewedAgeCodeMatches(() => Buffer.from("changed ages"))).toBe(false);
  const atoms = report.requirements.filter(row => row.id.startsWith("atomic.adopted.nso.accident-ages."));
  expect(atoms).toHaveLength(6); expect(atoms.every(row => row.verificationStatus === "recorded-evidence")).toBe(true);
  const source = report.requirements.filter(row => row.finding.startsWith("Reviewed NSO accident ages:"));
  expect(source).toHaveLength(3); expect(source.every(row => row.verificationStatus === "recorded-evidence")).toBe(true);
  const asce = report.requirements.filter(row => row.finding.startsWith("Reviewed ASCE approved ages:"));
  expect(asce).toHaveLength(4); expect(asce.every(row => row.disposition === "superseded-by-user-decision")).toBe(true);
  const edited = structuredClone(db);
  edited.eligibilityConstraints.find(row => row.siteKey === "nso" && row.productKey === "li-add" && row.applicantTypeKey === "child")!.studentMaximumAgeYears = 26;
  edited.eligibilityConstraints.find(row => row.key === "asce.li-10yr.approved-eligibility.member")!.maximumAgeYears = 64;
  const changed = buildRequirementCrosswalk({ ...edited, eligibilityConstraints: edited.eligibilityConstraints.map(row => row.key === "asce.li-10yr.approved-eligibility.member" ? db.eligibilityConstraints.find(original => original.key === row.key)! : row) });
  reviewAgeSourceStatements(edited, changed.requirements);
  expect(changed.requirements.find(row => row.id === "atomic.adopted.nso.accident-ages.child.studentMaximumAgeYears")?.verificationStatus).toBe("not-verified");
  expect(changed.requirements.filter(row => row.sourceReferences[0] === "Main!Q320" && row.kind === "source-clause").every(row => row.verificationStatus === "not-verified")).toBe(true);
  expect(changed.requirements.filter(row => row.sourceReferences[0] === "Main!O165" && row.kind === "source-clause").every(row => row.verificationStatus === "not-verified")).toBe(true);
});

it("reconciles complete unqualified current source age ranges and reopens the exact edited native dimension", () => {
  const atoms = report.requirements.filter(row => row.id.startsWith("atomic.adopted.canonical-age."));
  expect(atoms.length).toBeGreaterThan(120);
  expect(atoms.every(row => row.verificationStatus === "recorded-evidence")).toBe(true);
  const clauses = report.requirements.filter(row => row.finding.startsWith("Reviewed unqualified source ages:"));
  expect(clauses).toHaveLength(atoms.length / 2);
  expect(clauses.every(row => row.verificationStatus === "recorded-evidence")).toBe(true);
  const edited = structuredClone(db), atom = atoms.find(row => row.scope.siteKeys[0] === "avma" && row.scope.applicantKeys[0] === "member")!;
  const constraint = edited.eligibilityConstraints.find(row => row.key === atom.executionOwners[0].key)!;
  constraint.maximumAgeYears = constraint.maximumAgeYears! - 1;
  const changed = buildRequirementCrosswalk(edited);
  expect(changed.requirements.find(row => row.id === atom.id)?.verificationStatus).toBe("not-verified");
  expect(changed.requirements.filter(row => row.kind === "source-clause" && row.sourceReferences[0] === atom.sourceReferences[0]).every(row => row.verificationStatus === "not-verified")).toBe(true);
});

it("maps each reviewed Attestation clause to its exact atoms while retaining role guards and unrelated clauses", () => {
  const mapped = report.requirements.filter(row => row.finding.startsWith("Reviewed attestation source leaf:"));
  expect(mapped.length).toBeGreaterThan(40); expect(mapped.every(row => row.verificationStatus === "recorded-evidence")).toBe(true);
  const spouse = mapped.find(row => row.id === "requirement.mcr.attestation-online-and-pdf.C3.32")!;
  expect(spouse.context).toContain("Spouse"); expect(spouse.context).toContain("spouse-physician-details");
  expect(mapped.find(row => row.id === "requirement.mcr.attestation-online-and-pdf.C3.36")?.disposition).toBe("superseded-by-user-decision");
  expect(report.requirements.find(row => row.id === "requirement.mcr.attestation-online-and-pdf.D38.2")?.disposition).toBe("review-pending");
  const edited = structuredClone(db); edited.siteFieldConfigurations.find(row => row.key === "site:abe.membership.membership.override")!.values.label = "Edited membership question";
  expect(buildRequirementCrosswalk(edited).requirements.find(row => row.id === "requirement.mcr.attestation-online-and-pdf.C7.1")?.verificationStatus).toBe("not-verified");
});

it("closes the named owner gaps and reconciles complete ISITRUST/WAEPA online instruction cells", () => {
  for (const id of ["atomic.attestation.isitrust.association-selector", "atomic.ama.di-step-rated.domestic-partner-notice-online", "atomic.ama.di-level-rated.domestic-partner-notice-online", "atomic.unique-dividend-notice"]) {
    const row = report.requirements.find(row => row.id === id)!;
    expect(row.verificationStatus, id).toBe("recorded-evidence");
    expect(row.ownerCandidates, id).toEqual([]); expect(row.executionOwners.length, id).toBeGreaterThan(0);
    expect(row.scope.unresolved, id).toEqual([]);
  }
  expect(report.explicitUniqueMcrRequirements.find(row => row.key === "unique-dividend-notice")?.disposition).toBe("reviewed-current-template-functionality");
  for (const cell of ["C86", "C122"]) {
    const clauses = report.requirements.filter(row => row.kind === "source-clause" && row.sourceReferences[0] === `Attestation Online and PDF!${cell}`);
    expect(clauses.length).toBeGreaterThan(10);
    expect(clauses.every(row => row.atomization === "reviewed" && row.verificationStatus === "recorded-evidence"), cell).toBe(true);
  }
  const cseaCompound = report.requirements.find(row => row.id === "requirement.mcr.attestation-online-and-pdf.C69.8")!;
  expect(cseaCompound.atomization).toBe("clause-review-pending"); // Optional spouse + child age exception still require their exact compound reconciliation.
  expect(report.requirements.filter(row => row.kind === "template-behavior" && row.ruleKeys.includes("rule-validation-page-advance")).every(row => row.verificationStatus === "recorded-evidence")).toBe(true);
  expect(report.enumerationComplete).toBe(false);
  const phases = step1ReviewPhases(report);
  expect(phases.executionMode).toBe("site-by-site");
  expect(phases.activeSiteKey).toBe("abe");
  expect(phases.siteQueue.filter(site => site.status.startsWith("Active")).map(site => site.siteKey)).toEqual(["abe"]);
  expect(phases.completedPhase.status).toBe("Reviewed for current mock prototype");
  expect(phases.priorAreaRegressions).toEqual([]);
  expect(new Set(phases.phases.flatMap(phase => phase.queue.map(row => row.id)))).toEqual(new Set(report.requirements.filter(row => row.disposition === "review-pending").map(row => row.id)));
  const staleRouting = { ...report, requirements: report.requirements.map(row => row.ruleKeys.includes("rule-validation-page-advance") ? { ...row, verificationStatus: "not-verified" as const, finding: "Captured routing evidence changed" } : row) };
  expect(step1ReviewPhases(staleRouting).completedPhase.status).toBe("Reverification required");
});
