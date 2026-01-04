import { FormGroup, FormControlLabel, Checkbox, FormHelperText } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import type { CoverageCat } from '../../validation/eligibility';
import { commonStyles } from '../../theme/commonStyles';

interface CoverageCheckboxGroupProps {
  name: string;
  options: CoverageCat[];
  error?: string;
}

export default function CoverageCheckboxGroup({ name, options, error }: CoverageCheckboxGroupProps) {
  const { control, setValue, watch } = useFormContext();
  const currentValues = watch(name) as CoverageCat[] | undefined;

  const handleToggle = (value: CoverageCat) => {
    const newValues = currentValues?.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...(currentValues || []), value];
    setValue(name, newValues, { shouldValidate: true });
  };

  return (
    <Controller
      name={name}
      control={control}
      render={() => (
        <>
          <FormGroup>
            {options.map((opt) => (
              <FormControlLabel
                key={opt}
                control={
                  <Checkbox
                    checked={currentValues?.includes(opt) || false}
                    onChange={() => handleToggle(opt)}
                  />
                }
                label={opt === "LI" ? "Life Insurance (LI)" : opt}
                sx={commonStyles.noVerticalMargin}
              />
            ))}
          </FormGroup>
          {error && <FormHelperText error>{error}</FormHelperText>}
        </>
      )}
    />
  );
}
