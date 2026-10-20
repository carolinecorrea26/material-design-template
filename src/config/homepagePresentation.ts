import type { ClientFeatures } from "./clients/types";

/** Client setting; omitted values use regular illustrations for every variant. */
export function getApplyingWorksPresentation(features?: ClientFeatures): "animated" | "static" {
  return features?.applyingStepsPresentation === "animated" ? "animated" : "static";
}
export const applyingWorksImages = [
  { image: "apply" as const, alt: "Apply online" },
  { image: "health" as const, alt: "Answer health questions" },
  { image: "decision" as const, alt: "Receive your decision" },
];

/** Multi-page layouts never render the single-page decorative scene. */
export function showSinglePageArtwork(template: "single" | "multi", features?: ClientFeatures): boolean {
  return template === "single" && features?.singlePageArtwork === "clouds-cat-umbrella";
}
