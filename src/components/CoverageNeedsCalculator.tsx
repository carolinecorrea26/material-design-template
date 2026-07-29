import { useState } from "react";
import { Box, Stack, TextField, Typography } from "@mui/material";

import { formatUSD } from "../utils/formatUSD";

export default function CoverageNeedsCalculator() {
  const [annualIncome, setAnnualIncome] = useState("");
  const [yearsToReplace, setYearsToReplace] = useState("");
  const [outstandingDebts, setOutstandingDebts] = useState("");
  const [existingCoverage, setExistingCoverage] = useState("");

  const parseAmount = (val: string) => {
    const num = Number(val.replace(/[^0-9]/g, ""));
    return Number.isFinite(num) ? num : 0;
  };

  const income = parseAmount(annualIncome);
  const years = Number(yearsToReplace) || 0;
  const debts = parseAmount(outstandingDebts);
  const existing = parseAmount(existingCoverage);

  const incomeNeed = income * years;
  const totalNeed = incomeNeed + debts;
  const recommendedCoverage = Math.max(0, totalNeed - existing);

  const hasInput = income > 0 || debts > 0;

  return (
    <Stack spacing={2.5}>
      <Typography variant="body2" color="text.secondary">
        Use this simple calculator to get a rough estimate of how much life
        insurance coverage may be appropriate for your situation.
      </Typography>

      <TextField
        label="Annual household income"
        fullWidth
        value={annualIncome}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
          if (!digits) {
            setAnnualIncome("");
            return;
          }
          setAnnualIncome(`$${Number(digits).toLocaleString("en-US")}`);
        }}
        inputProps={{ inputMode: "numeric" }}
      />

      <TextField
        label="Years of income to replace"
        fullWidth
        value={yearsToReplace}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
          setYearsToReplace(digits);
        }}
        helperText="A common recommendation is 10–12 years"
        inputProps={{ inputMode: "numeric" }}
      />

      <TextField
        label="Outstanding debts (mortgage, loans, etc.)"
        fullWidth
        value={outstandingDebts}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
          if (!digits) {
            setOutstandingDebts("");
            return;
          }
          setOutstandingDebts(`$${Number(digits).toLocaleString("en-US")}`);
        }}
        inputProps={{ inputMode: "numeric" }}
      />

      <TextField
        label="Existing life insurance coverage"
        fullWidth
        value={existingCoverage}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
          if (!digits) {
            setExistingCoverage("");
            return;
          }
          setExistingCoverage(`$${Number(digits).toLocaleString("en-US")}`);
        }}
        inputProps={{ inputMode: "numeric" }}
      />

      {hasInput && (
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: "background.subtle",
            border: 1,
            borderColor: "panel.border",
          }}
        >
          <Stack spacing={1}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Estimated coverage need
            </Typography>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: "primary.main" }}
            >
              {formatUSD(recommendedCoverage, 0)}
            </Typography>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                Income replacement: {formatUSD(incomeNeed, 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Outstanding debts: {formatUSD(debts, 0)}
              </Typography>
              {existing > 0 && (
                <Typography variant="caption" color="text.secondary">
                  Less existing coverage: -{formatUSD(existing, 0)}
                </Typography>
              )}
            </Stack>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, fontStyle: "italic" }}
            >
              This is a simplified estimate. Your actual needs may vary based on
              your full financial picture.
            </Typography>
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
