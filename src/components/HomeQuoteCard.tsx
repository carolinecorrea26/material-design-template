import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AppModal from "./ui/AppModal";
import QuoteModal from "./QuoteModal";
import { getActiveClientCoverages } from "../config/client/getActiveClientCoverages";
import { fieldCatalog } from "../config/fields";
import {
  deriveStateProvinceFromZipOrPostalCode,
  formatZipOrPostalCode,
} from "../utils/zipToStateProvince";
import {
  parseStoredDate,
  formatDateForStorage,
  formatDateDisplay,
} from "../utils/dateFormatting";

type EligibilityValues = {
  birthday: string;
  zipCode: string;
  state: string;
};

const SURFACE_SX = {
  border: "1px solid rgba(52, 59, 72, 0.10)",
  borderRadius: 4,
  backgroundColor: "#ffffff",
  boxShadow: "0 18px 40px rgba(52, 59, 72, 0.06)",
};

const ESTIMATE_STORAGE_KEY = "homeEstimateValues";

function loadStoredEstimateValues(): Partial<EligibilityValues> {
  try {
    const stored = window.localStorage.getItem(ESTIMATE_STORAGE_KEY);
    if (!stored) return {};
    return JSON.parse(stored) as Partial<EligibilityValues>;
  } catch {
    return {};
  }
}

function saveEstimateValues(values: EligibilityValues) {
  window.localStorage.setItem(ESTIMATE_STORAGE_KEY, JSON.stringify(values));
}

function getStateOptions() {
  return fieldCatalog["state-province"].options ?? [];
}

function calculateAge(birthdayStr: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdayStr)) return null;
  const [y, m, d] = birthdayStr.split("-").map(Number);
  const birth = new Date(y, m - 1, d);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export default function HomeQuoteCard() {
  const coverages = useMemo(() => getActiveClientCoverages(), []);
  const stateOptions = useMemo(() => getStateOptions(), []);

  const storedEstimate = useMemo(() => loadStoredEstimateValues(), []);

  const [values, setValues] = useState<EligibilityValues>({
    birthday: storedEstimate.birthday ?? "",
    zipCode: storedEstimate.zipCode ?? "",
    state: storedEstimate.state ?? "",
  });
  const [attempted, setAttempted] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dobFocused, setDobFocused] = useState(false);
  const [ageError, setAgeError] = useState("");

  // Auto-derive state from zip code
  useEffect(() => {
    const derived = deriveStateProvinceFromZipOrPostalCode(
      values.zipCode,
      stateOptions,
    );
    if (derived && derived !== values.state) {
      setValues((current) => ({ ...current, state: derived }));
    }
  }, [values.zipCode, stateOptions, values.state]);

  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    if (!values.birthday) {
      errors.birthday = "Date of birth is required.";
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(values.birthday)) {
      errors.birthday = "Enter a complete date (MM/DD/YYYY).";
    }
    if (!values.zipCode) errors.zipCode = "ZIP / postal code is required.";
    if (!values.state) errors.state = "State is required.";
    return errors;
  }, [values.birthday, values.zipCode, values.state]);

  function updateValues(next: Partial<EligibilityValues>) {
    setValues((current) => ({ ...current, ...next }));
  }

  function handleGetEstimate() {
    setAttempted(true);
    setAgeError("");

    if (Object.keys(validationErrors).length > 0) return;

    const age = calculateAge(values.birthday);
    if (age !== null && age >= 80) {
      setAgeError(
        "We're sorry, but coverage is not available for applicants age 80 or older.",
      );
      return;
    }

    saveEstimateValues(values);

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setQuoteModalOpen(true);
    }, 1000);
  }

  return (
    <>
      <Box
        sx={{
          ...SURFACE_SX,
          width: "100%",
          borderColor: "rgba(7, 104, 255, 0.14)",
          background:
            "linear-gradient(135deg, #f4f8ff 0%, #ffffff 52%, #f7fbff 100%)",
        }}
      >
        <Stack spacing={2.25} sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Box>
            <Typography variant="h2" paddingBottom={0.5}>
              Get an instant quote
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Find a premium and amount that's a good fit for you.
            </Typography>
          </Box>

          <Stack spacing={2.5}>
            <TextField
              label="Date of Birth"
              fullWidth
              required
              placeholder="MM/DD/YYYY"
              value={parseStoredDate(values.birthday)}
              onChange={(event) => {
                const formatted = formatDateDisplay(event.target.value);
                const digits = formatted.replace(/\D/g, "");
                if (digits.length === 8) {
                  updateValues({ birthday: formatDateForStorage(formatted) });
                } else {
                  updateValues({ birthday: formatted });
                }
              }}
              onFocus={() => setDobFocused(true)}
              onBlur={() => setDobFocused(false)}
              inputProps={{ inputMode: "numeric" }}
              InputLabelProps={{ shrink: dobFocused || !!values.birthday }}
              error={attempted && !!validationErrors.birthday}
              helperText={
                attempted && validationErrors.birthday
                  ? validationErrors.birthday
                  : undefined
              }
            />

            <TextField
              label="ZIP / Postal Code"
              fullWidth
              required
              value={values.zipCode}
              onChange={(event) =>
                updateValues({
                  zipCode: formatZipOrPostalCode(event.target.value),
                })
              }
              inputProps={{ inputMode: "text", maxLength: 7 }}
              error={attempted && !!validationErrors.zipCode}
              helperText={
                attempted ? validationErrors.zipCode || undefined : undefined
              }
            />

            <FormControl
              fullWidth
              required
              error={attempted && !!validationErrors.state}
            >
              <InputLabel id="home-estimate-state-label">State</InputLabel>
              <Select
                labelId="home-estimate-state-label"
                label="State"
                value={values.state}
                onChange={(event) =>
                  updateValues({ state: event.target.value })
                }
              >
                {stateOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {attempted && validationErrors.state ? (
                <FormHelperText>{validationErrors.state}</FormHelperText>
              ) : null}
            </FormControl>
          </Stack>

          <Stack spacing={1}>
            <Button
              variant="outlined"
              size="large"
              sx={{ py: "16px" }}
              onClick={handleGetEstimate}
              disabled={isLoading}
            >
              {isLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Get an instant quote"
              )}
            </Button>
            {ageError ? (
              <Alert severity="error" sx={{ mt: 0.5 }}>
                {ageError}
              </Alert>
            ) : null}
          </Stack>
        </Stack>
      </Box>

      <AppModal
        open={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        title="Your coverage estimate"
      >
        <QuoteModal
          onClose={() => setQuoteModalOpen(false)}
          coverages={coverages}
          birthday={values.birthday}
          zipCode={values.zipCode}
          state={values.state}
        />
      </AppModal>
    </>
  );
}
