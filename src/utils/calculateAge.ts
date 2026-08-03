/**
 * Calculate age from an ISO date string (YYYY-MM-DD).
 * Returns null if the string is not in the expected format.
 */
export function calculateAge(birthdayStr: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdayStr)) return null;
  const [y, m, d] = birthdayStr.split("-").map(Number);
  const birth = new Date(y, m - 1, d);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
