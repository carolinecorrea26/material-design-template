import { fieldValidationChecks } from "../../utils/fieldValidation";
import { getContent } from '../../content';
import { getPrototypeLibrary } from '../../domain/prototypeLibrary';
import { getFieldSurface, getSurfaceFields } from '../../config/fields/storedSurfaces';
import type { FieldDefinition } from "../../config/fields/types";
import { useForm, useWatch } from "react-hook-form";
import FieldRenderer from "../forms/FieldRenderer";
import FieldGrid from '../layout/FieldGrid';
import { Box, Stack, Typography } from "@mui/material";

import { formatUSD } from "../../utils/formatUSD";

export default function CoverageNeedsCalculator({ fields: suppliedFields, bindings: suppliedBindings }: { fields?: FieldDefinition[]; bindings?: Record<string, string> } = {}) {
  const library = getPrototypeLibrary();
  if (!suppliedFields && !library) throw new Error('Missing fresh-start needs calculator projection');
  const fields = suppliedFields ?? getSurfaceFields('needsCalculator', library!);
  const bindings = suppliedBindings ?? (!suppliedFields && library ? getFieldSurface('needsCalculator', library).mapping.fieldToKey : {});
  const copy = getContent().coverage.needsCalculator;
  const binding = (id: string) => bindings[id] ?? id;
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
        {copy.intro}
      </Typography>

      <FieldGrid>{fields.map(field => <FieldRenderer key={field.id} field={field} control={form.control} errors={hasInput ? Object.fromEntries(Object.entries(validationErrors).map(([id, message]) => [id, { type: 'validate', message }])) : {}} />)}</FieldGrid>

      {hasInput && !Object.keys(validationErrors).length && (
        <Box
          role="status"
          aria-live="polite"
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: "background.default",
            border: 1,
            borderColor: "divider",
          }}
        >
          <Stack spacing={1}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {copy.title}
            </Typography>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: "primary.main" }}
            >
              {formatUSD(recommendedCoverage, 0)}
            </Typography>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                {copy['income-label']} {formatUSD(incomeNeed, 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {copy['debts-label']} {formatUSD(debts, 0)}
              </Typography>
              {existing > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {copy['existing-label']} -{formatUSD(existing, 0)}
                </Typography>
              )}
            </Stack>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, fontStyle: "italic" }}
            >
              {copy.disclaimer}
            </Typography>
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
