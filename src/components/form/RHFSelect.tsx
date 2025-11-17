import * as React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { FormControl, InputLabel, Select, MenuItem, FormHelperText } from "@mui/material";

interface Props {
  name: string;
  label: string;
  options: Array<{ label: string; value: string|number }>;
  required?: boolean;
}

export default function RHFSelect({ name, label, options, required }: Props) {
  const { control } = useFormContext();
  const id = `${name}-label`;
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FormControl fullWidth error={!!fieldState.error} required={required}>
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
        </FormControl>
      )}
    />
  );
}
