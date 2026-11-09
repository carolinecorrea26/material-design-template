import type { ChangeEvent, ReactNode } from 'react';
import { FormControl, FormHelperText, FormLabel, TextField, type TextFieldProps } from '@mui/material';
import type { FieldDefinition } from '../../config/fields/types';
import { getLabelVariant, isFieldComplete, isFieldInError, renderCompletedAdornment, renderErrorAdornment, renderFieldLabel } from './fieldInputPresentation';

export type TextLikeFieldProps = {
  field: FieldDefinition; value: string; onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; onBlur?: () => void;
  hideLabel?: boolean; margin?: 'none' | 'dense' | 'normal'; hasError?: boolean; helperText?: ReactNode;
  type?: string; placeholder?: string; inputProps?: Record<string, unknown>; inputAdornmentProps?: TextFieldProps['InputProps'];
};
/** Internal shared text presentation used by FieldRenderer and PhoneField. */
export function TextLikeField({ field, value, onChange, onBlur, hideLabel = false, margin = 'normal', hasError = false, helperText, type = 'text', placeholder, inputProps, inputAdornmentProps }: TextLikeFieldProps) {
  const labelVariant = getLabelVariant(field), status = { hasError };
  const complete = !field.multiline && isFieldComplete(field, value, status);
  const showError = !field.multiline && isFieldInError(status);
  const adornments = { ...inputAdornmentProps, endAdornment: inputAdornmentProps?.endAdornment ?? (complete ? renderCompletedAdornment() : showError ? renderErrorAdornment() : undefined) };
  const input = <TextField name={field.id} label={labelVariant === 'floating' ? renderFieldLabel(field) : undefined}
    required={field.required} type={type} fullWidth margin={labelVariant === 'floating' ? margin : 'none'}
    placeholder={placeholder ?? field.placeholder} autoComplete={field.autoComplete}
    inputProps={{ inputMode: field.inputMode, minLength: field.minLength, maxLength: field.format === 'currency' ? undefined : field.maxLength, ...inputProps }}
    value={value} onChange={onChange} onBlur={onBlur} disabled={field.disabled} error={hasError}
    helperText={labelVariant === 'floating' ? helperText : undefined} multiline={field.multiline}
    minRows={field.multiline ? field.minRows ?? 3 : undefined} InputProps={adornments} />;
  return labelVariant === 'floating' ? input : <FormControl fullWidth margin={margin} error={hasError}>
    {!hideLabel && <FormLabel id={`${field.id}-label`} required={field.required} sx={{ mb: 1 }}>{renderFieldLabel(field)}</FormLabel>}
    {input}<FormHelperText>{helperText}</FormHelperText>
  </FormControl>;
}
