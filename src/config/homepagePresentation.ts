import homeContent from "../../requirements/global/content/home.json";
import presentation from '../../requirements/global/configurations/presentation.json';
import type { ClientFeatures } from "./clients/types";

/** Client setting; omitted values use regular illustrations for every variant. */
export function getApplyingWorksPresentation(features?: ClientFeatures): "animated" | "static" {
  const configured = features?.applyingStepsPresentation ?? presentation.configurations.find(configuration => configuration.id === 'applying-steps-presentation')!.default;
  return configured === 'animated' ? 'animated' : 'static';
}
export const applyingWorksImages = homeContent["home.applying-illustrations"] as Array<{ image: "apply" | "health" | "decision"; alt: string }>;

/** Multi-page layouts never render the single-page decorative scene. */
export function showSinglePageArtwork(template: "single" | "multi", features?: ClientFeatures): boolean {
  return template === "single" && features?.singlePageArtwork === "clouds-cat-umbrella";
}
