import { requirementText } from "../../domain/requirementContent";
import AppDrawer from '../layout/AppDrawer';
import AppSnackbar from '../feedback/AppSnackbar';
import CoverageCart from "../../app/sections/ConfiguredCoverageCart";

type Props = {
  summaryOpen: boolean;
  onCloseSummary: () => void;
  addedOpen: boolean;
  onCloseAdded: () => void;
};

/** First addition opens the cart; later additions use the compact Added feedback. */
export default function CoverageSelectionFeedback({ summaryOpen, onCloseSummary, addedOpen, onCloseAdded }: Props) {
  return <>
    <AppDrawer open={summaryOpen} onClose={onCloseSummary} swipeable ariaLabel={requirementText("coverage.coverage-cart.coverage-added")}>
      <CoverageCart variant="drawer" source="coverage-page" onClose={onCloseSummary} />
    </AppDrawer>
    <AppSnackbar open={addedOpen} onClose={onCloseAdded} message={requirementText("coverage.coverage-selection-feedback.added")} severity="success" />
  </>;
}
