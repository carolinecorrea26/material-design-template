import { useForm } from 'react-hook-form';
import { Box } from '@mui/material';
import DynamicList from '../src/components/forms/DynamicList';
import { getPrototypeLibrary } from '../src/domain/prototypeLibrary';
import { renderDisabilityCompanySummary } from '../src/components/profile/ProfileSections';
import examples from '../requirements/global/prototype-fixtures/company-records.json';

export default function CompanyRecordExample({ populated = false, maxItems, legacyOrdering = false }: { populated?: boolean; maxItems?: number; legacyOrdering?: boolean }) {
  const collection = getPrototypeLibrary()?.fieldCollections.selfDisabilityCompanies;
  if (!collection) throw new Error('Missing fresh-start disability-company collection');
  const mapping = collection.mapping;
  const { control } = useForm<Record<string, unknown>>({
    defaultValues: { [collection.name]: populated ? structuredClone(examples.companies) : [] },
  });
  return <Box sx={{ maxWidth: 480 }}>
    <DynamicList
      control={control}
      name={collection.name}
      label={collection.label}
      mapping={legacyOrdering ? { ...mapping, gridFields: mapping.fields.slice(0, 2).map(field => field.id) } : mapping}
      renderItem={renderDisabilityCompanySummary}
      getItemLabel={item => item.company}
      maxItems={maxItems ?? collection.maxItems}
    />
  </Box>;
}

