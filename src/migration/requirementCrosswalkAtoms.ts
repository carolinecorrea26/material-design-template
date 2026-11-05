/** Human decomposition of compound cells. An enumerated atom is not a verified
 * behavior. These entries retain source scope and accepted decisions; they never
 * seed fields/policies or reopen provisional values. */
export type CrosswalkAtom = {
  id: string; source: string; site: string; product?: string; applicant?: string;
  area: string; expected: string; modes: string[]; ruleKeys?: string[];
  ownerCandidates?: Array<{ table: string; key: string; column?: string }>;
  deferred?: boolean; context?: string;
  executionOwners?: Array<{ table: string; key: string; column?: string }>;
  implementationReferences?: string[];
};
const field = (key: string) => ({ table: "fields", key, column: "definition" });
const policy = (key: string) => ({ table: "configurationValues", key, column: "value" });

export const crosswalkAtoms: CrosswalkAtom[] = [];
const add = (base: Pick<CrosswalkAtom, "source" | "site" | "product" | "applicant">, suffix: string, area: string, expected: string,
  options: Partial<Pick<CrosswalkAtom, "modes" | "ruleKeys" | "ownerCandidates" | "deferred" | "context">> = {}) => {
  crosswalkAtoms.push({ ...base, id: `atomic.${base.site}.${base.product ?? "membership"}.${suffix}`, area, expected, modes: ["application"], ...options });
};

// Work hours already have exact atomic reviews. Enumerate the other instructions
// in these cells independently, including presentation locations and change mode.
for (const [product, row] of Object.entries({ "li-term": 39, "li-10yr": 40, "li-20yr": 41, "li-50plus": 42, "li-add": 43,
  "di-ltd-plus": 44, "di-ltd": 45, "di-mtd": 46, "oo-professional": 48, "sh-hospital-money": 49 })) {
  const base = { source: `Main!R${row}`, site: "abe", product, applicant: "member" };
  add(base, "membership-id-optional", "Membership", "Do not require Membership ID.");
  add(base, "ssn-required", "Profile", "Require the member Social Security number.", { ownerCandidates: [field("social-security-number")] });
  if (row !== 42) {
    add(base, "eligibility-email-required", "Eligibility", "Require email on Eligibility.", { ownerCandidates: [field("email")] });
    add(base, "contact-email-required", "Contact", "Require email on Contact details.", { ownerCandidates: [field("email")] });
  }
  const modes = [40, 41].includes(row) ? ["new", "change"] : ["new"];
  add(base, "dividend-paragraph-online", "Review and consent", `Display the dividend paragraph in Read & Sign for ${modes.join(" and ")} coverage only.`, { modes: ["online", ...modes], ownerCandidates: [policy("abe.review-policy")] });
  add(base, "dividend-note-online", "Review and consent", `Display the dividend note after E-signature for ${modes.join(" and ")} coverage only.`, { modes: ["online", ...modes], ownerCandidates: [policy("abe.review-policy")] });
  add(base, "dividend-pdf", "Review and consent", `Include the dividend paragraph and post-signature note on PDF for ${modes.join(" and ")} coverage only.`, { modes: ["PDF", ...modes], deferred: true, context: "Detailed PDF/XML work remains explicitly deferred; split paragraph/note outputs when that work resumes." });
  if (row === 48) add(base, "firm-size", "Eligibility", "Require five or fewer members of the firm, independently of the work-hours requirement.", { ownerCandidates: [field("average-employees-6-months")] });
}

