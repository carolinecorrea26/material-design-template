import { matchPath } from 'react-router-dom';
import { invalidCoverageEntryPage } from '../config/client/coverageCategoryScope';
import { getConfiguredPages, getPagePath } from '../config/pages';
import type { Page } from '../domain/pages';

export const acceptsCoverageEntry = (page: Page) => page.type !== 'error' && page.flow !== 'internal';

export function coverageEntryRedirect(params: URLSearchParams) {
  const errorPage = invalidCoverageEntryPage(params);
  if (!errorPage) return null;
  const context = new URLSearchParams();
  for (const key of ['site', 'client']) {
    const value = params.get(key);
    if (value) context.set(key, value);
  }
  return getPagePath(errorPage) + (context.size ? `?${context}` : '');
}

/** Reject invalid initial links before form startup reads or saves campaign state. */
export function normalizeInitialCoverageEntry(url: URL, base: string, standalone: boolean) {
  if (standalone && !url.hash.startsWith('#/')) return null;
  const route = standalone ? new URL(url.hash.slice(1), url) : url;
  const baseUrl = new URL(base, url);
  const basePath = standalone ? '/' : baseUrl.pathname;
  if (!route.pathname.toLowerCase().startsWith(basePath.toLowerCase())) return null;
  const topLevel = standalone ? coverageEntryRedirect(url.searchParams) : null;
  const destination = coverageEntryRedirect(route.searchParams) ?? topLevel;
  if (!destination) return null;
  const pathname = '/' + route.pathname.slice(basePath.length);
  if (!getConfiguredPages().some(page => acceptsCoverageEntry(page) && matchPath(page.path, pathname))) return null;
  if (!standalone) return new URL(destination.slice(1), baseUrl);
  const result = new URL(url);
  result.hash = destination;
  if (topLevel) result.search = new URL(topLevel, url).search;
  return result;
}
