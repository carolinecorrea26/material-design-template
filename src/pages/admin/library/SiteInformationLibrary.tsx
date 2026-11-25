import { Box, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useLibraryCatalog } from './LibraryCatalogContext';
import { resolveCompiledEffectiveSite } from '../../../domain/effectiveSite';
import type { ClientSupportContact } from '../../../domain/configuration';
import ResponsiveTableContainer from '../../../components/docs/ResponsiveTableContainer';

function ContactDetails({ support, fallback }: { support?: ClientSupportContact; fallback?: string }) {
  const { website, email, phone, address, contactName } = support ?? {};
  const mailingAddress = address && [address.street, address.unit, address.city, address.state, address.zip].filter(Boolean).join(', ');
  const details = [['Website', website], ['Email', email], ['Phone', phone], ['Address', mailingAddress], ['Contact', contactName]];
  return <Stack spacing={0.5}>
    {details.filter(([, value]) => value).map(([label, value]) => <Typography key={label} variant="body2">{label}: {value}</Typography>)}
    {fallback && !details.some(([, value]) => value) && <Typography variant="body2">{fallback}</Typography>}
  </Stack>;
}

export default function SiteInformationLibrary({ siteKey }: { siteKey: string }) {
  const { data } = useLibraryCatalog();
  const sites = data.sites.filter(site => (siteKey === 'all' || site.key === siteKey) && !site.deletedAt && site.status === 'active');
  const rows = sites.map(site => {
    const hostingAssociation = data.associationEntities.find(row => row.id === site.hostingAssociationId);
    const tpa = data.organizations.find(row => row.id === hostingAssociation?.organizationId);
    const profile = data.organizationProfiles.find(row => row.organizationKey === tpa?.key)?.definition;
    const effective = resolveCompiledEffectiveSite(data, site.key).configuration;
    return {
      site, hostingAssociation, tpa, profile,
      branding: Object.fromEntries(effective.branding.map(row => [row.key, row.value])),
      support: Object.fromEntries(effective.support.map(row => [row.key, row.value])) as ClientSupportContact,
      contacts: profile?.administrationContacts?.filter(contact => contact.hostingAssociationKey === hostingAssociation?.key) ?? [],
      associations: data.associationEntities.filter(row => row.id === site.hostingAssociationId || data.siteAssociationContexts.some(context => context.siteId === site.id && context.associationId === row.id)),
    };
  });
  return <ResponsiveTableContainer>
    <Table size="small" aria-label="Site information" sx={{ minWidth: 640, tableLayout: 'fixed', '& td': { verticalAlign: 'top', overflowWrap: 'anywhere' } }}>
      <TableHead><TableRow><TableCell>Hosting Association / Site</TableCell><TableCell>TPA information</TableCell><TableCell>Association contexts</TableCell><TableCell>Association contact</TableCell></TableRow></TableHead>
      <TableBody>{rows.map(({ site, hostingAssociation, tpa, profile, branding, support, contacts, associations }) => <TableRow key={site.key}>
        <TableCell><Stack spacing={1}>
          {typeof branding.logo === 'string' && branding.logo && <Box component="img" src={branding.logo} alt={`${hostingAssociation?.acronym ?? site.name} logo`} sx={{ width: 180, maxWidth: '100%', maxHeight: 65, objectFit: 'contain', alignSelf: 'flex-start' }} />}
          <Typography variant="body2" fontWeight={700}>{hostingAssociation?.name ?? 'Association unavailable'}</Typography>
          <Typography variant="body2">Acronym: {hostingAssociation?.acronym ?? 'Not recorded'}</Typography>
          <Typography variant="body2">Site: {site.name}</Typography>
          <Typography variant="caption" color="text.secondary">{site.key}</Typography>
        </Stack></TableCell>
        <TableCell><Stack spacing={1}>
          {profile?.branding?.logo && <Box component="img" src={profile.branding.logo} alt={profile.branding.logoAlt ?? `${tpa?.name ?? 'TPA'} logo`} sx={{ maxWidth: 160, maxHeight: 56, objectFit: 'contain', alignSelf: 'flex-start' }} />}
          <Typography variant="body2" fontWeight={700}>{tpa?.name ?? 'TPA not recorded'}</Typography>
          {profile?.acronym && <Typography variant="body2">{profile.acronym}</Typography>}
          {profile?.support && <ContactDetails support={profile.support} />}
          {contacts.map((contact, index) => <Box key={index}><Typography variant="caption" color="text.secondary">Administration contact</Typography><Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{contact.details}</Typography></Box>)}
        </Stack></TableCell>
        <TableCell><Stack spacing={1}>{associations.length ? associations.map(association => <Box key={association.id}><Typography variant="body2" fontWeight={700}>{association.name}</Typography><Typography variant="caption" color="text.secondary">{association.kind} · {association.status}</Typography></Box>) : <Typography variant="body2">No association information recorded.</Typography>}</Stack></TableCell>
        <TableCell><ContactDetails support={support} fallback="Contact details not provided." /></TableCell>
      </TableRow>)}{!rows.length && <TableRow><TableCell colSpan={4}>No Site information recorded for this scope.</TableCell></TableRow>}</TableBody>
    </Table>
  </ResponsiveTableContainer>;
}
