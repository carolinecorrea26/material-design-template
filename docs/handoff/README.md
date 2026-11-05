# Developer handoff

Begin with the [catalog layout](../../public/catalog/README.md), then use the [table index](table-index.md), [data dictionary](data-dictionary.json), [relationship and scope guide](contracts.md), and page implementation guides: [Membership](membership.md), [Eligibility](eligibility.md), [Coverage](coverage.md).

## What to consume

| Artifact | Purpose | Edit directly? |
| --- | --- | --- |
| `public/catalog/manifest.json` and listed section files | Authoring definitions, scoped values and assignments | Yes; preserve table ownership and stable identities |
| `public/catalog/portal.json` | Single atomic deployment bundle | No; `npm run catalog:build` |
| `src/persistence/types`, domain types and resolvers | Property contracts and interpretation of stored values | Implementation changes require appropriate validation |
| Dictionary, table index and page maps in this folder | Generated contract index and direct page relationships | No; `npm run docs:handoff` |
| Page guides and linked component reviews | Behavior, implementation entry points and acceptance examples | Yes; update when behavior changes |
| Storybook examples | Reviewable component interactions and states | Change stories/implementation, then regenerate references |
| `public/catalog/evidence/` and `docs/project-review/` | Requirement history, provenance and review evidence | Follow current decisions and runtime contracts |

The JSON is public configuration. Applicant answers, applications, credentials, production service responses and account records do not belong here. Synthetic mock services are implementation examples; implementing teams must supply production integration contracts.

## Implementation sequence

1. Choose the Site and resolve its client/association context. Do not assume every catalog product or field applies to that Site.
2. Read the page definition, Site participation and resolved sections/fields. Use stored IDs and keys; labels and display IDs are not join keys.
3. Resolve configuration and business policies through the linked domain resolvers. Storage ownership and Library business ownership can differ.
4. Implement shared components, validation, navigation, dynamic feedback and persisted answers. Component examples and page reviews describe states that are not encoded as catalog rows.
5. Verify the applicable Site variants and page states. Section documentation is not complete visual/accessibility acceptance or production service certification.

## Maintaining the package

After authoring JSON changes, run `npm run catalog:build`, `npm run docs:abe`, `npm run docs:handoff`, then `npm run catalog:check`. Run `npm run storybook:catalog` first if component usages/stories changed. `npm run build` also checks catalog/document drift and compiles the application. Run relevant behavior tests when implementation changes.

The handoff generator derives catalog table names and row properties from the TypeScript compiler, exporting required/nullable flags, property types and declaration locations. Nested payload details remain in their TypeScript contracts. It also derives direct page/section/field/validation/component/flow/content references from saved relationships. Its drift check is part of `catalog:check`.

The page guides are curated explanations. [page-maps.json](page-maps.json) covers direct relationships; it is not a complete conditional rule dependency graph or a resolved Site. Product and Site policy applicability must still be resolved. Accessibility remains a reference section with pending assessment.
