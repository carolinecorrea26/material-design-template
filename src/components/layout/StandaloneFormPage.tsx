import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import PageShell from './PageShell';
import FormShell from './FormShell';
import PageHeader from './PageHeader';

/** Shared standalone form surface; its caller owns form state and workflow effects. */
export default function StandaloneFormPage({ title, subhead, onBack, children }: {
  title: ReactNode; subhead?: ReactNode; onBack?: () => void; children: ReactNode;
}) {
  return <Box sx={{ flex: 1, px: { xs: 2, sm: 3 }, py: { xs: 4, sm: 6 } }}>
    <PageShell title={title} maxWidth={600} noTitle>
      <FormShell sx={{ px: { xs: 2, sm: 4 }, py: 6 }}>
        <PageHeader title={title} subhead={subhead} onBack={onBack} />
        {children}
      </FormShell>
    </PageShell>
  </Box>;
}
