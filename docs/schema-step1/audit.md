# Portal database structure audit

Step 1 is a repository audit of Portal Admin, portal configuration, and operational application data, dated October 12, 2026. It covers every table declared in the current migrations, its TypeScript representation where one exists, current seeds, and persistence boundaries. It records the existing structure and unresolved gaps. It does not finalize ownership or cardinality, add constraints, change application workflows, or apply migrations.

The inventory is **135 public SQL tables**, not 129. The generic TypeScript persistence contract maps 129; the other six are SQL publication and administrator tables accessed through RPCs or trusted service writes. `auth.users` is an external Supabase table referenced by those six and is not counted as a repository-defined public table. There are **342 declared foreign keys**, including **108 provenance metadata references**, and **57 JSON columns**. These are migration declarations, not assertions about the schema currently installed in a running database.

The full schema completion gate remains open. The relationships below include unresolved structural decisions that later steps must resolve.

## Audit files

| File | Contents |
| --- | --- |
| [Table dictionary](table-dictionary.md) | All 135 tables, purpose, observed ownership, every SQL column, contract field/type/source, keys, CHECKs, FKs, defaults, alterations, indexes, triggers, and seed row counts |
| [Relationship diagrams](relationships.md) | Partitioned Mermaid diagrams of every declared FK, including composites, required/optional parents, uniqueness and external auth identity |
| [Complete diagram source](relationships.mmd) | One full graph with every public table and all 342 FK edges |
| [Scalar reference register](scalar-references.md) | Unenforced keys, identities, actors, vocabulary, aliases, evidence locators and expressions; distinguishes alternatives from gaps |
| [JSON reference register](json-references.md) | Every JSON column, TypeScript type and observed reference candidate paths, sample values and row IDs |
| [Machine readable inventory](inventory.json) | Full table evidence, reference register, seed compatibility observations, SQL functions/policies/grants, manifest differences and source hashes |
| [Audit coverage checks](validation.json) | Independent table/FK/column coverage counts, source hash checks and explicit validation limits |

## Sources and verification boundary

All **15** `supabase/migrations/*.sql` files were read in filename order, including the recent component and application relationship migrations. The TypeScript compiler resolves `DatabaseSchema` and its inherited interfaces, intersections, generic definitions and imported field declarations. The adapter table map is compared to that resolved contract and the migration table set. `src/migration/schema.ts`, `canonicalSchema.ts`, `canonical.ts` and `export.ts` define a separate schema/seed export surface; the audit compares its current expanded manifest against migration definitions.

Current seeds were exported into `/tmp/portal-schema-step1-audit` with the existing `src/migration/reviewedExport.test.ts`. Its integrity check passed. The export produces both the reviewed migration dataset and the current `createSeedDatabase()` operational/local dataset. Exporting writes files only; it does not execute SQL. Seed counts and samples in this audit come from those fresh exports, rather than older saved artifacts.

The audit also reads `supabase/seed.sql`, the generic adapter interface, local and Supabase adapters, the mock operations adapter and server, the applicant save store, persisted repositories, snapshot code, publication RPC service, and the services that write application, builder, release and audit records. Existing reports are context rather than proof that current migrations are applied or that all constraints have been tested.

Field names and scalar nullability reconcile across the 129 mapped contracts. This does **not** mean contracts and SQL are fully equivalent: strings do not enforce UUID format, opaque JSON does not enforce the nested domain contract, and the manifest differences and missing relationships below remain. Identity columns are implicitly NOT NULL in PostgreSQL, even when their migration declaration does not spell out `not null`. JSON `null` is distinct from SQL NULL.

No database was connected, altered, reset or migrated. Fresh database, upgrade, invalid-write and live data reconciliation checks belong to the later requested steps.

## Findings and unresolved structural gaps

### F01 Table inventory has two access surfaces

The six SQL-only tables are `portal_admin_accounts`, `portal_library_drafts`, `portal_library_releases`, `portal_library_heads`, `portal_library_readiness`, and `portal_library_publication_audit`. Their absence from `DatabaseSchema` is consistent with the dedicated publication RPC boundary, not evidence that they do not exist. The generic adapter expects every row to have an `id`; admin accounts, heads and readiness instead use `user_id`, `site_key` and a composite primary key. They cannot simply be added to that adapter without changing its contract.