for (const [product, row] of [["di-step-rated", 118], ["di-level-rated", 119]] as const) {
  const base = { source: `Main!R${row}`, site: "ama", product, applicant: "member" };
  add(base, "name-before-lookup", "Membership", "Collect the applicant name before triggering the AMA API transfer.", { ownerCandidates: [field("first-name"), field("last-name")] });
  add(base, "dob-before-lookup", "Membership", "Collect date of birth before triggering the AMA API transfer.", { ownerCandidates: [field("birth-date")] });
  add(base, "ama-api-transfer", "Membership", "Trigger the AMA data transfer with the upfront name and date of birth.", { context: "Source describes an external integration; current mock/production service ownership must be distinguished." });
  add(base, "nonmember-participation", "Membership", "Allow both AMA Members and Non-Members to apply.");
  add(base, "nonmember-surcharge", "Payment and rates", "Apply the product's annual surcharge to Non-Members.", { ownerCandidates: [policy(`ama.${product}.rate-modifier-policy`)], ruleKeys: ["rule-rates-billing-modifier-owners"] });
  add(base, "medical-education-number-api", "Membership", "Collect the Medical Education Number through the AMA API.");
  add(base, "medical-education-number-xml", "Membership", "Populate the API-provided Medical Education Number on the Full XML.", { modes: ["XML"], deferred: true });
  add(base, "domestic-partner-notice-online", "Eligibility", "Suppress the Domestic partner/Civil Union message online.", { modes: ["online"] });
  add(base, "domestic-partner-notice-pdf", "Eligibility", "Suppress the Domestic partner/Civil Union message on PDF.", { modes: ["PDF"], deferred: true });
}

const ama = { source: "Attestation Online and PDF!C3", site: "ama", applicant: "member" };
add(ama, "insurance-for-hidden", "Eligibility", "Hide the question 'This insurance is for…'.");
add(ama, "spouse-option-label", "Eligibility", "Label the dependent spouse option 'Spouse Coverage (Premier Accident or Hospital Income)'.", { ownerCandidates: [field("dependents")] });
for (const [role, categories, dependents] of [
  ["Physician", "Life, Disability, Office Overhead Expense and Supplemental Health", "spouse and child"],
  ["Resident", "Life, Disability and Supplemental Health", "spouse and child"],
  ["Student / Retired Physician", "Life and Supplemental Health", "spouse and child"],
  ["Spouse", "Life", "child only"],
] as const) {
  const suffix = role.toLowerCase().replace(/[^a-z]+/g, "-");
  add(ama, `${suffix}-categories`, "Membership", `When applicant type is ${role}, show the category question with ${categories} categories.`, {
    ownerCandidates: [policy("ama.applicant-category-eligibility")], ruleKeys: ["rule-membership-ama-category-eligibility"],
    context: "Category policy accepted October 20. The earlier combined review is retained separately; this row enumerates one applicant-class clause." });
  add(ama, `${suffix}-dependents`, "Eligibility", `When applicant type is ${role}, show the optional dependent question with ${dependents} options.`, { ownerCandidates: [field("dependents")] });
}
add(ama, "spouse-physician-details", "Membership", "When applicant type is Spouse, display About Physician.", { ruleKeys: ["rule-membership-ama-spouse-displays-physician-information"], ownerCandidates: [field("ama-physician-first-name")] });
add(ama, "di-rate-choice-show", "Coverage", "Show 'Choose step or level rate premiums' if the prods parameter is absent or includes more than one disability product.", { context: "Retain the URL condition with this instruction; do not infer a default step/level business choice." });
add(ama, "di-rate-choice-tooltip", "Coverage", "For the displayed step/level question, explain that step premiums start lower and increase, while level premiums may start higher and stay the same over the coverage life.");
add(ama, "di-step-selection", "Coverage", "If Step is chosen, show Disability Insurance with Step Rated Premiums on Coverage.");
add(ama, "di-level-selection", "Coverage", "If Level is chosen, show Disability Insurance with Level Rated Premiums on Coverage.");
add(ama, "di-single-url-hide-choice", "Coverage", "If prods contains exactly DI_STEP_GNUM or exactly DI_LEVEL_GNUM, hide the step/level question.");
add(ama, "di-single-url-product", "Coverage", "If prods contains exactly one disability product, show only that disability product on Coverage.");

