import { createPortal } from 'react-dom';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Box, Button, GlobalStyles, Paper, Stack, Typography } from '@mui/material';
import AppDrawer from '../layout/AppDrawer';
import EstimatedRate from './EstimatedRate';
import type { RateDisplayState } from '../../domain/rateDisplay';
export type ApplicationEstimateItem = { id: string; name: string; period: string; display: RateDisplayState };
/** One reserved bottom surface keeps the estimate and the page action together on small screens. */
export default function ApplicationEstimate({ display, items, actions, label = 'Estimated monthly cost', suffix = '/mo' }: { label?: string; suffix?: string; display: RateDisplayState; items: ApplicationEstimateItem[]; actions?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [height, setHeight] = useState(actions ? 150 : 90);
  const bar = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = bar.current;
    if (!element) return;
    const measure = () => { const next = element.getBoundingClientRect().height; if (next > 0) setHeight(next); };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure); observer.observe(element); return () => observer.disconnect();
  }, [display.status === 'hidden', Boolean(actions)]);
  if (display.status === 'hidden') return <>{actions}</>;
  return <>
    <GlobalStyles styles={{ html: { scrollPaddingBottom: height + 24 }, 'input, button, select, textarea, [tabindex]': { scrollMarginBottom: height + 24 } }} />
    {typeof document !== 'undefined' && createPortal(<Box aria-hidden data-estimate-spacer sx={{ height: height + 24, '@media print': { display: 'none' } }} />, document.body)}
    <Paper ref={bar} component="aside" aria-label="Application estimate and actions" elevation={8} sx={{ position: 'fixed', bottom: 0, insetInline: 0, zIndex: theme => theme.zIndex.appBar, borderTop: '1px solid', borderColor: 'divider', px: { xs: 2, md: 3 }, pt: 1.5, pb: 'max(12px, env(safe-area-inset-bottom))', '@media print': { display: 'none' } }}>
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }} sx={{ maxWidth: 1120, mx: 'auto' }} spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ flex: 1 }}>
          <Box sx={{ minWidth: 0 }}><Typography variant="caption" color="text.secondary">{label}</Typography><Box><EstimatedRate display={display} suffix={suffix} appearance="summary" /></Box></Box>
          <Button size="small" onClick={() => setOpen(true)} aria-label="View estimate details">Details</Button>
        </Stack>
        {actions && <Box sx={{ width: { xs: '100%', md: 240 }, '& > .MuiBox-root': { m: 0 } }}>{actions}</Box>}
      </Stack>
    </Paper>
    <AppDrawer open={open} onClose={() => setOpen(false)} title="Your estimated cost">
      <Stack spacing={2}><Typography variant="body2">Estimates are subject to approval. The monthly equivalent lets you compare selections with different payment frequencies.</Typography>
        {items.filter(item => item.display.status !== 'hidden').map(item => <Box key={item.id}><Typography variant="subtitle2">{item.name}</Typography><EstimatedRate display={item.display} suffix={` ${item.period}`} /></Box>)}
      </Stack>
    </AppDrawer>
  </>;
}