Evidence: `202610020001_library_publication.sql`; `src/persistence/types/index.ts`; `tableNames.ts`; `src/services/libraryPublicationService.ts`. The dictionary includes these six explicitly. Final ownership and references must cover both surfaces.

### F02 Catalog keys remain unenforced and have different meanings

`site_coverages.coverage_key`, `site_products.product_key`, `site_riders.rider_key`, `site_configurations.configuration_key`, `applications.product_key`, and `migration_schedules.client_key` have no foreign key to their apparent catalog/client target. Existing uniqueness on a site/key pair does not validate the key.

All **200** reviewed `site_coverages.coverageKey` values fail exact membership in the reviewed `coverage_categories.key` set. The values include `li-term` and `li-10yr`, which function as coverage/product selection identities rather than the category key vocabulary. Adding a category FK mechanically would therefore misrepresent the existing data. Reviewed `site_products` and `site_riders` values do resolve to their catalog keys in that export; SQL still does not enforce those relationships.

The four seeded applications use display labels in `productKey`: `Group Term Life`, `Term Life`, `Guaranteed Issue Life`, and `Disability Income`. None matches a reviewed `products.key`. These labels cannot safely be converted into catalog identity without an explicit reconciliation decision. Migration schedule saves validate milestones and dates, but do not check that their `clientKey` exists.

Evidence: initial migration; `src/persistence/seed.ts`; `src/services/applicationService.ts`; `migrationScheduleService.ts`; current exported datasets. These fields are unresolved, not ready for automatic FK attachment.

### F03 Independent parent references do not always enforce matching ownership

`pattern_assignments` and `product_amount_rules` can hold both a client key and a site key without a CHECK deciding their combined meaning or a composite FK proving that the site belongs to the named client. `analytics_measurements` similarly permits independent `site_id` and `client_id` values. Each individual FK can succeed while the pair describes different clients.

`site_product_applicants` validates site, product and applicant-role existence and uniqueness of the triple, but does not require that the product be assigned in `site_products` for that site. Several product/site eligibility, amount, underwriting and rate tables likewise reference valid catalog entities independently, without proving a matching site assignment. Whether these are valid override/catalog records or need assignment membership is an unresolved ownership decision.

In contrast, the scoped Library tables with `scope`, `client_key` and `site_key` prohibit simultaneous client/site targets through CHECKs. Their site ownership is derived through the site; those CHECKs must not be mistaken for the independent-target model above. The dictionary preserves the distinction.

Evidence: canonical normalization migration; analytics migration; Library migration; each table's FKs and CHECKs in the dictionary.

### F04 Association ownership is partially guarded

`associations.client_key` is a required FK, so each current association definition belongs to one client. `site_associations` is unique by site/association pair and supports many assignments. Its trigger verifies matching clients **when the assignment is inserted or updated**.

The trigger is attached only to `site_associations`. Updating `sites.client_id` or `associations.client_key` does not run it, so a previously valid assignment can become cross-client after parent reassignment. No composite FK preserves that invariant for those parent changes. This is a structural reassignment gap, separate from the successful insertion check.

The current schema allows a client to own multiple sites and an association to be assigned to multiple sites within that client. It does not support one association row owned by multiple clients. Whether shared associations need different ownership remains for step 2; this audit does not impose a one-to-one interpretation.

Evidence: `check_site_association_client` and `site_association_client_guard` in the Library migration; `sites`, `associations` and `site_associations` constraints.

### F05 Operational application relationships are additive and incomplete

`applicants.client_id` is required. `application_applicants` uses composite FKs to match application/site, site/client and applicant/client. It permits multiple people per application and multiple applications per person, with a unique application/person pair. Applicant type is a relationship attribute referring to `applicant_types.key`, not a person identity.

`application_associations.application_id` is unique, so the current model allows **zero or one selection per application**. Composite FKs match the application site and require an existing site/association assignment. They do not check that the assignment is enabled. Applications may have no people or association selection; neither table enforces a minimum of one. All three new collections are empty in current seeds.

`application_participants` links to an application and optionally a public user. It has no applicant link or enforced participant-type vocabulary and is a separate contact/participant source. No reconciliation rule connects its name/email copies to `applicants`.

The SQL tables do not yet store operational multi-product selections, selected riders/coverage amounts, application answers, or a submitted snapshot referencing the original configuration release. `submitted_at` is only a timestamp. The mock saved-form and submission data are separate stores, described in F12. These remain structural gaps for step 3, even though the additive applicant FKs are declared correctly.

