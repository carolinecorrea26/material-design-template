import { getPrototypeLibrary, type PrototypeLibrary } from '../domain/prototypeLibrary';
import { getHostingAssociationForSite, getEffectiveSiteConfig, getTpaForAssociation } from '../repositories/sites';
import type { SiteId } from '../domain/sites';
import { applicationSupportReference, type ApplicationSupportIds } from '../domain/applicationSupportReference';
import { readSavedApplication } from '../services/applicantSaveService';

export function resolveApplicationSupportReference(siteId: SiteId, ids: ApplicationSupportIds = {}) {
  const explicit = applicationSupportReference(ids);
  if (explicit) return explicit;
  const params = new URLSearchParams(window.location.search);
  return applicationSupportReference({ applicationId: params.get('site') === siteId ? params.get('applicationId') ?? undefined : undefined })
    ?? applicationSupportReference({ applicationId: readSavedApplication(siteId)?.applicationId });
}

export type SiteSupportContact = {
  name: string;
  acronym: string;
  phone: string;
  email: string;
  website: string;
  hideInEmail: boolean;
};

/** One contact resolution for site cards and email HTML. Email visibility stays email-specific. */
export function resolveSiteSupportContact(siteId: SiteId, library: PrototypeLibrary | null = getPrototypeLibrary(siteId)): SiteSupportContact {
  const client = library?.clientIdentity ?? getHostingAssociationForSite(siteId);
  if (!client) throw new Error(`Unknown support Site: ${siteId}`);
  const configuration = library?.client ?? getEffectiveSiteConfig(siteId);
  const support = configuration.support;
  const email = configuration.emailSupport;
  const administrator = getTpaForAssociation(client.id);
  return {
    name: email?.contactOverride?.name || administrator?.name || client.name,
    acronym: email?.contactOverride?.acronym || administrator?.acronym || client.acronym,
    phone: email?.supportOverride?.phone || support.phoneDisplay || support.phone || '',
    email: email?.supportOverride?.email || support.email || '',
    website: email?.supportOverride?.website || support.website || '',
    hideInEmail: Boolean(email?.hideContactBox),
  };
}

export function supportPhoneHref(phone: string) { return `tel:${phone.replace(/[^\d+]/g, '')}`; }
export function supportWebsiteHref(website: string) {
  const value = website.trim();
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}
