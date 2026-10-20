// Generated storage contracts; business relationships use stable semantic keys.
import type { LibraryMetadata } from "../../domain/provenance";
export interface RateTables extends LibraryMetadata {
  id: string;
  key: string;
  name: string;
  format: string;
  content: string | null;
  url: string | null;
  imageRef: string | null;
  sourceSystem: string | null;
}
export interface ProductRateTables extends LibraryMetadata {
  id: string;
  key: string;
  productKey: string;
  rateTableKey: string;
  siteKey: string | null;
  conditionKey: string | null;
}
export interface RateTablePresentations extends LibraryMetadata {
  id: string;
  key: string;
  rateTableKey: string;
  siteKey: string | null;
  productKey: string | null;
  placement: string;
  mode: string;
  enabled: boolean;
  flagKey: string | null;
}
