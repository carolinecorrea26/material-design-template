import CoverageNeedsCalculator from "../../components/coverage/CoverageNeedsCalculator";
import { getSurfaceFields, getFieldSurface } from "../../config/fields/storedSurfaces";
export default function ConfiguredCoverageNeedsCalculator() {
  return <CoverageNeedsCalculator fields={getSurfaceFields("needsCalculator")} bindings={getFieldSurface("needsCalculator").mapping.fieldToKey} />;
}
