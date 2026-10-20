/** Calendar age, evaluated in UTC from explicit ISO dates, unaffected by browser timezone. */
export function applicantAge(birthDate: string, applicationDate: string) {
  const date = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s ? new Date(s) : null;
  const birth = date(birthDate), application = date(applicationDate);
  if (!birth || !application || birth > application) return null;
  const ageDays = Math.floor((application.getTime() - birth.getTime()) / 86400000);
  // Feb 29 birthdays use March 1 in non-leap years provisionally.
  const birthdayPassed = application.getUTCMonth() > birth.getUTCMonth() || application.getUTCMonth() === birth.getUTCMonth() && application.getUTCDate() >= birth.getUTCDate();
  return { ageDays, ageYears: application.getUTCFullYear() - birth.getUTCFullYear() - Number(!birthdayPassed) };
}
