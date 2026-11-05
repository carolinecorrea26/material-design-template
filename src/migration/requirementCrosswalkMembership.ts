import type { CrosswalkAtom } from "./requirementCrosswalkAtoms";

const field = (key: string) => ({ table: "fields", key, column: "definition" });
const scopedField = (site: string, key: string) => ({ table: "siteFieldConfigurations", key: `site:${site}.membership.${key}.override` });
const condition = (key: string) => ({ table: "conditions", key, column: "definition" });
const membershipConsumers = ["src/pages/Membership.tsx", "src/config/clientFields/getClientPageFields.ts", "src/config/clientFields/membershipFollowUpVisibility.ts"];
export const membershipCrosswalkAtoms: CrosswalkAtom[] = [];
function add(site: string, cell: string, suffix: string, expected: string, options: Partial<CrosswalkAtom> = {}) {
  membershipCrosswalkAtoms.push({ id: `atomic.attestation.${site}.${suffix}`, source: `Attestation Online and PDF!${cell}`, site,
    area: "Membership", applicant: "member", modes: ["online", "application"], expected, implementationReferences: membershipConsumers, ...options });
}

for (const [site, row, association] of [["abe", 7, "a State, Local, or Specialty Bar Association"], ["asce", 9, "the American Society of Civil Engineers"]] as const) {
  add(site, `C${row}`, "member-question", `Ask whether the applicant is ${site === "abe" ? "an active member" : "a member"} of ${association}.`, {
    executionOwners: [field("membership"), scopedField(site, "membership")], context: "The scoped field owns the question label; the shared Membership page currently owns the nonmember advancement gate. These owners do not themselves certify source parity." });
  add(site, `C${row}`, "spouse-question", `Ask whether the spouse is also ${site === "abe" ? "an active member" : "a member"} of ${association}.`, {
    applicant: "spouse", ownerCandidates: [field("spouse-membership")], context: "The source has a separate spouse instruction. Confirm effective placement and requiredness separately from the member question." });
  add(site, `E${row}`, "pdf-membership-statement", `Print the source's ${site === "abe" ? "American Bar Association" : "American Society of Civil Engineers"} membership statement on PDF.`, {
    modes: ["PDF"], deferred: true, context: site === "abe" ? "Online eligibility names State/Local/Specialty Bar membership while PDF names the American Bar Association. Preserve the literal source difference; do not broaden or narrow the accepted template through this enumeration." : undefined });
}

add("avma", "C38", "membership-question", "Ask American Veterinary Medical Association membership with Yes/No choices.", { executionOwners: [field("membership"), scopedField("avma", "membership")] });
add("avma", "D38", "veterinary-college", "For a member, collect the veterinary college attended using a dropdown of colleges.", { executionOwners: [field("avma-vet-college"), scopedField("avma", "avma-vet-college")], context: "The captured shared field currently uses a text input. The source's college-list control needs reconciliation at the global field definition and scoped placement; keep the current field decision intact during enumeration." });
add("avma", "D38", "graduation-year", "For a member, collect the year of graduation.", { executionOwners: [field("avma-graduation-year"), scopedField("avma", "avma-graduation-year")] });
add("avma", "D38", "occupation", "For a member, collect type of veterinary practice or another occupation if not practicing.", { executionOwners: [field("avma-occupation"), scopedField("avma", "avma-occupation")] });
add("avma", "D38", "details-pdf", "Print the veterinary college, graduation year and occupation on PDF.", { modes: ["PDF"], deferred: true });

add("isitrust", "C86", "association-selector", "Ask which participating association the applicant belongs to using an association dropdown.", { executionOwners: [field("membership"), scopedField("isitrust", "membership")], context: "Stored Site association assignments and the shared association resolver supply the current options. Pending St. Louis evidence remains pending; no association is added or removed here." });
add("isitrust", "C86", "atpe-rate-suppression", "Suppress rates for Association of Texas Professional Educators.", { area: "Payment and rates", context: "Retain an association-scoped rate-display requirement. Global rates-unavailable behavior is not evidence that this particular association exception has a stored assignment." });
for (const [product, name, gNumber] of [["li-add", "AD&D", "G-31132-0"], ["li-group-term", "Term Life", "G-31136-0"]] as const) {
  add("isitrust", "C86", `${product}-fencing-equestrian-cap`, `For USA Fencing and US Equestrian Federation, cap ${name} (${gNumber}) at $500,000.`, {
    product, area: "Coverage", context: "The association condition is part of this amount requirement. Reuse the structured amount/cap owners with explicit association applicability; do not make this cap the global product default." });
}
add("isitrust", "C86", "weekly-hours", "Collect the member's weekly work hours.", { ownerCandidates: [field("hours-worked-per-week")], area: "Eligibility", context: "The source asks for collection here; per-product minimum hours remain separate requirements with their existing reviewed values." });
add("isitrust", "C86", "spouse-no-attestation", "For the spouse, do not ask an attestation question.", { applicant: "spouse", area: "Eligibility" });
add("isitrust", "C86", "spouse-election-notice", "For the spouse, display the blue-box notice that a spouse who is also a participating association member may apply as spouse or member, but not both.", { applicant: "spouse", area: "Eligibility", context: "The source describes a presentation notice. Separate enrollment/exclusivity enforcement must not be inferred from displaying its prose." });

