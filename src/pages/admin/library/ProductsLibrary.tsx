import { Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import BrowseTable from '../../../components/docs/BrowseTable';
import { resolveEffectiveSite } from '../../../domain/effectiveSite';
import { useLibraryCatalog } from './LibraryCatalogContext';
import LibraryLink from './LibraryLink';
import { readableValue } from './libraryRecordColumns';
import { storedLibraryRows } from './storedLibraryModel';

export const productDatasets = [['products', 'Products'], ['riders', 'Riders'], ['coverageCategories', 'Categories'], ['productIdentifiers', 'Identifiers'], ['productRiders', 'Rider assignments'], ['coveragePlanDefinitions', 'Plans'], ['coveragePlanVariants', 'Plan variants'], ['productCoveragePlans', 'Product plans']] as const;

export default function ProductsLibrary({ siteKey }: { siteKey: string }) {
  const catalog = useLibraryCatalog();
  const [search] = useSearchParams();
  const effective = siteKey === 'all' ? null : resolveEffectiveSite(catalog.data, siteKey);
  const rows = productDatasets.flatMap(([dataset, recordType]) => storedLibraryRows(catalog, dataset, siteKey).map(row => {
    const base = (row.definition ?? {}) as Record<string, unknown>;
    const presentation = effective?.configuration.products.find(product => product.productKey === row.key)?.presentation ?? [];
    const facts = { ...base, ...Object.fromEntries(presentation.map(item => [item.key, item.value])) };
    const product = String(row.productKey ?? (dataset === 'products' ? row.key : ''));
    return { ...row, dataset, recordType, product, name: readableValue(facts.name ?? facts.label ?? row.key),
      description: dataset === 'productIdentifiers' ? readableValue(row.definition) : readableValue(Object.fromEntries(Object.entries(facts).filter(([key]) => ['description', 'definition', 'brochureUrl', 'coverageNote', 'applicantNotes', 'productWarning', 'productContent', 'amountLabel', 'defaultSelected', 'included', 'displayAsProduct', 'hasAmount'].includes(key)))),
      scopeName: readableValue(row.siteKey ?? row.clientKey ?? row.scope ?? (siteKey === 'all' ? 'Catalog' : siteKey)),
      category: String(row.categoryKey ?? ''),
      relationships: readableValue({ ...(row.riderKey ? { rider: row.riderKey } : {}), ...(row.kind ? { identifierType: row.kind } : {}), ...(facts.groupPolicySitus ? { groupPolicySitus: facts.groupPolicySitus } : {}) }),
    };
  }));
  const linkedType = productDatasets.find(([dataset]) => dataset === search.get('dataset'))?.[1];
  return <BrowseTable label="Products & riders" tableName="products" hiddenColumns={['displayId']} rows={rows} initialFilters={linkedType ? { recordType: linkedType } : undefined} rowKey={row => `${row.dataset}:${row.id}`} columns={[
    { id: 'recordType', label: 'Record type', width: 180, value: row => row.recordType, filter: true },
    { id: 'record', label: 'Record', width: 280, value: row => `${row.name} ${row.key}`, render: row => <><Typography variant="body2" fontWeight={700}>{row.name}</Typography><Typography variant="caption" color="text.secondary">{row.key}</Typography></> },
    { id: 'category', label: 'Category', width: 140, value: row => row.category || '—', filter: true },
    { id: 'product', label: 'Product', width: 220, value: row => row.product || '—', render: row => row.product && row.dataset !== 'products' ? <LibraryLink domain="products" filters={{ dataset: 'products', q: row.product }}>{row.product}</LibraryLink> : row.dataset === 'products' ? row.name : '—' },
    { id: 'description', label: 'Description / identifiers', width: 380, value: row => row.description },
    { id: 'relationships', label: 'Relationships', width: 240, value: row => row.relationships },
    { id: 'scope', label: 'Scope', width: 180, value: row => row.scopeName, filter: true },
    { id: 'requirements', label: 'Requirements', width: 180, value: row => row.product ? 'Coverage settings' : '—', render: row => row.product ? <LibraryLink domain="coverage" filters={{ dataset: 'productApplicantEligibility', product: row.product }}>View coverage settings</LibraryLink> : '—' },
  ]} />;
}
