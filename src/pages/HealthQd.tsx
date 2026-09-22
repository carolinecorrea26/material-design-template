import OfflineBoltIcon from "@mui/icons-material/OfflineBolt";
import FormRoutePage from "../app/RoutePage";
import ProcessingStatusPage from "../components/feedback/ProcessingStatusPage";
import { getContent } from "../content";

export default function HealthQd() {
  const content = getContent().statusMessages.healthQd;
  return (
    <FormRoutePage pageId="health-qd">
      {() => (
        <ProcessingStatusPage
          heading={
            <>
              {content.heading}
              <sup style={{ fontSize: "0.6em" }}>SM</sup>
            </>
          }
          body={
            <>
              {content.bodyBeforeMark} {content.heading}
              <sup style={{ fontSize: "0.6em" }}>SM</sup>
              {content.bodyAfterMark}
            </>
          }
          mark={<OfflineBoltIcon color="success" sx={{ fontSize: "1.4rem" }} />}
        />
      )}
    </FormRoutePage>
  );
}
