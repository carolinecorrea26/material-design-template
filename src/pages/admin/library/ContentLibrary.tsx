import { Stack, Typography } from '@mui/material';
import BrowseTable from '../../../components/docs/BrowseTable';
import { useLibraryCatalog } from './LibraryCatalogContext';
import { contentRows } from './contentRows';
import { readableValue } from './libraryRecordColumns';
import LibraryLink from './LibraryLink';

export default function ContentLibrary({ siteKey }: { siteKey: string }) {
  const catalog = useLibraryCatalog();
  const rows = contentRows(catalog, siteKey);
  return <Stack spacing={1.5}>
    <Typography variant="body2" color="text.secondary">Content used by the global site template, with inherited or overridden Site values. “Used in” shows its pages, shared components and display conditions. Open “Content record” for its JSON owner and references. Field labels and choices are in Fields; email previews are in Emails.</Typography>
    <BrowseTable label="Content" tableName="content" initialFilters={{ channel: 'Site' }} hiddenColumns={['displayId']} rows={rows} rowKey={row => row.key} columns={[
      { id: 'area', label: 'Page / area', width: 150, value: row => row.area, filter: true },
      { id: 'content', label: 'Content', width: 240, value: row => `${row.name} ${row.key} ${row.sourceFile ?? ''} ${row.overrideFile ?? ''} ${row.references.join(' ')}`, render: row => <Stack spacing={0.75}><Typography variant="body2" fontWeight={600}>{row.name}</Typography><details><summary>Content record</summary><Typography variant="caption" component="div">Global owner: {row.sourceFile}<br />Key: {row.key}</Typography>{row.overrideFile && <Typography variant="caption" component="div">Site override: {row.overrideFile}</Typography>}<Typography variant="caption" component="div">References: {row.references.join(', ')}</Typography></details></Stack> },
      { id: 'uses', label: 'Used in', width: 330, expandable: true,
        value: row => row.usages.map(usage => [row.placements.find(page => page.pageKey === usage.pageKey)?.label, usage.location === 'Page content' ? row.name : usage.location, usage.component, usage.when].filter(Boolean).join(' › ')).join('\n'),
        render: row => <Stack spacing={1}>{row.usages.map((usage, index) => <Stack key={index} spacing={0.25}>
          <Typography variant="body2">{usage.pageKey && <><LibraryLink domain="pages" filters={{ q: usage.pageKey }}>{row.placements.find(page => page.pageKey === usage.pageKey)?.label}</LibraryLink>{' › '}</>}{usage.location === 'Page content' ? row.name : usage.location}</Typography>
          {usage.component && <Typography variant="caption"><LibraryLink domain="components" filters={{ q: usage.component }}>{usage.component}</LibraryLink></Typography>}
          {usage.when && <Typography variant="caption" color="text.secondary">{usage.when}</Typography>}
        </Stack>)}</Stack> },
      { id: 'channel', label: 'Channel', width: 120, value: row => [...new Set(row.usages.map(usage => usage.channel))].join(', '), filterValues: row => [...new Set(row.usages.map(usage => usage.channel))], filter: true },
      { id: 'default', label: 'Global default', width: 420, expandable: true, value: row => readableValue(row.defaultValue) },
      ...(siteKey === 'all' ? [] : [{ id: 'effective', label: 'Effective Site value', width: 420, expandable: true, value: (row: typeof rows[number]) => readableValue(row.value) }, { id: 'resolution', label: 'Resolution', width: 140, value: (row: typeof rows[number]) => row.status }]),
      { id: 'configuration', label: 'Wording configuration', width: 210, value: row => row.configurable ? 'Site wording override supported' : 'Global wording' },
    ]} />
  </Stack>;
}
