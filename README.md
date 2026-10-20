# React + TypeScript + Vite

Current architecture and schema completion review: [project structure and Library review](docs/project-review/README.md).
It includes all 147 tables, current relationships, reference dispositions and a proposed cleanup sequence.
The full completion gate remains open; this review does not apply migrations or change runtime behavior.

## ASCE development/testing handoff

Current local database setup, storage boundaries and repeatable verification are in
[ASCE database setup](docs/asce-database-setup.md). `npm run db:verify-asce` checks
the entire SQL migration chain with fresh/upgrade seeds and the focused ASCE runtime tests.

Start with [ASCE handoff and startup](docs/asce-handoff.md),
[acceptance and owners](docs/asce-handoff-acceptance.md),
[mock contracts](docs/asce-mock-service-contracts.md), and
[follow-up backlog](docs/asce-follow-up-backlog.md).
Current follow-up status and required source inputs are in the
[execution register](docs/asce-follow-up-execution.md).
The accepted scope is the local mock prototype; real PRASE remains excluded.
The October 8 increment adds [durable mock applicant save/resume](docs/applicant-save-resume.md)
and [shared health catalog intake and remaining form gaps](docs/global-health-form-migration.md).
The [ASCE MCR template check](docs/asce-mcr-template-check.md) records corrected
CIR/AD&D increments, child medical-underwriting behavior and MCR health scope.
Account sign-in is temporarily disabled in the local development startup until
the user requests restoration. Application-data PDFs are available on Review and Receipt.

## Persistent portal data

The current migration scope and acceptance criteria are defined in
[Active Site migration contract](docs/active-site-migration-contract.md).
It covers the ten current prototype Sites, including the synthetic Demo, with
per-product review in the [generated inventory](docs/active-site-migration-inventory.md)
and [JSON register](docs/active-site-coverage-audit.json). Other MCR clients remain
archived for later migration. `npm run migration:scope-audit` regenerates this
review baseline; add `-- --check` to detect drift without rewriting it.
Historical phase readiness does not establish complete MCR migration or runtime
activation readiness. The default local mock consumes the persisted Library;
production activation and complete source acceptance remain gated.

The Admin Center uses domain services backed by Supabase when both
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured. Copy
`.env.example` to `.env.local` and apply `supabase/migrations` plus
`supabase/seed.sql` to a Supabase project. Secrets are never committed.

Without those variables the same services automatically use a seeded,
persistent `localStorage` repository, so the CRUD demo works offline. The
legacy rules, fields, pages, features, and configuration definitions remain
code-driven; only business records and site-specific assignments cross the
persistence boundary. See `docs/data-architecture-audit.md` for the inventory.

For a local Supabase CLI project, `npm run db:reset` reapplies migrations and
the repeatable seed. For the browser fallback, call `resetLocalDemoData()` from
`src/persistence/reset.ts` in a developer console/tooling entry point. No reset
control is exposed in normal user UI.

## Storybook deployment

Storybook is built separately with `npm run build-storybook`; deploy the
generated `storybook-static` directory as its own Netlify site. In the deployed
prototype site's Netlify environment, set:

```text
VITE_STORYBOOK_URL=https://<storybook-netlify-site>.netlify.app
```

Local development defaults to `http://localhost:6006`.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
# Canonical migration review

The current pass is Phase 4B; semantic completion remains blocked. A read-only Canonical Review tab is available in the development server under Portal Library. See [canonical schema and MCR normalization](docs/canonical-mcr-normalization.md) and the [source/table inventory](docs/canonical-mcr-inventory.md). Source-cell accounting is complete; substantial semantic mapping remains unresolved. Do not start the runtime/repository switch from these results.

## Phase 4C status

Phase 4C is closed successfully and Phase 5 repository access is implemented. `phase5Ready: true`, `phase6Ready: true`: the six [ASCE business decisions](docs/asce-business-decisions.md) now have approved canonical records and persisted approval evidence. This is readiness for a deliberate Phase 6 implementation, not runtime activation. Application and Library reads preserve existing compatibility behavior; Admin foundational reads use the existing persistence adapters. See [Phase 5 repository boundaries and validation](docs/phase5-repositories.md) and [Phase 4C curation](docs/phase4c-curated-boundary.md).

Step 2 adds an opt-in shared read boundary and consistent normalized snapshots. See [the shared data and revision contract](docs/shared-data-revision-contract.md) for integration, SQL validation and remaining gates. The applicant runtime remains on its existing adapter.

