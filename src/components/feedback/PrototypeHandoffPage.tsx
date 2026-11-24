import { useEffect, useState } from 'react';
import { Alert, Box, Dialog, Typography } from '@mui/material';
import FormRoutePage from '../../app/RoutePage';
import { getPrototypeLibrary } from '../../domain/prototypeLibrary';
import { validatePrototypeHandoffs, type HandoffScreen } from '../../domain/prototypeHandoffs.mjs';
import defaults from '../../../requirements/global/prototype-fixtures/handoffs.json';
import { requirementText } from '../../domain/requirementContent';

export type { HandoffScreen } from '../../domain/prototypeHandoffs.mjs';
export function prototypeHandoffScreens(page: 'health-qd' | 'docusign'): HandoffScreen[] {
  const library = getPrototypeLibrary();
  const configuration = library ? library.settings.prototypeHandoffs : defaults;
  if (configuration === undefined) throw new Error('Missing fresh-start prototype handoff configuration');
  return validatePrototypeHandoffs(configuration)[page];
}

/** Prototype external screens retain the shared form's saving and transition behavior. */
export default function PrototypeHandoffPage({ pageId, screens = prototypeHandoffScreens(pageId), onEnter }: { pageId: 'health-qd' | 'docusign'; screens?: HandoffScreen[]; onEnter?: () => Promise<void> }) {
  const [entryReady, setEntryReady] = useState(!onEnter);
  const [entryFailed, setEntryFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!onEnter) return;
    let active = true;
    void onEnter().then(() => { if (active) setEntryReady(true); }).catch(() => { if (active) setEntryFailed(true); });
    return () => { active = false; };
  }, [onEnter, attempt]);
  const [index, setIndex] = useState(0);
  validatePrototypeHandoffs({ [pageId]: screens }, true);
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const currentIndex = Math.min(index, screens.length - 1);
  const screen = screens[currentIndex];
  return <FormRoutePage pageId={pageId} hideActions>
    {({ pageError, navigationPending }) => <Dialog open fullScreen aria-label={screen.alt} PaperProps={{ 'aria-label': screen.alt, sx: { m: 0, bgcolor: 'background.paper' } }}>
      {(pageError || entryFailed) && <Alert severity="error" sx={{ position: 'sticky', top: 0, zIndex: 1 }}>{pageError || requirementText('resume.error.technical')}</Alert>}
      <Box component="button" type="button" disabled={navigationPending || !entryReady && !entryFailed} aria-busy={navigationPending || !entryReady && !entryFailed} aria-label={requirementText('handoff.continue')} onClick={() => {
        if (entryFailed) { setEntryFailed(false); setAttempt(value => value + 1); return; }
        if (navigationPending || !entryReady) return;
        if (currentIndex < screens.length - 1) { setIndex(currentIndex + 1); return; }
        (document.getElementById(`${pageId}-form`) as HTMLFormElement | null)?.requestSubmit();
      }} sx={{ display: 'block', width: '100%', minHeight: '100dvh', p: 0, border: 0, bgcolor: 'background.paper', cursor: navigationPending ? 'wait' : 'pointer', flexShrink: 0 }}>
        {screen.src && !failedImages.includes(screen.src) ? <Box component="img" src={screen.src} alt={screen.alt} onError={() => setFailedImages(current => [...current, screen.src!])} sx={{ display: 'block', width: '100%', height: 'auto', minHeight: '100dvh', objectFit: 'contain', objectPosition: 'top' }} />
          : <Box sx={{ minHeight: '100dvh', display: 'grid', placeContent: 'center', gap: 2 }}><Typography variant="h3">{screen.placeholder ?? requirementText('handoff.image-unavailable')}</Typography><Typography>{requirementText('handoff.continue')}</Typography></Box>}
      </Box>
    </Dialog>}
  </FormRoutePage>;
}