const csea = { source: "Attestation Online and PDF!C69", site: "csea", product: "di-ltd", applicant: "member" };
add(csea, "membership-gate", "Membership", "Ask CSEA membership; Yes permits continuation and No prevents continuation with the standard error.", { ownerCandidates: [field("membership")] });
add(csea, "duties-gate", "Membership", "Ask whether the applicant is presently performing all occupation duties on their regular schedule; No prevents continuation with the standard error.", { ownerCandidates: [field("csea-performing-duties")], context: "The separate duties field is hidden because the current scoped membership label combines CSEA membership and performing duties. Preserve the accepted combined question; field visibility alone does not establish a missing gate." });
add(csea, "occupation-class", "Membership", "Ask whether work is solely office or clerical: Yes maps to Group 1 Clerical and No to Group 2 Non-Clerical.", { ownerCandidates: [field("csea-occupation-group")] });
add(csea, "spouse-details", "Eligibility", "When spouse coverage is checked, collect spouse title, first name, middle initial, last name, suffix and birthday.", { ownerCandidates: [field("spouse-first-name"), field("spouse-last-name"), field("spouse-birth-date")] });
add(csea, "spouse-amounts", "Coverage", "Offer spouse accident disability benefit choices of $500 and $1,000 under Disability.", { ownerCandidates: [policy("csea.di-ltd.reviewed-benefit-policy")] });
add(csea, "spouse-selected-locked", "Coverage", "Pre-check and disable the spouse coverage checkbox in the described spouse benefit flow.");
add(csea, "child-age-attestation", "Eligibility", "Collect the child-coverage attestation that the children are under age 19 on the application date.");
add(csea, "child-no-person-records", "Eligibility", "Selecting the described child outpatient benefit does not render individual child fields.");
add(csea, "child-benefit-checkbox", "Coverage", "Under the spouse benefit, offer the Child Outpatient Emergency Room Benefit checkbox.");
add(csea, "child-no-amount-selection", "Coverage", "Do not show an amount selector for the child outpatient benefit.");
add(csea, "child-benefit-disclosure", "Coverage", "Display the source's optional dependent child emergency accident benefit disclosure.", { context: "Keep the full disclosure in source context; the payment amount, eligible settings and visit limit have separate atoms." });
add(csea, "child-benefit-amount", "Coverage", "The optional outpatient accident benefit pays $50 for a covered injury to a child under age 19.");
add(csea, "child-benefit-settings", "Coverage", "The child benefit's covered treatment settings are hospital, ambulatory surgical center, urgent care center or private licensed physician office, on an outpatient basis.");
add(csea, "child-benefit-visit-limit", "Coverage", "Limit the child outpatient benefit to two visits per calendar year.");

const waepa = { source: "Main!R379", site: "waepa", product: "li-group-term", applicant: "member" };
add(waepa, "ssn-required", "Profile", "Require member SSN.", { ownerCandidates: [field("social-security-number")] });
add(waepa, "member-number-optional", "Membership", "Do not require Member Number.", { ownerCandidates: [field("waepa-member-id")] });
add(waepa, "active-duty-excluded", "Membership", "Prevent application by members called to active military duty.", { ruleKeys: ["rule-membership-waepa-active-duty-prevents-application"] });
add(waepa, "phone-on-eligibility", "Eligibility", "Collect telephone number in Eligibility.", { ownerCandidates: [field("phone")] });
add(waepa, "phone-not-contact", "Contact", "Do not collect telephone numbers on Contact details.", { ownerCandidates: [field("phone")] });
add(waepa, "no-business-address", "Contact", "Do not show a business address section on Contact details.", { ruleKeys: ["rule-contact-business-address-same-as-home"] });
add(waepa, "membership-pdf-suppression", "Membership", "Suppress Membership questions/statements on PDF; retain their XML output.", { modes: ["PDF", "XML"], deferred: true });
add(waepa, "referral-pdf-suppression", "Contact", "Suppress 'How did you hear about WAEPA?' on PDF; retain its XML output.", { modes: ["PDF", "XML"], deferred: true });
