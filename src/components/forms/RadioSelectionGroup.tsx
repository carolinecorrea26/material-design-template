import { FormControl, FormLabel, Radio, Stack, Box } from "@mui/material";
import type { FieldOption } from "../../config/fields/types";
import SelectionGroup from "./SelectionGroup";

type RadioSelectionGroupProps = {
  name: string;
  label: string;
  options: FieldOption[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
};

/** Accessible radio rows using the app's canonical SelectionGroup surface. */
export default function RadioSelectionGroup({
  name,
  label,
  options,
  value,
  onChange,
  required,
  disabled,
}: RadioSelectionGroupProps) {
  const labelId = `${name}-label`;
  return (
    <FormControl fullWidth required={required} disabled={disabled}>
      <FormLabel id={labelId}>{label}</FormLabel>
      <Stack
        spacing={1}
        sx={{ mt: 1 }}
        role="radiogroup"
        aria-labelledby={labelId}
      >
        {options.map((option) => {
          const inputId = `${name}-${option.value}`;
          const checked = value === option.value;
          return (
            <SelectionGroup
              key={option.value}
              htmlFor={inputId}
              disabled={disabled}
            >
              <Radio
                id={inputId}
                name={name}
                value={option.value}
                checked={checked}
                disabled={disabled}
                size="small"
                onChange={() => onChange(option.value)}
                sx={{ p: 0 }}
              />
              <Box
                component="span"
                className="SelectionGroup-label"
                sx={{ fontSize: "0.875rem" }}
              >
                {option.label}
              </Box>
            </SelectionGroup>
          );
        })}
      </Stack>
    </FormControl>
  );
}
