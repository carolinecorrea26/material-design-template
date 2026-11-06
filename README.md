# Material Portal Prototype

## Downloadable Admin Center

Run `npm run build:admin-html` to create `dist/standalone/admin-center.html`.
Share that single file; recipients can double-click it to open Admin Center in
a modern browser without installing Node or starting a server. JavaScript must
be enabled. The file embeds the current public catalog, application code, styles,
and local images; rebuild it to distribute updated catalog content.

Navigation uses `#/admin-center` so links and reloads work under `file://`.
Catalog data remains read-only, as in the hosted static build. Operational demo
changes use browser storage; they do not change the downloaded file or sync to
other people. Browser settings can restrict persistence for local files.
Shared authentication, mock API workflows, publishing, Storybook, and external
resources still require their respective services. No local account credentials
or private mock-platform stores are included. `npm run build` replaces `dist`,
so run the standalone command afterward if you need both outputs.

## Current shared catalog

The prototype, Portal Library and generated ABE requirements tables use
[`public/catalog/portal.json`](public/catalog/portal.json). This checked-in JSON
file is the generated runtime bundle. Its authoring sources are the section files
listed in [`public/catalog/manifest.json`](public/catalog/manifest.json). Start with
the [developer handoff guide](docs/handoff/README.md). No database connection or
additional account is required.

```text
public/catalog/portal.json
  ├── Application prototype: pages, fields, flows, rules and content
  ├── Portal Library: catalog tables, usage and configuration
  └── ABE requirements: generated Pages and Fields tables
```

Edit the section files, retain their IDs and relationships, then run
`npm run catalog:build`, `npm run docs:abe`, `npm run docs:handoff` and
`npm run build`. Do not edit `portal.json` directly. The build validates all saved Sites,
checks that the generated requirements tables match, and copies the same file
into `dist/catalog/portal.json` for Netlify. Deploy the resulting `dist` folder
through the existing site deployment workflow. Reload the site after deploying.

`npm run dev` retains the local mock services for synthetic quotes, payments,
save/resume and Site Builder previews. Its base catalog is the same JSON file;
saved local Site drafts can override it for their Site during preview. These
drafts are not deployed or included in the base requirements document. Local
application saves, account state and operational demo records stay in their
existing private local stores and are not part of the public catalog.

The static Netlify build reads the catalog directly. It does not provide shared
server saves; catalog updates require a file change and redeployment. Catalog
records cannot be overwritten through browser-only persistence. A failed catalog
read is reported instead of substituting code defaults or browser copies.

### Pages and Fields source contract

The Library's Pages and Fields tables project this same catalog. Stable table
names belong to `pages[].definition.displayName` and
`fields[].definition.displayName`; applicant-facing input copy remains in
`fields[].definition.label`. Field options, helper text, keyboard metadata and
`defaultValue` belong to the field definition. Forms and nested phone selectors
read those saved defaults and options as well.

Page participation and order come from `sitePages`; field placement and order
come from `pageFields`, `pageSections` and `pageSectionFields`. Home's inline
field references are saved on its page definition. Modal group labels and
collection ordering anchors live with the saved `field-surfaces` and
`field-collections` configuration values; questionnaire policies save their
details group label. The tables do not maintain ABE-specific copies of these
values. Input-type and keyboard names are generic display formatting.

`src/persistence/abePagesFields.test.tsx` verifies source edits across the ABE
prototype and Library, including a rendered phone selector. `catalog:check`
also rejects missing display names and defaults outside authored options.

The SQL migrations, Supabase adapter and Postgres verification scripts were archived
in the `redesignv6` refactor and removed from the working tree. They remain in git at
tag `archive/sql-postgres-v5`. Migration exports under `src/migration` remain only as
historical fixtures until the requirements refactor replaces them; `mock:seed` generates
those fixtures and does not overwrite the shared JSON catalog.

Current architecture review: [project structure and Library review](docs/project-review/README.md).
Its table counts, SQL dictionaries and relationship diagrams describe the archived schema.

## Requirements (fresh start)

