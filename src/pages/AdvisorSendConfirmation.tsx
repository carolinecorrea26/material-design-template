import { Alert, Stack, Typography } from "@mui/material";
import FormPage from "../components/page/Page";
import { useApplicationForm } from "../app/ApplicationFormContext";

export default function AdvisorSendConfirmation() {
  const { values } = useApplicationForm();

  const applicantEmail =
    String(values["applicant-email"] ?? values["email"] ?? "").trim() || "—";

  return (
    <FormPage title="Application Sent Successfully!">
      <Stack spacing={2}>
        <Alert severity="success">
          An email has been sent to the applicant for signature.
        </Alert>

        <Typography variant="body1" color="text.secondary">
          The applicant will receive an email with instructions to complete
          their electronic signature.
        </Typography>

        <Typography variant="body2">
          <strong>Applicant Email:</strong> {applicantEmail}
        </Typography>
      </Stack>
    </FormPage>
  );
}
