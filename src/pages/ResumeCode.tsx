import { useEffect, useState, type FormEvent } from "react";
import {
  Box,
  Button,
  TextField,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getActiveClient } from "../config/client/getActiveClient";
import { getPagePath, getPageTitle } from "../config/pages";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
import {
  useApplicationForm,
  type ApplicationFormValues,
} from "../app/ApplicationFormContext";
import type { ClientId } from "../types";
import PageHeader from "../components/layout/PageHeader";
import PageShell from "../components/layout/PageShell";
import FormShell from "../components/layout/FormShell";
import useCountdown from "../hooks/useCountdown";
import ExpiringCodeAlert from "../components/feedback/ExpiringCodeAlert";
import ResendCountdownRow from "../components/feedback/ResendCountdownRow";

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

export default function ResumeCode() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAdvisorFlow = searchParams.get("flow") === "advisor";
  const client = getActiveClient();
  const { setPageValues } = useApplicationForm();

  const fields = getClientPageFields("resume-code");
  const codeField = fields.find((field) => field.id === "resume-security-code");

  const [phoneCode, setPhoneCode] = useState("");
  const [phoneCodeError, setPhoneCodeError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const { secondsLeft, start: startCountdown, restart } = useCountdown(300);
  const [resendConfirmationVisible, setResendConfirmationVisible] =
    useState(false);

  useEffect(() => {
    startCountdown();
  }, [startCountdown]);

  function handleResendCode() {
    restart();
    setPhoneCodeError(null);
    setResendConfirmationVisible(true);
  }

  function handleVerifySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!phoneCode.trim()) {
      setPhoneCodeError("Enter your verification code.");
      return;
    }

    setPhoneCodeError(null);
    setIsVerifying(true);

    window.setTimeout(() => {
      setIsVerifying(false);
      setVerifySuccess(true);

      window.setTimeout(() => {
        const savedApplication = getSavedApplicationForEmail(
          "returning.user@example.com",
          client.id,
        );

        setPageValues(savedApplication);

        if (isAdvisorFlow) {
          window.sessionStorage.setItem("advisorApplicantFlow", "true");
          navigate(getPagePath("review"), {
            state: { resumeLoaded: true },
          });
        } else {
          navigate(getPagePath("eligibility"), {
            state: { resumeLoaded: true },
          });
        }
      }, 2000);
    }, 700);
  }

  return (
    <Box sx={{ flex: 1, px: { xs: 2, sm: 3 }, py: { xs: 4, sm: 6 } }}>
      <PageShell title={getPageTitle("resume-code")} maxWidth={600} noTitle>
        <FormShell
          sx={{
            px: { xs: 2, sm: 4 },
            py: 6,
          }}
        >
          <PageHeader
              title={getPageTitle("resume-code")}
              subhead={
                <>
                  Please enter the verification code sent to the phone number{" "}
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
                  .
                </>
              }
              onBack={() => navigate(getPagePath("resume-method"))}
          />

          <Box
            component="form"
            onSubmit={handleVerifySubmit}
            noValidate
            sx={{ py: 1 }}
          >
            <Box sx={{ mb: secondsLeft === 0 || resendConfirmationVisible ? 2 : 0 }}>
              <ExpiringCodeAlert
                secondsLeft={secondsLeft}
                kind="code"
                onResend={handleResendCode}
                showConfirmation={resendConfirmationVisible}
                confirmationMessage="A new verification code has been sent."
              />
            </Box>

            <TextField
              fullWidth
              type="text"
              required={codeField?.required}
              value={phoneCode}
              disabled={secondsLeft === 0}
              label={codeField?.label ?? "Verification Code"}
              onChange={(event) => {
                setPhoneCode(event.target.value);

                if (phoneCodeError) {
                  setPhoneCodeError(null);
                }

                if (resendConfirmationVisible) {
                  setResendConfirmationVisible(false);
                }
              }}
              inputProps={{
                inputMode: "numeric",
                pattern: "[0-9]*",
              }}
              error={Boolean(phoneCodeError)}
              helperText={phoneCodeError ?? undefined}
            />

            <Box sx={{ mt: 1, mb: 3 }}>
              <ResendCountdownRow
                secondsLeft={secondsLeft}
                kind="code"
                onResend={handleResendCode}
              />
            </Box>

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
                disabled={isVerifying || verifySuccess || secondsLeft === 0}
                sx={(theme) => ({
                  ...(verifySuccess && {
                    backgroundColor: theme.palette.success.main,

                    "&:hover": {
                      backgroundColor: theme.palette.success.main,
                    },

                    "&.Mui-disabled": {
                      color: theme.palette.success.contrastText,
                      backgroundColor: theme.palette.success.main,
                      boxShadow: "none",
                      opacity: 1,
                    },
                  }),
                })}
              >
                {verifySuccess ? (
                  <CheckIcon />
                ) : isVerifying ? (
                  "Verifying..."
                ) : (
                  "Next"
                )}
              </Button>
            </Box>
          </Box>
        </FormShell>
      </PageShell>
    </Box>
  );
}
