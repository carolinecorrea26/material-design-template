import { useCallback, useEffect, useRef, useState } from "react";

export function useServiceData<T>(loader: () => Promise<T>, dependencies: unknown[] = []) {
  // Callers explicitly identify the inputs that start a different load.
  const load = useCallback(() => loader(), dependencies); // eslint-disable-line react-hooks/exhaustive-deps
  const activeLoader = useRef<typeof load | null>(null);
  const generation = useRef(0);
  const [result, setResult] = useState<{ source: typeof load; data: T | null; error: Error | null; loading: boolean } | null>(null);
  const refresh = useCallback(async () => {
    if (activeLoader.current !== load) return;
    const request = ++generation.current;
    const current = () => activeLoader.current === load && generation.current === request;
    setResult(previous => ({ source: load, data: previous?.source === load ? previous.data : null, error: null, loading: true }));
    try {
      const data = await load();
      if (current()) setResult({ source: load, data, error: null, loading: false });
    } catch (value) {
      if (current()) setResult(previous => ({ source: load, data: previous?.source === load ? previous.data : null, error: value instanceof Error ? value : new Error(String(value)), loading: false }));
    }
  }, [load]);
  useEffect(() => {
    activeLoader.current = load;
    void refresh();
    return () => { activeLoader.current = null; };
  }, [load, refresh]);
  // Previous-context data is unavailable immediately, including the render
  // before the new effect starts its request.
  const state = result?.source === load ? result : { data: null, error: null, loading: true };
  return { data: state.data, error: state.error, loading: state.loading, refresh };
}
