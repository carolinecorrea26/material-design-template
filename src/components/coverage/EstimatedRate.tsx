import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import { Box, CircularProgress, Typography, type TypographyProps } from '@mui/material';
import type { ReactNode } from 'react';
import { formatUSD } from '../../utils/formatUSD';
import { rateDisplayForAmount, type RateDisplayState } from '../../domain/rateDisplay';
import ReferenceRateTableLink from './ReferenceRateTableLink';

export type EstimatedRateProps = Omit<TypographyProps, 'children' | 'display'> & {
  /** Product prices use 1.25rem; summary prices use body2 sizing. Both are bold and primary-colored. Inline inherits its context. */
  appearance?: 'inline' | 'product' | 'summary';
  amount?: number;
  display?: RateDisplayState;
  suffix?: string;
  isCalculating?: boolean;
  label?: ReactNode;
};

/** One rate display for prices, loading, technical failures and configured alternatives. */
export default function EstimatedRate({ appearance = 'product', amount = NaN, display, suffix = '', isCalculating = false, label, sx, ...props }: EstimatedRateProps) {
  const requested: RateDisplayState = display ?? (isCalculating ? { status: 'loading', previousAmount: Number.isFinite(amount) ? amount : undefined } : rateDisplayForAmount(amount));
  const state = requested.status === 'available' ? rateDisplayForAmount(requested.amount) : requested;
  if (state.status === 'hidden') return null;
  if (state.status === 'reference-table') return <ReferenceRateTableLink table={state.table} />;
  const priceSx = appearance === 'inline' ? {} : { color: 'primary.main', fontWeight: 700, fontSize: appearance === 'summary' ? '0.875rem' : '1.25rem' };
  const withLabel = (content: ReactNode) => label ? <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}><Typography component="span" variant="caption" color="text.secondary">{label}</Typography>{content}</Box> : content;
  if (state.status === 'unavailable') return withLabel(<Typography component="span" variant="body2" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontWeight: 400, lineHeight: 1.5 }}><InfoRoundedIcon aria-hidden="true" sx={{ fontSize: 16, flexShrink: 0 }} />Estimate unavailable</Typography>);
  if (state.status === 'needs-information' || state.status === 'provided-separately') return <Typography component="span" variant="body2" color="text.secondary">{state.status === 'needs-information' ? 'Complete the required information to calculate your estimate.' : state.message ?? 'Rate provided separately.'}</Typography>;
  const loading = state.status === 'loading' || isCalculating;
  const price = state.status === 'available' ? state.amount : state.previousAmount ?? amount;
  return withLabel(<Typography component="span" variant={appearance === 'inline' ? undefined : 'body2'} {...props} sx={[priceSx, { display: 'inline-block', position: 'relative', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}>
    <Box component="span" aria-hidden={loading || undefined} sx={{ visibility: loading ? 'hidden' : 'visible' }}>{formatUSD(Number.isFinite(price) ? price : 0)}{suffix}</Box>
    {loading && <Box component="span" role="status" aria-label="Recalculating estimated cost" sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}><CircularProgress size="1em" thickness={4} aria-hidden="true" color="inherit" /></Box>}
  </Typography>);
}
