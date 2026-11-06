import dayjs from "dayjs";
import { applicantAge } from "./applicantAge";
import type { ApplicantFacts } from "../domain/coverageRequirements";
import type { CoverageApplicantId } from "../domain/coverage";

export function numericFact(value: unknown): number | undefined {
  if (typeof value !== "number" && typeof value !== "string") return undefined;
  if (String(value).trim() === "") return undefined;
  const number = Number(String(value).replace(/[$,]/g, ""));
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}
const booleanFact = (value: unknown) => value === true || value === "yes" ? true : value === false || value === "no" ? false : undefined;

/** The single adapter used by selection, validation and downstream routing. */
export function applicationApplicantFacts(values: Record<string, unknown>, applicant: CoverageApplicantId, today = dayjs(), productKey?: string): ApplicantFacts {
  const prefix = applicant === "member" ? "" : `${applicant}-`;
  const rawBirth = values[`${prefix}birth-date`];
  const age = typeof rawBirth === "string" ? applicantAge(rawBirth, today.format("YYYY-MM-DD")) : null;
  return {
    associationKey: typeof (values.association ?? values.membership) === "string" ? String(values.association ?? values.membership) : undefined,
    ageYears: age?.ageYears,
    ageDays: age?.ageDays,
    honorablyDischargedServiceMember: booleanFact(values[`${prefix}honorably-discharged-service-member`]),
    fullTimeStudent: booleanFact(values[`${prefix}full-time-student`]),
    workHoursPerWeek: numericFact(values[`${prefix}hours-worked-per-week`]),
    associationMember: booleanFact(values[`${prefix}membership`]),
    activelyAtWork: booleanFact(values[`${prefix}actively-at-work`]),
    activeMilitary: booleanFact(values[`${prefix}active-military`] ?? (productKey ? values[`prototype-fact:${productKey}:${applicant}:activeMilitary`] : undefined)),
    averageMonthlyIncome: numericFact(values[`${prefix}average-monthly-income`]),
    selfEmployed: booleanFact(values[`${prefix}is-self-employed`]),
    yearsSelfEmployed: numericFact(values[`${prefix}years-self-employed`]),
    firmMemberCount: numericFact(values[`${prefix}firm-member-count`]),
  };
}

/** A child plan covers the listed children; every listed child must qualify. */
export function applicationApplicantFactSet(values: Record<string, unknown>, applicant: CoverageApplicantId, productKey?: string): ApplicantFacts[] {
  if (applicant !== "child" || !Array.isArray(values.children) || values.children.length === 0) return [applicationApplicantFacts(values, applicant, dayjs(), productKey)];
  return values.children.map((item: Record<string, unknown>) => applicationApplicantFacts({
    association: values.association ?? values.membership,
    ...item,
  }, "child"));
}