Evidence: `202610120002_application_relationships.sql`; initial migration; `types/applicants.ts`; `types/operations.ts`; applicant persistence tests; operational table documentation.

### F06 Application action owner is a discriminator without a target contract

`applications.current_action_owner_type` is an enum, while `current_action_owner_id` is a nullable UUID with no FK. There is no enforced mapping of each type to users, applicants, organizations or another actor table, and no CHECK pairing `None` with NULL or requiring an identity for other values.

Application events retain owner **types**, but no corresponding old/new owner IDs. Their `performed_by` text also lacks a typed actor reference. Current services and seeds use these compatibility fields directly. Choosing actor cardinality and historical retention belongs to steps 3 and 4.

Evidence: initial migration; `types/operations.ts`; `applicationService.ts`.

### F07 Identity and historical actors have multiple namespaces

`application_participants.user_id`, `user_roles.user_id` and `user_scopes.user_id` reference public `users`. Publication administrator, owner, publisher and audit actor columns reference **`auth.users`**. There is no FK or unique mapping between public `users.id` and `auth.users.id`.

`change_requests.requested_by/owner_id`, `site_builder_drafts.owner_id`, `application_events.performed_by`, and `audit_events.performed_by` are free text. Services default audit attribution to a demo actor, while the mock account server also records username-based actors in its own state. There is no unified service/automation actor entity or historical actor identity contract.

`user_scopes.scope_id` is nullable and unconstrained. Its `scope_type` CHECK permits global, organization, client, site and advisor, but does not validate target existence, target type, global NULL rules or assignment uniqueness. Audit `entity_type/entity_id` and change item `entity_type/entity_id/field_key` likewise identify polymorphic targets without SQL validation. Audit entity IDs are UUIDs; many Library entity IDs are text, creating a representation boundary for future Library audit use.

Evidence: initial migration; publication migration; `types/operations.ts`; `serviceUtils.ts`; `mock-platform.mjs`. Identity and actor resolution remain step 4 decisions; account workflows are outside this phase's immediate work.

### F08 Application flag values can cross the configuration snapshot boundary

`flag_assignments.application_id` is an FK to applications. Its CHECK allows zero or one target among client, site, product, coverage, rider, applicant-role and application. It does not exclude application targets, validate the target against `flag_definitions.level/persistence`, or constrain its value to the declared flag type/value catalog.

`flagAssignments` is included in `normalizedSnapshotTables`, and the SQL snapshot function selects **all rows** from that table. Thus operational application flag assignments, if populated, can enter the normalized configuration snapshot through this allowed table. Excluding the `applications` table itself does not exclude application-linked flag values.

The TypeScript snapshot validator checks table envelopes, row IDs and duplicate IDs, not the absence of an `applicationId` on flag rows. Current `createLibraryDraft` uses the narrower `effectiveSiteSnapshotTables`, which does not include `flagAssignments`. This is a normalized read boundary gap, not evidence that the current draft builder publishes application flags. The SQL publication payload validation gap is separate and described in F10.

Evidence: canonical normalization `flag_assignments`; `src/persistence/snapshot.ts`; latest snapshot function in the component migration. Current empty application assignments do not remove the structural gap.

### F09 JSON references have partial code validation rather than relational enforcement

The JSON register documents all 57 columns and observed nested paths. Major relationship surfaces include configuration definition `target.productKey`, typed field collections containing `pageKey/fieldKey`, field dependencies/visibility conditions, product/rider definitions, condition and action targets, flow node/edge definitions, site policy association/payment selectors, identity candidate keys, source promotion `active_site_keys`, and the full publication payloads. Some observed paths are vocabulary or copied identity rather than outgoing references; the register labels them as candidates.

`requirement_targets.target_table/target_key/target_column` and `semantic_requirements.subject_table/subject_key` are scalar polymorphic references with no FK validating their target. `identity_resolutions.product_key` has an FK, but candidate JSON keys do not. Source requirement values are archived evidence, so not every apparent identifier should become a canonical relationship. Formula/fact/derivation strings require a defined expression validator rather than a simple column FK.

Page migration CHECKs validate selected page JSON properties; Library rows commonly check only that definitions are objects. TypeScript resolvers and draft validators validate more nested semantics, but generic Supabase CRUD does not run those validators. The local snapshot validator is also deliberately shallow. Each embedded relationship therefore needs an enforced or explicitly justified validation boundary later; observing valid seeded references is insufficient.

