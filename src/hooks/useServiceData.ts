import { useCallback, useEffect, useState } from "react";

export function useServiceData<T>(loader: () => Promise<T>, dependencies: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => { setLoading(true); setError(null); try { setData(await loader()); } catch (value) { setError(value instanceof Error ? value : new Error(String(value))); } finally { setLoading(false); } }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { void refresh(); }, [refresh]);
  return { data, error, loading, refresh };
}
