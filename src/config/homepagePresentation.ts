import homeContent from "../../requirements/global/content/home.json";
import presentation from '../../requirements/global/configurations/presentation.json';
import type { RatePresentationPolicy } from "../domain/ratePresentation";
import type { HomePageVariant } from "./clients/types";
import type { ClientFeatures } from "./clients/types";
import homePage from '../../requirements/parked/home.json';
import homeSectionOrder from '../../requirements/mappings/page-sections/home.json';
import { requirementPageSections } from '../domain/requirementPagePresentation.mjs';
import type { PrototypeLibrary } from '../domain/prototypeLibrary';
import type { RequirementPage } from '../domain/requirementCatalog.mjs';

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

/** Quote is the default only when the effective Site can provide it. */
export function resolveHomePresentation(requested: HomePageVariant, policy?: Pick<RatePresentationPolicy, 'praseConfigured' | 'quoteToolEnabled'>): HomePageVariant {
  return (requested === 'default' || requested === 'quoteFirst') && (!policy?.praseConfigured || !policy.quoteToolEnabled) ? 'hero-image' : requested;
}

/** Installed consumers use compiled sections; standalone previews use the same authored projection. */
export function resolveHomePageSections(template: 'single' | 'multi', variant: HomePageVariant, library?: PrototypeLibrary | null) {
  const sections = library
    ? library.site.configuration.pages.find(page => page.key === 'home')?.sections.map(section => section.definition.value)
    : requirementPageSections(homePage as RequirementPage, { home: homeSectionOrder.sections }).map(([, section]) => section);
  if (!sections?.length || sections.some(section => !section.display || !section.components?.length)) throw new Error('Missing fresh-start Home section presentation');
  return sections.filter(section => section.display!.templates.includes(template) && !section.display!.excludeVariants?.includes(variant));
}