Evidence: page catalog migration; field collection/surface migrations; canonical normalization; `src/domain/libraryDraft.ts`; `snapshot.ts`; `supabaseAdapter.ts`; full JSON and scalar registers.

### F10 Publication pointers validate existence but rely on RPCs for site coherence

Publication drafts, releases, heads and audit records have individual site and release/draft FKs. There is no composite FK proving that a head's release belongs to the head's site, a release's draft belongs to the release's site, a draft's base release belongs to its site, or each publication audit draft/release reference belongs to its site.

Save/publish/rollback functions enforce several of these conditions procedurally and browser table access is revoked. These are meaningful existing safeguards. The database relationship declarations themselves permit inconsistent pairs to a writer with table privileges. Their acceptance as a justified RPC-only invariant or strengthening is unresolved.

SQL save validates the payload's top-level `siteKey`, `formatVersion` and object `data`; it does not run the full TypeScript `isLibraryDraft` validation or reject operational table keys nested in `data`. SQL publication copies the stored payload after readiness verification. Payload hashes and readiness bind a revision but do not intrinsically validate every nested relationship. Library releases retain configuration payloads; no operational application FK binds a submitted record to one.

Evidence: full publication migration and `LibraryPublicationService`. Historical immutability, deletion and retention remain decisions for later steps rather than assumed properties of the word “release.”

### F11 Natural identity and duplicate sources need decisions

The following existing overlaps are structural rather than merely naming differences:

| Sources | Current distinction or gap |
| --- | --- |
| `site_configurations` and scoped `configuration_values` | Legacy dated values versus normalized definition-backed values; no relational reconciliation |
| `rule_actions` and `structured_rule_actions`; JSON rule/condition definitions and normalized predicates/flags | Legacy/executable and normalized review representations coexist; no SQL equivalence guarantee |
| Product/rider JSON and normalized amount, eligibility, plan, dependency and underwriting tables | Parallel presentation/configuration representations; resolution depends on code and migration adoption |
| `change_requests.target_release_id` and `release_changes` | One target pointer alongside many-to-many assignments; service updates both but SQL does not force agreement |
| `releases` and `portal_library_releases` | Delivery planning versus published configuration; separate semantics, no FK joining them |
| Public `users`, `auth.users`, mock account state | Separate identity namespaces |
| `applicants`, participant contact copies, mock saved applications and submission state | Separate operational/contact/session representations |
| Client environment links, site environment links and URL usage/definition catalogs | Different owners/purposes; equivalence and precedence are not enforced |

Some tables have surrogate/key uniqueness without a natural assignment uniqueness rule, including `flag_assignments`, `pattern_assignments`, `product_coverage_plans`, `product_amount_rules` and `site_field_configurations`. This permits multiple rows with different IDs/keys for the same business dimensions. Multiple rows may be intentional for conditions or ordering; this audit does not invent the intended cardinality.

`site_configurations` uses ordinary `unique(site_id, configuration_key, effective_date)`. NULL effective dates are distinct under ordinary PostgreSQL uniqueness, allowing multiple undated rows for a site/configuration. `user_scopes` likewise has no assignment uniqueness rule. In contrast, several scoped Library tables explicitly use `UNIQUE NULLS NOT DISTINCT`; these models must not be conflated.

Evidence: dictionary keys and CHECKs; `releaseService.ts`; migration manifests; normalized repositories and configuration resolvers.

### F12 Persistence backends do not enforce equivalent structure

The Supabase adapter shallowly maps camelCase and snake_case names, delegates constraints to SQL, and accepts the broad TypeScript row contract. It neither transforms semantic IDs to UUIDs nor validates nested JSON on generic writes. Current JSON exports use semantic strings such as `tpa-demo`, `APP-78214` and `REL-2026-10` in UUID SQL columns. The audit records **68 table/column/export groups** containing these UUID format differences across the two current exports. This is not 68 distinct tables or 68 orphan records.

`migrationSeedSql()` explicitly converts organization/client/site and site-assignment identities to deterministic UUIDs/lookups. It intentionally excludes operational records from its SQL seed output. Therefore a successful reviewed seed export does not establish that the local operational seed can be inserted with the generic Supabase adapter.

