import { useEffect, useState } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import { applicationRecovery } from '../../content/applicationRecovery';

/** Application-wide connection notice, above the header and client help bar. */
export default function OfflineBanner({ offline: previewOffline }: { offline?: boolean }) {
  const [offline, setOffline] = useState(() => !navigator.onLine);
  useEffect(() => {
    if (previewOffline !== undefined) return;
    const disconnected = () => setOffline(true);
    const connected = () => setOffline(false);
    const technical = (event: Event) => {
      if ((event as CustomEvent).detail?.code === 'OFFLINE') disconnected();
    };
    setOffline(!navigator.onLine);
    window.addEventListener('offline', disconnected);
    window.addEventListener('online', connected);
    window.addEventListener('application:technical-error', technical);
    return () => {
      window.removeEventListener('offline', disconnected);
      window.removeEventListener('online', connected);
      window.removeEventListener('application:technical-error', technical);
    };
  }, [previewOffline]);
  if (!(previewOffline ?? offline)) return null;
  const content = applicationRecovery.offline;
  return <Alert severity="warning" role="alert" sx={{ width: '100%', borderRadius: 0, position: 'sticky', top: 0, zIndex: theme => theme.zIndex.appBar + 1, justifyContent: 'center', alignItems: 'center', py: 0.5 }}>
    <Typography variant="body2"><Box component="strong">{content.title}.</Box> {content.message} {content.guidance}</Typography>
  </Alert>;
}
