import BrowseTable from '../../../components/docs/BrowseTable';
import { flagOwner } from '../../../domain/libraryOwnership';
import { useLibraryCatalog } from './LibraryCatalogContext';
import { requirementValue } from './libraryRequirementRows';

export default function ApplicationStateLibrary() {
  const { data } = useLibraryCatalog();
  const rows = data.flagDefinitions.filter(row => flagOwner(row.persistence) === 'flows');
  if (!rows.length) return null;
  return <BrowseTable label="Application state" tableName="flagDefinitions" hiddenColumns={['displayId']} rows={rows} rowKey={row => row.key} acceptUrlFilters={false} columns={[
    { id: 'name', label: 'State / decision', width: 240, value: row => `${row.name}\n${row.key}` },
    { id: 'description', label: 'Meaning', width: 360, value: row => row.description },
    { id: 'values', label: 'Allowed values', width: 240, value: row => requirementValue(row.allowedValues) },
    { id: 'persistence', label: 'Storage', width: 160, value: row => row.persistence },
    { id: 'source', label: 'Source', width: 260, value: row => row.sourceReference ?? 'Source not recorded' },
  ]} />;
}
