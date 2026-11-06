# Phase 1–4 migration review gate

Historical Phase 1–4 report, not current runtime guidance. The database integration,
SQL export and PostgreSQL verification tooling have been removed from the working
tree. The prototype now uses the [JSON catalog](../README.md#current-shared-catalog).
Phase 4C was closed and Phase 5 repository access implemented; see the historical
[Phase 5 status](phase5-repositories.md).

This implementation stops before Phase 5. The application, Admin Center, and preview still use their existing sources. No additional legacy files were removed, and no configured Supabase database was modified.

## What is ready for review

- `src/domain/` owns organization, site, association, page, field, coverage, condition/rule, flow, feature, content, and configuration types. Existing type modules remain compatibility exports. The historical display-only `src/types.ts` ClientConfig is explicitly identified as `LegacyClientSummary`; it is not the application configuration.
- `src/persistence/types/` separates storage representations by domain and assembles the typed adapter schema. Existing operational records and adapters remain in place. Older local databases acquire empty new tables on read without losing saved edits or being reseeded.
- `202609240003_portal_library.sql` adds 39 tables. Existing tables and policies are retained. New tables have semantic keys, foreign keys, scope checks, relationship uniqueness, graph endpoint constraints, and RLS. A database constraint rejects cross-client site associations. No new browser access policy is enabled before the runtime migration.
- `src/migration/fixtures.tsx` compiles raw authoring definitions into a deterministic JSON-safe database. Explicit order is stored separately from semantic keys. Unsupported values fail export instead of disappearing during JSON serialization.
- `src/migration/resolve.ts` independently resolves persisted rows. Its only runtime dependency is the migration value utility; it cannot consult a legacy registry or resolver. This is a review resolver, not the Phase 6 runtime replacement.

The active seed includes empty new tables only. The complete migration seed is opt-in. Keeping the static authoring files connected to current consumers is intentional until the review gate is accepted.

## Data retained

| Domain | Fixture sources | Migrated representation |
| --- | --- | --- |
| Organizations | TPAs, canonical clients/sites, association registry | Existing organizations/clients/sites; organization profiles preserve provisional TPA status; associations, site relationships and policies |
| Template | Pages, page sections, field catalog/order and scoped field overrides | Pages, sections, fields, placements, validation metadata and ordered site field configurations |
| Coverage | Product catalog, categories, raw client/site overrides, amount assignments and identifiers | Products, riders, product-rider links, scoped identifiers, applicant types and site assignments |
| Coverage policies | Aggregate limits/notes, site note overrides, category-to-question requirements, flow gates | Scoped configuration values, with predicates and relationships retained |
| Rules | Site rule inventory and condition definitions | Rules, rule conditions, documented actions and explicit global/client/site assignments |
| Flows | Global definitions and scoped overrides | Flow variants, steps, transitions and scoped assignments |
| Features | Rich Portal Library descriptions and configured feature options | Serializable HTML descriptions, site capability inventory and scoped option values |
| Configuration | Configuration documentation and all authored settings | Definition metadata plus semantic path/value records at their original scopes |
| Content | Every default subtree and site content override | Content entries and scoped values; arrays retain replacement semantics |
| Branding/support | Client defaults and site overrides | Scoped profiles; enabled-association logo selection remains explicit |
| Email | All ten existing template identifiers and email support settings | Renderer references, site template assignments and effective support/contact settings |
| Documents | Structured legal content and product brochure references | Document definitions, site references and preserved content/product values |

Keys retain existing semantic identifiers rather than renaming working entities. For example, `membership`, `li-group-term`, and `home.hero.title` remain traceable to the original sources. Scoped relationship identities include their owner and operation; ordering is not their identity.

Some source material is executable application code, not authored JSON. Behavioral rule descriptions remain tagged `documented-behavior`, and email templates retain explicit renderer/source references. This migration does not pretend to translate those functions into a database rule engine or editable email HTML. Conditions, field visibility, routing gates, and flow graphs do have persisted declarative representations. The existing renderer/transition code remains in place.

Site pages, applicant relationships, and normalized field assignments are compiled from raw client defaults plus site overrides for the known-good fixture. Recompiling the seed propagates authoring changes. Live recomputation after Admin Center edits is a later repository/service integration task.

## Validation

Final result: **384/384 tests passed**, with zero failures or skipped tests when PostgreSQL readback is supplied. The original 219 tests remain included. Production build, targeted lint, and `git diff --check` passed. The existing Vite bundle-size warning remains. PostgreSQL 17.11 validated all three migrations, two identical seed applications, 39 RLS-enabled tables, and four rejected invalid writes. The disposable container was removed after saving the results.

The gate tests every requested site: `demo-default`, `abe-default`, `ama-default`, `asce-default`, `avma-default`, `csea-default`, `nso-default`, `isitrust-default`, `waepa-standard`, and `waepa-gi`.

Each site is compared by domain: branding/support and association logos; page inclusion and requirements; field order, inclusion, requiredness, options, validation and visibility; products, amounts, identifiers, riders, applicants and underwriting; rule applicability; flow nodes and branches; features; effective content; settings; association selection; and email contacts. Coverage tests also enumerate all 32 category combinations for both applicant question groups and compare aggregate notes.

Additional checks cover condition truth tables, WAEPA GI isolation, explicit AMA membership requiredness, mutations across all twelve compared domains, local adapter roundtrips, preservation of existing local edits, and rejection of invalid references/scopes. Mutation tests establish that the database result responds to persisted changes independently of the old runtime.

PostgreSQL validation applies all three migrations to a fresh disposable database, applies the exported seed twice, compares the stored rows for idempotence, and reads real PostgreSQL rows through the Supabase adapter's column mapping. Transport is stubbed for this readback test; it is not an end-to-end hosted Supabase/PostgREST test. Invalid foreign keys, scopes, duplicate relationships and cross-client associations are rejected. New-table RLS is verified.

The gate covers the migrated configuration and declarative behaviors. It is not a substitute for application end-to-end testing when runtime consumers switch in a later phase.

## Review artifacts and commands

Current JSON review exports are intentionally ignored by Git:

- `migration-artifacts/database.json`: complete local fixture database.
- `migration-artifacts/inventory.json`: table counts and reference-validation results.

```sh
npm run migration:check
npm run migration:export
npm test
npm run build
```

The historical PostgreSQL gate and its SQL artifacts are no longer part of the
current project commands.

## Stop point

Review the migrated inventory and equivalence evidence before starting repository-backed runtime consumers. `ClientConfig`, `getEffectiveSiteConfig`, alias helpers, `legacyClientId`, `?client=`, client configuration/content files, and current Admin pages remain available. No Phase 5–8 work or retirement is included.

## Corrective pass before Phase 5

See [ASCE corrective pass](asce-corrective-pass.md) for additional MCR rules,
normalized Site environment links, consolidated Admin Center domains, and
remaining source conflicts. The new link table uses an additive fourth SQL
migration; the consumer remains on the existing source configuration.
