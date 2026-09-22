import FormRoutePage from "../app/RoutePage";
import ProcessingStatusPage from "../components/feedback/ProcessingStatusPage";
import { getContent } from "../content";

export default function DocuSign() {
  const content = getContent().statusMessages.docusign;
  return (
    <FormRoutePage pageId="docusign" formMaxWidth={1200}>
      <ProcessingStatusPage
        heading={content.heading}
        body={content.body}
        mark={
          <img
            src="/docusign.png"
            alt="DocuSign"
            style={{ height: "1.4rem", width: "auto" }}
          />
        }
      />
    </FormRoutePage>
  );
}
