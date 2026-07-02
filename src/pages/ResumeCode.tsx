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
// import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import { useNavigate } from "react-router-dom";
import { getActiveClient } from "../config/client/getActiveClient";
import { getPagePath, getPageTitle } from "../config/pages";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
import {
  useApplicationForm,
  type ApplicationFormValues,
} from "../app/ApplicationFormContext";
import type { ClientId } from "../types";
import FormPageTitle from "../components/page/Title";

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

export default function ResumeCode() {
  const navigate = useNavigate();
  const client = getActiveClient();
  const { setPageValues } = useApplicationForm();
  const fields = getClientPageFields("resume-code");
  const codeField = fields.find((f) => f.id === "resume-security-code");

  const [phoneCode, setPhoneCode] = useState("");
  const [phoneCodeError, setPhoneCodeError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("text");
  const [secondsLeft, setSecondsLeft] = useState(300);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

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
          "returning.user@example.com",
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
        <Box
          sx={{
            width: "100%",
            borderRadius: "16px",
            backgroundColor: "#ffffff",
            boxShadow: "0 8px 16px rgba(52, 59, 72, 0.06)",
            px: { xs: 2, sm: 4 },
            py: 6,
          }}
        >
          <Box sx={{ mb: 2 }}>
            <FormPageTitle
              title={getPageTitle("resume-code")}
              subhead={
                <>
                  Please enter the security code sent via{" "}
                  {deliveryMode === "voice" ? "call" : "text"} to the phone
                  number{" "}
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
                  .{" "}
                  <Link
                    component="button"
                    type="button"
                    variant="body2"
                    underline="hover"
                    onClick={() => {
                      const nextMode =
                        deliveryMode === "text" ? "voice" : "text";
                      setDeliveryMode(nextMode);
                    }}
                    sx={{ fontSize: "inherit", verticalAlign: "baseline" }}
                  >
                    {deliveryMode === "text"
                      ? "Get security code with voice call instead."
                      : "Get security code with text message instead."}
                  </Link>
                </>
              }
            />
          </Box>

          <Box
            component="form"
            onSubmit={handleVerifySubmit}
            noValidate
            sx={{ py: 1 }}
          >
            {secondsLeft === 0 && (
              <Alert
                severity="error"
                // icon={<ErrorRoundedIcon />}
                sx={{ mb: 2 }}
              >
                Your security code has expired.{" "}
                <Link
                  href="#"
                  underline="hover"
                  onClick={() => {}}
                  sx={{ fontSize: "inherit", verticalAlign: "baseline" }}
                >
                  Resend Code
                </Link>
              </Alert>
            )}
            <TextField
              fullWidth
              type="text"
              required={codeField?.required}
              value={phoneCode}
              disabled={secondsLeft === 0}
              label={codeField?.label ?? "Security Code"}
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
              spacing={0.5}
              justifyContent="space-between"
              alignItems="center"
              sx={{ mt: 1, px: 0.5, mb: 3 }}
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
                      {Math.floor(secondsLeft / 60)}:
                      {String(secondsLeft % 60).padStart(2, "0")}
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
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isVerifying || verifySuccess || secondsLeft === 0}
                sx={{
                  fontWeight: 700,
                  padding: "16px",
                  boxShadow: "0 8px 18px #0668ff3d",
                  "&:hover": { boxShadow: "0 8px 18px #0668ff3d" },
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
        </Box>
      </Box>
    </Stack>
  );
}