add("nso", "C98", "nurse-question", "Ask 'Are you a Nurse?'.", { executionOwners: [field("membership"), scopedField("nso", "membership")] });
add("nso", "D98", "nurse-type", "Collect Nurse Type using a dropdown with RN, LPN and Other Nurse Professional Type.", { executionOwners: [field("nurse-type"), condition("condition-membership-confirmed"), { table: "siteFieldConfigurations", key: "site:nso.membership.nurse-type.include" }], context: "The global nurse-type definition is explicitly assigned only to NSO after the existing membership Yes gate. Required collection uses the normal template follow-up convention. PDF remains separate." });
add("nso", "E98", "pdf-nurse-statement", "Print the selected nurse type and eligibility through the Springhouse Group Insurance Trust (t/a Nurses Services Organization) in the source PDF statement.", { modes: ["PDF"], deferred: true });

const waepaNew = "rule-membership-waepa-new-member-displays-member-information";
add("waepa", "C122", "membership-selector", "Ask whether the applicant is a Current Member or New Member.", { executionOwners: [field("membership"), scopedField("waepa", "membership")] });
add("waepa", "C122", "current-member-no-entry-form", "Selecting Current Member does not display the new membership form.", { ruleKeys: [waepaNew], executionOwners: [condition("condition-membership-waepa-new")], context: "This hides the new-member form only. Shared applicant name/contact controls and the separately required military restriction are not suppressed by this instruction." });
add("waepa", "C122", "new-member-form", "Selecting New Member displays the membership form.", { ruleKeys: [waepaNew], executionOwners: [condition("condition-membership-waepa-new")] });
add("waepa", "C122", "membership-form-title", "Use 'Membership Form' as the new membership form title.", { ruleKeys: [waepaNew] });
add("waepa", "C122", "membership-form-note", "For the new membership form, explain that applying for coverage makes the applicant a WAEPA member and requests the information needed to complete membership.", { ruleKeys: [waepaNew] });
add("waepa", "C122", "active-federal-qualification", "Offer the qualification 'I am a civilian federal employee of the U.S. Government actively at work'.", { executionOwners: [field("waepa-attestation"), scopedField("waepa", "waepa-attestation")] });
add("waepa", "C122", "active-federal-employer", "When the active civilian federal employee qualification is selected, require an employer selected from the employer list.", {
  ruleKeys: ["rule-membership-waepa-active-federal-employee-fields"], executionOwners: [field("waepa-employer"), scopedField("waepa", "waepa-employer"), condition("condition-waepa-federal-active")] });
add("waepa", "C122", "active-federal-start-date", "When the active civilian federal employee qualification is selected, require the employment start date.", {
  ruleKeys: ["rule-membership-waepa-active-federal-employee-fields"], executionOwners: [field("waepa-start-date"), scopedField("waepa", "waepa-start-date"), condition("condition-waepa-federal-active")] });
add("waepa", "C122", "former-federal-no-followups", "Offer former federal employee qualification; selecting it displays no additional qualification questions/fields.", {
  executionOwners: [field("waepa-attestation")], context: "The October 20 user-approved six-option list supersedes the separate retired-annuitant choice. Former federal employee has no employer/retirement-date follow-ups. Historical annuitant definitions remain available for captured revisions." });
for (const [suffix, text] of [["spouse", "spouse"], ["parent", "parent/parent-in-law"], ["sibling", "sibling"], ["adult-child", "Adult Child/Step-Child"]] as const) {
  add("waepa", "C122", `${suffix}-associate-qualification`, `Offer ${text} of a WAEPA member as an Associate Member qualification.`, {
    executionOwners: [field("waepa-attestation")], context: "The October 20 user-approved list includes this relationship in the shared qualification field scoped to Standard WAEPA. Product eligibility remains separate." });
}
add("waepa", "C122", "associate-member-first-name", "For the source's associate-member information flow, require the WAEPA member's First Name.", {
  ruleKeys: ["rule-membership-waepa-associate-member-information"], executionOwners: [field("waepa-member-first-name"), scopedField("waepa", "waepa-member-first-name"), condition("condition-waepa-associated-member")], context: "C122 places the 'If selected' instruction after Statements 3–5 and explicitly names spouse information. The current condition covers all four Associate Member relationships. Reusing the existing sponsor fields documents the new-template interpretation; the old statement numbering remains ambiguous." });
add("waepa", "C122", "associate-member-last-name", "For the source's associate-member information flow, require the WAEPA member's Last Name.", {
  ruleKeys: ["rule-membership-waepa-associate-member-information"], executionOwners: [field("waepa-member-last-name"), scopedField("waepa", "waepa-member-last-name"), condition("condition-waepa-associated-member")], context: "Keep the ambiguous source Statements 3–5 guard visible. The new-template condition uses all four Associate Member relationships with the existing sponsor fields." });
