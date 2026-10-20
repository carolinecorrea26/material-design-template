import BusinessRulesLibrary from "./BusinessRulesLibrary";
import ConfigurationsLibrary from "./ConfigurationsLibrary";
import { Stack, Tab, Tabs } from '@mui/material';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { libraryHref } from './LibraryLink';
import ProductsLibrary, { productDatasets } from './ProductsLibrary';
import UrlParametersLibrary from './UrlParametersLibrary';
import ValidationLibrary from './ValidationLibrary';
const tabs = [['rules', 'Business rules'], ['products', 'Products & riders'], ['configurations', 'Configurations'], ['url-parameters', 'URL parameters'], ['validation', 'Validations']];
export const ruleDomains = [...tabs.map(([key]) => key), 'coverage'];
export default function RulesLibrary({ domain, siteKey }: { domain: string; siteKey: string }) {
  const [search] = useSearchParams();
  const selected = domain === 'coverage' ? (!search.get('dataset') || productDatasets.some(([table]) => table === search.get('dataset')) ? 'products' : 'rules') : tabs.some(([id]) => id === domain) ? domain : 'rules';
  return <Stack spacing={2}><Tabs value={selected} variant="scrollable" scrollButtons="auto" aria-label="Rule types">{tabs.map(([id, label]) => <Tab key={id} value={id} label={label} component={RouterLink} to={libraryHref(id, search)} />)}</Tabs>{selected === 'rules' ? <BusinessRulesLibrary siteKey={siteKey} /> : selected === 'products' ? <ProductsLibrary siteKey={siteKey} /> : selected === 'configurations' ? <ConfigurationsLibrary siteKey={siteKey} /> : selected === 'validation' ? <ValidationLibrary siteKey={siteKey} /> : <UrlParametersLibrary siteKey={siteKey} />}</Stack>;
}
