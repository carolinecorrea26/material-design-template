import { Box, Stack, Typography } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import RHFTextField from './RHFTextField';
import { commonStyles } from '../../theme/commonStyles';

interface DisabilityInsuranceSectionProps {
  incomeFieldName: string;
  hoursFieldName: string;
}

export default function DisabilityInsuranceSection({
  incomeFieldName,
  hoursFieldName
}: DisabilityInsuranceSectionProps) {
  const { control } = useFormContext();

  return (
    <Box sx={{
      ...commonStyles.borderedBox,
      bgcolor: 'grey.50',
      '& .MuiTextField-root, & .MuiFormControl-root': {
        '& .MuiOutlinedInput-root, & .MuiSelect-outlined': {
          bgcolor: 'background.paper'
        }
      }
    }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={commonStyles.marginBottom}>
        <Typography variant="subtitle1" sx={commonStyles.fontWeightBold}>Income Information</Typography>
      </Stack>
      <Stack spacing={2}>
        <Controller
          name={incomeFieldName}
          control={control}
          render={({ field, fieldState }) => (
            <RHFTextField
              name={field.name}
              label="Average Monthly Income"
              required
              value={field.value}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                const formatted = value ? `$${parseInt(value).toLocaleString()}` : '';
                field.onChange(formatted);
              }}
              error={!!fieldState.error}
              helperText={fieldState.error?.message || "Monthly income is asked to help determine the amount of disability coverage you may qualify for."}
            />
          )}
        />
        <RHFTextField 
          name={hoursFieldName} 
          label="# Hours You Work/Week" 
          required 
        />
      </Stack>
    </Box>
  );
}
