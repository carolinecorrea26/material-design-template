import { useState } from "react";
import MembershipHelp from "../../components/membership/MembershipHelp";
import QuoteCalculator from "../workflows/QuoteCalculator";
import { coverageOptionsAvailableHelpItem, howApplyingWorksHelpItem } from "../../content/helpContent";
export default function ConfiguredMembershipHelp() {
  const [open, setOpen] = useState(false);
  return <><MembershipHelp drawerHelpItems={[coverageOptionsAvailableHelpItem, howApplyingWorksHelpItem]} onEstimate={() => setOpen(true)} />
    <QuoteCalculator open={open} onClose={() => setOpen(false)} collectEligibility /></>;
}
