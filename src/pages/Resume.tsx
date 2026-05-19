import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Link,
  Snackbar,
  Stack,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";
import { useLocation, useNavigate } from "react-router-dom";
import { getActiveClient } from "../client/getActiveClient";
import { getPagePath } from "../config/pages";
import {
  useApplicationForm,
  type ApplicationFormValues,
} from "../state/ApplicationFormContext";
import type { ClientId } from "../types/client";

type DeliveryMode = "text" | "voice";

const RESUME_LINK_URL =
  "http://redesignv2--material-design-template.netlify.app/resume?resumeFlow=code";

const MOCK_SAVED_APPLICATIONS: Record<string, ApplicationFormValues> = {
  "returning.user@example.com": {
    membership: "yes",
    "first-name": "Taylor",
    "last-name": "Morgan",
    "email-address": "returning.user@example.com",
    "phone-number": "(555) 555-0133",
  },
};

function getMembershipPrefill(clientId: ClientId): string {
  if (clientId === "ama") return "physician";
  if (clientId === "waepa") return "current";
  return "yes";
}

function getSavedApplicationForEmail(
  emailAddress: string,
  clientId: ClientId,
): ApplicationFormValues {
  const normalizedEmail = emailAddress.trim().toLowerCase();
  const savedValues = MOCK_SAVED_APPLICATIONS[normalizedEmail] ?? {
    "first-name": "Taylor",
    "last-name": "Morgan",
    "email-address": normalizedEmail,
    "phone-number": "(555) 555-0133",
  };

  return {
    ...savedValues,
    membership: getMembershipPrefill(clientId),
  };
}

function sendResumeLinkEmail(emailAddress: string) {
  const subject = encodeURIComponent("Resume your application");
  const body = encodeURIComponent(
    `Resume your application here: ${RESUME_LINK_URL}`,
  );

  window.location.href = `mailto:${encodeURIComponent(emailAddress)}?subject=${subject}&body=${body}`;
}

