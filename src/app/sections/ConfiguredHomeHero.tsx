import type { ComponentProps } from "react";
import HomeHero from "../../components/home/HomeHero";
import { quoteEligibilityPresentation } from "./ConfiguredEligibilityFields";
import { getPagePath } from "../../config/pages";
import { resolveTemplate } from "../../content";
export default function ConfiguredHomeHero(props: ComponentProps<typeof HomeHero>) {
  return <HomeHero {...props} eligibilityPresentation={quoteEligibilityPresentation()} paths={{ membership: getPagePath("membership"), resume: getPagePath("resume") }} description={resolveTemplate(props.content.home.hero.description, props.activeAssociationId)} />;
}
