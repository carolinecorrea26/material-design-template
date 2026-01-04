import * as React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { FormControl, InputLabel, Select, MenuItem, FormHelperText, FormLabel, Stack } from "@mui/material";

interface Props {
  name: string;
  label: string;
  options: Array<{ label: string; value: string|number }>;
  required?: boolean;
  useStandardLabel?: boolean;
}

export default function RHFSelect({ name, label, options, required, useStandardLabel = false }: Props) {
  const { control } = useFormContext();
  const id = `${name}-label`;
  
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FormControl fullWidth error={!!fieldState.error} required={required} component="fieldset">
          {useStandardLabel ? (
            <Stack spacing={1}>
              <FormLabel component="legend">{label}</FormLabel>
              <Select {...field} displayEmpty>
                <MenuItem value="">
                  <em>Select an option</em>
                </MenuItem>
                {options.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
              {fieldState.error && <FormHelperText>{fieldState.error.message}</FormHelperText>}
            </Stack>
          ) : (
            <>
              <InputLabel id={id}>{label}</InputLabel>
              <Select {...field} labelId={id} label={label}>
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {options.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
              <FormHelperText>{fieldState.error?.message}</FormHelperText>
            </>
          )}
        </FormControl>
      )}
    />
  );
}
