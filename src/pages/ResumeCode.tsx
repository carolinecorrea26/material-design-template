import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getActiveClient } from "../config/client/getActiveClient";
import { getPagePath, getPageTitle } from "../config/pages";
import { formatCountdown } from "../utils/formatCountdown";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
import {
  useApplicationForm,
  type ApplicationFormValues,
} from "../app/ApplicationFormContext";
import type { ClientId } from "../types";
import PageTitle from "../components/layout/PageTitle";
import FormShell from "../components/layout/FormShell";

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
  const [secondsLeft, setSecondsLeft] = useState(300);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((previousSeconds) => {
        if (previousSeconds <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }

          return 0;
        }

        return previousSeconds - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

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
    <Stack
      spacing={2}
      sx={{
        flex: 1,
        alignItems: "center",
        justifyContent: "flex-start",
        px: { xs: 2, sm: 3 },
        py: { xs: 4, sm: 6 },
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 600 }}>
        <FormShell
          sx={{
            px: { xs: 2, sm: 4 },
            py: 6,
          }}
        >
          <Box sx={{ mb: 2 }}>
            <PageTitle
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
          </Box>

          <Box
            component="form"
            onSubmit={handleVerifySubmit}
            noValidate
            sx={{ py: 1 }}
          >
            {secondsLeft === 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Your verification code has expired.{" "}
                <Link
                  href="#"
                  underline="hover"
                  onClick={(event) => {
                    event.preventDefault();
                  }}
                  sx={{
                    fontSize: "inherit",
                    verticalAlign: "baseline",
                  }}
                >
                  Resend code
                </Link>
              </Alert>
            )}

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
              spacing={0.5}
              justifyContent="space-between"
              alignItems="center"
              sx={{
                mt: 1,
                px: 0.5,
                mb: 3,
              }}
            >
              <Typography
                variant="body2"
                color={secondsLeft === 0 ? "error" : "text.secondary"}
                sx={{ fontSize: "0.8125rem" }}
              >
                {secondsLeft === 0 ? (
                  "Code expired"
                ) : (
                  <>
                    Code expires in{" "}
                    <Box component="span" sx={{ fontWeight: 700 }}>
                      {formatCountdown(secondsLeft)}
                    </Box>
                  </>
                )}
              </Typography>

              <Button
                variant="text"
                size="small"
                startIcon={<RefreshRoundedIcon />}
                onClick={() => {}}
                sx={{ fontSize: "0.8125rem" }}
              >
                Resend code
              </Button>
            </Stack>

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
      </Box>
    </Stack>
  );
}
