import { Controller, useFormContext } from "react-hook-form";
import { TextField } from "@mui/material";

interface DateFieldProps {
  name: string;
  label: string;
  required?: boolean;
  autoComplete?: string;
}

export default function DateField({
  name,
  label,
  required = false,
  autoComplete,
}: DateFieldProps) {
  const { control } = useFormContext();

  // Convert YYYY-MM-DD to MM/DD/YYYY for display
  const convertToDisplay = (value: string): string => {
    if (!value) return "";
    // If already in MM/DD/YYYY format, return as is
    if (value.includes("/")) return value;
    // If in YYYY-MM-DD format, convert to MM/DD/YYYY
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      return `${match[2]}/${match[3]}/${match[1]}`;
    }
    return value;
  };

  // Convert MM/DD/YYYY to YYYY-MM-DD for storage
  const convertToStorage = (value: string): string => {
    if (!value || value.length < 10) return value;
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) {
      return `${match[3]}-${match[1]}-${match[2]}`;
    }
    return value;
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          value={convertToDisplay(field.value)}
          label={label}
          required={required}
          autoComplete={autoComplete}
          error={!!fieldState.error}
          helperText={fieldState.error?.message || "mm/dd/yyyy"}
          fullWidth
          onBlur={field.onBlur}
          onChange={(e) => {
            let value = e.target.value.replace(/\D/g, "");
            if (value.length >= 2) {
              value = value.slice(0, 2) + "/" + value.slice(2);
            }
            if (value.length >= 5) {
              value = value.slice(0, 5) + "/" + value.slice(5, 9);
            }
            // Store in YYYY-MM-DD format
            field.onChange(convertToStorage(value));
          }}
          inputProps={{
            maxLength: 10,
            inputMode: "numeric",
          }}
        />
      )}
    />
  );
}
