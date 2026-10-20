# Page catalog database and snapshot upgrade

The Pages contract was verified on PostgreSQL 17.11 on October 9, 2026,
using a temporary database in the existing `portal-migration-review` container.
The harness removes that database when it finishes. This verification does not
apply the migration to staging or production.

Run `npm run migration:postgres -- --reviewed` to repeat the gate. It applies
all twelve schema migrations, seeds the reviewed candidate twice, checks
readback through the shared repository for all ten Sites, and verifies RLS and
concurrent snapshots. Minimal auth stand-ins let the disposable PostgreSQL
database install Supabase-dependent functions; real Supabase authentication
is outside this gate.

The upgrade scenarios cover missing flow labels, untouched legacy page order,
custom global and Site order, custom routes, availability, and existing authored
flow labels. Invalid flow/type/identity/route metadata, duplicate routes and
negative order are rejected by PostgreSQL.

## Explicit snapshot conversion

Older Library draft and release payloads must be converted separately from the
SQL tables. Conversion writes a detached draft and a change report to new files,
preserves the source file, and refuses to overwrite outputs. It validates the
full catalog, every Site's page assignments, and the selected applicant runtime.
Conversion also adds missing stored child and disability-company collection metadata. Custom routes, availability and customized orders survive. Already-present
flow labels remain authoritative; invalid or ambiguous snapshots fail validation.

For an exported Library payload or a release record containing `payload`:

```sh
npm run pages:migrate-snapshot -- --input /absolute/path/old-snapshot.json --output /absolute/path/new-draft.json
```

For one record in a copy of local prototype state:

```sh
npm run pages:migrate-snapshot -- --input /absolute/path/server-state-copy.json --collection prototypeReleases --id RELEASE_ID --output /absolute/path/new-draft.json
```

The supported collections are `drafts`, `releases` and `prototypeReleases`.
The adjacent `.migration.json` report records the source SHA-256, selected
record, Site and individual metadata changes. Transport IDs are removed so
the converted payload cannot overwrite the original draft through an old ID.
The source base revision and edit history remain in the detached payload.

Save the result through the existing Library save boundary as a **new draft**:
`/api/mock/library/save` accepts `{ "expectedVersion": 0, "payload": <new-draft> }`
in local prototype mode. The PostgreSQL equivalent is
`portal_save_library_draft(site_key, payload)` with no draft ID. Use the normal
authenticated admin session. Conversion does not submit either request.

Review navigation and collect fresh acceptance evidence before staging or
publishing. Old release hashes, review IDs, readiness records and environment
heads are not transferred. Originals remain available for audit; older release
payloads still require conversion before this runtime can consume them.

## Evidence and remaining rollout work

The [PostgreSQL gate report](page-catalog-postgres-validation.json) records
legacy conversion, custom-data preservation, idempotent seeds, readback,
24 rejected invalid writes, five rejected snapshot requests and 103 RLS tables.
Regression tests also cover explicit conversion, unchanged originals,
save/reload/restart, publication rejection without fresh evidence, and explicit
publication after test-only acceptance approval.

No saved drafts or releases were present in this checkout's local server state
at verification time. Snapshot lifecycle checks used an older-release fixture.
Applying the SQL migration to staging and converting actual historical payloads
remain deployment work. The previously reported Fields/Analytics failures were not reproduced in the current focused test runs. The subsequent stored collection upgrade is documented in [Stored field collections](stored-field-collections.md).
