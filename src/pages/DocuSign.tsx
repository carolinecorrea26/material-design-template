import { Alert, Box, Stack, Typography } from "@mui/material";
import { useMemo } from "react";
import ApplicationDocumentPreview from "../components/docusign/ApplicationDocumentPreview";
import SignatureCompletionSection from "../components/docusign/SignatureCompletionSection";
import FormRoutePage from "../components/form/FormRoutePage";
import { useApplicationForm } from "../state/ApplicationFormContext";

export default function DocuSign() {
  const { values, setPageValues } = useApplicationForm();

  const currentDate = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      }).format(new Date()),
    [],
  );

  const signatureName =
    typeof values["signature-full-name"] === "string"
      ? values["signature-full-name"]
      : "";
  const signedDate =
    typeof values["signature-signed-date"] === "string"
      ? values["signature-signed-date"]
      : signatureName.trim()
        ? currentDate
        : "";

  function handleSignatureNameChange(name: string) {
    setPageValues({
      "signature-full-name": name,
      "signature-signed-date": name.trim() ? currentDate : "",
    });
  }

  return (
    <FormRoutePage
      pageId="docusign"
      title="Review and sign your application."
      formMaxWidth={1200}
      validate={() =>
        signatureName.trim()
          ? undefined
          : "Type your full name to complete the signature."
      }
    >
      <Stack spacing={2.5}>
        <Alert severity="info">
          This is a mock review-and-sign step. The preview shows the saved
          application summary only and does not include health or payment data.
        </Alert>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 340px" },
            alignItems: "start",
          }}
        >
          <Stack spacing={1.5}>
            <Typography variant="h6">Application Document</Typography>
            <ApplicationDocumentPreview
              values={values}
              signatureName={signatureName}
              signedDate={signedDate}
              currentDate={currentDate}
            />
          </Stack>

          <SignatureCompletionSection
            signatureName={signatureName}
            signedDate={signedDate}
            onSignatureNameChange={handleSignatureNameChange}
          />
        </Box>
      </Stack>
    </FormRoutePage>
  );
}
