import { useState } from "react";
import { Accordion, AccordionDetails, AccordionSummary, Box, Stack, TextField, Typography } from "@mui/material";
import type { PaletteOptions, Theme } from "@mui/material/styles";
import { deepmerge } from "@mui/utils";

const basicColors = [
  ["primary", "main", "Primary"], ["secondary", "main", "Secondary"],
  ["background", "default", "Page background"], ["background", "paper", "Paper background"],
  ["text", "primary", "Primary text"], ["text", "secondary", "Secondary text"],
  ["success", "main", "Success"], ["error", "main", "Error"],
  ["warning", "main", "Warning"], ["info", "main", "Info"],
] as const;
const groups = ["primary", "secondary", "success", "error", "warning", "info", "background", "text", "action", "panel", "notice", "support"] as const;
const hexPattern = /^#[\da-f]{3}([\da-f]{3})?$/i;
function ColorField({ label, color, onChange }: { label: string; color: string; onChange: (color: string) => void }) {
  const [edit, setEdit] = useState<{source: string; input: string}>();
  const input = edit?.source === color ? edit.input : undefined;
  const value = input ?? color;
  const update = (next: string) => { setEdit({source: color, input: next}); if (hexPattern.test(next)) onChange(next); };
  return <TextField size="small" label={label} value={value} onChange={event => update(event.target.value.trim())} error={input !== undefined && !hexPattern.test(input)} helperText={input !== undefined && !hexPattern.test(input) ? "Use a hex color, such as #001F5F." : undefined} slotProps={{input:{startAdornment:<Box component="input" type="color" aria-label={`${label} color picker`} value={hexPattern.test(value) ? value.length === 4 ? '#'+value.slice(1).split('').map(c=>c+c).join('') : value : '#ffffff'} onChange={event=>update(event.target.value)} sx={{width:26,height:26,p:0,mr:1,border:0,bgcolor:'transparent',cursor:'pointer',flexShrink:0}}/>}}} />;
}
export default function ThemePaletteEditor({ theme, value, onChange }: { theme: Theme; value: PaletteOptions; onChange: (value: PaletteOptions) => void }) {
  const palette = theme.palette as unknown as Record<string, Record<string, unknown>>;
  const field = (group: string, token: string, label: string) => <ColorField key={`${group}.${token}`} label={label} color={String(palette[group][token])} onChange={color => onChange(deepmerge(value,{[group]:{[token]:color}}))}/>;
  return <Stack spacing={2}>
    <Typography variant="body2" color="text.secondary">Choose colors below to activate a custom theme. Additional palette tokens are available in Advanced colors.</Typography>
    <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2, minmax(0, 1fr))',xl:'repeat(5, minmax(0, 1fr))'},gap:2}}>{basicColors.map(([group,token,label])=>field(group,token,label))}</Box>
    <Accordion disableGutters><AccordionSummary><Typography>Advanced colors</Typography></AccordionSummary><AccordionDetails><Stack spacing={2}>
      {groups.map(group=><Box key={group}><Typography variant="subtitle2" sx={{mb:1,textTransform:'capitalize'}}>{group}</Typography><Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,minmax(0,1fr))',md:'repeat(3,minmax(0,1fr))'},gap:2}}>{Object.entries(palette[group]).filter(([,color])=>typeof color==='string').map(([token])=>field(group,token,`${group}.${token}`))}</Box></Box>)}
      <ColorField label="Divider" color={theme.palette.divider} onChange={divider=>onChange({...value,divider})}/>
    </Stack></AccordionDetails></Accordion>
  </Stack>;
}
