import { useEffect, useState, type FormEvent } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import MailLockRounded from "@mui/icons-material/MailLockRounded";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader";
import PageShell from "../components/layout/PageShell";
import FormShell from "../components/layout/FormShell";
import { getPageSubhead, getPageTitle, getPagePath } from "../config/pages";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
import { sendResumeMagicLinkMockEmail } from "../utils/mockEmail";
import useCountdown from "../hooks/useCountdown";
import ExpiringCodeAlert from "../components/feedback/ExpiringCodeAlert";
import ResendCountdownRow from "../components/feedback/ResendCountdownRow";
import { useApplicationSession } from "../app/ApplicationSessionContext";

export default function Resume() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fields = getClientPageFields("resume");
  const { setAdvisorApplicantFlow } = useApplicationSession();

  // When flow=advisor, skip the email-entry step and go directly to Review
  // in advisor-applicant mode. The review page then adjusts edit behavior.
  const isAdvisorFlow = searchParams.get("flow") === "advisor";

  useEffect(() => {
    if (!isAdvisorFlow) {
      setAdvisorApplicantFlow(false);
    }
  }, [isAdvisorFlow, setAdvisorApplicantFlow]);

  const emailField = fields.find((field) => field.id === "resume-email");

  const [emailAddress, setEmailAddress] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { secondsLeft, reset: resetCountdown, restart } = useCountdown(600);

  function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmailAddress = emailAddress.trim();

    if (!trimmedEmailAddress) {
      setEmailError("Enter your email address.");
      return;
    }

    setEmailError(null);
    setIsEmailSending(true);

    window.setTimeout(() => {
      void sendResumeMagicLinkMockEmail(trimmedEmailAddress);

      setIsEmailSending(false);

      if (isAdvisorFlow) {
        // Advisor-flow resumes skip the verification step and go straight to
        // review in advisor-applicant mode.
        setAdvisorApplicantFlow(true);
        navigate(`${getPagePath("review")}?flow=advisor`);
        return;
      }

      restart();
      setEmailSent(true);
    }, 1500);
  }

  function handleResendLink() {
    setEmailSent(false);
    resetCountdown();
  }

  return (
    <Box sx={{ flex: 1, px: { xs: 2, sm: 3 }, py: { xs: 4, sm: 6 } }}>
      <PageShell title={getPageTitle("resume")} maxWidth={600} noTitle>
        <FormShell
          sx={{
            px: { xs: 2, sm: 4 },
            py: 6,
          }}
        >
          <PageHeader
            title={getPageTitle("resume")}
            subhead={getPageSubhead("resume")}
            onBack={() => navigate(-1)}
          />

          {isEmailSending ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                py: 4,
              }}
            >
              <Stack spacing={2} alignItems="center">
                <CircularProgress size={40} thickness={4} />

                <Typography variant="body2" color="text.secondary">
                  Sending secure link…
                </Typography>
              </Stack>
            </Box>
          ) : emailSent ? (
            <Stack spacing={2} sx={{ py: 1 }}>
              <ExpiringCodeAlert
                secondsLeft={secondsLeft}
                kind="link"
                onResend={handleResendLink}
                activeIcon={<MailLockRounded />}
              >
                  A secure link has been sent to{" "}
                  <Box component="span" sx={{ fontWeight: 700 }}>
                    {emailAddress}
                  </Box>
                  . Open your email and click the link to continue.
              </ExpiringCodeAlert>

              <ResendCountdownRow
                secondsLeft={secondsLeft}
                kind="link"
                onResend={handleResendLink}
              />
            </Stack>
          ) : (
            <Box
              component="form"
              onSubmit={handleEmailSubmit}
              noValidate
              sx={{ py: 1 }}
            >
              <TextField
                fullWidth
                label={emailField?.label}
                type="email"
                required={emailField?.required}
                value={emailAddress}
                onChange={(event) => {
                  setEmailAddress(event.target.value);

                  if (emailError) {
                    setEmailError(null);
                  }
                }}
                error={Boolean(emailError)}
                helperText={emailError ?? emailField?.helperText}
                sx={{ mb: 3 }}
              />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                >
                  Next
                </Button>
              </Box>
            </Box>
          )}
        </FormShell>
      </PageShell>
    </Box>
  );
}
