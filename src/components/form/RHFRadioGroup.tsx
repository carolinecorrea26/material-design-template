import { Controller, useFormContext } from "react-hook-form";
import { FormLabel, FormHelperText, Box, ToggleButtonGroup, ToggleButton } from "@mui/material";
import { commonStyles } from "../../theme/commonStyles";

export default function RHFRadioGroup({
  name, label, options, required
}: { name: string; label: string; options: Array<{ label: string; value: string|number }>; required?: boolean }) {
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Box>
          <FormLabel sx={commonStyles.formLabel} required={required} error={!!fieldState.error}>{label}</FormLabel>
          <ToggleButtonGroup
            value={field.value}
            exclusive
            onChange={(_, value) => {
              if (value !== null) {
                field.onChange(value);
              }
            }}
            fullWidth
            sx={fieldState.error ? {
              '& .MuiToggleButton-root': {
                borderColor: 'error.main',
                '&:not(.Mui-selected)': {
                  borderColor: 'error.main'
                }
              }
            } : undefined}
          >
            {options.map(o => (
              <ToggleButton key={String(o.value)} value={o.value}>
                {o.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          {fieldState.error && <FormHelperText error>{fieldState.error?.message}</FormHelperText>}
        </Box>
      )}
    />
  );
}
