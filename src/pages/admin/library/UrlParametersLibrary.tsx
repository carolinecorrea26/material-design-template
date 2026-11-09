import { Stack, Typography } from '@mui/material';
import BrowseTable from '../../../components/docs/BrowseTable';
import type { LibraryCatalog } from '../../../services/libraryCatalogService';
import { useLibraryCatalog } from './LibraryCatalogContext';
import { withFreshStartCatalog } from '../../../domain/freshStartCatalog';

export function urlParameterRows(catalog: LibraryCatalog, siteKey: string) {
  const data = withFreshStartCatalog(catalog.data);
  if (siteKey !== 'all' && !data.sites.some(row => row.key === siteKey)) return [];
  return data.urlParameters.map(parameter => {
    const assignments = data.siteUrlParameters.filter(row => row.urlParameterKey === parameter.key && (siteKey === 'all' || row.siteKey === siteKey));
    return { ...parameter, values: data.urlParameterValues.filter(row => row.urlParameterKey === parameter.key).map(row => row.value),
      siteSettings: assignments.length ? assignments.map(row => `${row.siteKey}: ${row.enabled ? 'Enabled' : 'Disabled'}; default: ${row.defaultValue ?? 'Not specified'}`).join('\n') : 'No site assignment recorded',
    };
  });
}

export default function UrlParametersLibrary({ siteKey }: { siteKey: string }) {
  const catalog = useLibraryCatalog();
  return <Stack spacing={2}>
    <Typography variant="body2" color="text.secondary">Each parameter combines its behavior, allowed values and recorded site settings. A missing site assignment does not establish that a parameter is enabled or disabled.</Typography>
    <BrowseTable label="URL parameters" tableName="urlParameters" hiddenColumns={['displayId']} rows={urlParameterRows(catalog, siteKey)} rowKey={row => row.key} columns={[
      { id: 'parameter', label: 'Parameter', width: 180, value: row => row.parameter },
      { id: 'behavior', label: 'Behavior', width: 480, value: row => row.behavior },
      { id: 'values', label: 'Allowed values', width: 240, value: row => row.values.join('\n') || 'Not specified' },
      { id: 'settings', label: siteKey === 'all' ? 'Site settings' : 'Site setting / default', width: 300, value: row => row.siteSettings },
      { id: 'status', label: 'Status', width: 180, value: row => row.status, filter: true },
      { id: 'source', label: 'Source', width: 280, value: row => row.sourceReference ?? 'Source not recorded' },
    ]} />
  </Stack>;
}
