import { FormLabel, Box, ToggleButtonGroup, ToggleButton, Radio } from "@mui/material";

export default function RadioGroup({
  label, value, onChange, options, fullWidth = true
}: { 
  label: string; 
  value: string; 
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  fullWidth?: boolean;
}) {
  return (
    <Box>
      <FormLabel sx={{ mb: 1, display: 'block' }}>{label}</FormLabel>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={(_, newValue) => {
          if (newValue !== null) {
            onChange(newValue);
          }
        }}
        fullWidth={fullWidth}
      >
        {options.map(o => (
          <ToggleButton 
            key={o.value} 
            value={o.value}
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
              checked={value === o.value}
              size="small"
              sx={{ p: 0 }}
            />
            {o.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}
