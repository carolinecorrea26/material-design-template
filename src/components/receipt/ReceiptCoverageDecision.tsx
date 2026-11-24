import { emailBodyTextStyle } from '../../utils/emailTypography';
import { requirementText } from '../../domain/requirementContent';
import { useTheme } from '@mui/material/styles';
import type { CSSProperties, ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import type { DecisionStatus } from '../../utils/coverageDecisions';
import ApplicantSectionDivider from '../layout/ApplicantSectionDivider';
import { coverageApplicantToSection } from '../../config/formSectionTitle';
import type { CoverageApplicantId } from '../../config/coverages/types';
import type { ClientApplicantLabels } from '../../config/clients/types';
import ProductCard from '../layout/ProductCard';
import { formatCurrencyAmount } from '../../utils/coverageDecisions';

type ReceiptCoverageDecisionProps = {
  productName: string;
  quickDecision?: boolean;
  status: DecisionStatus;
  tone: 'success' | 'primary' | 'warning';
  applicantLabel: string;
  applicant: CoverageApplicantId;
  showApplicant?: boolean;
  applicantLabels?: ClientApplicantLabels;
  requestedAmount: number | null;
  estimatedPayment?: ReactNode;
  paymentMethod?: string;
  children?: ReactNode;
  /** Static email serialization shares decision content without page-only payment controls. */
  presentation?: 'page' | 'email';
};

/** One coverage/applicant outcome within the shared decision section. */
export default function ReceiptCoverageDecision({ productName, quickDecision, status, tone, applicantLabel, applicant, showApplicant = false, applicantLabels, requestedAmount, estimatedPayment, paymentMethod, children, presentation = 'page' }: ReceiptCoverageDecisionProps) {
  const theme = useTheme();
  const email = presentation === 'email';
  const bodyStyle: CSSProperties | undefined = email ? { ...emailBodyTextStyle, margin: 0, color: theme.palette.text.secondary, lineHeight: 1.65 } : undefined;
  const contents = <Stack spacing={1.5} style={email ? { display: 'flex', flexDirection: 'column', gap: 12 } : undefined}>

        <Stack direction="row" alignItems="center" spacing={1} style={email ? { display: 'flex', alignItems: 'center', gap: 8 } : undefined}>
          <Typography variant="body2" color="text.secondary" style={bodyStyle}>{requirementText('receipt.decision-label')}</Typography>
          <Typography variant="subtitle2" component="h3" color={`${tone}.main`} fontWeight={800} style={email ? { ...emailBodyTextStyle, margin: 0, fontWeight: 800, color: theme.palette[tone].main } : undefined}>{status.label}</Typography>
        </Stack>
        <Typography data-decision-description variant="body2" color="text.secondary" sx={{ lineHeight: 1.65, maxWidth: '70ch' }} style={bodyStyle}>{status.description}</Typography>
        {!email && <Box component="dl" sx={{ m: 0, pt: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 1, alignItems: 'baseline', '& dd': { color: 'text.primary', fontWeight: 700 } }}>
          <Typography component="dt" variant="body2" color="text.secondary">{requirementText('coverage.coverage-cart.requested-coverage')}</Typography>
          <Typography component="dd" variant="body2" sx={{ m: 0, textAlign: 'right' }}>{requestedAmount !== null ? formatCurrencyAmount(requestedAmount) : requirementText('application.ui.not-available')}</Typography>
          {estimatedPayment && <>
            <Typography component="dt" variant="body2" color="text.secondary">{requirementText('application.ui.estimated-payment')}</Typography>
            <Box component="dd" sx={{ m: 0, minWidth: 0, textAlign: 'right' }}>{estimatedPayment}</Box>
          </>}
          <Typography component="dt" variant="body2" color="text.secondary">{requirementText('application.ui.payment-method')}</Typography>
          <Typography component="dd" variant="body2" sx={{ m: 0, textAlign: 'right' }}>{paymentMethod ?? requirementText('application.ui.not-selected')}</Typography>
        </Box>}
        {children && <Box sx={{ pt: 1 }}>{children}</Box>}
      </Stack>;
  if (email) return <Box component="article" aria-label={`${applicantLabel} coverage decision`} data-component="receipt-coverage-decision" style={{ padding: '16px 0', borderBottom: `1px solid ${theme.palette.divider}` }}>
    <Typography component="h3" style={{ ...emailBodyTextStyle, margin: '0 0 8px', fontWeight: 800 }}>{productName}</Typography>
    {showApplicant && <Typography style={{ ...bodyStyle, marginBottom: 8 }}>{applicantLabel}</Typography>}
    {contents}
  </Box>;
  return <ProductCard component="article" productName={productName} quickDecision={quickDecision} aria-label={`${applicantLabel} coverage decision`} sx={{ p: 0, py: 1, border: 0, borderRadius: 0, bgcolor: 'transparent', gap: 1.5 }}>
    <ApplicantSectionDivider applicant={coverageApplicantToSection[applicant]} showLabel={showApplicant} labels={applicantLabels}>
      {contents}
    </ApplicantSectionDivider>
  </ProductCard>;
}