export default function Resume() {
  const location = useLocation();
  const navigate = useNavigate();
  const client = getActiveClient();
  const { setPageValues } = useApplicationForm();

  const resumeFlow = new URLSearchParams(location.search).get("resumeFlow");
  const startAtStep2 = resumeFlow === "code";

  const [activeStep] = useState(startAtStep2 ? 1 : 0);
  const [emailCompleted] = useState(startAtStep2);

  const [emailAddress, setEmailAddress] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const [phoneCode, setPhoneCode] = useState("");
  const [phoneCodeError, setPhoneCodeError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("text");
  const [snackMessage, setSnackMessage] = useState<string | null>(null);

  const mailtoTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (mailtoTimeoutRef.current !== null) {
        window.clearTimeout(mailtoTimeoutRef.current);
      }
    };
  }, []);

  function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!emailAddress.trim()) {
      setEmailError("Enter your email address.");
      return;
    }

    setEmailError(null);
    setIsEmailSending(true);

    // Simulate sending, then show success message
    window.setTimeout(() => {
      setIsEmailSending(false);
      setEmailSent(true);

      if (mailtoTimeoutRef.current !== null) {
        window.clearTimeout(mailtoTimeoutRef.current);
      }
      mailtoTimeoutRef.current = window.setTimeout(() => {
        sendResumeLinkEmail(emailAddress.trim());
      }, 8000);
    }, 1500);
  }

  function handleVerifySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!phoneCode.trim()) {
      setPhoneCodeError("Enter your phone code.");
      return;
    }

    setPhoneCodeError(null);
    setIsVerifying(true);

    window.setTimeout(() => {
      setIsVerifying(false);
      setVerifySuccess(true);

      window.setTimeout(() => {
        const savedApplication = getSavedApplicationForEmail(
          emailAddress,
          client.id,
        );

        setPageValues(savedApplication);

        navigate(getPagePath("eligibility"), {
          state: { resumeLoaded: true },
        });
      }, 2000);
    }, 700);
  }

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 650,
        mx: "auto",
        py: 4,
        px: { xs: 2, sm: 3 },
      }}
    >
      <Button
        component="a"
        href="/"
        startIcon={<ArrowBackIcon />}
        sx={{
          color: "text.secondary",
          fontSize: "0.8125rem",
          textTransform: "none",
          mb: 2,
          pl: 0,
        }}
      >
        Back to home page
      </Button>

      <Stepper activeStep={activeStep} orientation="vertical">
        {/* Step 1: Enter your email */}
        <Step completed={emailCompleted}>
          <StepLabel>
            <Typography
              sx={{
                fontWeight: activeStep === 0 ? 700 : 500,
                fontSize: "1rem",
              }}
            >
              Resume your saved application
            </Typography>
          </StepLabel>
          <StepContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter the email that you started an application with. A secure
              link will be sent to your email with next steps to resume your
              saved application.
            </Typography>
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
                <Alert severity="success">
                  A secure link has been sent to your email. Open your email and
                  click the link to continue with your saved application.
                </Alert>
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
                  label="Email address"
                  type="email"
                  required
                  value={emailAddress}
                  onChange={(event) => {
                    setEmailAddress(event.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  error={Boolean(emailError)}
                  helperText={emailError ?? undefined}
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button type="submit" variant="contained">
                    Next
                  </Button>
                </Box>
              </Box>
            )}
          </StepContent>
        </Step>

        {/* Step 2: Enter phone code */}
        <Step completed={false}>
          <StepLabel>
            <Typography
              sx={{
                fontWeight: activeStep === 1 ? 700 : 500,
                fontSize: "1rem",
              }}
            >
              Enter security code
            </Typography>
          </StepLabel>
          <StepContent>
            <Box
              component="form"
              onSubmit={handleVerifySubmit}
              noValidate
              sx={{ py: 1 }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter the security code sent to the phone number ending in{" "}
                <Box component="span" sx={{ fontWeight: 700 }}>
                  1111
                </Box>
                .
              </Typography>
              <TextField
                fullWidth
                type="text"
                required
                value={phoneCode}
                label="Security Code"
                onChange={(event) => {
                  setPhoneCode(event.target.value);
                  if (phoneCodeError) setPhoneCodeError(null);
                }}
                inputProps={{
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                }}
                error={Boolean(phoneCodeError)}
                helperText={phoneCodeError ?? undefined}
              />
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mt: 1 }}
              >
                <Button
                  variant="text"
                  size="small"
                  startIcon={<RefreshRoundedIcon />}
                  onClick={() => {
                    setSnackMessage("A new code has been sent.");
                  }}
                >
                  Resend code
                </Button>
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  underline="hover"
                  onClick={() => {
                    const nextMode = deliveryMode === "text" ? "voice" : "text";
                    setDeliveryMode(nextMode);
                    setSnackMessage(
                      nextMode === "voice"
                        ? "Code will be sent via voice call."
                        : "Code will be sent via text message.",
                    );
                  }}
                  sx={{ fontSize: "0.8125rem" }}
                >
                  {deliveryMode === "text"
                    ? "Send code with voice call"
                    : "Send code with text"}
                </Link>
              </Stack>
              <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isVerifying || verifySuccess}
                  sx={{
                    ...(verifySuccess && {
                      bgcolor: "success.main",
                      "&:hover": { bgcolor: "success.main" },
                      "&.Mui-disabled": {
                        bgcolor: "success.main",
                        color: "#fff",
                      },
                    }),
                  }}
                >
                  {verifySuccess ? (
                    <CheckIcon sx={{ color: "#fff" }} />
                  ) : isVerifying ? (
                    "Verifying..."
                  ) : (
                    "Next"
                  )}
                </Button>
              </Box>
            </Box>
          </StepContent>
        </Step>
      </Stepper>

      <Snackbar
        open={Boolean(snackMessage)}
        autoHideDuration={3000}
        onClose={() => setSnackMessage(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackMessage(null)}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
