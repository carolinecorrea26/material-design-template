import { useEffect, useState } from 'react';

/** A display clock for an existing absolute deadline; activity never renews it. */
export default function useDeadline(deadline?: number) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = window.setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', tick); };
  }, []);
  return deadline === undefined ? null : Math.max(0, Math.ceil((deadline - now) / 1000));
}
