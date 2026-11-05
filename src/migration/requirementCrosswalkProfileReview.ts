import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { DatabaseSchema } from "../persistence/types";
import type { CrosswalkRow } from "./requirementCrosswalk";

const evidence = {
  "src/migration/profileReplacementNoticeAdoption.test.ts": "5545fa6e46ae18c7239a3e30a2e466d18b85e2254bb8dff4db07c61af9de69d4",
  "src/migration/profileReplacementNoticeAdoption.ts": "735b339b66ed90f434c2593e5962b6a9c94e359a9f0edc8876d4cf9b24744792",
  "src/domain/applicantExperience.ts": "0847a51ca17e8fed0ed442c32d812f561d98f8a612dd553bd6765d01401e6099",
  "src/pages/Profile.tsx": "78eb567c855b71a2a446e0030dd8b73d4d14f2db34c46627a424bab04a94a9d0",
  "src/app/RoutePage.tsx": "0758c408d2246da3e4cb59a0c5370c913a047c4c110792ec1bcd3a13fd555ae3",
  "src/components/forms/DynamicList.tsx": "94c21a8cd73cb0be67bedf9cf42c0c9be692992521c0f0ddff7a470a9dd48e1b",
  "src/components/forms/DynamicListItem.tsx": "eb5a9b4e16e2f96f5f19f4b9b7157ce37997c479046ffad79feec269c1c3fba8",
  "src/components/forms/ConditionalGroup.tsx": "1cabab612be9b5ee94a06d3517ce988dc4db8d35f0dbada76f903d6bd1edd98d",
  "src/domain/financialQuestionnaire.ts": "96bd23b7c62cbd280f951e511b0b19252a1d3b8493556bed18f3ca62246e6e81",
  "src/utils/fieldValidation.ts": "e482e3b197dcfc2354e436b386e4d99ef67fba90380be0ed3d69759324dbdb75",
  "src/pages/Profile.test.tsx": "7701b3f9939e59f3b18d79c3dcf1b20e6e53fd1e549d0915510ee5737492b913",
  "src/migration/profileCollectionReview.test.ts": "c23c178c95c4df3511336dedec2ea0cf78f963bf52ec7d4fcb4aa8b25e7b1faf",
  "src/domain/financialQuestionnaire.test.ts": "66c22e00c4083230b4a2bd11a42ad33ac6e420d5b844eb1441a92c5f80221cf1",
};
export function reviewedProfileCodeMatches(read = (path: string) => readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../..", path))) {
  return Object.entries(evidence).every(([path, hash]) => createHash("sha256").update(read(path)).digest("hex") === hash);
}
export function profileOwnerEvidenceHash(db: DatabaseSchema) {
  const sections = db.pageSections.filter(row => row.pageKey === "profile"), sectionKeys = new Set(sections.map(row => row.key));
  const placements = db.pageSectionFields.filter(row => sectionKeys.has(row.sectionKey));
  const pageFields = db.pageFields.filter(row => row.pageKey === "profile"), overrides = db.siteFieldConfigurations.filter(row => row.pageKey === "profile");
  const fieldKeys = new Set([...placements, ...pageFields, ...overrides].map(row => row.fieldKey));
  // Ignore compiler list offsets for settings; collection/field order stays captured.
  const definitions = db.configurationDefinitions.filter(row => row.definition.path?.join(".") === "fieldCollections").map(row => ({ ...row, position: 0 })), definitionKeys = new Set(definitions.map(row => row.key));
  const values = db.configurationValues.filter(row => definitionKeys.has(row.configurationKey)).map(row => ({ ...row, position: 0 }));
  for (const row of values) for (const collection of Object.values(row.value as unknown as Record<string, { pageKey: string; fields: Array<{ fieldKey: string }> }>)) if (collection.pageKey === "profile") for (const binding of collection.fields) fieldKeys.add(binding.fieldKey);
  const noticeDefinitions = db.configurationDefinitions.filter(row => row.definition.path?.join(".") === "applicantExperience.profile.lifeReplacementNotice");
  const noticeValues = db.configurationValues.filter(row => noticeDefinitions.some(definition => definition.key === row.configurationKey));
  const fields = db.fields.filter(row => fieldKeys.has(row.key));
  const conditions = new Set<string | undefined>([...fields.map(row => row.definition.visibilityConditionId), ...sections.map(row => row.definition.visibilityConditionId), ...overrides.map(row => row.values.visibilityConditionId)]);
  return createHash("sha256").update(JSON.stringify({ noticeDefinitions, noticeValues, fields, validationRules: db.validationRules.filter(row => fieldKeys.has(row.fieldKey)), pageFields, pageSections: sections, pageSectionFields: placements, siteFieldConfigurations: overrides, sitePages: db.sitePages.filter(row => row.pageKey === "profile"), conditions: db.conditions.filter(row => conditions.has(row.key)), collectionDefinitions: definitions, collectionValues: values })).digest("hex");
}
export function reviewProfileRequirements(db: DatabaseSchema, rows: CrosswalkRow[], financialScopeReviewed: boolean) {
  const matches = reviewedProfileCodeMatches() && profileOwnerEvidenceHash(db) === "8daade5dd4a22f838b7341790dcaa0b49c1d5dedf377573a7d0f2bbb66e5e6dd" && financialScopeReviewed;
  for (const row of rows.filter(row => row.area === "Profile" && (row.kind === "template-behavior" || row.kind === "source-clause" && /^Main!Y\d+$/.test(row.sourceReferences[0]) && /^(?:no|n\/?a)$/i.test(row.expectedBehavior)))) {
    row.codeOwner = row.kind === "template-behavior" && row.ruleKeys.includes("rule-profile-repeatable-insurance-company-records") ? "Profile, captured fieldCollections and DynamicList" : "Profile conditional rendering and requiresFinancialQuestionnaire";
    row.ownerResolution = "code-owned";
    row.verificationReferences = ["src/pages/Profile.test.tsx", "src/migration/profileCollectionReview.test.ts", "src/domain/financialQuestionnaire.test.ts"];
    row.verificationStatus = matches ? "recorded-evidence" : "not-verified";
    row.disposition = matches ? "reviewed-current-template-functionality" : "review-pending";
    if (row.kind === "source-clause") row.atomization = "reviewed";
    row.finding = matches ? "Current Profile owner/code snapshot and rendered/captured tests match: member/spouse conditional fields, existing Life follow-ups, collection restoration/Edit/removal, and full financial-questionnaire scope. ABE’s approved financial sub-form uses explicit Site/product/amount configuration on the existing Profile section at combined member DI >= $7,000 excluding OO. It is independent of health completion. Shared placement and the separately adopted referral field remain explicit decisions." : "Profile code, captured fields/conditions/collections or current financial applicability changed. Repeat the bounded review before closing this requirement.";
  }
  const replacement = rows.find(row => row.id === "atomic.adopted.profile.ny-life-replacement-notice");
  if (replacement && !matches) { replacement.verificationStatus = "not-verified"; replacement.disposition = "review-pending"; replacement.finding = "Profile native owner or rendering/test evidence changed; reverify the NY Life/Yes replacement guard before closing."; }
  const referral = rows.find(row => row.id === "atomic.attestation.waepa-gi.referral-source-section");
  if (referral && rows.some(row => row.id.startsWith("atomic.adopted.waepa-gi.membership-referral.") && row.verificationStatus !== "recorded-evidence")) { referral.disposition = "review-pending"; referral.finding = "The adopted Membership replacement changed; reverify its native owners before accepting the superseded legacy Profile placement."; }
}
