import { useState } from "react";
import { Alert, Box, Button } from "@mui/material";
import FormRoutePage from "../app/RoutePage";
import ProcessingStatusPage from "../components/feedback/ProcessingStatusPage";
import { getContent } from "../content";

export default function DocuSign() {
  const [complete, setComplete] = useState(false);
  const content = getContent().statusMessages.docusign;
  return (
    <FormRoutePage
      pageId="docusign"
      formMaxWidth={1200}
      hideActions={!complete}
      validate={() =>
        complete ? undefined : "Complete the simulated signing step before continuing."
      }
    >
      <Alert severity="info">
        Prototype preview: DocuSign is not connected. Use the simulation below to
        preview completion; no documents will be signed.
      </Alert>
      <ProcessingStatusPage
        operation="signature"
        phase={complete ? "complete" : "pending"}
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
      {!complete && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Button type="button" variant="outlined" onClick={() => setComplete(true)}>
            Simulate signing completion
          </Button>
        </Box>
      )}
    </FormRoutePage>
  );
}
