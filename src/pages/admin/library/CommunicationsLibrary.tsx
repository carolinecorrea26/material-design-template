import { useMemo } from 'react';
import EmailTemplatesTable from '../../../components/docs/EmailTemplatesTable';
import { resolvePrototypeLibrary } from '../../../domain/prototypeLibrary';
import { useLibraryCatalog } from './LibraryCatalogContext';
export default function CommunicationsLibrary({ siteKey }: { siteKey: string }) {
  const catalog = useLibraryCatalog();
  const exampleSite = siteKey === 'all' ? catalog.data.sites.find(site => site.status === 'active')?.key : siteKey;
  const library = useMemo(() => exampleSite ? resolvePrototypeLibrary(catalog.data, exampleSite, catalog.revision) : null, [catalog, exampleSite]);
  return library ? <EmailTemplatesTable key={`${exampleSite}:${catalog.revision}`} siteId={library.site.siteKey} library={library} /> : null;
}
