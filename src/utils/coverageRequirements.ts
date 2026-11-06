import type { CoverageDefinition, CoverageRequirements } from "../domain/coverage";
import { formatCoverageAmounts } from "./coverageAmounts";
const money = (value: number) => `$${value.toLocaleString("en-US")}`;
export function formatCoverageRequirements(requirements?: CoverageRequirements): string {
  if (!requirements) return "";
  const lines: string[] = [];
  for (const rule of requirements.eligibility ?? []) {
    const facts: string[] = [];
    if (rule.minimumAgeDays !== undefined) facts.push(`at least ${rule.minimumAgeDays} days old`);
    if (rule.minimumAgeYears !== undefined) facts.push(`age ${rule.minimumAgeYears} or older`);
    if (rule.maximumAgeYears !== undefined) facts.push(`through age ${rule.maximumAgeYears}`);
    if (rule.fullTimeStudentMaximumAgeYears !== undefined) facts.push(`through age ${rule.fullTimeStudentMaximumAgeYears} if a full-time student`);
    if (rule.minimumWorkHoursPerWeek !== undefined) facts.push(`works at least ${rule.minimumWorkHoursPerWeek} hours/week`);
    lines.push(`${rule.applicantType}: ${facts.join("; ")}.`);
  }
  for (const rule of requirements.dependencies ?? []) lines.push(`${rule.applicantType}: requires ${rule.requiresApplicant} ${rule.categoryId} coverage${rule.sameProduct ? " on the same product" : " (any product in this category)"}.`);
  for (const rule of requirements.maximumPlans ?? []) lines.push(`${rule.applicantType}: maximum ${rule.count} ${rule.categoryId} plan.`);
  const benefit = requirements.benefitLimit;
  if (benefit) {
    lines.push(`${benefit.applicantType}: lesser of ${benefit.incomeFraction * 100}% of average monthly income and the applicable maximum (otherwise ${money(benefit.defaultMaximum)}).`);
    for (const cap of benefit.caps) lines.push(`${cap.when.selfEmployedLessThanYears !== undefined ? `Self-employed less than ${cap.when.selfEmployedLessThanYears} year` : `Age ${cap.when.minimumAgeYears}–${cap.when.maximumAgeYears}`}: ${money(cap.maximum)} maximum${cap.requiredWaitingPeriod ? `; ${cap.requiredWaitingPeriod}-day waiting period required` : ""}${cap.requiredBenefitPeriod ? `; ${cap.requiredBenefitPeriod} benefit period required` : ""}.`);
  }
  lines.unshift(...(requirements.unresolved ?? []).map((item) => `Unresolved: ${item.description}`));
  return lines.join("\n");
}
export function formatCoverageDetails(coverage: CoverageDefinition): string {
  return [coverage.definition, coverage.description, coverage.coverageNote,
    ...Object.entries(coverage.applicantNotes ?? {}).map(([applicant, note]) => `${applicant}: ${note}`),
    ...(coverage.waitingPeriodOptions ? [`Waiting periods: ${coverage.waitingPeriodOptions.map((o) => o.label).join(", ")}`] : []),
    ...Object.entries(coverage.waitingPeriodOptionsByApplicant ?? {}).map(([applicant, options]) => `${applicant} waiting periods: ${options.map((o) => o.label).join(", ")}`),
    ...(coverage.maxBenefitPeriodOptions ? [`Benefit periods: ${coverage.maxBenefitPeriodOptions.map((o) => o.label).join(", ")}`] : []),
    ...Object.entries(coverage.maxBenefitPeriodOptionsByApplicant ?? {}).map(([applicant, options]) => `${applicant} benefit periods: ${options.map((o) => o.label).join(", ")}`),
    coverage.productWarning?.message,
    ...(coverage.productContent ?? []).map((entry) => entry.type === "section" ? `${entry.heading}: ${entry.body.join(" ")}` : entry.type === "list" ? entry.items.join("; ") : entry.text),
  ].filter(Boolean).join("\n");
}
export function formatRiders(coverage: CoverageDefinition): string {
  return (coverage.riders ?? []).map((rider) => `${rider.name} (${rider.id})\n${rider.description}\nApplicants: ${rider.applicants?.join(", ") ?? "All"}${rider.coverageAmounts ? `\n${formatCoverageAmounts({ coverageAmounts: rider.coverageAmounts })}` : ""}`).join("\n");
}
