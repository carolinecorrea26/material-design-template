import { Button, Link, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { getPagePath } from '../../config/pages';
import { resolveSiteId } from '../../data/activeSite';
import { requirementText } from '../../domain/requirementContent';
import { recoveryActions, type RecoveryAction } from '../../content/applicationRecovery';

/** Shared recovery actions for unavailable, expired and failed application pages. */
export default function ApplicationRecoveryActions({ onStartNew, onRetry, actions = ['resume', 'start-new'], appearance = 'buttons' }: { onStartNew?: () => void; onRetry?: () => void; actions?: readonly RecoveryAction[]; appearance?: 'buttons' | 'links' }) {
  const search = new URLSearchParams({ site: resolveSiteId() });
  const visibleActions = actions.filter(action => action !== 'retry' || onRetry);
  if (visibleActions.length === 0) return null;
  const label = (action: RecoveryAction) => requirementText(recoveryActions[action].label);
  const destination = (action: Exclude<RecoveryAction, 'retry'>) => `${getPagePath(recoveryActions[action].page as Parameters<typeof getPagePath>[0])}?${search}`;
  return <Stack useFlexGap spacing={appearance === 'links' ? 3 : 1.5} sx={appearance === 'links' ? { flexDirection: 'row', flexWrap: 'wrap' } : { width: '100%', flexDirection: 'column', '@media (min-width:600px)': { width: 'auto', flexDirection: 'row' } }}>
    {visibleActions.map((action, index) => action === 'retry'
      ? <Button key={action} variant={index === 0 ? 'contained' : 'outlined'} size="small" onClick={onRetry}>{label(action)}</Button>
      : appearance === 'links'
        ? <Link key={action} component={RouterLink} to={destination(action)} onClick={action === 'start-new' ? onStartNew : undefined} fontWeight={600}>{label(action)}</Link>
        : <Button key={action} component={RouterLink} to={destination(action)} variant={index === 0 ? 'contained' : 'outlined'} size="small" onClick={action === 'start-new' ? onStartNew : undefined}>{label(action)}</Button>)}
  </Stack>;
}
