import type { CrosswalkRow } from "./requirementCrosswalk";
import type { SourceCell } from "./mcr";

/** Explicitly reviewed labels: these variants are not the current Library Sites.
 * Never infer applicability to a base Site from a shared prefix. */
export function reviewOutsideCurrentVariants(cells: readonly SourceCell[], rows: CrosswalkRow[]) {
  const source = new Map(cells.map(cell => [`${cell.sheet}!${cell.cell}`, String(cell.value ?? "").trim()]));
  const outside = new Map<string, string>();
  function variant(sheet: string, labelCell: string, label: string, references: string[]) {
    if (source.get(`${sheet}!${labelCell}`)?.replace(/\s+/g, " ") !== label.replace(/\s+/g, " ")) throw new Error(`Reviewed variant boundary changed: ${sheet}!${labelCell}`);
    for (const cell of references) if (source.has(`${sheet}!${cell}`)) outside.set(`${sheet}!${cell}`, `${sheet}!${labelCell}=${JSON.stringify(label)}`);
  }
  const readSign = [
    [8,"ABEGI"],[9,"AChSNCGI/ASCENCGI"],[10,"ACSInitiateGI"],[11,"CAT"],[12,"AAPGI"],[13,"NYSBAGI"],[14,"AIAGI"],[15,"APTAGradAssist"],[16,"APTAGI"],[17,"AVMALIFEGI"],[18,"AVMAStudent"],[19,"AVMALifeTrustGrad"],[20,"IEEEWL"],[21,"WAEPAconf"],[22,"WAEPANH"],[23,"WAEPAuPGRADE"],
    [25,"WAEPAChild"],[26,"WAEPAConf"],[27,"WAEPANH"],[28,"RUAAGI"],[29,"IEEE (AD&D)"],[30,"ASCEGI"],[31,"AAOGI"],[32,"AVMAStudent"],[33,"AOAGI"],[34,"ACPGI"],[37,"AVMALifeTrustGrad"],[38,"AVMAStudent"],[39,"WAEPAWL"],[42,"Compass Rose Authorization"],[50,"WAEPAWL"],
    [81,"AMASI"],[82,"APWUDIGI"],[83,"ACPGI"],[84,"Compass Rose Consent (no GI)"],[85,"NYSBA"],[87,"APTAGradAssist"],[88,"AIIT (Comprehensive Accident Plan)"],[89,"AVMALifeTrustGrad"],[91,"WAEPAWL"],[96,"ACSInitiateGI"],
    [100,"AVMALifeTrustGrad"],[101,"CALSEARET (NYL-9920)"],[102,"Compass Rose Consent (GI)"],[103,"CAT GI Recent Grads"],[104,"LSBA/Gilsbar (GI)"],[105,"CAT (use this for AD only.  Use default langauge for underwritten life)"],[106,"AIAGI/APTAGI/WAEPAconf/WAEPANHN"],[107,"AAPGI/NYSBAGI"],[108,"IEEE (AD&D)"],[109,"RUAAGI"],[110,"AAOGI"],[112,"NARGI"],[113,"GEBAFIFTY"],
  ] as const;
  for (const [row, label] of readSign) variant("Read & Sign", `B${row}`, label, [`B${row}`, `C${row}`, ...(row === 38 ? ["N38"] : [])]);
  variant("Read & Sign", "B95", "ABEGI (Consent and Dividend notice)", ["B95", "C95"]);
  variant("Read & Sign", "B98", "AMA GI", ["B98", "C98"]);
  variant("Read & Sign", "B99", "ASCEGI/AChSGI/AchSNCGI/ ASCENCGI", ["B99", "C99"]);
  variant("Read & Sign", "B121", "APWU/APWUADD/NPMHU:Payroll deduction authorization (should be placed above the signature)", ["B121", "C121"]);
  variant("Legal Disclosures", "B4", "Underwriting = True and Site is Compass Rose", ["A4", "B4", "C4", "D4"]);
  variant("Read & Sign", "B46", "NYSBA/NYSSCPA\n\n\nLast sentence \"Receipt …\" should only rener if apply for TL (regular flow and QD)", ["B46", "C46"]);
  variant("Read & Sign", "A164", "READ AND SIGN OMA", cells.filter(cell => cell.sheet === "Read & Sign" && /^B(?:16[5-9]|17\d|18[0-3])$/.test(cell.cell)).map(cell => cell.cell));
  variant("Read & Sign", "B184", "APWU (check box above the signature line)", ["B184", "B185"]);
  variant("Read & Sign", "A248", "NYSBA (NY situs) Important notice.", ["A248", "A249", "B249"]);
  variant("Read & Sign", "A283", "APWU/APWUADD", ["A283"]);
  variant("Read & Sign", "A298", "APWUDIGI\nVerbaige to render on the Read and Sign page above \"Your Authorization\" (same as main site)", ["A298", "B298"]);
  variant("ElectrConsent", "A71", "CAT custom consent (NYL-12945)", ["A71"]);
  variant("ElectrConsent", "A72", "WAEPAWL - custom consent (NYL-22272)", ["A72"]);
  for (const [row, label] of [[21,"Required *\n\n\nASCEGI\n\nFiling Code\nAs amended by  GMA-L/H-TELE-SUPP"],[22,"Required ** (OMA only)"],[23,"Required *** (APTA only)"],[24,"AIA-GI\nRequired****"],[25,"LifeHelp"],[26,"ACS Initiate GI (Member Only) unless we just use standard quesiton and apply the 12 month lookback for rate purposes)"],[27,"ROA"]] as const) variant("Smoker Question", `A${row}`, label, ["A","B","C","D"].map(column => `${column}${row}`));
  variant("Standard Decision Wording ", "A6", "AAFP", ["A7","B7","A8","B8","A9","B9","A10","B10"]);
  variant("Standard Decision Wording ", "A18", "NYSBA/NYSSCPA", ["A19","B19","A20","B20"]);
  variant("Order of Products Across Site", "A39", "AMASI", ["A39","A40","A41","A42","A43"]);
  for (const row of rows) {
    const boundary = row.kind === "source-clause" && outside.get(row.sourceReferences[0]);
    if (!boundary) continue;
    row.scope = { siteKeys: [], productKeys: [], applicantKeys: [], modes: [], unresolved: [], basis: `Explicit outside-current variant boundary ${boundary}. Current Library scope does not include this variant.` };
    row.atomization = "reviewed"; row.disposition = "source-reference"; row.verificationStatus = "recorded-evidence";
    row.executionOwners = []; row.ownerCandidates = []; row.ownerResolution = "recorded-review";
    row.verificationReferences = ["src/migration/requirementCrosswalk.test.ts"];
    row.finding = "Reviewed source applicability only. Preserve this named variant as reference; do not import its wording, fields or behavior into a current base Site or an ISITRUST Association.";
  }
}
