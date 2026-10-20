import { useState } from "react";
import { Stack, TextField, Typography } from "@mui/material";
import type { ClientBranding } from "../../domain/configuration";
import { ClientIconContext } from "../ui/ClientIconContext";
import QuickDecisionIcon from "../ui/QuickDecisionIcon";
import { coverageCategories } from "../../config/coverageCategories";

export default function IconConfigurationPreview({branding}:{branding:ClientBranding}) {
  const [icons,setIcons] = useState<ClientBranding["icons"]>(branding.icons ?? {});
  return <Stack spacing={2}>
    <Typography variant="h6" component="h2">Client icon overrides</Typography>
    <Typography variant="body2" color="text.secondary">Preview custom asset URLs for QD and each coverage category. Empty values use the standard icon. Preview changes do not save client configuration.</Typography>
    <ClientIconContext value={{...branding,icons}}><Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap><Stack alignItems="center"><QuickDecisionIcon sx={{fontSize:48}}/><Typography>QD</Typography></Stack>{coverageCategories.map(category=><Stack key={category.id} alignItems="center"><category.icon sx={{fontSize:48}}/><Typography>{category.label}</Typography></Stack>)}</Stack></ClientIconContext>
    <TextField size="small" label="QuickDecision icon URL" value={icons?.quickDecision ?? ""} onChange={event=>setIcons(previous=>({...previous,quickDecision:event.target.value}))}/>
    {coverageCategories.map(category=><TextField key={category.id} size="small" label={`${category.id} — ${category.label} icon URL`} value={icons?.categories?.[category.id] ?? ""} onChange={event=>setIcons(previous=>({...previous,categories:{...previous?.categories,[category.id]:event.target.value}}))}/>)}
  </Stack>;
}
