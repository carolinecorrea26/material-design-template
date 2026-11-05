import { useState } from "react";
import { Box, TextField } from "@mui/material";

const hexPattern = /^#[\da-f]{3}([\da-f]{3})?$/i;
export function ColorField({ label, color, onChange }: { label: string; color: string; onChange: (color: string) => void }) {
  const [edit, setEdit] = useState<{source: string; input: string}>();
  const input = edit?.source === color ? edit.input : undefined;
  const value = input ?? color;
  const update = (next: string) => { setEdit({source: color, input: next}); if (hexPattern.test(next)) onChange(next); };
  return <TextField size="small" label={label} value={value} onChange={event => update(event.target.value.trim())} error={input !== undefined && !hexPattern.test(input)} helperText={input !== undefined && !hexPattern.test(input) ? "Use a hex color, such as #001F5F." : undefined} slotProps={{input:{startAdornment:<Box component="input" type="color" aria-label={`${label} color picker`} value={hexPattern.test(value) ? value.length === 4 ? '#'+value.slice(1).split('').map(c=>c+c).join('') : value : '#ffffff'} onChange={event=>update(event.target.value)} sx={{width:26,height:26,p:0,mr:1,border:0,bgcolor:'transparent',cursor:'pointer',flexShrink:0}}/>}}} />;
}