Local storage checks duplicate row IDs on insert but does not enforce FKs, natural uniqueness, CHECKs or deletion restrictions. The mock operations server also operates on detached row arrays. Its allowlist covers 11 collections; the new applicants/application-applicants/application-associations collections are absent. In `MockOperationsAdapter`, reads for those collections fall through to local storage, whereas mutation methods always call the mock write endpoint, which rejects an unlisted table. Registration in `DatabaseSchema` therefore does not establish equivalent persistence support.

The applicant save store separately persists forms, recovery records and outbox entries to a file; mock submission responses and their state are not inserts into operational `applications`. They have no SQL FK joining their identities to the operational people/application tables. This is an identified boundary, not a request to implement deferred customer workflows.

Evidence: adapters; `seed.ts`; `src/migration/export.ts`; mock server `/operations` routes; `scripts/applicant-saves.mjs`.

### F13 Migrations and schema export manifest are not fully equivalent

The expanded manifest comparison reports **44 textual column definition differences**: 40 existing Library `display_id` columns use generated identity in migrations but required positive values in the export manifest; three source promotion columns omit migration defaults/CHECKs in the expanded manifest; and `components.definition` omits the migration's object CHECK. Some differences deliberately distinguish imported metadata from database-generated IDs; they are not automatically defects.

Additional migration CHECKs, triggers, publication tables, application tables and operational tables are outside or supplementary to that manifest's generation surface. In particular, page catalog CHECKs and source promotion scope constraints are not fully represented by a comparison of base columns. The manifest is an export subset, not a complete replacement for the migration history. Generating a database from a subset must not be called equivalent to applying the whole migration chain.

The latest SQL snapshot allowlist contains 96 names and matches the 96 unique TypeScript normalized snapshot table names. The older snapshot migration contains 95; the component migration intentionally adds the missing component catalog. This additive history reconciles when all files are considered.

Evidence: manifest comparison in `inventory.json`; canonical metadata columns; source promotion and component migrations; `snapshot.ts`.

### F14 Existing seed and documentation paths describe different inventories

`supabase/seed.sql` is a compatibility demo seed using sites such as `waepa-standard` and `asce-default`. The current generated/local data use canonical keys such as `waepa` and `asce` and include a wider client/site inventory. These seed paths do not represent the same database content. An existing database must be inspected before deciding which identities are aliases, retained records, or separate experiences.

The earlier `docs/data-architecture-audit.md` describes code-driven metadata and a `portal-prototype-database-v1` fallback key. Current normalized Library persistence and the local adapter's `portal-prototype-database-v2` differ from that account. The newer operational table document accurately acknowledges unresolved product/actor references and deferred answer/snapshot storage; it is not a complete inventory of the other domains.

This audit supplements those documents without rewriting their historical record or altering seeds.

## Existing constraints that should be preserved as evidence

The current migrations already declare organization/client/site parent FKs; organization profile uniqueness; scoped global/client/site CHECKs; ordered page-field and catalog assignment uniqueness where specified; same-flow composite node references; provenance vocabulary FKs; source evidence sheet/cell uniqueness; application applicant tenant composites; application association site composites; and publication readiness/hash/version checks. Each is documented with its exact columns rather than generalized into an assumption that all relationships are validated.

Most FKs default to NO ACTION on update and delete; certain change/release/user-assignment relationships cascade. Soft-deletion/status columns exist on only some tables and do not themselves propagate an archive invariant. Existing indexes and triggers are recorded per table. No archive, reassignment or historical retention behavior was changed in step 1.

## Step 1 result

The requested table/reference audit is complete at the repository level, including the six additional SQL tables. Independent coverage checks confirm all 135 tables, 1,235 columns, 342 FKs and 57 JSON columns are represented, including 312 observed JSON candidate paths and 286 scalar identity/reference/vocabulary candidates. The latest SQL/TypeScript snapshot allowlists agree. The reviewed seed export test passed; the audit generator passed syntax and targeted lint checks. JSON and scalar reference surfaces are documented; current seeds and the persistence surfaces have been compared. Findings F02–F14 retain unresolved relationships, representation choices or validation boundaries for later steps.

The schema is **not finished**, and the full completion gate is **not passed**. Step 2 ownership/cardinality decisions, implementation, fresh/upgrade validation, and application to the intended database have not been performed. Work stops here as requested.

To reproduce the file-only audit from the repository root:

```sh
MIGRATION_EXPORT_DIR=/tmp/portal-schema-step1-audit npx vitest run src/migration/reviewedExport.test.ts
node scripts/audit-schema-step1.mjs /tmp/portal-schema-step1-audit
```
