import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { PortalDataRepository, PortalRevision } from "../repositories/portalDataRepository";

type LoadState = { status: "loading" } | { status: "ready"; revision: PortalRevision } | { status: "error"; error: Error };
const Context = createContext<(LoadState & { refresh: () => void }) | null>(null);

/** Opt-in only: not installed in the applicant router before migration/parity gates. */
export function PortalDataProvider({ repository, children }: { repository: PortalDataRepository; children: ReactNode }) {
  const [generation, setGeneration] = useState(0);
  const [result, setResult] = useState<{ repository: PortalDataRepository; generation: number; state: LoadState } | null>(null);
  const refresh = useCallback(() => setGeneration(value => value + 1), []);
  useEffect(() => {
    let current = true;
    repository.open().then(revision => {
      if (current) setResult({ repository, generation, state: { status: "ready", revision } });
    }).catch(reason => {
      if (current) setResult({ repository, generation, state: { status: "error", error: reason instanceof Error ? reason : new Error(String(reason)) } });
    });
    return () => { current = false; };
  }, [repository, generation]);
  const state: LoadState = result?.repository === repository && result.generation === generation ? result.state : { status: "loading" };
  return <Context.Provider value={{ ...state, refresh }}>{children}</Context.Provider>;
}
export function usePortalData() {
  const context = useContext(Context);
  if (!context) throw new Error("PortalDataProvider is required; no static fallback is available.");
  return context;
}
export function usePortalSite(siteKey: string) {
  const context = usePortalData();
  return useMemo(() => {
    if (context.status !== "ready") return context;
    try { return { status: "ready" as const, ...context.revision.resolveSite(siteKey), refresh: context.refresh }; }
    catch (reason) { return { status: "error" as const, error: reason instanceof Error ? reason : new Error(String(reason)), refresh: context.refresh }; }
  }, [context, siteKey]);
}
