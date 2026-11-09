import { useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  Stack,
} from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import { useNavigate } from "react-router-dom";
import FormRoutePage from "../app/RoutePage";
import { useApplicationForm } from "../app/ApplicationFormContext";
import { getPagePath } from "../config/pages";
import {
  getApplicantEmail,
  getApplicantName,
} from "../utils/applicantIdentity";
import DetailsTable from "../components/layout/DetailsTable";
import { requirementText } from "../domain/requirementContent";
import { requirementConfigurationValue } from "../domain/requirementConfiguration";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function AdvisorSendConfirmation() {
  const { values } = useApplicationForm();
  const navigate = useNavigate();

  const applicantName = getApplicantName(values) || "\u2014";
  const applicantEmail = getApplicantEmail(values) || "\u2014";

  const { sentDate, purgeDate } = useMemo(() => {
    const now = new Date();
    const purge = new Date(now);
    purge.setDate(purge.getDate() + Number(requirementConfigurationValue('signature-confirmation-retention-days')));
    return { sentDate: now, purgeDate: purge };
  }, []);

  const details = [
    { label: requirementText('confirmation.advisor.applicant-name'), value: applicantName },
    { label: requirementText('confirmation.advisor.applicant-email'), value: applicantEmail },
    { label: requirementText('confirmation.advisor.sent'), value: formatDateTime(sentDate) },
    { label: requirementText('confirmation.advisor.deletion'), value: formatDateTime(purgeDate) },
  ];

  return (
    <FormRoutePage
      pageId="advisor-send-confirmation"
      hideActions
    >
      {() => (
        <Stack spacing={3}>
          <Alert severity="success" icon={<SendRoundedIcon fontSize="small" />}>
            {requirementText('confirmation.advisor.message')}
          </Alert>

          <DetailsTable rows={details} />

          <Box>
            <Button
              variant="contained"
              startIcon={<AddCircleOutlineRoundedIcon />}
              onClick={() => navigate(getPagePath("advisor-login"))}
            >
              {requirementText('confirmation.advisor.start')}
            </Button>
          </Box>
        </Stack>
      )}
    </FormRoutePage>
  );
}
