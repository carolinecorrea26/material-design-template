import { FormLabel, Box, ToggleButtonGroup, ToggleButton } from "@mui/material";

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
          <ToggleButton key={o.value} value={o.value}>
            {o.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}
