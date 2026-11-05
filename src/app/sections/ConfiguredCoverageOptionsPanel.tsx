import type { ComponentProps } from "react";
import CoverageOptionsPanel from "../../components/coverage/CoverageOptionsPanel";
import { getActiveClient } from "../../config/client/getActiveClient";
import { getActiveClientCoverages } from "../../config/client/getActiveClientCoverages";
import { activeFeaturedProduct } from "../../config/client/coverageProductScope";
import { getActiveSite } from "../../data";
import { getContent } from "../../content";
export default function ConfiguredCoverageOptionsPanel(props: Pick<ComponentProps<typeof CoverageOptionsPanel>, "variant" | "initialCategory">) {
  return <CoverageOptionsPanel {...props} content={getContent()} coverages={getActiveClientCoverages()} coverageConfig={getActiveClient().coverages} featuredProduct={activeFeaturedProduct(getActiveSite().id)} />;
}
