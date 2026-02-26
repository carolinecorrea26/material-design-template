import * as React from "react";
import { Controller, useFormContext } from "react-hook-form";
import TextField from "@mui/material/TextField";
import type { TextFieldProps } from "@mui/material/TextField";

export default function RHFTextField({
  name,
  ...props
}: TextFieldProps & { name: string }) {
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          {...props}
          value={field.value ?? ""}
          error={!!fieldState.error}
          helperText={fieldState.error?.message || props.helperText}
          fullWidth={props.fullWidth ?? true}
        />
      )}
    />
  );
}
