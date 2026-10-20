import { Stack, Typography } from '@mui/material';
import BrowseTable from '../../../components/docs/BrowseTable';
import LibraryLink from './LibraryLink';
import LibraryTag from '../../../components/docs/LibraryTag';
import { useLibraryCatalog } from './LibraryCatalogContext';

import { libraryRequirementRows } from './libraryRequirementRows';

export default function BusinessRulesLibrary({ siteKey }: { siteKey: string }) {
  const catalog = useLibraryCatalog();
  const { data } = catalog;
  const rows = libraryRequirementRows(catalog, siteKey);
  const names = new Map(data.rules.map(row => [row.key, row.definition.rule]));
  return <Stack spacing={2}>
    <Typography variant="body2" color="text.secondary">Eligibility, availability, amounts, limits, underwriting and application behavior have one owning requirement. Amount bands and options are shown with their assignment. Sequence is documentation order; it does not determine execution. Stored and planned requirements still need verification against the portal.</Typography>
    <BrowseTable label="Business rules" tableName="rules" hiddenColumns={["displayId"]} rows={rows} rowKey={row => row.id} columns={[
      { id: 'sequence', label: 'Sequence', width: 120, value: row => String(row.sequence) },
      { id: 'rule', label: 'Rule', width: 280, value: row => `${row.name} ${row.key}`, render: row => <Typography variant="body2" fontWeight={700}>{row.name}</Typography> },
      { id: 'categories', label: 'Category', width: 200, value: row => row.categories.join(', '), filter: true, filterValues: row => row.categories, render: row => <Stack spacing={0.5}>{row.categories.map(category => <LibraryTag key={category} label={category} />)}</Stack> },
      { id: 'behavior', label: 'Behavior / criteria', width: 460, value: row => row.behavior, render: row => <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{row.behavior}</Typography> },
      { id: 'site', label: 'Site / scope', width: 180, value: row => row.site, filter: true },
      { id: 'product', label: 'Product', width: 220, value: row => row.product || '—', filter: true, render: row => row.product ? <LibraryLink domain="products" filters={{ dataset: 'products', q: row.product }}>{data.products.find(product => product.key === row.product)?.definition.name ?? row.product}</LibraryLink> : '—' },
      { id: 'applicant', label: 'Applicant', width: 140, value: row => row.applicant || '—', filter: true },
      { id: 'dependsOn', label: 'Depends on', width: 260, value: row => row.dependsOn.map(key => names.get(key) ?? key).join('; ') || '—' },
      { id: 'status', label: 'Status', width: 200, value: row => row.status, filter: true },
      { id: 'source', label: 'Source', width: 280, value: row => row.source },
    ]} />
  </Stack>;
}
