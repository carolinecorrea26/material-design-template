import { Controller, useFormContext } from "react-hook-form";
import { FormLabel, FormHelperText, Box, ToggleButtonGroup, ToggleButton, Radio } from "@mui/material";
import { commonStyles } from "../../theme/commonStyles";
import * as React from "react";

export default function RHFRadioGroup({
  name, label, options, required
}: { name: string; label: string; options: Array<{ label: string; value: string|number }>; required?: boolean }) {
  const { control } = useFormContext();
  
  const handleKeyDown = (event: React.KeyboardEvent, currentValue: any, onChange: (value: any) => void) => {
    const currentIndex = options.findIndex(o => o.value === currentValue);
    let newIndex = currentIndex;
    
    switch(event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        newIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
        onChange(options[newIndex].value);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
        onChange(options[newIndex].value);
        break;
    }
  };
  
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Box>
          <FormLabel sx={commonStyles.formLabel} required={required} error={!!fieldState.error}>{label}</FormLabel>
          <ToggleButtonGroup
            value={field.value}
            exclusive
            onChange={(_, value) => {
              if (value !== null) {
                field.onChange(value);
              }
            }}
            onBlur={field.onBlur}
            onKeyDown={(e) => handleKeyDown(e, field.value, field.onChange)}
            fullWidth
            aria-label={label}
            sx={fieldState.error ? {
              '& .MuiToggleButton-root': {
                borderColor: 'error.main',
                '&:not(.Mui-selected)': {
                  borderColor: 'error.main'
                }
              }
            } : undefined}
          >
            {options.map(o => (
              <ToggleButton 
                key={String(o.value)} 
                value={o.value}
                aria-label={o.label}
                sx={{
                  py: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: 1.5,
                  textTransform: 'none',
                  '&.Mui-selected': {
                    bgcolor: 'transparent',
                    color: 'text.primary',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }
                }}
              >
                <Radio 
                  checked={field.value === o.value}
                  size="small"
                  sx={{ p: 0 }}
                />
                {o.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          {fieldState.error && <FormHelperText error>{fieldState.error?.message}</FormHelperText>}
        </Box>
      )}
    />
  );
}
