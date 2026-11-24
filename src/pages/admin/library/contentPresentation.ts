import pageOrder from '../../../../requirements/global/pages.json';
import { getSiteDetailsPageLabel } from '../../../config/resolvers/resolveClientPages';
import type { PageId } from '../../../types';
import type { ContentRow } from './contentRows';
import { humanize } from './libraryRecordColumns';

export type ContentPlacement = { pageKey: string; label: string };
const sharedRoots = new Set(['action', 'people', 'navigation', 'display', 'list', 'support', 'insurer', 'footer', 'help', 'physician', 'validation']);
/** Turn declared page placements into readable locations; binding paths remain search references. */
export function presentContent(row: ContentRow, pageIds = pageOrder.pages.map(page => page.id as string)) {
  const placements: ContentPlacement[] = [...new Set(row.usages.flatMap(usage => usage.pageKey ? [usage.pageKey] : []))].map(pageKey => ({ pageKey, label: getSiteDetailsPageLabel(pageKey as PageId) }));
  const root = row.key.split('.')[0];
  const directPage = row.key.startsWith('page.') ? row.key.split('.')[1] : pageIds.includes(root) ? root : row.key.startsWith('application.document-preview.') ? 'review' : undefined;
  const shared = sharedRoots.has(root) || root === 'health' || !directPage && placements.length !== 1;
  const pageKey = directPage ?? (!shared ? placements[0]?.pageKey : undefined);
  const area = root === 'health' ? 'Health · shared' : shared && !directPage ? 'Shared' : pageKey ? getSiteDetailsPageLabel(pageKey as PageId) : 'Shared';
  const location = root === 'footer' ? 'Site footer' : root === 'support' ? 'Support alert' : root === 'help' ? 'Help drawers' : root === 'people' ? 'Applicant headings and labels' : root === 'physician' ? 'Physician information' : root === 'insurer' ? 'Insurer information' : root === 'action' || root === 'navigation' || root === 'display' || root === 'list' || root === 'validation' ? 'Shared application controls' : row.uses.some(use => use.startsWith('Product:')) ? 'Product information' : 'Shared content';
  let name = row.name;
  if (row.key.startsWith('application.document-preview.')) name = `Application preview · ${humanize(row.key.slice('application.document-preview.'.length))}`;
  else if (row.key.startsWith('application.ui.')) name = humanize(row.key.slice('application.ui.'.length));
  else if (pageKey) name = humanize(row.key.replace(new RegExp(`^(?:page\\.)?${pageKey}\\.`), ''));
  else if (sharedRoots.has(root)) name = `${humanize(root)} · ${humanize(row.key.slice(root.length + 1))}`;
  const index = pageKey ? pageIds.indexOf(pageKey) : -1;
  const order = area === 'Shared' ? -1 : root === 'health' ? pageIds.indexOf('health-si') - 0.5 : index;
  const priority = /(?:^|\.)(?:title|name)$/.test(row.key) ? 0 : /(?:^|\.)(?:subhead|description|intro)$/.test(row.key) ? 1 : 2;
  return { ...row, name, area, placements, location, order, priority };
}
