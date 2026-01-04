import { Controller, useFormContext } from 'react-hook-form';
import { TextField, type TextFieldProps } from '@mui/material';

interface RHFCurrencyFieldProps extends Omit<TextFieldProps, 'name' | 'value' | 'onChange'> {
  name: string;
}

function formatCurrency(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  if (!digits) return '';
  
  // Convert to number and add commas
  const number = parseInt(digits, 10);
  return number.toLocaleString();
}

function parseCurrency(formattedValue: string): string {
  // Remove all non-digits for storage
  return formattedValue.replace(/\D/g, '');
}

export default function RHFCurrencyField({ name, ...props }: RHFCurrencyFieldProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value, ...field }, fieldState: { error } }) => {
        return (
          <TextField
            {...field}
            {...props}
            value={value ? formatCurrency(value) : ''}
            onChange={(e) => {
              const formatted = e.target.value;
              const raw = parseCurrency(formatted);
              onChange(raw);
            }}
            error={!!error}
            helperText={error?.message}
            InputProps={{
              startAdornment: <span style={{ marginRight: 4 }}>$</span>,
              ...props.InputProps,
            }}
          />
        );
      }}
    />
  );
}