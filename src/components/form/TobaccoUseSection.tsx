import { Box, Stack, Typography, FormControl, InputLabel, Select, MenuItem, Checkbox, FormHelperText } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import RHFRadioGroup from './RHFRadioGroup';
import RHFTextField from './RHFTextField';
import { commonStyles } from '../../theme/commonStyles';

interface TobaccoUseSectionProps {
  smokerFieldName: string;
  lastUsedFieldName: string;
  productsFieldName: string;
  showDetails: boolean;
  tobaccoProducts: string[];
}

export default function TobaccoUseSection({
  smokerFieldName,
  lastUsedFieldName,
  productsFieldName,
  showDetails,
  tobaccoProducts
}: TobaccoUseSectionProps) {
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
        <Typography variant="subtitle1" sx={commonStyles.fontWeightBold}>Tobacco Use</Typography>
      </Stack>
      <Stack spacing={2}>
        <RHFRadioGroup
          name={smokerFieldName}
          label="Have you used tobacco or any nicotine substitute in any form (including nicotine patches and nicotine chewing gum)?"
          options={[{label:"Yes",value:"yes"},{label:"No",value:"no"}]}
          required
        />
        
        {showDetails && (
          <>
            <Controller
              name={lastUsedFieldName}
              control={control}
              render={({ field, fieldState }) => (
                <RHFTextField
                  name={field.name}
                  label="Last Used"
                  required
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
            
            <Controller
              name={productsFieldName}
              control={control}
              render={({ field, fieldState }) => (
                <FormControl fullWidth error={!!fieldState.error} required>
                  <InputLabel id={`${productsFieldName}-label`}>Product(s) Used</InputLabel>
                  <Select
                    {...field}
                    labelId={`${productsFieldName}-label`}
                    label="Product(s) Used"
                    multiple
                    value={field.value || []}
                    renderValue={(selected) => (selected as string[]).join(', ')}
                  >
                    {tobaccoProducts.map((product) => (
                      <MenuItem key={product} value={product}>
                        <Checkbox checked={field.value?.includes(product) || false} />
                        {product}
                      </MenuItem>
                    ))}
                  </Select>
                  {fieldState.error && (
                    <FormHelperText>{fieldState.error.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />
          </>
        )}
      </Stack>
    </Box>
  );
}
