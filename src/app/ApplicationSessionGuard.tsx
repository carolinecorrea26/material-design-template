import { useEffect, useRef, useState, type ReactNode } from 'react';
import { resolveSiteId } from '../data/activeSite';
import { getPagePath } from '../config/pages';
import SessionExpiryAlert from '../components/feedback/SessionExpiryAlert';
import RecoveryAlert from '../components/feedback/RecoveryAlert';
import { defaultTechnicalIncident, recoveryIncident, type RecoveryIncident } from '../domain/recoveryIncident';
import { recoveryPresentation } from '../content/applicationRecovery';
import { useNavigate } from 'react-router-dom';
import { applicationTimeoutKey, readApplicationDeadline, timeoutMilliseconds, warningMilliseconds } from './applicationTimeout';

function reloadExpiredSession() {
  const url = new URL(getPagePath('session-expired').replace(/^\//, ''), new URL(import.meta.env.BASE_URL, window.location.origin));
  url.searchParams.set('site', resolveSiteId());
  window.location.replace(url.toString());
}

/** Covers multi-page and embedded application forms using the same persisted inactivity deadline. */
export default function ApplicationSessionGuard({ active, children, onExpire = reloadExpiredSession }: { active: boolean; children: ReactNode; onExpire?: () => void }) {
  const site = resolveSiteId();
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [incident, setIncident] = useState<RecoveryIncident>();
  const keepActive = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!active) return;
    let expired = false;
    let warningOpen = false;
    const expire = () => {
      if (!expired) {
        expired = true;
        sessionStorage.setItem(applicationTimeoutKey(site), String(Math.min(readApplicationDeadline(site), Date.now())));
        onExpire();
      }
    };
    const tick = () => {
      const remaining = readApplicationDeadline(site) - Date.now();
      if (remaining <= 0) { expire(); return; }
      warningOpen = remaining <= warningMilliseconds;
      setSecondsLeft(remaining <= warningMilliseconds ? Math.ceil(remaining / 1000) : null);
    };
    const renew = () => {
      // An event received after expiry cannot revive the expired session.
      if (readApplicationDeadline(site) <= Date.now()) { expire(); return; }
      sessionStorage.setItem(applicationTimeoutKey(site), String(Date.now() + timeoutMilliseconds));
      warningOpen = false;
      setSecondsLeft(null);
    };
    // Once the alert opens, only its explicit action renews the session.
    const activity = () => { if (!warningOpen) renew(); };
    keepActive.current = renew;
    const technical = (event: Event) => {
      const incident = recoveryIncident((event as CustomEvent).detail ?? defaultTechnicalIncident);
      const presentation = recoveryPresentation(incident);
      if (presentation.placement === 'page') navigate(`${getPagePath('technical-error')}?${new URLSearchParams({ site })}`, { state: { recoveryIncident: incident } });
      else if (presentation.placement !== 'field') setIncident(incident);
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    const events = ['pointerdown', 'keydown', 'input'] as const;
    events.forEach(event => window.addEventListener(event, activity));
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('application:session-expired', expire);
    window.addEventListener('application:technical-error', technical);
    return () => {
      keepActive.current = null;
      clearInterval(timer);
      events.forEach(event => window.removeEventListener(event, activity));
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('application:session-expired', expire);
      window.removeEventListener('application:technical-error', technical);
    };
  }, [active, site, onExpire, navigate]);
  return <>
    {active && secondsLeft !== null && <SessionExpiryAlert secondsLeft={secondsLeft} onKeepActive={() => keepActive.current?.()} />}
    {active && incident && <RecoveryAlert incident={incident} />}
    {children}
  </>;
}
