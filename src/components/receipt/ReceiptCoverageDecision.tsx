import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import FindInPageRoundedIcon from '@mui/icons-material/FindInPageRounded';
import type { DecisionStatus } from '../../utils/coverageDecisions';
import ApplicantSectionDivider from '../layout/ApplicantSectionDivider';
import { coverageApplicantToSection } from '../../config/formSectionTitle';
import type { CoverageApplicantId } from '../../config/coverages/types';
import type { ClientApplicantLabels } from '../../config/clients/types';
import ProductCard from '../layout/ProductCard';

type ReceiptCoverageDecisionProps = {
  productName: string;
  quickDecision?: boolean;
  status: DecisionStatus;
  tone: 'success' | 'primary' | 'warning';
  applicantLabel: string;
  applicant: CoverageApplicantId;
  showApplicant?: boolean;
  applicantLabels?: ClientApplicantLabels;
  children?: ReactNode;
};

/** One coverage/applicant outcome within the shared decision section. */
export default function ReceiptCoverageDecision({ productName, quickDecision, status, tone, applicantLabel, applicant, showApplicant = false, applicantLabels, children }: ReceiptCoverageDecisionProps) {
  const StatusIcon = tone === 'success' ? CheckCircleRoundedIcon : tone === 'warning' ? InfoRoundedIcon : FindInPageRoundedIcon;
  return <ProductCard component="article" productName={productName} quickDecision={quickDecision} aria-label={`${applicantLabel} coverage decision`} sx={{ p: 0, py: 1, border: 0, borderRadius: 0, bgcolor: 'transparent', gap: 1.5 }}>
    <ApplicantSectionDivider applicant={coverageApplicantToSection[applicant]} showLabel={showApplicant} labels={applicantLabels}>
      <Stack spacing={1.5}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <StatusIcon aria-hidden sx={{ color: `${tone}.main`, fontSize: 24, flexShrink: 0 }} />
          <Typography variant="h5" component="h3" color={`${tone}.main`}>{status.label}</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65, maxWidth: '70ch' }}>{status.description}</Typography>
        {children && <Box sx={{ pt: 1 }}>{children}</Box>}
      </Stack>
    </ApplicantSectionDivider>
  </ProductCard>;
}
