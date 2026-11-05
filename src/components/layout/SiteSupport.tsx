import { useId } from 'react';
import { Box, Link, Stack, Typography } from '@mui/material';
import { resolveSiteId } from '../../data/activeSite';
import { resolveSiteSupportContact, resolveApplicationSupportReference, siteSupportCopy, supportPhoneHref, supportWebsiteHref, type SiteSupportContact } from '../../data/siteSupport';
import { supportReference } from '../../domain/recoveryIncident';
import type { ApplicationSupportIds } from '../../domain/applicationSupportReference';

/** Site support card shared by receipts, maintenance and error pages; email uses the same contact data and copy. */
export default function SiteSupport({ contact = resolveSiteSupportContact(resolveSiteId()), reference, applicationId, confirmationId }: ApplicationSupportIds & { contact?: SiteSupportContact; reference?: string }) {
  const headingId = useId();
  const applicationReference = resolveApplicationSupportReference(resolveSiteId(), { applicationId, confirmationId });
  const safeReference = applicationReference?.id ?? supportReference(reference);
  const emailSubject = safeReference ? `?subject=${encodeURIComponent(`Application support (${safeReference})`)}` : '';
  const hasContact = Boolean(contact.phone || contact.email || contact.website);
  if (!hasContact && !applicationReference) return null;
  return <Box component="section" aria-labelledby={headingId} sx={theme => ({ width: '100%', textAlign: 'left', p: 2.5, borderRadius: 2, bgcolor: theme.palette.background.paper, border: '1px solid', borderColor: theme.palette.divider, overflowWrap: 'anywhere' })}>
    <Stack spacing={1.5}>
      <Typography id={headingId} component="h2" variant="h6">{siteSupportCopy.title}</Typography>
      {applicationReference && <Typography variant="body2">{applicationReference.instruction}{' '}<strong>{applicationReference.id}</strong></Typography>}
      {contact.name && <Typography variant="body2" color="text.secondary">{contact.name} {siteSupportCopy.administratorSuffix}</Typography>}
      {contact.phone && <Typography variant="body2">{siteSupportCopy.callLabel}{' '}<Link href={supportPhoneHref(contact.phone)} fontWeight={700}>{contact.phone}</Link></Typography>}
      {contact.email && <Typography variant="body2">{siteSupportCopy.emailLabel}{' '}<Link href={`mailto:${contact.email}${emailSubject}`} fontWeight={700}>{contact.email}</Link></Typography>}
      {contact.website && <Typography variant="body2">{siteSupportCopy.websiteLabel}{' '}<Link href={supportWebsiteHref(contact.website)} target="_blank" rel="noopener noreferrer" fontWeight={700}>{contact.website}</Link></Typography>}
    </Stack>
  </Box>;
}
