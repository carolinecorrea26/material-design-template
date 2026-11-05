import { Box, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useLibraryCatalog } from './LibraryCatalogContext';
import { resolveEffectiveSite } from '../../../domain/effectiveSite';
import ResponsiveTableContainer from '../../../components/docs/ResponsiveTableContainer';

export default function ClientInformationLibrary({ siteKey }: { siteKey: string }) {
  const { data } = useLibraryCatalog();
  const sites = data.sites.filter(site => (siteKey === 'all' || site.key === siteKey) && !site.deletedAt && site.status === 'active');
  const rows = sites.map(site => {
    const client = data.clients.find(row => row.id === site.clientId);
    const tpa = data.organizations.find(row => row.id === client?.organizationId);
    const profile = data.organizationProfiles.find(row => row.organizationKey === tpa?.key)?.definition;
    const effective = resolveEffectiveSite(data, site.key).configuration;
    return {
      site, client, tpa, profile,
      branding: Object.fromEntries(effective.branding.map(row => [row.key, row.value])),
      support: Object.fromEntries(effective.support.map(row => [row.key, row.value])),
      contacts: profile?.administrationContacts?.filter(contact => contact.clientKey === client?.key) ?? [],
      associations: data.associationEntities.filter(row => row.id === site.hostingAssociationId || data.siteAssociationContexts.some(context => context.siteId === site.id && context.associationId === row.id)),
    };
  });
  return <ResponsiveTableContainer>
    <Table size="small" aria-label="Client information" sx={{ minWidth: 640, tableLayout: 'fixed', '& td': { verticalAlign: 'top', overflowWrap: 'anywhere' } }}>
      <TableHead><TableRow><TableCell>Client / Site</TableCell><TableCell>TPA information</TableCell><TableCell>Association information</TableCell><TableCell>Client contact</TableCell></TableRow></TableHead>
      <TableBody>{rows.map(({ site, client, tpa, profile, branding, support, contacts, associations }) => <TableRow key={site.key}>
        <TableCell><Stack spacing={1}>
          {typeof branding.logo === 'string' && branding.logo && <Box component="img" src={branding.logo} alt={`${client?.acronym ?? site.name} logo`} sx={{ width: 180, maxWidth: '100%', maxHeight: 65, objectFit: 'contain', alignSelf: 'flex-start' }} />}
          <Typography variant="body2" fontWeight={700}>{client?.name ?? 'Client not recorded'}</Typography>
          <Typography variant="body2">Acronym: {client?.acronym ?? 'Not recorded'}</Typography>
          <Typography variant="body2">Site: {site.name}</Typography>
          <Typography variant="caption" color="text.secondary">{site.key}</Typography>
        </Stack></TableCell>
        <TableCell><Stack spacing={1}>
          <Typography variant="body2" fontWeight={700}>{tpa?.name ?? 'TPA not recorded'}</Typography>
          {profile?.acronym && <Typography variant="body2">{profile.acronym}</Typography>}
          {profile?.support && <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{[profile.support.contactName, profile.support.phone, profile.support.email].filter(Boolean).join('\n')}</Typography>}
          {contacts.map((contact, index) => <Box key={index}><Typography variant="caption" color="text.secondary">Administration contact · MCR {contact.source}</Typography><Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{contact.details}</Typography></Box>)}
        </Stack></TableCell>
        <TableCell><Stack spacing={1}>{associations.length ? associations.map(association => <Box key={association.id}><Typography variant="body2" fontWeight={700}>{association.name}</Typography><Typography variant="caption" color="text.secondary">{association.kind} · {association.status}</Typography></Box>) : <Typography variant="body2">No association information recorded.</Typography>}</Stack></TableCell>
        <TableCell><Stack spacing={0.5}>{['contactName', 'email', 'phone', 'website'].some(key => support[key]) ? ['contactName', 'email', 'phone', 'website'].map(key => support[key] ? <Typography key={key} variant="body2">{key === 'contactName' ? 'Contact' : key[0].toUpperCase() + key.slice(1)}: {String(support[key])}</Typography> : null) : <Typography variant="body2">Contact details not provided.</Typography>}</Stack></TableCell>
      </TableRow>)}{!rows.length && <TableRow><TableCell colSpan={4}>No client information recorded for this scope.</TableCell></TableRow>}</TableBody>
    </Table>
  </ResponsiveTableContainer>;
}
