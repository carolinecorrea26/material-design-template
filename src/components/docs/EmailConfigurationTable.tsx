import { withFreshStartCatalog } from '../../domain/freshStartCatalog';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import application from '../../../requirements/global/application.json';
import { resolveCompiledPrototypeLibrary } from '../../domain/prototypeLibrary';
import { resolveSiteSupportContact } from '../../data/siteSupport';
import type { LibraryCatalog } from '../../services/libraryCatalogService';
import ResponsiveTableContainer from './ResponsiveTableContainer';

const definitions = application.records.configurationDefinitions.filter(row => row.definition.path?.[0] === 'emailSupport');
const defaults = application.records.configurationValues;
const display = (value: unknown): string => typeof value === 'boolean' ? value ? 'Hide' : 'Show'
  : value && typeof value === 'object' ? Object.entries(value).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(' · ') || 'Inherited from Site contacts'
  : String(value ?? '');

function EmailConfigurationTable({ catalog, siteId }: { catalog: LibraryCatalog; siteId?: string }) {
  const data = withFreshStartCatalog(catalog.data, siteId, catalog.siteScope);
  const library = siteId ? resolveCompiledPrototypeLibrary(data, siteId, catalog.revision) : null;
  const contact = library ? resolveSiteSupportContact(library.site.siteKey, library) : null;
  return <ResponsiveTableContainer libraryTable="configurationDefinitions"><Table size="small" aria-label="Email contact settings">
    <TableHead><TableRow><TableCell>Setting</TableCell><TableCell>Description</TableCell><TableCell>Global default</TableCell>{library && <><TableCell>Site override</TableCell><TableCell>Effective value</TableCell></>}</TableRow></TableHead>
    <TableBody>{definitions.map(row => {
      const key = row.definition.path!.at(-1)! as 'hideContactBox' | 'supportOverride' | 'contactOverride';
      const base = defaults.find(value => value.configurationKey === row.key && value.scope === 'global')?.value;
      const value = library?.client.emailSupport?.[key];
      const effective = key === 'supportOverride' && contact ? { phone: contact.phone, email: contact.email, website: contact.website }
        : key === 'contactOverride' && contact ? { name: contact.name, acronym: contact.acronym } : value ?? base;
      const overridden = data.configurationValues.some(value => value.configurationKey === row.key && value.scope === 'site' && value.siteKey === siteId);
      return <TableRow key={row.key}><TableCell>{'label' in row.definition ? String(row.definition.label) : key}</TableCell><TableCell>{'description' in row.definition ? String(row.definition.description) : ''}</TableCell><TableCell>{display(base)}</TableCell>{library && <><TableCell>{overridden ? display(value) : 'Inherited'}</TableCell><TableCell>{display(effective)}</TableCell></>}</TableRow>;
    })}</TableBody>
  </Table></ResponsiveTableContainer>;
}
export function GlobalEmailConfigurationTable({ catalog }: { catalog: LibraryCatalog }) { return <EmailConfigurationTable catalog={catalog} />; }
export function ClientEmailConfigurationTable({ siteId, catalog }: { siteId: string; catalog: LibraryCatalog }) { return <EmailConfigurationTable siteId={siteId} catalog={catalog} />; }
