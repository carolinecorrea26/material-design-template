import MembershipHelp from "../../components/membership/MembershipHelp";
import { coverageOptionsAvailableHelpItem, howApplyingWorksHelpItem } from "../../content/helpContent";
export default function ConfiguredMembershipHelp() {
  return <MembershipHelp drawerHelpItems={[coverageOptionsAvailableHelpItem, howApplyingWorksHelpItem]} />;
}
