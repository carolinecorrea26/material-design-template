import { useCallback, useEffect, useRef, useState } from "react";

/** A restartable seconds countdown with interval cleanup on expiry/unmount. */
export default function useCountdown(initialSeconds: number) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    stop();
    timerRef.current = setInterval(() => {
      setSecondsLeft((previousSeconds) => {
        if (previousSeconds <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return previousSeconds - 1;
      });
    }, 1000);
  }, [stop]);

  const reset = useCallback(
    (nextSeconds = initialSeconds) => {
      stop();
      setSecondsLeft(nextSeconds);
    },
    [initialSeconds, stop],
  );

  const restart = useCallback(
    (nextSeconds = initialSeconds) => {
      reset(nextSeconds);
      start();
    },
    [initialSeconds, reset, start],
  );

  useEffect(() => stop, [stop]);

  return { secondsLeft, start, stop, reset, restart };
}
