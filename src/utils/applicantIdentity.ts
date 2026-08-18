import type { ApplicationFormValues } from "../app/ApplicationFormContext";

function getStringValue(
  values: ApplicationFormValues,
  keys: readonly string[],
): string {
  for (const key of keys) {
    const raw = values[key];
    if (typeof raw === "string" && raw.trim()) {
      return raw.trim();
    }
  }

  return "";
}

export function getApplicantName(values: ApplicationFormValues): string {
  const firstName = getStringValue(values, [
    "first-name",
    "member-first-name",
    "applicant-first-name",
  ]);
  const lastName = getStringValue(values, [
    "last-name",
    "member-last-name",
    "applicant-last-name",
  ]);

  return [firstName, lastName].filter(Boolean).join(" ").trim();
}

export function getApplicantEmail(values: ApplicationFormValues): string {
  return getStringValue(values, [
    "email",
    "applicant-email",
    "email-address",
    "applicant-email-address",
  ]);
}
