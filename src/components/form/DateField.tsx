import { Controller, useFormContext } from 'react-hook-form';
import { TextField } from '@mui/material';

interface DateFieldProps {
  name: string;
  label: string;
  required?: boolean;
  autoComplete?: string;
}

export default function DateField({ name, label, required = false, autoComplete }: DateFieldProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          label={label}
          required={required}
          autoComplete={autoComplete}
          placeholder="MM/DD/YYYY"
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
          fullWidth
          onChange={(e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
              value = value.slice(0, 2) + '/' + value.slice(2);
            }
            if (value.length >= 5) {
              value = value.slice(0, 5) + '/' + value.slice(5, 9);
            }
            field.onChange(value);
          }}
          inputProps={{ 
            maxLength: 10,
            inputMode: 'numeric'
          }}
        />
      )}
    />
  );
}
