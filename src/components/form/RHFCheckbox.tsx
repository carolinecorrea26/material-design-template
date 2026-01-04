import * as React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Checkbox, FormControlLabel } from "@mui/material";

export default function RHFCheckbox({ name, label }: { name: string; label: string }) {
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormControlLabel
          control={
            <Checkbox 
              checked={!!field.value} 
              onChange={(_, v) => field.onChange(v)}
              onBlur={field.onBlur}
              name={field.name}
            />
          }
          label={label}
        />
      )}
    />
  );
}
