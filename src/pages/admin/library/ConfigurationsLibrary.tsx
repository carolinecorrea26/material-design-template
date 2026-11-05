import { Stack, Tab, Tabs, Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import BrowseTable from '../../../components/docs/BrowseTable';
import { useLibraryCatalog } from './LibraryCatalogContext';
import { configurationRows, type ConfigurationInspectionRow } from './configurationRows';
import { ownerLabels } from '../../../domain/libraryOwnership';
import LibraryLink from './LibraryLink';
import { GlobalEmailConfigurationTable, ClientEmailConfigurationTable } from '../../../components/docs/EmailConfigurationTable';
import BusinessRulesLibrary from './BusinessRulesLibrary';
import ProductsLibrary, { productDatasets } from './ProductsLibrary';
import ThemesBrandingLibrary from './ThemesBrandingLibrary';
import UrlParametersLibrary from './UrlParametersLibrary';
import RuleCoverageLibrary from './RuleCoverageLibrary';
import StoredLibraryDomain from './StoredLibraryDomain';
import { TemplateChangeReference } from '../../../docs/ProjectOverview';
import { libraryApplicantLabel } from './libraryApplicants';

function configurationType(row: ConfigurationInspectionRow) {
  if (/applicant.?labels|applicant.?experience/i.test(row.key)) return 'applicants';
  if (row.owner === 'themes' || row.key === 'site.templateType') return 'theme';
  if (row.owner === 'products' || row.owner === 'rules' || /coverage|products|premium/i.test(row.group)) return 'coverage';
  if (row.owner === 'client-information' || /support|contact/i.test(row.group)) return 'contacts';
  return 'portal';
}

function SettingsTable({ rows, siteKey }: { rows: ConfigurationInspectionRow[]; siteKey: string }) {
  if (!rows.length) return null;
  return <BrowseTable label="Configurations" tableName="configurationDefinitions" hiddenColumns={['displayId']} rows={rows} rowKey={row => row.key} columns={[
    { id: 'name', label: 'Setting', width: 260, value: row => row.name },
    { id: 'description', label: 'Description', width: 440, value: row => row.description },
    { id: 'group', label: 'Category', width: 180, value: row => row.group, filter: true, tag: true },
    { id: 'values', label: siteKey === 'all' ? 'Configured values' : 'Effective value', width: 320, value: row => row.values, render: row => row.owner === 'configurations' ? row.values : <LibraryLink domain={row.owner === 'rules' ? 'coverage' : row.owner} filters={{ ...(row.owner === 'rules' ? { dataset: 'configurationValues' } : {}), q: row.referenceKey }}>{row.owner === 'rules' ? 'Coverage settings' : ownerLabels[row.owner]}</LibraryLink> },
    { id: 'options', label: 'Options', width: 260, value: row => row.options },
    { id: 'scope', label: 'Scope', width: 180, value: row => row.scope, filter: true, tag: true },
    { id: 'usedIn', label: 'Used in', width: 240, value: row => row.usedIn },
    { id: 'source', label: 'Source', width: 280, value: row => row.source },
  ]} />;
}

const views = [['applicants', 'Applicants'], ['coverage', 'Coverage'], ['theme', 'Theme & branding'], ['portal', 'Portal settings'], ['contacts', 'Email contacts'], ['url-parameters', 'URL parameters'], ['features', 'Features']];

export default function ConfigurationsLibrary({ siteKey, domain }: { siteKey: string; domain?: string }) {
  const catalog = useLibraryCatalog();
  const [search, setSearch] = useSearchParams();
  const { data } = catalog;
  const requested = search.get('view') ?? (domain === 'themes' || domain === 'templates' ? 'theme' : domain === 'products' || domain === 'coverage' || domain === 'coverage-review' ? 'coverage' : domain === 'url-parameters' || domain === 'features' ? domain : 'portal');
  const view = views.some(([id]) => id === requested) ? requested : 'portal';
  const coverageView = search.get('coverageView') ?? (domain === 'coverage-review' ? 'review' : domain === 'products' || domain === 'coverage' && (!search.get('dataset') || productDatasets.some(([table]) => table === search.get('dataset'))) ? 'products' : 'settings');
  const rows = configurationRows(catalog, siteKey).filter(row => configurationType(row) === view);
  const assignments = data.siteProductApplicants.filter(row => siteKey === 'all' || row.siteKey === siteKey);
  const applicants = [...new Set(assignments.map(row => row.applicantKey))].map(key => ({ key, label: libraryApplicantLabel(key) ?? key, products: [...new Set(assignments.filter(row => row.applicantKey === key).map(row => data.products.find(product => product.key === row.productKey)?.definition.name ?? row.productKey))].join('\n') }));
  return <Stack spacing={3}>
    <Tabs value={view} aria-label="Configuration types" variant="scrollable" scrollButtons="auto" onChange={(_, next: string) => setSearch({ site: siteKey, view: next })}>
      {views.map(([id, label]) => <Tab key={id} value={id} label={label} />)}
    </Tabs>
    {view === 'applicants' ? <>
      <BrowseTable label="Applicant types" hiddenColumns={['displayId']} rows={applicants} rowKey={row => row.key} columns={[
        { id: 'name', label: 'Applicant', width: 260, value: row => row.label },
        { id: 'key', label: 'Role', width: 180, value: row => row.key },
        { id: 'products', label: 'Assigned products', width: 450, value: row => row.products },
      ]} />
      <SettingsTable rows={rows} siteKey={siteKey} />
      <BusinessRulesLibrary siteKey={siteKey} view="applicants" />
    </> : view === 'coverage' ? <>
      <Tabs value={coverageView} aria-label="Coverage configuration views" variant="scrollable" scrollButtons="auto" onChange={(_, next: string) => setSearch({ site: siteKey, view: 'coverage', coverageView: next })}>
        <Tab value="products" label="Products & riders" /><Tab value="settings" label="Eligibility, amounts & policies" /><Tab value="review" label="Coverage review" />
      </Tabs>
      {coverageView === 'products' ? <ProductsLibrary siteKey={siteKey} /> : coverageView === 'review' ? <RuleCoverageLibrary siteKey={siteKey} /> : <><SettingsTable rows={rows} siteKey={siteKey} /><BusinessRulesLibrary siteKey={siteKey} view="coverage" /></>}
    </> : view === 'theme' ? <ThemesBrandingLibrary /> : view === 'url-parameters' ? <UrlParametersLibrary siteKey={siteKey} /> : view === 'features' ? <><StoredLibraryDomain domain="features" siteKey={siteKey} /><details><summary>Template change reference</summary><TemplateChangeReference /></details></> : view === 'contacts' ? <>
      <SettingsTable rows={rows} siteKey={siteKey} />
      <Typography variant="h6">Email contact settings</Typography>
      {siteKey === 'all' ? <GlobalEmailConfigurationTable /> : <ClientEmailConfigurationTable siteId={siteKey} />}
    </> : <>
    <SettingsTable rows={rows} siteKey={siteKey} />
    </>}
  </Stack>;
}
