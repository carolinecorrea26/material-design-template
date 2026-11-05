import type { ReactNode, Ref } from "react";
import { FormControl, FormHelperText, FormLabel, Radio, RadioGroup, Box } from "@mui/material";
import type { FieldOption } from "../../config/fields/types";
import SelectionGroup from "./SelectionGroup";

type RadioSelectionGroupProps = {
  name: string;
  label?: ReactNode;
  options: FieldOption[];
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  inputRef?: Ref<HTMLInputElement>;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: ReactNode;
  margin?: "none" | "dense" | "normal";
  renderOptionEnd?: (value: string) => ReactNode;
};

/** Presentational radio rows used by FieldRenderer; application fields use the renderer. */
export default function RadioSelectionGroup({
  name, label, options, value, onChange, onBlur, inputRef,
  required, disabled, error, helperText, margin = "none", renderOptionEnd,
}: RadioSelectionGroupProps) {
  const labelId = `${name}-label`;
  const helperId = `${name}-helper`;
  return (
    <FormControl fullWidth required={required} disabled={disabled} error={error} margin={margin}>
      {label && <FormLabel id={labelId}>{label}</FormLabel>}
      <RadioGroup
        name={name}
        value={value}
        onChange={(_, next) => onChange(next)}
        onBlur={onBlur}
        aria-labelledby={label ? labelId : undefined}
        aria-label={label ? undefined : name}
        aria-describedby={helperText ? helperId : undefined}
        sx={{ gap: 1, mt: label ? 1 : 0 }}
      >
        {options.map((option, index) => (
          <SelectionGroup key={option.value} disabled={disabled}>
            <Radio
              name={name}
              value={option.value}
              checked={value === option.value}
              disabled={disabled}
              inputRef={index === 0 ? inputRef : undefined}
              size="small"
              sx={{ p: 0 }}
            />
            <Box component="span" className="SelectionGroup-label" sx={{ fontSize: "0.875rem", flex: 1 }}>
              {option.label}
            </Box>
            {renderOptionEnd?.(option.value)}
          </SelectionGroup>
        ))}
      </RadioGroup>
      {helperText && <FormHelperText id={helperId}>{helperText}</FormHelperText>}
    </FormControl>
  );
}
