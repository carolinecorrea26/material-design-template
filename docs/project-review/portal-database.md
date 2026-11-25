# Portal database POC

GitHub holds the authored requirements and application code. Netlify builds the
site and runs `/api/portal/*` in a Netlify Function. One PostgreSQL database
stores the published Library revision, migration statuses, demo accounts and
Site assignments, Site Builder drafts, and submitted prototype applications.

## Catalog ownership and local copies

The global template and effective Site assignments are authored in
`requirements/`. The catalog build compiles them into one public
`public/catalog/portal.json` bundle. The local prototype and Storybook read the
bundle directly. The downloadable Admin Center embeds it with local assets.
PostgreSQL receives that same JSON during publication. There is one authoring
path and the publication step is one-way.

Database accounts, Site Builder drafts, migration statuses and submitted
applications have their own storage. A downloaded source ZIP or standalone
HTML is a copy of the public configuration at its build revision. Hosted
operational records require a separate database backup.

## Enable on Netlify

The existing Netlify projects build from the same GitHub repository. Use
[`AGENTS.md`](../../AGENTS.md#development-and-publishing-on-redesignv6) for
initialization, authentication, validation and release commands.

| Project | Git deploy | Configuration |
| --- | --- | --- |
| [Portal and prototypes](https://redesignv6--material-design-template.netlify.app/) | Enable branch deploys for `redesignv6`. Production remains on `main`. | Root [`netlify.toml`](../../netlify.toml), repository root as the build base, and Netlify Database enabled. |
| [Storybook](https://material-design-template-storybook.netlify.app/) | Production branch is `redesignv6`. | Repository root as the build base, `netlify/storybook` as the Netlify package directory, and [its own `netlify.toml`](../../netlify/storybook/netlify.toml) for static output. |

Netlify provides the database URL to the Portal Function. The release command
gets the intended branch connection from the authenticated Netlify CLI in
memory. The branch database must already exist. Keep database URLs and demo
passwords out of Git and Vite variables. [Netlify Database tooling](https://docs.netlify.com/build/data-and-storage/netlify-database/tooling/)

The import preserves submissions, account Site assignments, migration statuses
and drafts. Equivalent catalog imports move layout drafts to the new revision,
including after the legacy identity conversion. Drafts based on a changed
catalog remain stored under their original revision. Existing demo accounts
keep their passwords during coordinated releases. For a dedicated local
PostgreSQL database, `npm run db:setup` can optionally seed the two demo
accounts from separate 12–128 character passwords in an ignored `.env`. The
accounts are `portal.admin@example.test` and `account.manager@example.test`,
with the manager scoped to ASCE. Use fictional information for applicant
journeys. `npm run test:db` exercises a fresh install and migration of existing
records using an isolated embedded PostgreSQL engine.

## Ownership and next phase

- Shared definitions, including the two application layouts, remain global. The
  Library's global option is a template reference. The Site portfolio owns the
  TPA and association overview, and each Site links to its effective Library
  view and prototype.
- The Builder saves a draft Site layout override and previews it through the
  fresh-start compiler. The first pass covers the existing ten Sites. Follow-on
  work is planned in the [New Site Builder field map](new-site-builder-field-map.md).
  It covers Site creation, inline relationships, product setup, page overrides,
  validation and preview through the same authored contract.
- The hosted signing POC records submitted coverage selections and activity.
  The save workflow retains the recipient and selected coverage. Health,
  payment, and other form answers are excluded from its database snapshots.
  Portal Admin and an ASCE-scoped Account Manager use database logins.
- Future template inventory can list the global template's supported layouts
  and each Site's legacy template reference for migration review. Fast Track
  remains its standalone demonstration. Record its intended relationship to
  the global template before extending Builder support.
- Applicant, Advisor and TPA Admin workspaces can build on the same application
  records as their roles and actions are implemented. The screenshot PDF tool
  and site Q&A can use the published Site revision and selected journey inputs.

## TPA, Association, and Site identity

The hierarchy is **TPA → Association → Site**. Each active TPA has at
least one Association. Every Association belongs to exactly one TPA and can
host multiple Sites. Every Site points to one hosting Association and derives
its TPA from that record. On a Site that offers several member Associations,
the applicant's resolved membership context is a separate relationship.

The active catalog uses `organizations`, `associationEntities` and
`sites.hostingAssociationId`. The ten existing Sites resolve to eight hosting
Associations. AMA and AMA-GI share one, and WAEPA and WAEPA GI share another.
Historical aliases preserve original records from the retired `clients`
collection. [Association crosswalk](../schema-step1/association-site-model.md)

The database import adds TPA and Association tables, backfills Site ownership
in place and enforces the two required foreign keys. The import keeps
`site_key` stable for applications, drafts and migration status. Apply the
import and the corresponding Portal build together on the intended pilot
database. [Database migration](../../netlify/database/migrations/0002_association_identity.sql) ·
[Import and backfill](../../scripts/seed-portal-db.mjs)

The planned New Site Builder collects the first Association when adding a
TPA. The TPA, Association and Site will be committed together. For an existing
TPA the form can reuse an Association or add one inline. [New Site Builder form](new-site-builder-field-map.md#site-details)

## Audit findings addressed in this phase

| Severity | Finding and cause | Affected source | Resolution |
| --- | --- | --- | --- |
| High | The hosted reader accepted any well-formed database revision and then used this build's requirements to resolve it. Local artifacts could show different configuration. | `vite.config.ts`, `src/persistence/sharedCatalog.ts`, `scripts/seed-portal-db.mjs` | Hosted startup checks the revision and JSON bytes. The read-only `db:check` verifies release parity before deployment. Storybook builds validate the same bundle and serve it statically. |
| High | The compiled catalog retained 11 actions for superseded Beneficiary rules. The merge guard only checked explicitly retired IDs. | `requirements/global/application.json`, `src/domain/requirementApplicationCatalog.mjs` | Removed the obsolete authored actions and applied the guard to replaced rule IDs. The import rejects orphan rule actions. |
| High | Signing and the Admin application list used separate stores. | `scripts/applicant-saves.mjs`, `src/app/RoutePage.tsx`, `src/pages/admin/ApplicationsWorkspace.tsx` | Write the fictional submission and audit event together, with a stable Receipt reference on retry. |
| High | Hosted applicant pages requested rates from the local mock server and redirected to a technical error. | `src/app/usePrototypeRates.ts`, `src/domain/pricingFormulas.mjs` | Use the same fictional quote calculation within the hosted prototype and the local mock server. |
| High | The local Builder edited captured data that the fresh-start compiler could replace with authored defaults. | `src/domain/freshStartCatalog.ts`, `src/services/portalDrafts.ts` | Apply the saved Site layout override at the compiler input and lock edits to a base revision and draft version. |
| Medium | The global Library repeated Site identities by TPA and association, and page preview links selected Demo. | `src/pages/admin/PortalLibrary.tsx`, `src/pages/admin/library/StoredPagesLibrary.tsx` | Use the Sites portfolio for navigation and migration tracking. Select a Site before opening a prototype. |
| Medium | Some catalog configuration records lacked the ordering field declared by the row schema. | `requirements/global/products.json`, `requirements/parked/sites/ama/application.json` | Add ordering at the authored owner and regenerate the published catalog. |
| Medium | Storybook documentation blocks explicitly loaded and applied Roboto. | `src/docs/shared/DocsBlocks.tsx`, `src/app/theme.ts` | Use the shared MUI typography theme and bundle the Inter font for both surfaces. |

The current catalog response is about 2.25 MB compressed for ten Sites. Keep
the single import while it fits the deployment limits comfortably. As more
Sites enroll, measure payload and load time and split delivery into shared
definitions plus Site projections when needed. Keep every response tied to the
same published revision. [Netlify Functions limits](https://docs.netlify.com/build/functions/configuration/)
