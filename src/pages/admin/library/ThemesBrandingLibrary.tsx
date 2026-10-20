import DesignFoundations from "../../../components/docs/DesignFoundations";
import { BrandingGuidelines } from "../../../components/docs/BrandingGuidelines";
import { IconsGuidelines } from "../../../components/docs/IconsGuidelines";
import IconConfigurationPreview from "../../../components/docs/IconConfigurationPreview";
import { getEffectiveSiteConfig } from "../../../data";
import { useLibraryScope } from "./LibraryScope";
import { useLibrarySite } from "./LibrarySiteSelector";
import { useState } from "react";
import { Box, Paper, Stack, Tab, Tabs, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { createAppTheme } from "../../../app/theme";
import { themeColorLabels, type ThemeColorId } from "../../../config/clients/types";
import { clientEntities, resolveEffectiveBranding, siteEntities } from "../../../data";
import ResponsiveTableContainer from "../../../components/docs/ResponsiveTableContainer";
import ThemeConfigurationPreview from "../../../components/docs/ThemeConfigurationPreview";

const presets: ThemeColorId[] = ["default", "teal", "purple", "dark-blue"];

export default function ThemesBrandingLibrary() {
  const scope = useLibraryScope();
  const [siteId] = useLibrarySite();
  const [tab, setTab] = useState("preview");
  return <Stack spacing={3}>
    <Tabs variant="scrollable" scrollButtons="auto" aria-label="Branding views" value={tab} onChange={(_, value: string) => setTab(value)} sx={{ borderBottom: 1, borderColor: "divider" }}><Tab value="preview" label="Application theme preview" /><Tab value="definitions" label="Branding definitions" /><Tab value="guidelines" label="Branding guidelines" /><Tab value="icons" label="Icons" /><Tab value="foundations" label="Design foundations" /></Tabs>
    {tab === "preview" ? (scope === "global" ? <ThemeConfigurationPreview /> : <ThemeConfigurationPreview key={siteId} client={getEffectiveSiteConfig(siteId)} />) : tab === "foundations" ? <DesignFoundations client={scope === "global" ? undefined : getEffectiveSiteConfig(siteId)} /> : tab === "guidelines" ? <BrandingGuidelines /> : tab === "icons" ? <Stack spacing={3}><IconConfigurationPreview key={`${scope}:${siteId}`} branding={getEffectiveSiteConfig(scope === "global" ? "demo" : siteId).branding} /><IconsGuidelines /></Stack> : <>
    {scope === "global" && <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>{presets.map((preset) => { const theme = createAppTheme({ type: "preset", preset }); return <Paper key={preset} variant="outlined" sx={{ p: 2, flex: 1 }}><Box sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: theme.palette.primary.main, mb: 1 }} /><Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{themeColorLabels[preset]}</Typography><Typography variant="caption" sx={{ fontFamily: "monospace" }}>{theme.palette.primary.main}</Typography></Paper>; })}</Stack>}
    {scope === "effective" && <ResponsiveTableContainer libraryTable="sites"><Table size="small"><TableHead><TableRow><TableCell>Client / Site</TableCell><TableCell>Client branding</TableCell><TableCell>Site override</TableCell><TableCell>Effective branding</TableCell><TableCell>Custom icons</TableCell><TableCell>Theme</TableCell></TableRow></TableHead><TableBody>{siteEntities.filter((site) => site.id === siteId).map((site) => { const client = clientEntities.find((entry) => entry.id === site.clientId)!; const effective = resolveEffectiveBranding({ siteId: site.id }); const theme = client.configurationDefaults.theme; return <TableRow key={site.id}><TableCell><Typography variant="body2" sx={{ fontWeight: 700 }}>{client.acronym} · {site.name}</Typography><Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>{site.id}</Typography></TableCell><TableCell>{client.branding.name}<br /><Typography variant="caption">{client.branding.logo}</Typography></TableCell><TableCell>{site.brandingOverride ? JSON.stringify(site.brandingOverride) : "—"}</TableCell><TableCell>{effective.name}<br /><Typography variant="caption">{effective.logo}</Typography></TableCell><TableCell>{effective.icons?.quickDecision ? <Stack spacing={0.5}><Box component="img" src={effective.icons.quickDecision} alt="QuickDecision" sx={{ width: 40, height: 40, objectFit: "contain" }} /><Typography variant="caption">{effective.icons.quickDecision}</Typography>{Object.entries(effective.icons.categories ?? {}).map(([category,source]) => <Stack direction="row" key={category} spacing={1}><Box component="img" src={source} alt={`${category} coverage`} sx={{width:40,height:40}}/><Typography variant="caption">{category}: {source}</Typography></Stack>)}</Stack> : "Standard lightning bolt"}</TableCell><TableCell>{theme?.type === "custom" ? theme.primary : themeColorLabels[theme?.preset ?? "default"]}</TableCell></TableRow>; })}</TableBody></Table></ResponsiveTableContainer>}
    </>}
  </Stack>;
}
