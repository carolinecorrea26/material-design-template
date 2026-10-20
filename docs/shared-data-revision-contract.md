# Step 2: shared data and revision reads

Caroline approved the active Site migration contract and authorized step 2 on October 1, 2026. This step creates a shared read boundary for Library inspection and candidate Site consumers. It does not adopt additional MCR requirements or activate the candidate resolver in the applicant application.

## Shared consumer contract

`createPortalDataRepository(adapter).open()` captures the authorized normalized Library tables once and returns an immutable revision handle. `query(table, options)`, `get(table, id)` and `resolveSite(siteKey)` read that captured dataset. Queries and Site resolution return the same revision identifier. Caller changes to returned rows do not affect the handle. Persisted edits become visible only when a consumer opens a fresh handle.

`createEffectiveSiteRepository` uses the same boundary. Its existing `resolve(siteKey)` signature remains available; `resolveRevision(siteKey)` also exposes the revision. The opt-in `PortalDataProvider` supplies one shared handle to React consumers, and `usePortalSite` resolves a candidate from that handle. Refresh and repository replacement return loading state immediately, ignore obsolete asynchronous responses, and expose failures. The provider is deliberately not mounted in the current router. Existing static Library and applicant consumers will be switched together during the later migration/parity stage.

Unsupported adapters, incomplete table sets, invalid envelopes, duplicate row identities, corrupt local storage and transport failures reject the read. No per-table list fallback or static fixture fallback supplies a successful candidate. Resolution still enforces the existing exact approval checks and unresolved capabilities; a valid transport revision is not coverage approval.

The allowlist includes normalized configuration, Site/product/applicant assignments, eligibility and decision evidence, organization/association data, email/document/URL assignments, structured patterns/flags, and provenance. Raw workbook extraction, compatibility blobs and operational applications/users/audit tables are outside this snapshot boundary. All requested authorized catalog rows are captured; the function does not yet prune a minimal graph for one Site. The repository supports future migration without hardcoding the ten active Sites. The separate [active Site migration contract](active-site-migration-contract.md) governs current migration scope.

## Local and PostgreSQL snapshots

Local storage is read synchronously once, and requested rows are cloned before any asynchronous hashing. An existing stored database must contain every requested table; snapshot reads do not fill gaps from seed data. A newly initialized in-memory adapter still uses its explicitly supplied dataset. SHA-256 identifies the captured table set and content. Table, row and object-key order do not affect the local hash; authored array order does.

The additive migration `202610010001_normalized_snapshot.sql` defines `portal_read_snapshot(requested_tables)`. The Supabase adapter calls it once and shallowly maps database column names to TypeScript names, preserving nested JSON definitions. The function validates its table allowlist and returns ordered rows with a SHA-256 content identifier.

The function is `STABLE`, so its table reads use the calling statement's MVCC snapshot, and `SECURITY INVOKER`, so caller privileges and RLS still apply. These choices follow the [PostgreSQL volatility contract](https://www.postgresql.org/docs/current/xfunc-volatility.html) and [Supabase function guidance](https://supabase.com/docs/guides/database/functions). The migration grants function execution to authenticated callers and an existing service role, but grants no table access and creates no RLS policies. Anonymous execution is revoked. Current normalized Library tables still have no browser read policies: applying this migration alone does not authorize a browser to read them. Authorization belongs to its later stage.

Revision strings have the form `local:v1:sha256:…` or `postgres:v1:sha256:…`. They are content identifiers for the requested visible dataset, not release numbers, authorization tokens or persisted historical revisions. Local and PostgreSQL serialization differs, so equivalent content need not produce identical cross-adapter identifiers. A handle pins in-memory reads; it cannot retrieve an old database version by identifier after refresh. Draft isolation, historical revisions, atomic publication and rollback remain later work. Snapshot rows are not full domain-schema validation; candidate resolution and migration integrity checks remain necessary.

## Browsing and pagination

Adapters and persisted read repositories now support typed scalar equality filters, ordering, offset and limit (1–1000, default 500). Snapshot queries use the captured rows, including Site-specific filtering. Supabase queries translate top-level columns, use exact counts and inclusive ranges, and add the row ID as an ordering tie-breaker. This follows the [Supabase range contract](https://supabase.com/docs/reference/javascript/using-modifiers-range).

Supabase `list` follows pages until the exact count is reached, advancing by the number of rows actually returned even when the server caps pages below the requested limit. It rejects incomplete responses, changed counts and duplicate rows. Separate browsing requests are not a transaction: equal-count concurrent edits can still alter their results. Consumers needing coherent domain reads must use one snapshot handle. Local scalar sorting follows JavaScript comparison; PostgreSQL text sorting follows database collation. No cross-adapter text-collation equivalence is claimed.

## Validation and next stage

Focused tests cover one local storage read, detached results, content revisions, unchanged old handles, fresh persisted edits, approval removal, malformed envelopes, forbidden tables, scoped pagination, server row caps, failure propagation, shared React consumers, refresh races and repository replacement.

The disposable PostgreSQL gate applies seven migrations, seeds twice, reads actual PostgreSQL rows through the Supabase wire mapping, resolves all ten active Sites, rejects invalid snapshot requests, checks invoker RLS and interleaves an edit with a blocked snapshot read. The concurrent reader must see both tables before the edit; a later reader must see both after it. This validates the SQL function locally, not a hosted PostgREST deployment.

Validation on October 1, 2026 passed build, lint, scope-audit drift checking, 41 focused tests and the disposable PostgreSQL gate (PostgreSQL 17.11, seven migrations, two identical seed applications, twelve rejected invalid writes, five rejected snapshot requests, and RLS enabled on 101 Library tables). The full suite reported 754 passed, two PostgreSQL-only tests skipped, and one pre-existing failure in `libraryInspection.test.ts`: it expects exactly sixteen template standards, but the catalog also contains four `TS-SP-*` standards. Both PostgreSQL-only tests passed separately against actual database readback. The disposable container was removed after validation.

No hosted database changes, account provisioning, TOTP, visual builder implementation, publication or runtime cutover are included. Step 3 is scoped identity/applicability mapping and reviewed canonical adoption for the active Sites, now including the supplied legacy platform behavior evidence as described in the [platform review and revised plan](legacy-platform-migration-review.md). Source currency, business decisions and the acceptance domains in the step 1 register remain pending.