Before Step 3, the [legacy platform review and revised plan](docs/legacy-platform-migration-review.md) compares the supplied Site configuration reference against current template capabilities. Its [review register](docs/legacy-platform-review-register.json) preserves all 203 property-guide entries and scoped behavior evidence; recommendations remain pending, and the active Site scope is unchanged.

Step 3 clarification register: [major outstanding items and confirmed rate behavior](docs/step3-major-outstanding-items.md). CIR-only selection and existing-policy changes are tracked separately.

Step 3 migration review: [scoped adoption and required rule work](docs/step3-active-site-adoption.md), [explicit identity crosswalk](docs/step3-identity-crosswalk.md). Run `npm run migration:adoption-review -- --check` to verify the generated review artifacts. The reviewed compiler seeds the persisted mock Library; the default development prototype consumes that snapshot.

Latest Step 3 verification: [exception acceptance, portfolio gates and runtime data sources](docs/step3-exception-adoption.md). All 1,838 persisted journey mappings execute after serialization and PostgreSQL readback. The default local mock now consumes the persisted Library; full Step 3 product acceptance and production activation remain pending. The compatibility catalog is available through `dev:catalog`.

Portal Library uses one Effective Site scope selector, initially All. All browses the full catalog and preserves default field placements independently of client overrides. Site scope shows enabled applicant pages/products, effective fields/rules and applicable shared standards. The Templates domain presents Multi-page and Single-page layout previews, plus a planned Fast Track entry; a selected Site shows its configured default template. Legacy scope query parameters remain readable, while new Library links preserve only the selected Site and domain filters. This inspection change does not activate the reviewed migration in the live applicant form.

### Local migration mock platform

`npm run mock:dev` starts a separate preview at `http://127.0.0.1:5180`, with
synthetic PRASE/payment endpoints and Caroline's local password/TOTP/recovery
setup with an authenticator QR code (`caroline@example.invalid`; no emails sent).
See [Step 6 admin setup](docs/step6-admin-authentication.md) for sign-in and recovery. Mock mode uses local data
and does not call a configured Supabase database. See
[the continuation record](docs/migration-continuation-2026-10-02.md) for setup,
implemented scope, validation and remaining publication/activation gates.

Current Step 3 status: [prototype migration acceptance](docs/step3-prototype-acceptance.md), including Review notices/fields, coverage exclusions, rate participation and mock PRASE. The separate [prototype cutover acceptance](docs/prototype-cutover-acceptance.md) records the persisted mock runtime and remaining provisional behavior.


Prototype cutover: `npm run dev` starts the persisted mock Library and applicant prototypes at [localhost:5180](http://127.0.0.1:5180/). `npm run mock:dev` is the equivalent explicit command. The reviewed seed is written to `migration-artifacts/mock/prototype-data.json`; saved Site drafts remain in `.mock-platform/server-state.json` and take precedence only for their Site. Open Site Builder, choose the existing Site, open its Library draft, edit and save, then reload its prototype. Field/rate changes require no catalog edit. `npm run dev:catalog` explicitly runs the compatibility catalog preview. Production publication and real PRASE remain excluded.

### Site build, review and prototype release

Site Builder now supports new/existing TPA and client selection, Site template selection, validated Library editing, full journey previews and revision-specific readiness review. Accepted snapshots stage in prototype UAT and can be scheduled into the next release, executed in Releases on the scheduled date, and rolled back to a previously launched prototype snapshot. Majesco implementation remains separately tracked in Migration schedule. Published-data activation remains gated. See [steps 4–5 workflow and acceptance](docs/step45-builder-publication.md).

Pages database verification and explicit legacy snapshot conversion are documented in [the page catalog upgrade guide](docs/page-catalog-migration.md).

## Portal Library requirements ownership

Portal Library owns site requirements and design guidance; Storybook contains component examples. Rules & configuration groups Business rules, Products & riders, Configurations, URL parameters and Validations. Main Site keys use the client name (`asce`, `waepa`, etc.); distinct variants such as `waepa-gi` remain separate and old bookmarks are accepted.

See [the ownership and schema review](docs/portal-library-model-review.md). Run `npm run library:audit` to regenerate the complete table contracts, SQL definitions, ownership and Storybook link inventory. ASCE information accuracy, applicant verification and the full PDF export are the subsequent phases.
