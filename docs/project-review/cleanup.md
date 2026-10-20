# Canonical sources and cleanup register

Proposals only. No file/table deletion, rename, merge, new framework or runtime switch is authorized by generating this review. Keep React, TypeScript, Vite, the existing Node HTTP server, existing storage adapters and PostgreSQL/Supabase tooling.

## Canonical source proposals

| Concern | Current overlap | Proposed authority | Required compatibility/decision |
| --- | --- | --- | --- |
| TPA/Association/Site | clients, associations, canonical identity/context tables and static registry | Canonical Association identity and explicit Site context | Resolve source aliases and TPA differences; legacy wire names remain projections until mapping accepted |
| Site products | site_products, site_coverages and enabled configuration values | site_products assignment | Prove disagreement handling and derive compatibility coverage assignments; do not drop records first |
| Product policies | product/rider definitions, normalized policy tables and business JSON in configurationValues | One authority per business property; typed ownership and precedence contract | Choose per property, not a blanket preference for JSON or extra tables |
| Page/field composition | pages/sections/placements, field collections, source registries | Stored page/field model with portable resolver | Keep React rendering separate; reconcile rich legacy adapters and repeated collection semantics |
| Rules | JSON rules/actions, normalized predicates/actions and code catalogs | One executable rule/condition contract | Expression validation, ordering and backward compatibility must be explicit |
| Content/email/branding | Stored entries/configuration and rich preview/source adapters | Stored definitions/values plus render-only presentation | Verify actual preview/runtime parity before retiring source catalogs |
| Applications | Admin operational rows, applicant recovery values and mock receipts | One application-domain service with explicit draft/submission/recovery boundaries | Do not conflate recovery capability records with people or workflow participants |
| Actors/history | public users, auth users, mock accounts and legacy labels | Portal actor identity and validated typed target | Keep source identities and snapshots; authentication/permissions remain deferred |
| Releases | delivery planning releases and immutable configuration releases | Keep distinct models | Similar names do not make them duplicate entities; define associations only where needed |
| Schema | SQL migrations, TypeScript interfaces and subset export manifests | Installed SQL structure, verified against current contracts | Import/export manifests describe supported subsets, not the full schema |

## Prioritized cleanup

| Priority | Candidate | Disposition | Entry condition | Verification |
| --- | --- | --- | --- | --- |
| 1 | README.md, docs/, src/docs/ | One current entry point; archive historical reports; label generated inventory | Preserve imported evidence and historical acceptance/source decisions | Links resolve; current gate states agree |
| 1 | migration-artifacts/, dist/, storybook-static/, root ZIP backups | Generated output cleanup and backup archive review | Confirm regeneration/provenance and unique contents; never include .mock-platform saved state | Reproduce exports/builds; compare hashes before removing backups |
| 2 | site_coverages/site_products, site_configurations/configuration_values | Consolidate authority through compatibility projections | Approve source map and reconcile disagreements | Serialized/readback and all Site assignment tests |
| 2 | src/repositories/ and static/persisted compatibility paths | Consolidate redundant access boundaries | Trace imports, catalog-only mode, injection seams and test consumers | All supported consumers read the same captured revision; failures propagate |
| 3 | scripts/mock-platform.mjs, start-mock-dev.mjs, builder-release.mjs, applicant-saves.mjs | Separate server HTTP, application services, persistence and synthetic integrations | Define domain/store ownership; preserve atomic file writes and recovery behavior | Restart, isolation, idempotency and failure rollback tests |
| 3 | src/migration/ and import/report scripts | Move import/evidence tooling outside runtime modules | Trace runtime dependency graph; keep curated execution data/resolvers available | Build/startup and seed exports work without browser-time source compilation |
| 3 | parallel schema/audit/check scripts | One current authoritative audit and full-chain gate; preserve historical evidence | Explicitly distinguish subset/export gates from complete schema checks | Current migration list/contract inventory agrees; historical tools cannot claim readiness |

## Organization direction

Keep application bootstrap/routing in src/app; pure contracts/resolvers in src/domain; business use cases in src/services; storage mechanics in src/persistence; UI by existing feature boundaries. Separate the existing Node server into HTTP adapters, domain-service entry points, file storage and mock external-service providers. Group existing files before adding abstractions; one-line forwarding wrappers need a documented responsibility to remain.

Migration/source evidence should have its own tooling area and dated archive. Generated outputs should have documented regeneration commands and stay out of source imports. Preserve historical migrations and original source datasets. Avoid broad folder moves until imports and the canonical source map are approved.

## Complete file register

1099 files in maintained source, scripts, schema, assets, documentation, Storybook configuration and selected root files are classified in [inventory.json](inventory.json). Candidate classifications are not deletion orders and do not assert a file is unused. node_modules, generated output trees, saved state, credentials and Git internals are excluded from this source register. Generated folders/backups appear separately in the prioritized review above.
