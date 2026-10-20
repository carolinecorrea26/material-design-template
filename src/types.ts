/** Compatibility aliases; canonical identity types live in src/domain. */
export type * from "./domain/identities";
/** @deprecated Historical display summary, not the application configuration. */
export type { LegacyClientSummary as ClientConfig } from "./domain/organizations";
