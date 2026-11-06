# Portal data architecture audit

This audit records an earlier incremental persistence design. For current stored applicant activation, Library reads and remaining compatibility boundaries, use the [runtime ownership and cleanup plan](../project-review/ownership-and-cleanup-plan.md). In mock mode the installed stored revision now supplies applicant products, pages, fields and configuration; the code-driven decisions below are historical migration context.

## Current sources and persistence boundary

The current operational relationship contract is documented in [Portal operational tables and relationships](portal-operational-tables.md). Migration `202610120002_application_relationships.sql` adds independent applicants, application/applicant links, and application association selections. Account and customer workflows remain deferred.

| Domain | Current canonical source | Decision |
| --- | --- | --- |
| TPAs, clients, sites, associations | `src/data/registry.ts`, `tpas.ts`, `associations.ts`, `waepa.ts` | Seed organizations/clients/sites and preserve all stable keys. Associations remain a definition dataset until an admin workflow needs mutation. |
| Coverage, products, riders | Client configuration and `src/data/waepa.ts` | Keep product/coverage/rider definitions in code; persist site assignments in relationship tables. |
| Configurations and rules | `src/config/**`, client configs, rule documentation | Keep definitions and execution logic in code; persist only site-specific values in `site_configurations`. |
| Pages, fields, features, flows | `src/config/**` and documentation content | Remain code-driven system metadata. |
| Emails, CMS content, themes, documents | `src/content/**`, client configs, public assets | Definitions/templates stay code-driven. Future site overrides belong in persisted assignment tables, not a single site JSON object. |
| Applications | `src/admin/domain.ts` plus public-form state and resume mocks | Admin operational records move to `applications`; public-form session state remains independent until its submission flow is integrated. |
| Changes, releases, builder drafts | `src/admin/domain.ts` | Move behind CRUD services and seed from the existing records. |
| Users/personas/access | `src/admin/access.ts` | Persona definitions remain code-driven; user, role, and scope assignments are persisted. |
| Activity/history | Documentation change log and static admin arrays | Operational history comes from `audit_events` and `application_events`; documentation history remains documentation. |

## Duplicates and incremental migration

The legacy admin arrays remain only as seed inputs. New Admin Center views use services as the canonical operational source. Existing Portal Admin and Site Details continue using `src/data` so their rule/configuration architecture and stable query-string keys are unchanged. This deliberate coexistence allows page-by-page migration.

The browser fallback persists to `localStorage` under `portal-prototype-database-v1`. Supabase is selected automatically when both Vite environment variables are set.

## Security boundary

The initial migration enables RLS but grants a broad demo-only policy to `anon` and `authenticated` so the prototype can operate before authentication exists. Real authentication and `user_scopes`-based policies are required before production; frontend scoped queries are convenience, not authorization. Never treat the included policy as a production security boundary.
