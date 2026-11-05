import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack, Typography } from '@mui/material';
import ComponentCatalogTable from '../components/docs/ComponentCatalogTable';
import { componentCatalog } from '../content/docs/components';
import { componentRoleLabels, componentRoles, reusableComponents } from '../domain/componentCatalog';

const rows = componentCatalog.map((row, position) => ({ id: row.id, key: row.id, position, definition: { ...row, storybookPath: `?path=/story/${row.storyId}` } }));
const localStoryUrl = (storyId: string) => `./?path=/story/${storyId}`;

const meta = {
  title: 'Reference/Component inventory',
  id: 'component-reuse',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;
export default meta;

/** An index of canonical examples, not duplicate stories or definitions. */
export const Catalog: StoryObj = {
  name: 'Used in multiple places',
  render: () => <Stack spacing={2} sx={{ p: { xs: 2, md: 4 } }}>
    <Typography variant="h1">Components used in multiple places</Typography>
    <Typography>One definition per component, classified as application frame, page section or shared piece. Reuse is derived separately from production placements. Contains links and internal parts explain composition; conditional variants are included.</Typography>
    <ComponentCatalogTable reusable storyUrl={localStoryUrl} catalog={rows} rows={reusableComponents(rows)} />
  </Stack>,
};

export const Structure: StoryObj = {
  name: 'All components',
  render: () => <Stack spacing={3} sx={{ p: { xs: 2, md: 4 } }}>
    <Typography variant="h1">Component structure</Typography>
    <Typography>Application frame → page sections → shared pieces describes ownership. Components are browsed by function; Components → Pages shows their application composition. This inventory reads the same saved definitions and example links as the application.</Typography>
    <Typography>The prototype composes these React implementations with saved Site settings, fields, content and flow rules. Contains records direct registered source dependencies, including conditional paths. Slots and named exports stay within their owning component, and page examples demonstrate usage without creating new definitions.</Typography>
    {componentRoles.map(role => <Stack spacing={1} key={role}>
      <Typography variant="h2">{componentRoleLabels[role]}</Typography>
      <ComponentCatalogTable label={componentRoleLabels[role]} storyUrl={localStoryUrl} catalog={rows} rows={rows.filter(row => row.definition.role === role)} />
    </Stack>)}
  </Stack>,
};
