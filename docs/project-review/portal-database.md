# Portal database POC

GitHub holds the authored requirements and application code. Netlify builds the
site and runs `/api/portal/*` in a Netlify Function. One PostgreSQL database
stores the published Library revision, migration statuses, demo accounts and
Site assignments, Site Builder drafts, and submitted prototype applications.

## Enable on Netlify

Use the [`redesignv6` GitHub branch](https://github.com/carolinecorrea26/material-design-template/tree/redesignv6) and its [Netlify branch deploy](https://redesignv6--material-design-template.netlify.app/) for this pilot. Scope the pilot environment variables to `redesignv6`.

1. Use a Postgres database dedicated to the pilot. For Netlify Database, open **Data & Storage → Database** and use the connection string for the intended database branch. An existing Postgres instance can also host a dedicated pilot database. [Netlify Database tooling](https://docs.netlify.com/build/data-and-storage/netlify-database/tooling/)
2. In the GitHub project's workspace, set `DATABASE_URL` to that connection string and set `PORTAL_DEMO_ADMIN_PASSWORD` and `PORTAL_DEMO_MANAGER_PASSWORD` to separate demo passwords of 12–128 characters. Run `npm ci`, `npm run catalog:check`, and `npm run db:setup` under Node 24. The setup command creates the schema and imports `public/catalog/portal.json` in one transaction. Omitting the demo password variables on a later import preserves the existing accounts and passwords.
3. In Netlify set `VITE_PORTAL_DATABASE_ENABLED=true` for `redesignv6` Builds. With external Postgres, set `DATABASE_URL` for `redesignv6` Functions. If using Netlify Database, confirm the deploy's `NETLIFY_DB_URL` targets the pilot database branch. Keep connection strings and demo passwords out of GitHub and frontend variables. [Netlify deploy contexts](https://docs.netlify.com/build/environment-variables/overview/) · [Functions environment variables](https://docs.netlify.com/build/functions/environment-variables/)
4. Trigger a deploy from GitHub and open `/admin-center`. The seeded accounts are `portal.admin@example.test` and `account.manager@example.test`. The manager can view ASCE. Use fictional information for applicant journeys.

For a new published catalog, import the generated JSON from the same checkout
that Netlify will deploy. Build [the separately hosted Storybook](https://material-design-template-storybook.netlify.app/) from that checkout
with the database flag unset so it reads the matching static catalog.
Reimporting preserves submissions, account Site
assignments, migration statuses and drafts. Builder previews require the
published revision they were created from, so a newer catalog requires a new
draft. For local verification run `npm run test:db`. It uses an isolated embedded
PostgreSQL engine with no database credentials. The existing `npm run dev`
continues to provide the local mock environment.

## Ownership and next phase

- Shared definitions, including the two application layouts, remain global. The
  Library's global option is a template reference. The Site portfolio owns the
  TPA and association overview, and each Site links to its effective Library
  view and prototype.
- The Builder saves a draft Site layout override and previews it through the
  fresh-start compiler. The first pass covers the existing ten Sites. Follow-on
  work should let the Builder select supported products and Site settings, then
  publish a reviewed Site assignment through the same authored contract.
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

## Audit findings addressed in this phase

| Severity | Finding and cause | Affected source | Resolution |
| --- | --- | --- | --- |
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
