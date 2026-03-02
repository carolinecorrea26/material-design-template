import {
  FormHelperText,
  Checkbox,
  Box,
  Typography,
  Stack,
} from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import type { CoverageCat } from "../../validation/eligibility";
import { commonStyles } from "../../theme/commonStyles";

interface CoverageCheckboxGroupProps {
  name: string;
  options: CoverageCat[];
  error?: string;
}

export default function CoverageCheckboxGroup({
  name,
  options,
  error,
}: CoverageCheckboxGroupProps) {
  const { control, setValue, watch } = useFormContext();
  const currentValues = watch(name) as CoverageCat[] | undefined;

  const handleToggle = (value: CoverageCat) => {
    const newValues = currentValues?.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...(currentValues || []), value];
    setValue(name, newValues, { shouldValidate: true });
  };

  return (
    <Controller
      name={name}
      control={control}
      render={() => (
        <>
          <Stack spacing={1}>
            {options.map((opt) => {
              const checked = currentValues?.includes(opt) || false;
              return (
                <Box
                  key={opt}
                  component="label"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 2,
                    py: 1.5,
                    width: "100%",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: "8px",
                    bgcolor: "white",
                    cursor: "pointer",
                    transition:
                      "background-color 0.2s ease, border-color 0.2s ease",
                    "@media (hover: hover)": {
                      "&:hover": {
                        backgroundColor: "action.hover",
                      },
                    },
                  }}
                >
                  <Checkbox
                    checked={checked}
                    onChange={() => handleToggle(opt)}
                    disableRipple
                    sx={{
                      p: 0,
                      color: "text.primary",
                      "&.Mui-checked": { color: "primary.main" },
                    }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 400 }}>
                    {opt === "LI" ? "Life Insurance (LI)" : opt}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
          {error && <FormHelperText error>{error}</FormHelperText>}
        </>
      )}
    />
  );
}
