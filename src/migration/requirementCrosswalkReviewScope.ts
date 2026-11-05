import type { SourceCell } from "./mcr";

/** Exact current-Site and common-instruction boundaries. Source applicability
 * is independent of whether the captured Review policy implements a clause. */
export function readSignSourceScopes(cells: readonly SourceCell[], businessSites: readonly string[]) {
  const source = new Map(cells.filter(cell => cell.sheet === "Read & Sign").map(cell => [cell.cell, cell]));
  const result = new Map<string, { siteKeys: string[]; modes: string[]; evidence: string[]; basis: string }>();
  function add(coordinates: string[], sites: readonly string[], evidence: string[], guard: string) {
    for (const coordinate of coordinates) if (source.has(coordinate)) result.set(`Read & Sign!${coordinate}`, {
      siteKeys: [...sites], modes: ["application"], evidence: evidence.map(cell => `Read & Sign!${cell}`),
      basis: `${guard} Applicability is source scope only; exact product/applicant/jurisdiction predicates and captured implementation still require separate review.`,
    });
  }
  for (const [row, label, site] of [[80, "AMA", "ama"], [86, "WAEPA", "waepa"], [97, "AMA", "ama"], [111, "ABE - only", "abe"], [117, "AMA (No Title)", "ama"]] as const) {
    const actual = String(source.get(`B${row}`)?.value ?? "").trim();
    if (!actual.startsWith(label) || row !== 111 && actual !== label) throw new Error(`Read & Sign Site label changed: B${row}/${site}`);
    add([`C${row}`], [site], [`B${row}`], `Dedicated current Site label B${row}=${JSON.stringify(actual)}.`);
  }
  if (String(source.get("B114")?.value) !== "WAEPAUPGRADE/WAEPAGI/WAEPAChildGI") throw new Error("Read & Sign GI boundary changed: B114");
  add(["C114"], ["waepa-gi"], ["B114", "B92"], "Only the explicitly listed WAEPA GI variant is current; Upgrade and Child GI remain outside approved scope.");
  add(["B3", "B4"], businessSites, ["A2"], "Common underwriting-flag definition; product/applicant guard retained in the source text.");
  add(["B6", "B7"], businessSites.filter(site => site !== "waepa-gi"), ["B6", "B24"], "Common initial statement, with the explicit WAEPA GI exclusion at B24; adjacent variants do not change main Sites.");
  add(["B35", "B36"], businessSites, ["B35", "B37", "B38", "B39"], "Common underwritten-only statement; its named graduate/student/whole-life exceptions are outside current Site scope.");
  add(["B40", "B41", "B43", "C43"], businessSites, ["B40", "B43"], "Common underwritten-only authorization with a separate Minnesota-residency variant; preserve the IMPORTANT NOTICE link instructions.");
  add(["B48", "C48", "B90", "C90"], businessSites, ["B48", "B90"], "Virginia wording applies only to QD requests in Virginia; other requests retain their applicable standard or Site wording.");
  add(Array.from({ length: 22 }, (_, index) => index + 53).flatMap(row => [`B${row}`, `C${row}`]), businessSites, ["B53", "B54", "B69"], "Common jurisdiction fraud-notice matrix; NY life-only suppression and the current CSEA override remain explicit source exceptions.");
  add(["B75", "C75"], ["waepa"], ["B75"], "The source names WAEPA for the notice following fraud and preceding consent; no GI or other variant is inferred.");
  add(["B76", "C76"], businessSites, ["B76"], "Vermont jurisdiction fraud notice; residency predicate retained.");
  add(["B77", "B78", "B92", "B93"], businessSites, ["B77", "B79", "B92", "B94"], "Common underwritten/non-underwritten consent alternatives with the explicitly listed Site exceptions retained; a common instruction does not supersede dedicated wording.");
  add(["B115", "B116"], businessSites, ["B115", "B116", "B117"], "Supplemental Health attestation, above the signature at the specified type size; AMA's dedicated no-title variant remains separate.");
  add(["B118", "B119"], businessSites, ["B118"], "Connecticut notice only for underwritten coverage, above the member signature.");
  add(["B24", "C24"], ["waepa-gi"], ["B24"], "Dedicated current WAEPA GI certification notice; user retains existing signature consent.");
  add(["B122", "C122"], ["csea"], ["B122"], "Current CSEA single-page payroll source; DI applicability approved, standalone AD&D remains flagged.");
  add(["B120", "C120"], ["csea"], ["B120"], "California CSEA payroll authorization; preserve state/payment applicability for owner review.");
  add(["B125", "C125", ...Array.from({ length: 14 }, (_, index) => `C${126 + index}`)], ["abe"], ["B125", "B127", "B128"], "ABE member post-signature notices with per-product new/change instructions. Accepted ABE behavior takes precedence over older conflicting presentation instructions.");
  add(["B142", "B144", "B146", "B148", "B150", "B152", "B154", "B156", "B158", "B160", "B162"], businessSites, ["A142", "A156"], "Common Important Notice and New Mexico protected-person addendum; the named NYSBA exception is outside current Site scope.");
  add(["B187"], businessSites, ["A186"], "Virginia Important Notice for Virginia residents; NYSBA is explicitly excepted and outside current Site scope.");
  return result;
}
