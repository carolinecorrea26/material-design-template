import { Controller, useFormContext } from 'react-hook-form';
import RHFTextField from './RHFTextField';

interface DateFieldProps {
  name: string;
  label: string;
  required?: boolean;
}

export default function DateField({ name, label, required = false }: DateFieldProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <RHFTextField
          name={field.name}
          label={label}
          required={required}
          value={field.value}
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
          inputProps={{ maxLength: 10 }}
          error={!!fieldState.error}
          helperText={fieldState.error?.message || "MM/DD/YYYY"}
        />
      )}
    />
  );
}
