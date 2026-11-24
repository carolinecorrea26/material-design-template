import { componentDisplayName } from '../../../domain/componentDisplayNames';
import { declaredPageComponents } from '../../../domain/requirementBehaviors';
import { useMemo } from "react";
import { Box, Link, Stack, Tab, Tabs, Typography } from "@mui/material";
import { useParams, useSearchParams } from 'react-router-dom';
import BrowseTable from "../../../components/docs/BrowseTable";
import { getSitePagePrototypeUrl } from "../../../config/sitePrototype";
import { useLibraryCatalog } from "./LibraryCatalogContext";
import { pageCatalogRows } from "./pageCatalogRows";
import LibraryLink from "./LibraryLink";
import ContentLibrary from './ContentLibrary';
import { componentRoleLabels, componentRoles, componentUsages } from '../../../domain/componentCatalog';
import { getStorybookStoryUrl } from '../../../config/storybook';

export default function StoredPagesLibrary({ siteKey }: { siteKey: string }) {
  const catalog = useLibraryCatalog();
  const [search, setSearch] = useSearchParams();
  const { domainId } = useParams();
  const view = search.get('pageView') ?? (['content', 'documents'].includes(domainId ?? '') ? 'content' : 'pages');
  const rows = useMemo(() => pageCatalogRows(catalog, siteKey), [catalog, siteKey]);
  const components = (pageKey: string) => {
    const declared = declaredPageComponents(pageKey);
    return catalog.data.components.filter(row => declared.has(row.definition.name) || componentUsages(row.definition).some(usage => usage.pageKey === pageKey && usage.source.startsWith('src/pages/')) || row.definition.examples?.some(example => example.pageKey === pageKey));
  };
  return <Stack spacing={2}>
    <Tabs value={view === 'content' ? 'content' : 'pages'} onChange={(_, value: string) => setSearch(previous => { const next = new URLSearchParams(previous); next.set('pageView', value); next.delete('q'); next.delete('table'); return next; })} aria-label="Page library views">
      <Tab value="pages" label="Pages" /><Tab value="content" label="Content" />
    </Tabs>
    {view === 'content' ? <ContentLibrary siteKey={siteKey} /> : <BrowseTable label="Pages" tableName="pages" identityPosition="first" searchOnly
    rows={rows} rowKey={row => row.key} columns={[
      { id: "displayId", label: "Page ID", width: 210, value: row => row.name, render: row => row.enabled && siteKey !== 'all'
        ? <Link href={getSitePagePrototypeUrl(siteKey, row.definition.id, row.definition.path)} target="_blank" rel="noopener noreferrer">{row.name}</Link>
        : <Typography variant="body2" fontWeight={700}>{row.name}</Typography> },
      { id: "flow", label: "Flow", width: 120, value: row => row.flow, filter: true },
      { id: "requirement", label: "Requirement", width: 130, value: row => row.requirement, filter: true },
      { id: 'sections', label: 'Sections', width: 250, expandable: true, value: row => row.sections.map(section => section.display ? `${section.display.label}: ${section.components?.join(', ') ?? ''} (${section.display.templates.join(' / ')})` : section.description ?? section.id).join('\n') },
      { id: "fields", label: "Fields", width: 290, value: row => row.fieldGroups.map(group => `${group.label}:\n${group.fields.map(field => field.name).join("\n")}`).join("\n\n"), expandable: true,
        render: row => row.fieldGroups.length ? row.fieldGroups.map(group => <Box key={group.label} sx={{ mb: 1.5, "&:last-child": { mb: 0 } }}>
          <Typography variant="body2" fontWeight={700}>{group.label}</Typography>
          <Typography component="ul" variant="body2" sx={{ m: 0, pl: 2 }}>{group.fields.map(field => <li key={field.key}>
            {field.definitionKey ? <LibraryLink domain="fields" filters={{ q: field.definitionKey }}>{field.name}</LibraryLink> : field.name}
          </li>)}</Typography>
        </Box>) : "—" },
      { id: 'components', label: 'Components', width: 260, expandable: true, value: row => components(row.key).map(component => componentDisplayName(component.definition)).join('\n'), render: row => <Stack alignItems="flex-start" spacing={0.5}>
        {componentRoles.map(role => {
          const group = components(row.key).filter(component => component.definition.role === role);
          return group.length ? <Stack key={role} alignItems="flex-start" spacing={0.5}>
            <Typography variant="body2" fontWeight={700}>{componentRoleLabels[role]}</Typography>
            {group.map(component => <Link key={component.key} href={getStorybookStoryUrl(component.definition.examples?.find(example => example.pageKey === row.key)?.storyId ?? component.definition.storyId)} target="_blank" rel="noopener noreferrer">{componentDisplayName(component.definition)}</Link>)}
          </Stack> : null;
        })}
      </Stack> },
    ]} />}
  </Stack>;
}
