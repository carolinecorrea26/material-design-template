import type { RuleDefinition } from "./rules";

export type RuleOrganization = {
  path: string[]; familyKey: string;
  effect: "eligibility" | "routing" | "calculation" | "validation" | "presentation" | "persistence" | "reference";
  ordering: "review-only";
};
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Review hierarchy describes responsibility; execution stays with referenced
 * fields, conditions, typed policies/services and their scoped assignments. */
export function organizeRule(rule: Pick<RuleDefinition, "id" | "area" | "execution" | "ref">): RuleOrganization {
  const area = slug(rule.area);
  let family = area, effect: RuleOrganization["effect"] = "presentation";
  if (rule.area === "Patterns" || rule.id.startsWith("rule-mcr.") || rule.ref.startsWith("canonical:")) { family = "source-models"; effect = "reference"; }
  else if (rule.area === "Membership") { family = /active-duty/.test(rule.id) ? "participation-gates" : "qualifications-and-follow-ups"; effect = "eligibility"; }
  else if (["Eligibility", "Applicant display"].includes(rule.area)) { family = "applicant-participation"; effect = "eligibility"; }
  else if (rule.execution || rule.area === "Application flow") { family = "page-participation"; effect = "routing"; }
  else if (rule.area === "Rates") { family = "rating-and-billing"; effect = "calculation"; }
  else if (rule.area === "Persistence") { family = "application-recovery"; effect = "persistence"; }
  else if (rule.area === "Validation") { family = "advancement-gates"; effect = "validation"; }
  else if (["Review", "Read & Sign"].includes(rule.area)) family = "consent-and-disclosures";
  else if (["Coverage", "Coverage cart", "Home / Quote tool"].includes(rule.area)) family = /policy-owners/.test(rule.id) ? "product-policies" : "selection-and-quote";
  return { path: ["application", area, family], familyKey: `rules.${area}.${family}`, effect, ordering: "review-only" };
}

export function ruleDependencyFindings(rules: Array<{ key: string; definition: Pick<RuleDefinition, "dependsOn"> }>): string[] {
  const byKey = new Map(rules.map(rule => [rule.key, rule]));
  const findings: string[] = [];
  if (byKey.size !== rules.length) findings.push("Duplicate rule identity");
  const visited = new Set<string>(), active = new Set<string>();
  function visit(key: string) {
    if (active.has(key)) { findings.push(`Cyclic rule dependency: ${key}`); return; }
    if (visited.has(key)) return;
    active.add(key);
    for (const dependency of byKey.get(key)?.definition.dependsOn ?? []) {
      if (!byKey.has(dependency)) findings.push(`Missing dependency: ${key} -> ${dependency}`);
      else visit(dependency);
    }
    active.delete(key); visited.add(key);
  }
  for (const rule of rules) visit(rule.key);
  return [...new Set(findings)];
}
