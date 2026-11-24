import { Stack, Typography } from '@mui/material';
import BrowseTable from '../../../components/docs/BrowseTable';
import { applicationFormHostingDefinition, applicationFormRows } from '../../../domain/applicationForms';
import LibraryLink from './LibraryLink';

type FormDefinition = ReturnType<typeof applicationFormRows>[number];

/** Global form definitions stay visible under effective-Site filters, like shared components. */
export default function FormsLibrary() {
  const forms = applicationFormRows();
  const internal = forms.filter(form => form.hosting === 'Internal').length;
  return <Stack spacing={2}>
    <Typography variant="body2">{forms.length} forms: {internal} internally hosted and {forms.length - internal} externally hosted. {applicationFormHostingDefinition}</Typography>
    <Typography variant="body2" color="text.secondary">This is the global template inventory, including forms that are not enabled for the selected Site. Used on identifies the containing page or component; links retain the selected Site.</Typography>
    <BrowseTable<FormDefinition> label="Forms" tableName="forms" rows={forms} rowKey={form => form.id} hiddenColumns={['displayId']} columns={[
      { id: 'form', label: 'Form', width: 250, value: form => form.name, render: form => <Typography variant="body2" fontWeight={700}>{form.name}</Typography> },
      { id: 'hosting', label: 'Hosting', width: 120, value: form => form.hosting, filter: true, tag: true },
      { id: 'usedIn', label: 'Used on', width: 200, value: form => form.placements.map(page => page.name).join(', '), filter: true, filterValues: form => form.placements.map(page => page.name), render: form => <Stack spacing={0.5}>{form.placements.map(page => <LibraryLink key={`${page.kind}:${page.key}`} domain={page.kind === "page" ? "pages" : "components"} filters={{ q: page.kind === "page" ? page.key : page.name }}>{page.name}</LibraryLink>)}</Stack> },
      { id: 'description', label: 'Description', width: 330, value: form => form.description },
    ]} />
  </Stack>;
}
