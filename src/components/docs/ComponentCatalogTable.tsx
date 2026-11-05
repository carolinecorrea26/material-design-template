import { Link, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import type { ComponentRow, ComponentUsage } from '../../persistence/types/library';
import { componentRoleLabels, componentRoles, componentUsages } from '../../domain/componentCatalog';
import { getStorybookStoryUrl } from '../../config/storybook';
import BrowseTable from './BrowseTable';

/** Both indexes project the same component records; reuse has no second copy. */
export default function ComponentCatalogTable({ rows, catalog = rows, reusable = false, renderUsage, label, storyUrl = getStorybookStoryUrl }: {
  rows: ComponentRow[];
  catalog?: ComponentRow[];
  reusable?: boolean;
  label?: string;
  storyUrl?: (storyId: string) => string;
  renderUsage?: (usage: ComponentUsage) => ReactNode;
}) {
  const componentByKey = new Map(catalog.map(row => [row.key, row]));
  const componentName = (key: string) => componentByKey.get(key)?.definition.name ?? key;
  return <Stack spacing={2}>
    <Typography variant="body2" fontWeight={700}>{rows.length} {reusable ? 'unique reusable components' : 'components'}</Typography>
    <BrowseTable label={label ?? (reusable ? 'Reusable components' : 'Components')} tableName="components" hiddenColumns={['displayId']} rows={[...rows].sort((a, b) => componentRoles.indexOf(a.definition.role) - componentRoles.indexOf(b.definition.role) || a.definition.name.localeCompare(b.definition.name))} rowKey={row => row.key} columns={[
      { id: 'name', label: 'Name', width: 230, value: row => row.definition.name },
      { id: 'description', label: 'Description', width: 340, value: row => row.definition.description, expandable: true },
      { id: 'category', label: 'Location', width: 300, value: row => row.definition.section, filter: true },
      { id: 'role', label: 'Role', width: 180, value: row => componentRoleLabels[row.definition.role], filter: true },
      { id: 'contains', label: 'Contains components', width: 260, value: row => row.definition.contains.map(componentName).join('\n'), expandable: true,
        render: row => row.definition.contains.length ? <Stack alignItems="flex-start" spacing={0.5}>{row.definition.contains.map(key => {
          const child = componentByKey.get(key);
          return child ? <Link key={key} href={storyUrl(child.definition.storyId)} target="_blank" rel="noopener noreferrer">{child.definition.name}</Link> : key;
        })}</Stack> : '—' },
      { id: 'parts', label: 'Internal parts', width: 320, value: row => row.definition.parts.map(part => `${part.name} (${part.kind}): ${part.description}`).join('\n'), expandable: true },
      { id: 'usedIn', label: 'Used in', width: 320, value: row => componentUsages(row.definition).map(usage => usage.label).join('\n'), expandable: true,
        render: row => componentUsages(row.definition).length ? <Typography component="ul" variant="body2" sx={{ m: 0, pl: 2 }}>{componentUsages(row.definition).map(usage => <li key={`${usage.pageKey}:${usage.source}`}>{renderUsage?.(usage) ?? usage.label}</li>)}</Typography> : 'No source placements recorded' },
      { id: 'usageCount', label: 'Usage count', width: 130, value: row => String(componentUsages(row.definition).length) },
      { id: 'storybook', label: 'Examples', width: 230, value: row => row.definition.storyId, render: row => <Stack alignItems="flex-start" spacing={0.5}>
        <Link href={storyUrl(row.definition.storyId)} target="_blank" rel="noopener noreferrer">Open component</Link>
        {(row.definition.examples ?? []).filter(example => example.storyId !== row.definition.storyId).map(example => <Link key={example.storyId} href={storyUrl(example.storyId)} target="_blank" rel="noopener noreferrer">{example.label}</Link>)}
      </Stack> },
    ]} />
  </Stack>;
}