Site requirements are being rewritten from scratch under [`requirements/`](requirements/),
starting with ASCE. The model, naming and layering rules are in the
[requirements specification](docs/requirements-spec/README.md); explicitly requested
changes are recorded in [`requirements/changelog.json`](requirements/changelog.json)
and shown in Admin Center. `golden/` holds reference snapshots for comparison, not a target.

## ASCE development/testing handoff

Storage boundaries and verification: no database is used. Configuration comes from the
JSON catalog; operational demo data stays in browser storage and `.mock-platform/`.
`npm test` runs the focused ASCE tests (`test:asce`) while ASCE is being finalized; other
sites' tests are paused. `npm run test:all` runs the full all-sites suite.

Other sites are switched off: `activeSites` in `scripts/catalog-parts.mjs` limits the built
bundle (`public/catalog/portal.json`) to ASCE, so the prototype, Library and Storybook load only
ASCE (Storybook's generic template renders every capability from it). The catalog parts keep every
site. `tsconfig.app.json` type-checks only the ASCE tests, and `catalog:check` skips the ABE
document. To switch a site back on, add it to `activeSites` and run `node scripts/build-catalog.mjs`.

Current ASCE scope and open corrections are in the
[execution register](docs/asce-follow-up-execution.md). Still-binding decisions:
[approved ASCE business decisions](docs/asce-business-decisions.md),
[provisional source decisions](docs/step3-provisional-decisions.md) and the
[Portal Library acceptance criteria](docs/portal-library-acceptance.md).
The accepted scope is the local mock prototype; real PRASE remains excluded.
Account sign-in is temporarily disabled in the local development startup until
the user requests restoration. Document actions on Review and Receipt are placeholders.

## Persistent portal data

The current configuration source is the shared JSON catalog described above.
Operational demo services retain local persistence. No database is configured.

For the browser fallback, call `resetLocalDemoData()` from
`src/persistence/reset.ts` in a developer console/tooling entry point. No reset
control is exposed in normal user UI.

## Component and Storybook conventions

Components are grouped by responsibility. `forms` owns FieldRenderer and its input primitives; `layout`, `navigation`, `feedback`, and `content` own reusable UI. `coverage`, `verification`, and `home` own composed application features. Demo helpers live in `demo`. Components, stories, and their tests stay together. Admin Center is outside this portal component refactor.

Storybook owns component browsing under **Layout**, **Forms**, **Pages**, **Dialogs**, **Feedback**, **Transitions**, and **Reusable components**. Each component has one canonical record; page examples and the reuse index reference it. Portal Library retains contextual Storybook links on Pages and Fields, with no separate Components section. Existing CSF `id` values preserve deep links. Admin Center stories are excluded.

The saved component records in `public/catalog/portal.json` include their source, canonical example, page-section examples, and production usage references. `node scripts/generate-component-catalog.mjs --write-catalog` refreshes those references from source; add `--add-records` when intentionally introducing newly reviewed records. Run `npm run docs:abe` afterward. `catalog:check` rejects differences between the generated inventory, saved catalog and generated document.

Reuse counts distinct page/source compositions, includes conditional variants, and excludes stories, tests and internal reference pages. Repeated records do not inflate totals. The final index is derived from canonical records with at least two uses; no second inventory is maintained.

Standard action buttons use pill shapes by default. An explicit `theme.buttonShape: "standard"` retains the standard radius. WAEPA's shared Client configuration applies that override to both regular and GI sites.

Review pages as main sections with their pieces inside. Give each shared component or pattern one reference location; page stories show its actual content and behavior in context. Keep section names unnumbered and ordered as they appear on the page. Track reuse and page-specific differences in the [cross-page reuse register](docs/project-review/page-reuse-review.md). Use these existing groups and avoid adding extra abstraction or documentation layers.

Use a typed CSF meta with the actual `component`, a short `parameters.docs.description.component`, editable `args`/`argTypes`, and named stories for meaningful states. Interactive harnesses should forward args and own only example state. Use the shared preview providers and application theme. Historical implementation notes belong in project documentation, not extra sidebar stories.

Application form fields use **FieldRenderer** with their authored field definitions and React Hook Form control. Components whose values are owned by a parent can use **ControlledFieldRenderer**, a small adapter to the same renderer. Input primitives such as RadioSelectionGroup are implementation details of the renderer. Presentation controls such as the monthly/annual display switch and documentation filters do not collect application answers.

The standard Docs addon is not installed: the registry returned HTTP 403 when installing `@storybook/addon-docs` 10.5. The CSF descriptions are in place, but a generated Docs tab requires that official addon. There is no separate custom documentation renderer.

## Storybook deployment

Storybook is built separately with `npm run build-storybook`; deploy the
generated `storybook-static` directory as its own Netlify site. In the deployed
prototype site's Netlify environment, set:

```text
VITE_STORYBOOK_URL=https://<storybook-netlify-site>.netlify.app
```

Local development defaults to `http://localhost:6006`.

## Generated files and retained evidence

`dist/` and `storybook-static/` are disposable build output, recreated by
`npm run build` and `npm run build-storybook`. Root ZIP snapshots are local
backups and are ignored by Git.

Historical compatibility exports in `migration-artifacts/` can be recreated with
`npm run migration:export`; `npm run migration:semantic-gate` regenerates them
before checking readiness. `npm run mock:seed` regenerates the separate
`migration-artifacts/mock/` fixtures used by local development.

Keep the original requirements workbooks, review evidence and
`.mock-platform/` saved state. Historical reports retain source decisions and
acceptance evidence even where their runtime descriptions have been superseded.

## Local development

### Local mock platform

`npm run mock:dev` starts a separate preview at `http://127.0.0.1:5180`, with
synthetic PRASE/payment endpoints and Caroline's local password/TOTP/recovery
setup with an authenticator QR code (`caroline@example.invalid`; no emails sent).
Mock mode uses local data and does not call any database.

Prototype startup: `npm run dev` loads `public/catalog/portal.json` with the local mock services at [localhost:5180](http://127.0.0.1:5180/). `npm run mock:dev` is the equivalent explicit command. Saved Site drafts remain in `.mock-platform/server-state.json` and take precedence only for their Site during local preview. `npm run dev:catalog` runs the shared catalog directly without mock services. Both use the same base JSON file as the Netlify build. Real PRASE remains excluded.

### Site build, review and prototype release

Site Builder now supports new/existing TPA and client selection, Site template selection, validated Library editing, full journey previews and revision-specific readiness review. Accepted snapshots stage in prototype UAT and can be scheduled into the next release, executed in Releases on the scheduled date, and rolled back to a previously launched prototype snapshot. Majesco implementation remains separately tracked in Migration schedule. Published-data activation remains gated.

Optional conversion of older JSON snapshots is documented in [Stored field collections](docs/stored-field-collections.md#older-json-snapshots).

## Portal Library requirements ownership

Portal Library owns site requirements and design guidance; Storybook contains component examples. Rules & configuration groups Business rules, Products & riders, Configurations, URL parameters and Validations. Main Site keys use the client name (`asce`, `waepa`, etc.); distinct variants such as `waepa-gi` remain separate and old bookmarks are accepted.

Portal Library uses one Effective Site scope selector, initially All. All browses the full catalog and preserves default field placements independently of client overrides. Site scope shows enabled applicant pages/products, effective fields/rules and applicable shared standards. The Templates domain presents Multi-page and Single-page layout previews, plus a planned Fast Track entry; a selected Site shows its configured default template. Legacy scope query parameters remain readable, while new Library links preserve only the selected Site and domain filters. This inspection change does not activate the reviewed migration in the live applicant form.

## Historical migration reviews

Earlier phase, Step 3–6, canonical/MCR, active-site and ASCE handoff reports are kept in
[`docs/archive/`](docs/archive/) for traceability only. They predate the fresh-start
requirements model and do not describe current behavior. Code and generated catalog
records still cite them as `source`/`reference` evidence.
