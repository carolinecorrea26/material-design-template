# Portal Library catalog

Start with the [developer handoff guide](../../docs/handoff/README.md). Folders follow the main Library sections. Each persistence table belongs to exactly one authoring JSON file; [manifest.json](manifest.json) lists them. Each file is an object of named table arrays, not a page implementation or a resolved Site.

| Library section | Folder / files | Responsibility |
| --- | --- | --- |
| Overview | `overview/`: tpas, clients, associations, sites | Identity, support and Site relationships |
| Pages | `pages/pages.json` | Pages, configured sections and Site participation |
| Fields | `fields/fields.json` | Definitions, placements, overrides and question sets |
| Components | `components/components.json` | Shared components, production usages and Storybook references |
| Flows | `flows/flows.json` | Journeys, steps and transitions |
| Rules | `rules/rules.json` | Rules, eligibility, amounts, underwriting and policies |
| Validations | `validations/validation.json` | Field validation records; page/recovery behavior also uses code |
| Configurations | `configurations/`: configurations, products, features, themes, url-parameters | Settings, products/riders, capabilities, branding and entry parameters |
| Content | `content/content.json`, `content/emails.json` | CMS entries and values, documents and email templates |
| Accessibility | [Reference folder](accessibility/README.md) | Existing criteria and review sources; assessment pending, no runtime tables |
| Analytics | `analytics/analytics.json` | Analytics tags |
| Supporting relationships | `shared/shared.json` | Patterns, flags and assignments |
| Supporting evidence | `evidence/evidence.json` | Source requirements and provenance |

Each basename listed above has a `.json` extension. See the generated [table index](../../docs/handoff/table-index.md) for the exact table-to-file mapping.

## Authoring and generation

Edit files listed in the manifest. Preserve IDs, semantic keys and relationships. `portal.json` is the generated deployment bundle: do not edit it directly. Its envelope remains `{ formatVersion: 1, data: { table: [] }, analyticsTags: [] }`. The prototype, mock server and Library read this single bundle to stay on one atomic revision. Operational application/account records are outside this public catalog.

After a catalog edit:

```sh
npm run catalog:build
npm run docs:abe
npm run docs:handoff
npm run catalog:check
```

After changing component stories or production usages, run `npm run storybook:catalog` first. This updates the component file and rebuilds the bundle. Generation rejects components with no current production usage. Storybook imports the saved definitions through `src/content/docs/components.ts`; there is no second inventory. Restart an already running mock server after rebuilding: it retains its startup revision.

The build enforces table placement using `scripts/catalog-parts.mjs`. Logical business ownership uses `src/domain/libraryOwnership.ts`; a policy stored in configuration values can belong to Rules, Fields or another view. Folder moves do not change policy ownership or precedence.

## Contract and validation

Component definitions explicitly distinguish `application-frame`, `page-section` and `shared-piece` ownership from their Storybook browsing category. `contains` references direct registered component dependencies; `parts` describes internal exports, native elements, actions and content slots. Generation and catalog loading validate these references and reject cycles. See the [component documentation contract](../../docs/project-review/component-documentation.md) for the shared page frame, section review format and prototype boundary.

`src/persistence/types` is the TypeScript persistence contract. The generated [dictionary](../../docs/handoff/data-dictionary.json) exports row properties, types, required/nullable flags and source locations for every catalog table. It is documentation, not a universal runtime JSON Schema validator. See the [relationship and scope guide](../../docs/handoff/contracts.md).

`src/persistence/identityCatalog.ts` validates identity properties, profiles, enums, timestamps, booleans, IDs, unique keys and foreign references during builds and browser loads. Unknown identity properties and cross-client identity mismatches are rejected. Strings are not coerced into booleans or numbers. Other domains retain snapshot and domain validation.

The Overview split retains existing table contracts: `organizations` stores TPAs, with no second `tpas` table. Association aliases preserve legacy identities, canonical hosting/member Associations and unresolved source-only records. Support profiles retain their explicit scope. Null metadata and unresolved association references remain null.
