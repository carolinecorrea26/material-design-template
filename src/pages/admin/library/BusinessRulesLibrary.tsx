import { Stack, Typography } from '@mui/material';
import BrowseTable from '../../../components/docs/BrowseTable';
import LibraryLink from './LibraryLink';
import LibraryTag from '../../../components/docs/LibraryTag';
import { useLibraryCatalog } from './LibraryCatalogContext';

import { libraryRequirementRows } from './libraryRequirementRows';
import { ruleAuthority } from '../../../domain/ruleAuthority';

export default function BusinessRulesLibrary({ siteKey, view = 'functional' }: { siteKey: string; view?: 'functional' | 'coverage' | 'applicants' }) {
  const catalog = useLibraryCatalog();
  const { data } = catalog;
  const functionalKeys = new Set(data.rules.filter(row => !['source-pattern', 'source-reference'].includes(ruleAuthority(row).kind)).map(row => row.key));
  const allRows = libraryRequirementRows(catalog, siteKey);
  for (const row of allRows) if (row.requirementsJson) functionalKeys.add(row.key);
  const rows = allRows.filter(row => view === 'functional' ? row.dataset === 'rules' && functionalKeys.has(row.key) : view === 'applicants' ? !!row.applicant || row.categories.includes('Eligibility') : row.dataset !== 'rules' || !functionalKeys.has(row.key));
  const label = view === 'functional' ? 'Business rules' : view === 'applicants' ? 'Applicant eligibility' : 'Coverage settings';
  const names = new Map(data.rules.map(row => [row.key, row.definition.rule]));
  return <Stack spacing={2}>
    <Typography variant="body2" color="text.secondary">{view === 'functional' ? 'Functional rules describe navigation, conditional actions and application behavior. Configured eligibility, amounts and coverage policies are listed in Configurations.' : 'Configured eligibility, availability, amounts, limits and policy values use the existing saved requirements. Stored policies and source references retain their verification status.'} Sequence is documentation order; it does not determine execution.</Typography>
    <BrowseTable label={label} tableName="rules" hiddenColumns={["displayId"]} rows={rows} rowKey={row => row.id} columns={[
      { id: 'sequence', label: 'Sequence', width: 120, value: row => String(row.sequence) },
      { id: 'hierarchy', label: 'Hierarchy', width: 300, value: row => (row.hierarchy ?? ['application', ...row.categories]).join(' / '), filter: true },
      { id: 'rule', label: 'Rule', width: 280, value: row => `${row.name} ${row.key}`, render: row => <Typography variant="body2" fontWeight={700}>{row.name}</Typography> },
      { id: 'categories', label: 'Category', width: 200, value: row => row.categories.join(', '), filter: true, filterValues: row => row.categories, render: row => <Stack spacing={0.5}>{row.categories.map(category => <LibraryTag key={category} label={category} />)}</Stack> },
      { id: 'behavior', label: 'Behavior / criteria', width: 460, value: row => row.behavior, render: row => <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{row.behavior}</Typography> },
      { id: 'site', label: 'Site / scope', width: 180, value: row => row.site, filter: true },
      { id: 'product', label: 'Product', width: 220, value: row => row.product || '—', filter: true, render: row => row.product ? <LibraryLink domain="products" filters={{ dataset: 'products', q: row.product }}>{data.products.find(product => product.key === row.product)?.definition.name ?? row.product}</LibraryLink> : '—' },
      { id: 'applicant', label: 'Applicant', width: 140, value: row => row.applicant || '—', filter: true },
      { id: 'dependsOn', label: 'Depends on', width: 260, value: row => row.dependsOn.map(key => names.get(key) ?? key).join('; ') || '—' },
      { id: 'status', label: 'Status', width: 200, value: row => row.status, filter: true },
      { id: 'owner', label: 'Owning record / implementation', width: 340, value: row => row.implementation ?? `${row.dataset}/${row.key}` },
      { id: 'source', label: 'Source', width: 280, value: row => row.source },
    ]} />
  </Stack>;
}
