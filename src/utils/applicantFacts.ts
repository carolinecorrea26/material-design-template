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
export function applicationApplicantFacts(values: Record<string, unknown>, applicant: CoverageApplicantId, today = dayjs()): ApplicantFacts {
  const prefix = applicant === "member" ? "" : `${applicant}-`;
  const rawBirth = values[`${prefix}birth-date`];
  const age = typeof rawBirth === "string" ? applicantAge(rawBirth, today.format("YYYY-MM-DD")) : null;
  return {
    ageYears: age?.ageYears,
    ageDays: age?.ageDays,
    unmarried: booleanFact(values[`${prefix}unmarried`]),
    fullTimeStudent: booleanFact(values[`${prefix}full-time-student`]),
    workHoursPerWeek: numericFact(values[`${prefix}hours-worked-per-week`]),
    averageMonthlyIncome: numericFact(values[`${prefix}average-monthly-income`]),
    selfEmployed: booleanFact(values[`${prefix}is-self-employed`]),
    yearsSelfEmployed: numericFact(values[`${prefix}years-self-employed`]),
  };
}

/** A child plan covers the listed children; every listed child must qualify. */
export function applicationApplicantFactSet(values: Record<string, unknown>, applicant: CoverageApplicantId): ApplicantFacts[] {
  if (applicant !== "child" || !Array.isArray(values.children) || values.children.length === 0) return [applicationApplicantFacts(values, applicant)];
  return values.children.map((item: Record<string, unknown>) => applicationApplicantFacts({
    "child-birth-date": item.birthDate,
    "child-unmarried": item.unmarried,
    "child-full-time-student": item.fullTimeStudent,
  }, "child"));
}
