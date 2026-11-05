import { Box, Button, Stack, Typography } from "@mui/material";
import BrowseTable from "../../../components/docs/BrowseTable";
import { BrandingGuidelines } from "../../../components/docs/BrandingGuidelines";
import IconConfigurationPreview from "../../../components/docs/IconConfigurationPreview";
import { getStorybookStoryUrl } from "../../../config/storybook";
import { resolveEffectiveSite } from "../../../domain/effectiveSite";
import { configurationPath, primaryConfigurationDefinitions } from "../../../domain/libraryOwnership";
import type { ClientBranding } from "../../../domain/configuration";
import { useLibraryCatalog } from "./LibraryCatalogContext";
import { useLibrarySelection } from "./LibrarySiteSelector";
import { readableValue } from "./libraryRecordColumns";

export default function ThemesBrandingLibrary() {
  const { data } = useLibraryCatalog();
  const [siteKey] = useLibrarySelection();
  const site = data.sites.find(row => row.key === siteKey);
  const effective = site ? resolveEffectiveSite(data, siteKey).configuration : null;
  const branding = effective ? Object.fromEntries(effective.branding.map(row => [row.key, row.value])) as ClientBranding : null;
  const rows = primaryConfigurationDefinitions(data.configurationDefinitions).filter(row => /^(theme|branding)(\.|$)/.test(configurationPath(row))).map(row => ({
    key: row.key, setting: configurationPath(row),
    value: readableValue(effective ? effective.configurations.filter(value => value.key === row.key).map(value => value.value) : data.configurationValues.filter(value => value.configurationKey === row.key).map(value => ({ scope: value.siteKey ?? value.clientKey ?? 'Global', value: value.value }))),
    scope: siteKey,
  }));
  if (effective) rows.unshift(...effective.branding.map(row => ({ key: `branding.${row.key}`, setting: `Branding: ${row.key}`, value: readableValue(row.value), scope: siteKey })));
  else rows.unshift(...data.brandingProfiles.map(row => ({ key: row.key, setting: 'Branding profile', value: readableValue(row.definition), scope: row.siteKey ?? row.clientKey ?? 'Global' })));
  rows.unshift({ key: 'site.templateType', setting: 'Application template', value: site ? site.templateType : data.sites.map(row => `${row.name}: ${row.templateType}`).join('\n'), scope: siteKey });
  return <Stack spacing={3}>
    <Typography variant="body2" color="text.secondary">Logo, template, colors, buttons and custom icon settings. Try appearance changes in Site Builder’s Application theme preview.</Typography>
    <Stack direction="row" gap={1} flexWrap="wrap">
      <Button component="a" href={getStorybookStoryUrl('foundations-design-foundations--foundations')} target="_blank" rel="noopener noreferrer" variant="outlined">Storybook: Design foundations</Button>
      <Button component="a" href={getStorybookStoryUrl('foundations-icons--icons')} target="_blank" rel="noopener noreferrer" variant="outlined">Storybook: Foundation icons</Button>
      <Button component="a" href={`/admin-center/site-builder?view=theme&site=${siteKey}`}>Application theme preview</Button>
    </Stack>
    {branding?.logo && <Box component="img" src={branding.logo} alt={branding.logoAlt || branding.name} sx={{ maxWidth: 280, maxHeight: 100, objectFit: 'contain', alignSelf: 'flex-start' }} />}
    <BrowseTable label="Theme & branding settings" hiddenColumns={['displayId']} rows={rows} rowKey={row => row.key} columns={[
      { id: 'setting', label: 'Setting', width: 280, value: row => row.setting },
      { id: 'value', label: site ? 'Effective value' : 'Configured values', width: 550, value: row => row.value },
      { id: 'scope', label: 'Scope', width: 180, value: row => row.scope, filter: true },
    ]} />
    {branding && <details><summary>Custom icons</summary><IconConfigurationPreview key={siteKey} branding={branding} /></details>}
    <details><summary>Branding guidelines</summary><BrandingGuidelines /></details>
  </Stack>;
}
