export type MembershipLookupResult = {
  mode: "mock"; provider: "ama-mock"; status: "matched" | "not-found";
  identity: { firstName: string; lastName: string; birthDate: string };
  medicalEducationNumber: string | null; isMember: boolean | null;
};
export function membershipLookupIdentity(values: Record<string, unknown>) {
  return { firstName: String(values["first-name"] ?? "").trim(), lastName: String(values["last-name"] ?? "").trim(), birthDate: String(values["birth-date"] ?? "").trim() };
}
export function currentMembershipLookup(values: Record<string, unknown>): MembershipLookupResult | undefined {
  let result: MembershipLookupResult | undefined;
  try { result = (typeof values.membershipLookupResult === "string" ? JSON.parse(values.membershipLookupResult) : values.membershipLookupResult) as MembershipLookupResult | undefined; } catch { return; }
  if (!result || result.mode !== "mock" || result.provider !== "ama-mock" || !["matched", "not-found"].includes(result.status) || !result.identity) return;
  if (typeof result.identity !== "object" || Object.values(result.identity).some(value => typeof value !== "string")) return;
  if (result.status === "not-found" && (result.medicalEducationNumber !== null || result.isMember !== false)) return;
  const identity = membershipLookupIdentity(values);
  if (Object.entries(identity).some(([key, value]) => value.toLowerCase() !== result.identity[key as keyof typeof identity]?.toLowerCase())) return;
  if (result.status === "matched" && (typeof result.medicalEducationNumber !== "string" || !/^MOCK-ME-\d{10}$/.test(result.medicalEducationNumber) || typeof result.isMember !== "boolean")) return;
  return result;
}
