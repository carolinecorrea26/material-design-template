import { Stack, Typography } from '@mui/material';
import BrowseTable from '../../../components/docs/BrowseTable';
import { useLibraryCatalog } from './LibraryCatalogContext';
import { configurationRows } from './configurationRows';
import { ownerLabels } from '../../../domain/libraryOwnership';
import LibraryLink from './LibraryLink';
import { GlobalEmailConfigurationTable, ClientEmailConfigurationTable } from '../../../components/docs/EmailConfigurationTable';

export default function ConfigurationsLibrary({ siteKey }: { siteKey: string }) {
  const catalog = useLibraryCatalog();
  const { data } = catalog;
  const site = data.sites.find(site => site.key === siteKey);
  const rows = configurationRows(catalog, siteKey);
  return <Stack spacing={3}>
    <BrowseTable label="Configurations" tableName="configurationDefinitions" hiddenColumns={["displayId"]} rows={rows} rowKey={row => row.key} columns={[
      { id: 'name', label: 'Setting', width: 260, value: row => row.name },
      { id: 'description', label: 'Description', width: 440, value: row => row.description },
      { id: 'group', label: 'Category', width: 180, value: row => row.group, filter: true, tag: true },
      { id: 'values', label: site ? 'Effective value' : 'Configured values', width: 320, value: row => row.values, render: row => row.owner === 'configurations' ? row.values : <LibraryLink domain={row.owner} filters={{ q: row.referenceKey }}>{ownerLabels[row.owner]}</LibraryLink> },
      { id: 'options', label: 'Options', width: 260, value: row => row.options },
      { id: 'scope', label: 'Scope', width: 180, value: row => row.scope, filter: true, tag: true },
      { id: 'usedIn', label: 'Used in', width: 240, value: row => row.usedIn },
      { id: 'source', label: 'Source', width: 280, value: row => row.source },
    ]} />
    <Typography variant="h6">Email contact settings</Typography>
    {siteKey === 'all' ? <GlobalEmailConfigurationTable /> : <ClientEmailConfigurationTable siteId={siteKey} />}
  </Stack>;
}
