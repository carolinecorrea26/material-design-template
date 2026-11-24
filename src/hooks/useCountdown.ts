import { useCallback, useEffect, useRef, useState } from 'react';

/** Wall-clock deadline so delayed/background timer callbacks cannot extend validity. */
export default function useCountdown(initialSeconds: number) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const secondsRef = useRef(initialSeconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stop = useCallback(() => { if (timerRef.current) clearInterval(timerRef.current); timerRef.current = null; }, []);
  const start = useCallback(() => {
    stop();
    const deadline = Date.now() + secondsRef.current * 1000;
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      secondsRef.current = remaining; setSecondsLeft(remaining);
      if (!remaining) stop();
    }, 1000);
  }, [stop]);
  const reset = useCallback((nextSeconds = initialSeconds) => { stop(); secondsRef.current = nextSeconds; setSecondsLeft(nextSeconds); }, [initialSeconds, stop]);
  const restart = useCallback((nextSeconds = initialSeconds) => { reset(nextSeconds); start(); }, [initialSeconds, reset, start]);
  useEffect(() => stop, [stop]);
  return { secondsLeft, start, stop, reset, restart };
}
