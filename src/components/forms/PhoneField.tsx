import { Box, InputAdornment, MenuItem, Select } from '@mui/material';
import type { TextLikeFieldProps } from './TextLikeField';
import { TextLikeField } from './TextLikeField';
import { formatPhone } from '../../utils/formatPhone';
import { isFieldComplete, isFieldInError, renderCompletedIcon, renderErrorIcon } from './fieldInputPresentation';

export type PhoneFieldProps = Omit<TextLikeFieldProps, 'value' | 'onChange' | 'type' | 'inputAdornmentProps'> & {
  value: string; onChange: (value: string) => void;
  typeField?: TextLikeFieldProps['field']; typeValue?: string; onTypeChange?: (value: string) => void; onTypeBlur?: () => void; typeError?: string;
};
/** Controlled number/type composition. Every value is bound explicitly by its caller. */
export default function PhoneField({ field, value, onChange, typeField, typeValue = '', onTypeChange, onTypeBlur, typeError, hasError = false, helperText, ...props }: PhoneFieldProps) {
  if (typeField?.id === field.id) throw new Error('Phone number and type require distinct field IDs');
  const status = { hasError: hasError || Boolean(typeError) };
  const complete = isFieldComplete(field, value, status), showError = isFieldInError(status);
  const indicatorSx = { position: 'absolute', left: -28, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' };
  return <TextLikeField {...props} field={field} type="tel" value={value} onChange={event => onChange(formatPhone(event.target.value))}
    hasError={status.hasError} helperText={hasError ? helperText : typeError ?? helperText ?? field.helperText}
    inputAdornmentProps={typeField ? { endAdornment: <InputAdornment position="end"><Box sx={{ position: 'relative' }}>
      {complete ? renderCompletedIcon(indicatorSx) : showError ? renderErrorIcon(indicatorSx) : null}
      <Select data-analytics-field={typeField.id} id={typeField.id} name={typeField.id} value={typeValue} onChange={event => onTypeChange?.(String(event.target.value))} onBlur={onTypeBlur}
        disabled={field.disabled || typeField.disabled} required={typeField.required} error={Boolean(typeError)}
        inputProps={{ 'aria-label': typeField.label }} variant="standard" disableUnderline sx={{ minWidth: 92, ml: 1, '& .MuiSelect-select': { py: 0.5 } }}>
        {typeField.options?.map(option => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
      </Select>
    </Box></InputAdornment> } : undefined} />;
}
