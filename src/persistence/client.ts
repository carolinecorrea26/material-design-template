import { MockOperationsAdapter } from "./mockOperationsAdapter";
import { createClient } from "@supabase/supabase-js";
import type { PersistenceAdapter } from "./adapter";
import { LocalStorageAdapter } from "./localAdapter";
import { createSeedDatabase } from "./seed";
import { SupabaseAdapter } from "./supabaseAdapter";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
export const isSupabaseConfigured = Boolean(url && anonKey) && !import.meta.env.VITE_MOCK_PLATFORM_ENABLED;

const browserStorage = typeof window === "undefined" ? undefined : window.localStorage;
export const persistence: PersistenceAdapter = isSupabaseConfigured
  ? new SupabaseAdapter(createClient(url!, anonKey!))
  : import.meta.env.VITE_MOCK_PLATFORM_ENABLED ? new MockOperationsAdapter(new LocalStorageAdapter(createSeedDatabase(), browserStorage)) : new LocalStorageAdapter(createSeedDatabase(), browserStorage);

export const persistenceMode = persistence.kind;
