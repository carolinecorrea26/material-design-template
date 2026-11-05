import type { ComponentProps } from "react";
import HomeCoverageSection from "../../components/home/HomeCoverageSection";
import { getActiveClient } from "../../config/client/getActiveClient";
import { getActiveClientCoverages } from "../../config/client/getActiveClientCoverages";
import { activeFeaturedProduct } from "../../config/client/coverageProductScope";
import { getActiveSite } from "../../data";
export default function ConfiguredHomeCoverageSection(props: Omit<ComponentProps<typeof HomeCoverageSection>, "coverageOptions">) {
  return <HomeCoverageSection {...props} coverageOptions={{ coverages: getActiveClientCoverages(), coverageConfig: getActiveClient().coverages, featuredProduct: activeFeaturedProduct(getActiveSite().id) }} />;
}
