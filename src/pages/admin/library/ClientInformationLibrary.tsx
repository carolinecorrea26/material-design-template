import { Box, Paper, Skeleton, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useLibraryCatalog } from './LibraryCatalogContext';
import { resolveEffectiveSite } from '../../../domain/effectiveSite';
import ResponsiveTableContainer from '../../../components/docs/ResponsiveTableContainer';

export default function ClientInformationLibrary({ siteKey }: { siteKey: string }) {
  const { data } = useLibraryCatalog();
  const site = data.sites.find(s => s.key === siteKey);
  const client = data.clients.find(c => c.id === site?.clientId);
  const organization = data.organizations.find(o => o.id === client?.organizationId);
  const profile = data.organizationProfiles.find(p => p.organizationKey === organization?.key)?.definition;
  const effective = site ? resolveEffectiveSite(data, siteKey).configuration : null;
  const branding = Object.fromEntries(effective?.branding.map(r => [r.key, r.value]) ?? []);
  const support = Object.fromEntries(effective?.support.map(r => [r.key, r.value]) ?? []);
  const contacts = profile?.administrationContacts?.filter(c => c.clientKey === client?.key) ?? [];
  const tpas = site ? data.organizations.filter(o => o.id === organization?.id) : data.organizations.filter(o => o.type.toLowerCase() === 'tpa' && !/Compatibility|not recorded/.test(o.name));
  return <Stack spacing={3}>
    <Paper variant="outlined" sx={{ p: 3 }}>
      {!client ? <Stack spacing={1}><Typography>Select a Site to view its client information.</Typography><Skeleton variant="rounded" width={180} height={65} /><Skeleton width="60%" /><Skeleton width="40%" /></Stack> : <Stack spacing={2}>
        {typeof branding.logo === 'string' && branding.logo ? <Box component="img" src={branding.logo} alt={`${client.acronym} logo`} sx={{ maxWidth: 280, maxHeight: 100, objectFit: 'contain', alignSelf: 'flex-start' }} /> : <Typography color="text.secondary">Logo not provided</Typography>}
        <Typography variant="h6">{client.name}</Typography><Typography>Acronym: {client.acronym}</Typography><Typography>Site: {site?.name}</Typography>
        <Typography variant="subtitle2">Client contact</Typography>
        {['contactName', 'email', 'phone', 'website'].map(key => support[key] ? <Typography key={key}>{key === 'contactName' ? 'Contact' : key[0].toUpperCase() + key.slice(1)}: {String(support[key])}</Typography> : null)}
        {!['contactName', 'email', 'phone', 'website'].some(key => support[key]) && <Typography color="text.secondary">Contact details not provided</Typography>}
        {contacts.map((contact, index) => <Box key={index}><Typography variant="subtitle2">Administration contact · MCR {contact.source}</Typography><Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{contact.details}</Typography></Box>)}
      </Stack>}
    </Paper>
    <Stack spacing={1}><Typography variant="h6">TPA directory</Typography><Typography variant="body2" color="text.secondary">MCR organization records and TPAs added in Site Builder. Administration contacts can vary by client.</Typography>
      <ResponsiveTableContainer><Table size="small"><TableHead><TableRow><TableCell>TPA name</TableCell><TableCell>Acronym</TableCell><TableCell>Contact</TableCell><TableCell>Clients</TableCell></TableRow></TableHead><TableBody>{tpas.sort((a, b) => a.name.localeCompare(b.name)).map(tpa => { const p = data.organizationProfiles.find(r => r.organizationKey === tpa.key)?.definition; return <TableRow key={tpa.id}><TableCell>{tpa.name}</TableCell><TableCell>{p?.acronym ?? '—'}</TableCell><TableCell>{p?.support ? [p.support.contactName, p.support.email, p.support.phone].filter(Boolean).join(' · ') : p?.administrationContacts?.length ? 'Client-specific contacts recorded in MCR' : 'Not provided in source'}</TableCell><TableCell>{data.clients.filter(c => c.organizationId === tpa.id).map(c => c.acronym).join(', ')}</TableCell></TableRow>; })}</TableBody></Table></ResponsiveTableContainer>
    </Stack>
  </Stack>;
}
