/** Internal Library terminology; applicant-facing copy and stored keys stay intact. */
export const libraryApplicantLabels = {
  member: "Member",
  spouse: "Spouse",
  child: "Child",
} as const;

type LibraryApplicant = keyof typeof libraryApplicantLabels;
export const libraryApplicantAliases: Record<string, LibraryApplicant> = {
  member: "member", self: "member", you: "member",
  spouse: "spouse", "your spouse": "spouse",
  child: "child", children: "child", "child(ren)": "child",
  "your child": "child", "your children": "child", "your child(ren)": "child",
};

export function libraryApplicantLabel(value: string): string | undefined {
  const key = libraryApplicantAliases[value.trim().toLowerCase()];
  return key ? libraryApplicantLabels[key] : undefined;
}

const aliases = Object.keys(libraryApplicantAliases).sort((a, b) => b.length - a.length)
  .map(alias => alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
const applicantTerms = new RegExp(`(?<![\\w-])(?:${aliases.join("|")})(?![\\w-])`, "gi");

/** Normalize descriptive headings without rewriting field IDs embedded in them. */
export function libraryApplicantText(value: string): string {
  return value.replace(applicantTerms, term => libraryApplicantLabel(term)!);
}
