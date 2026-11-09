import { requirementText } from "../domain/requirementContent";
import HealthInformationHelp from "../components/health/HealthInformationHelp";
import QuickDecisionIcon from "../components/coverage/QuickDecisionIcon";
import FormRoutePage from "../app/RoutePage";
import ProcessingStatusPage from "../components/feedback/ProcessingStatusPage";
import { getContent } from "../content";

export default function HealthQd({ loadingTimeoutMs }: { loadingTimeoutMs?: number | null } = {}) {
  const content = getContent().statusMessages.healthQd;
  return (
    <FormRoutePage pageId="health-qd" help={<HealthInformationHelp />} hideActions>
      {() => (
        <ProcessingStatusPage
          operation="decision"
          timeoutMs={loadingTimeoutMs}
          heading={
            <>
              {content.heading}
              <sup style={{ fontSize: "0.6em" }}>{requirementText("application.ui.sm")}</sup>
            </>
          }
          body={
            <>
              {content.bodyBeforeMark} {content.heading}
              <sup style={{ fontSize: "0.6em" }}>{requirementText("application.ui.sm")}</sup>
              {content.bodyAfterMark}
            </>
          }
          mark={<QuickDecisionIcon color="success" sx={{ fontSize: "1.4rem" }} />}
        />
      )}
    </FormRoutePage>
  );
}
