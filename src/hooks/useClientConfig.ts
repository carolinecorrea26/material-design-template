import { useMemo } from 'react';
import { 
  getClientConfig, 
  getClientBranding, 
  getClientTheme, 
  getClientFieldLabels,
  getClientFeatures,
  isFeatureEnabled,
  switchClient,
  getClientSwitchUrl,
  clearClientOverride,
  type ClientConfig,
  type ClientBranding,
  type ClientTheme,
  type ClientFieldLabels,
  type ClientFeatures,
  type ClientId
} from '../config/clients';

/**
 * Hook to access client configuration
 * Note: Configuration is determined at page load and doesn't change reactively
 */
export function useClientConfig(): ClientConfig {
  return useMemo(() => getClientConfig(), []);
}

/**
 * Hook to access client branding
 */
export function useClientBranding(): ClientBranding {
  return useMemo(() => getClientBranding(), []);
}

/**
 * Hook to access client theme
 */
export function useClientTheme(): ClientTheme {
  return useMemo(() => getClientTheme(), []);
}

/**
 * Hook to access client field labels
 */
export function useClientFieldLabels(): ClientFieldLabels {
  return useMemo(() => getClientFieldLabels(), []);
}

/**
 * Hook to access client features
 */
export function useClientFeatures(): ClientFeatures {
  return useMemo(() => getClientFeatures(), []);
}

/**
 * Hook to check if a feature is enabled
 */
export function useFeature(feature: keyof ClientFeatures): boolean {
  return useMemo(() => isFeatureEnabled(feature), [feature]);
}

/**
 * Hook to get a field label with fallback
 */
export function useFieldLabel(field: keyof ClientFieldLabels, fallback: string): string {
  const labels = useClientFieldLabels();
  return labels[field] || fallback;
}

/**
 * Hook to get client switching utilities
 */
export function useClientSwitcher() {
  return useMemo(() => ({
    switchClient,
    getClientSwitchUrl,
    clearClientOverride,
    currentClientId: getClientConfig().id,
  }), []);
}

// Re-export types for convenience
export type { ClientId, ClientConfig, ClientBranding, ClientTheme, ClientFieldLabels, ClientFeatures };
