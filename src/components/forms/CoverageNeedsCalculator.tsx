import { fieldValidationChecks } from "../../utils/fieldValidation";
import { getSurfaceFields, getFieldSurface } from "../../config/fields/storedSurfaces";
import { useForm, useWatch } from "react-hook-form";
import FieldRenderer from "./FieldRenderer";
import { Box, Stack, Typography } from "@mui/material";

import { formatUSD } from "../../utils/formatUSD";

export default function CoverageNeedsCalculator() {
  const fields = getSurfaceFields("needsCalculator");
  const binding = (id: string) => getFieldSurface("needsCalculator").mapping.fieldToKey[id];
  const form = useForm<Record<string, string | boolean | string[]>>({ defaultValues: {} });
  const inputs = useWatch({ control: form.control });
  const annualIncome = String(inputs[binding("needs-annual-income")] ?? "");
  const yearsToReplace = String(inputs[binding("needs-years-to-replace")] ?? "");
  const outstandingDebts = String(inputs[binding("needs-outstanding-debts")] ?? "");
  const existingCoverage = String(inputs[binding("needs-existing-coverage")] ?? "");

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
  const validationErrors = Object.fromEntries(fields.flatMap(field => {
    const invalid = fieldValidationChecks(field).find(check => !check.validate(inputs[field.id]));
    return invalid ? [[field.id, invalid.message]] : [];
  }));

  return (
    <Stack spacing={2.5}>
      <Typography variant="body2" color="text.secondary">
        Use this simple calculator to get a rough estimate of how much life
        insurance coverage may be appropriate for your situation.
      </Typography>

      {fields.map(field => <FieldRenderer key={field.id} field={field} control={form.control} margin="none" errors={hasInput ? Object.fromEntries(Object.entries(validationErrors).map(([id, message]) => [id, { type: 'validate', message }])) : {}} />)}

      {hasInput && !Object.keys(validationErrors).length && (
        <Box
          role="status"
          aria-live="polite"
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
