import { useEffect, useState, type FormEvent } from "react";
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
import { sendResumeMagicLinkMockEmail } from "../utils/mockEmail";

type DeliveryMode = "text" | "voice";

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

  const [snackAlert, setSnackAlert] = useState<{
    key: number;
    deliveryMode: DeliveryMode;
  } | null>(null);

  function showPhoneCodeSuccess(nextDeliveryMode: DeliveryMode) {
    setSnackAlert({
      key: Date.now(),
      deliveryMode: nextDeliveryMode,
    });
  }

  useEffect(() => {
    if (!startAtStep2) return;

    showPhoneCodeSuccess("text");
  }, [startAtStep2]);

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
      void sendResumeMagicLinkMockEmail(emailAddress.trim());

      setIsEmailSending(false);
      setEmailSent(true);
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
        maxWidth: 800,
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
              Finish your saved application
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
                    showPhoneCodeSuccess(deliveryMode);
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
                    showPhoneCodeSuccess(nextMode);
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
        key={snackAlert?.key}
        open={Boolean(snackAlert)}
        autoHideDuration={null}
        onClose={(_, reason) => {
          if (reason === "clickaway") return;
          setSnackAlert(null);
        }}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setSnackAlert(null)} severity="success">
          Code sent via{" "}
          {snackAlert?.deliveryMode === "voice" ? "voice call" : "text message"}{" "}
          to phone number{" "}
          <Box
            component="span"
            sx={{
              fontWeight: 700,
              letterSpacing: "0.08em",
              whiteSpace: "nowrap",
            }}
          >
            (•••)•••1111
          </Box>
          . This code expires in{" "}
          <Box component="span" sx={{ fontWeight: 700 }}>
            5
          </Box>{" "}
          minutes.{" "}
          <Link
            component="button"
            type="button"
            variant="body2"
            underline="hover"
            onClick={() => {
              const nextMode =
                snackAlert?.deliveryMode === "text" ? "voice" : "text";

              setDeliveryMode(nextMode);
              showPhoneCodeSuccess(nextMode);
            }}
            sx={{ fontSize: "0.8125rem" }}
          >
            {snackAlert?.deliveryMode === "text"
              ? "Send code with voice call"
              : "Send code with text message"}
          </Link>
        </Alert>
      </Snackbar>
    </Box>
  );
}
