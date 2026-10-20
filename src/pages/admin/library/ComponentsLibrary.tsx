import { Stack, Typography } from "@mui/material";
import { AllRoutes } from "../../../docs/PageCoverageAudit";
import { Link } from '@mui/material';
import BrowseTable from '../../../components/docs/BrowseTable';
import { getStorybookUrl } from '../../../config/storybook';
import { useLibraryCatalog } from './LibraryCatalogContext';

export default function ComponentsLibrary() {
  const { data } = useLibraryCatalog();
  return <Stack spacing={3}><Typography variant="body2" color="text.secondary">Storybook contains component examples and their states. Design foundations, accessibility guidance and site requirements are owned by Portal Library.</Typography><BrowseTable label="Components" tableName="components" hiddenColumns={["displayId"]}
    rows={data.components} rowKey={row => row.key} columns={[
      { id: 'name', label: 'Name', width: 260, value: row => row.definition.name },
      { id: 'description', label: 'Description', width: 440, value: row => row.definition.description },
      { id: 'section', label: 'Category', width: 180, value: row => row.definition.section, filter: true, tag: true },
      { id: 'storybook', label: 'Storybook', width: 180, value: row => row.definition.storyId, render: row => <Link href={getStorybookUrl(row.definition.storybookPath)} target="_blank" rel="noopener noreferrer">Open component</Link> },
    ]} /><details><summary>Recorded page composition and component coverage</summary><AllRoutes /></details></Stack>;
}
