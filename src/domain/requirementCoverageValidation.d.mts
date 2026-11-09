export type CoverageAssignment = {
  configuration: string;
  product: string;
  applicants: Array<"member" | "spouse" | "child">;
  value: number | boolean | string | string[];
  source: string;
  minimumAgeYears?: number;
  maximumAgeYears?: number;
};
export function parseCoverageAssignments(document: unknown, definitions: Array<{ id: string; status: string; type: string; options?: string[] }>, siteKey: string, products?: Record<string, string[]>): CoverageAssignment[];