add("waepa", "C122", "associate-member-number-optional", "Make WAEPA Membership Number optional in the described associate-member information flow.", {
  ruleKeys: ["rule-membership-waepa-associate-member-information"], executionOwners: [field("waepa-member-id"), scopedField("waepa", "waepa-member-id")] });
add("waepa", "C122", "associate-member-middle-initial", "Make Middle Initial optional in the described associate-member information flow.");
add("waepa", "C122", "adult-child-dependent-cap", "In the source's adult-child dependent route, dependent coverage may not exceed 50% of the Member's coverage.", { area: "Coverage", context: "C122 combines adult-child Associate Member and dependent-route instructions. Preserve the route-specific guard; do not impose this limit on an independently insured adult Associate Member without reconciliation." });
add("waepa", "C122", "adult-child-dependent-request", "For the source's dependent route, the Member makes the coverage request using the described Yes answer and dependent selection.", { area: "Coverage", context: "The cell says to click the spouse icon for this adult-child route; preserve that inconsistency for source review instead of translating it into a guessed applicant assignment." });
add("waepa", "C122", "adult-child-entry-block", "When the described Adult Child/Step-Child qualification is selected, the source says to prevent continuation and disable Self/Spouse/Child choices.", { context: "The same cell also offers this relationship as Associate Member and describes a dependent route. Exact entry behavior requires reconciliation; do not silently activate the conflicting source instruction." });
add("waepa", "C122", "truthfulness-acknowledgement", "Require the source truthfulness acknowledgement under its stated Statement 1/2 and Associate Member conditions.", {
  executionOwners: [field("waepa-declaration"), scopedField("waepa", "waepa-declaration")], context: "The source reuses 'Statement 4' for the acknowledgement after describing other numbered qualifications. Preserve its literal applicability text; the current declaration is required for the new-member form." });
add("waepa", "C122", "unchecked-acknowledgement-error", "If an applicable truthfulness acknowledgement is unchecked, clicking Next displays an error.", { executionOwners: [field("waepa-declaration")], context: "Applicability is subject to the separately recorded C122 statement-number conflict; the shared required-field validator owns the current checkbox validation." });
add("waepa", "C122", "military-question-location", "Always render the military Yes/No question in Self Eligibility.", { executionOwners: [field("active-military"), scopedField("waepa", "active-military")], context: "The current scoped placement collects this question on Membership. Page moves are template decisions; record the source location separately from its exclusion behavior." });
add("waepa", "C122", "military-yes-block", "An Armed Forces Yes answer displays the not-eligible message and disables Next.", { ruleKeys: ["rule-membership-waepa-active-duty-prevents-application"], ownerCandidates: [field("active-military")] });
add("waepa", "C122", "weekly-hours-location", "Always collect weekly working hours in Self Eligibility under the military question for product eligibility.", { area: "Eligibility", ownerCandidates: [field("hours-worked-per-week")], context: "Question location and collection are separate from the accepted per-product work-hour thresholds; this row does not introduce a global threshold." });
add("waepa", "C122", "spouse-membership-question", "Ask whether the spouse is currently or becoming a WAEPA member.", { applicant: "spouse", area: "Eligibility", ownerCandidates: [field("spouse-membership")] });
add("waepa", "C122", "spouse-membership-yes-block", "If the spouse is currently or becoming a WAEPA member, disable Next for the described dependent-spouse application.", { applicant: "spouse", area: "Eligibility", context: "Retain dependent-spouse applicability. Do not use this clause to prohibit a spouse's independently eligible Associate Member application." });
for (const [suffix, expected] of [
  ["pdf-member-attestation", "On PDF, print whether the applicant currently is or is becoming a WAEPA member or Associate Member."],
  ["pdf-working-hours", "On PDF, print the working-hours answer."],
  ["pdf-spouse-attestation", "On PDF, print the spouse's WAEPA membership statement."],
  ["pdf-eligibility-whitelist", "Limit PDF eligibility statements to those named in E122; retain the other collected fields in Full XML."],
] as const) add("waepa", "E122", suffix, expected, { modes: ["PDF", "XML"], deferred: true });

add("waepa-gi", "C125", "military-yes-block", "Retain the military question: Yes prevents continuation with the standard error.", { ruleKeys: ["rule-membership-waepa-active-duty-prevents-application"], ownerCandidates: [field("active-military")], context: "The October 20 generic GI membership decision supersedes the employer/uninsured/employment-date entry flow, while explicitly preserving this separate military restriction." });
add("waepa-gi", "C125", "military-no-proceed", "A military No answer satisfies the military restriction; other eligibility requirements still apply.", { ruleKeys: ["rule-membership-waepa-active-duty-prevents-application"] });
add("waepa-gi", "C125", "referral-source-section", "Render 'How did you hear about WAEPA? (check all that apply)' in Personal Information.", { area: "Profile", context: "The retained generic GI entry decision does not by itself establish a disposition for this separate referral-source collection instruction." });
add("waepa-gi", "E125", "pdf-membership-statement", "On PDF, print that the applicant currently is or is becoming a WAEPA member or Associate Member.", { modes: ["PDF"], deferred: true });
