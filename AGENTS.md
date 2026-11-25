# Fresh-start model

This is an established architecture, not an open design question.

- There is one global template. Shared page structure, fields, components,
  content definitions, rules, configuration definitions/defaults and URL
  parameter contracts belong to it.
- An effective Site is the global template plus assigned products, values,
  content selections and overrides. Site-specific data belongs under
  `requirements/parked/sites/<site>/`; do not add Site-specific implementations
  or visibility gates for shared capabilities.
- ASCE is the first effective Site being reviewed and rolled out. That does not
  make shared behavior ASCE-owned. ABE, AMA, AMA-GI, AVMA, CSEA, NSO, ISI Trust, WAEPA and WAEPA GI are also
  authorized for enrollment (user instruction November 23, 2026). Demo is not a
  business Site. Synthetic Sites are appropriate for inheritance checks.
- For each change, identify its owner: global definition/default or effective-Site
  assignment/override. Source references to ASCE or its MCR are provenance, not scope.
- Library, prototype and Storybook must use the same fresh-start source/projection.
  Do not add parallel constants, editable generated output, or legacy fallbacks
  for reviewed surfaces. Shared Library definitions remain global under Site filters.
- Storybook examples must use real fresh-start fields and supported components.
  Keep variations only for meaningful differences in structure, configuration or
  behavior. Do not duplicate the same name layout by page or person; the Name
  group has only with-Title and without-Title examples.
- Component reuse is a required part of every page audit. Check existing shared
  components and repeated structure/interaction before adding or retaining a
  page-specific wrapper. Differences in wording, topic, applicant, product or Site
  values should use data, configuration or slots when the behavior is shared.
  Keep distinct components for meaningful composition or behavior, and document
  that boundary. Check page integration and shared variations without duplicating
  canonical components, stories or approval rounds.
- Keep confirmed user exceptions intact. Ask unresolved policy questions during the
  migration; do not defer them or call a reviewed page complete while they remain open. Use the MCR for
  effective-Site policy values. Record planned requirements separately from
  implemented behavior. Prototype rates are fictional; no real service is implied.
- The animated Home illustration and Fast Track are excluded from requirements
  and content-hardcoding audits. Leave their demonstration implementations out of
  these source migrations.

## Checks and reporting

- Run `npm run test:fresh-start` when changing ownership, inheritance, shared
  configuration, Library scope or the fresh-start compiler. Run tests explicitly
  during testing; prototype and Storybook builds must not run test suites
  (user instruction November 24, 2026).
- Run focused tests for other affected behavior. Do not run every suite for every edit.
- Before calling a reviewed surface complete, verify it works without superseded
  authored records, that its consumers agree on the fresh-start projection, and
  that component reuse and any justified page-specific boundaries are accounted for.
- Report ownership, implementation status and relevant verification briefly.
  Do not reopen settled architecture or restart the page review.

Ownership reference: `docs/requirements-spec/README.md`.
Coverage definitions and effective-site evidence: `docs/requirements-spec/coverage.md`.

## Development and publishing on redesignv6

- Clone `carolinecorrea26/material-design-template` on branch `redesignv6`.
  With Node from `.nvmrc`, run `npm run init` to install locked dependencies,
  validate the committed catalog and prepare the local mock data. Use
  `npm run dev` and `npm run storybook` for local work. For a dedicated local
  PostgreSQL instance, set its `DATABASE_URL` in the ignored `.env` and run
  `npm run db:setup` and `npm run db:check`.
- Edit the owning JSON or catalog source. Run `npm run catalog:refresh` to
  regenerate the Library bundle and derived indexes and documents. Commit the
  source and generated files together. Run `npm run build:release` to build the
  prototype and Library in `dist/`, Storybook in `storybook-static/`, and
  `dist/standalone/admin-center.html` from the same catalog. It checks artifact
  parity. Run relevant tests explicitly.
- Publishing requires GitHub and Netlify access for macOS, Linux or WSL.
  Authenticate with `gh auth login`, `gh auth setup-git` and `netlify login`.
  If linking this checkout for other Netlify commands, use
  `netlify link --id 86159baa-204c-4672-b586-00f5b8caa786` for the Portal.
  `npm run db:hosted:status` queries the hosted `redesignv6` PostgreSQL branch
  over verified TLS. `npm run db:hosted:check` also checks exact catalog parity.
- Publish from a clean, committed `redesignv6` checkout with
  `npm run release:publish`. It validates the builds, transactionally applies
  the checked-in schema and catalog to the hosted database branch, checks the
  stored bytes, and pushes the same commit to GitHub without force. Netlify
  builds `redesignv6` as a branch deploy on `material-design-template` and as
  the production deploy on `material-design-template-storybook`. Keep the
  Portal's production branch on `main`. Use the coordinated command for
  release pushes. It waits for both deploys and checks both public catalog
  copies against the Portal API. Resume monitoring with
  `npm run release:verify` from the release checkout.
- Run one release at a time. The hosted pilot serves one catalog revision, so
  Portal startup can report a revision mismatch between database import and its
  Netlify deploy. If the Git push fails after import, retry the same release
  after resolving the error. If a build fails after the push, fix the failure or
  retry the matching deploy in Netlify, then run `npm run release:verify`.
- Keep SQL in `netlify/database/migrations/`. Add new idempotent SQL files to the
  ordered import in `scripts/seed-portal-db.mjs` and test upgrades with
  `npm run test:db`. The published catalog flows from the committed JSON to
  PostgreSQL. Accounts, sessions, Site status, drafts and applicant records stay
  in their operational stores. Keep credentials, database dumps, local state
  and source ZIPs out of Git. The hosted release uses the Netlify CLI session;
  it does not need a saved database connection string or demo passwords.

Netlify project settings and database details are in
[`docs/project-review/portal-database.md`](docs/project-review/portal-database.md).
