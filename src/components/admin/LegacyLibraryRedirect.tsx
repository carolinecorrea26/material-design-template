import { Navigate, useLocation } from 'react-router-dom';
import navigation from '../../../requirements/global/navigation.json';
import { libraryHref } from '../../pages/admin/library/LibraryLink';

/** URL compatibility only: all content and inspection belong to the current Library. */
export default function LegacyLibraryRedirect({ pageId }: { pageId: keyof typeof navigation.libraryRedirects }) {
  const location = useLocation();
  const target = navigation.libraryRedirects[pageId] as { domain: string; anchors?: Record<string, string> };
  const search = new URLSearchParams(location.search);
  if (!search.has('site') && search.has('client')) search.set('site', search.get('client')!);
  const domain = target.anchors?.[location.hash.slice(1)] ?? target.domain;
  return <Navigate replace to={libraryHref(domain, search)} />;
}
