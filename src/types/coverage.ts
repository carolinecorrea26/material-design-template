import { coverages } from "../config/coverages";

export type Coverage = (typeof coverages)[number];
export type CoverageId = Coverage["id"];
