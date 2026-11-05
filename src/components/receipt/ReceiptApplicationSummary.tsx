import type { ReactNode } from 'react';
import { Box, Divider, Stack, Typography } from '@mui/material';
import ApplicantSectionDivider from '../layout/ApplicantSectionDivider';
import { coverageApplicantToSection } from '../../config/formSectionTitle';
import type { CoverageApplicantId } from '../../config/coverages/types';
import type { ClientApplicantLabels } from '../../config/clients/types';
import { formatCurrencyAmount } from '../../utils/coverageDecisions';

export type ReceiptSelection = {
  id: string;
  productName: string;
  applicantLabel: string;
  applicant: CoverageApplicantId;
  requestedAmount: number | null;
  estimatedPayment?: ReactNode;
  paymentMethod?: string;
};
/** A receipt of the selected coverage and payment instructions; never a claim that payment was taken. */
export default function ReceiptApplicationSummary({ items, showApplicant = false, applicantLabels }: { items: ReceiptSelection[]; showApplicant?: boolean; applicantLabels?: ClientApplicantLabels }) {
  if (!items.length) return null;
  return <Box component="section" aria-labelledby="application-receipt-heading" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2.5, bgcolor: 'background.paper' }}>
    <Typography id="application-receipt-heading" variant="h6" component="h2" sx={{ mb: 0.5 }}>Application receipt</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>Your coverage and payment selections</Typography>
    <Stack spacing={2.5} divider={<Divider />}>
      {items.map(item => <Stack key={item.id} spacing={1} aria-label={`${item.productName} · ${item.applicantLabel} receipt`}>
        <Typography component="p" variant="subtitle2" fontWeight={800}>{item.productName}</Typography>
        <ApplicantSectionDivider applicant={coverageApplicantToSection[item.applicant]} showLabel={showApplicant} labels={applicantLabels}>
        <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 1, alignItems: 'baseline', '& dd': { color: 'text.primary', fontWeight: 700 }, '& dd .MuiTypography-root': { color: 'inherit', fontWeight: 'inherit', fontSize: '0.875rem' } }}>
          <Typography component="dt" variant="body2" color="text.secondary">Requested coverage</Typography>
          <Typography component="dd" variant="body2" sx={{ m: 0, textAlign: 'right' }}>{item.requestedAmount !== null ? formatCurrencyAmount(item.requestedAmount) : 'Not available'}</Typography>
          {item.estimatedPayment && <>
            <Typography component="dt" variant="body2" color="text.secondary">Estimated payment</Typography>
            <Box component="dd" sx={{ m: 0, minWidth: 0, textAlign: 'right' }}>{item.estimatedPayment}</Box>
          </>}
          <Typography component="dt" variant="body2" color="text.secondary">Payment method</Typography>
          <Typography component="dd" variant="body2" sx={{ m: 0, textAlign: 'right' }}>{item.paymentMethod ?? 'Not selected'}</Typography>
        </Box>
        </ApplicantSectionDivider>
      </Stack>)}
    </Stack>
  </Box>;
}
