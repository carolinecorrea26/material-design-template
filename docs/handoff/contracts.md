# Relationships, properties and scope

Use [data-dictionary.json](data-dictionary.json) for every table's file, row type, row count and property contracts. `required: false` means a property may be omitted under its TypeScript contract; `nullable: true` means null is allowed. Omission, null, false, zero and an empty array are distinct. Preserve values and follow the domain resolver; never coerce strings such as `"false"` into booleans.

Many library definitions use `{ id, key, definition, position, displayId, providedBy, sourceReference }`. This is a common pattern, not every table's shape. `definition` is a typed payload; relationship and scoped-value tables have their own contracts. Dictionary declaration locations trace properties back to source, and row/type names identify nested contracts. [Persistence types](../../src/persistence/types/index.ts) remain authoritative; the dictionary is not an independent JSON Schema validator.

## Identity and joins

| Relationship | Join |
| --- | --- |
| Site page participation | `sitePages.pageKey → pages.key`; `sitePages.siteKey → sites.key` |
| Configured sections | `pageSections.pageKey → pages.key` |
| Page fields | `pageFields.pageKey → pages.key`; `fieldKey → fields.key` |
| Section fields | `pageSectionFields.sectionKey → pageSections.key`; `fieldKey → fields.key` |
| Field overrides | `siteFieldConfigurations.pageKey → pages.key`; `fieldKey → fields.key`, filtered by scope |
| Field validation | `validationRules.fieldKey → fields.key`; page validation also lives in implementation |
| Configuration values | `configurationValues.configurationKey → configurationDefinitions.key` |
| Content values | `contentValues.contentKey → contentEntries.key` |
| Flow steps | `flowSteps.flowKey → flows.key`; page steps carry `definition.pageId` |
| Flow transitions | `sourceStepKey` and `targetStepKey → flowSteps.key` |
| Rule participation | `ruleAssignments.ruleKey → rules.key`, filtered by scope |
| Product participation | `siteProducts.siteId → sites.id`; `siteProducts.productKey → products.key` |
| Component placement | `components.definition.usages[].pageKey → pages.key`; examples can also carry a page key |
| Component composition | `components.definition.contains[] → components.key`; direct registered dependencies, including conditional paths; cycles are rejected |

This is the main implementation path, not an exhaustive foreign-key declaration. Identity relationships can use `id` instead of `key`: inspect their types and [identity validator](../../src/persistence/identityCatalog.ts). Do not parse compound IDs to infer relationships. `displayId` is a human reference; `position` orders a local collection and does not independently define Next/Back behavior. Resolve missing references and unresolved policies rather than guessing defaults.

## Scope and ownership

Components use `definition.role` to distinguish application frame, page sections and shared pieces. `definition.section` remains the Storybook browsing category; `parts` describes exports, native elements, actions and caller-supplied slots inside the owner. This metadata documents the React composition rather than replacing runtime configuration. See the [component documentation contract](../project-review/component-documentation.md).

Scoped values use `scope`, `clientKey` and `siteKey`. Under the Scope contract, global rows have null selectors, client rows identify a client with null Site, and Site rows identify a Site. Keep saved selectors intact; explicit Site relationship tables use their own contracts.

Scalar configuration/content resolution uses **global → client → Site** precedence per semantic definition. Same-layer scalar collisions are errors rather than last-record-wins. This is not a blanket deep-merge rule: products, field overrides, arrays and ownership have domain-specific handling. See [effective configuration](../../src/domain/effectiveConfiguration.ts), [effective Site](../../src/domain/effectiveSite.ts), [page catalog](../../src/domain/pageCatalog.ts), and [prototype projection](../../src/domain/prototypeLibrary.ts).

Some configurations select whether structured tables or a stored policy own behavior. Read ownership markers through [field ownership](../../src/domain/fieldDefinitionOwnership.ts), [Site structure ownership](../../src/domain/siteStructureOwnership.ts), and the other effective-configuration resolvers. The [Library ownership map](../../src/domain/libraryOwnership.ts) classifies targets for display; moving files does not move or copy policy values.

## Validation boundary

The builder rejects missing, duplicate, unknown or misplaced tables and validates identity contracts. Browser loading adds snapshot, identity and selected page/field checks through [sharedCatalog.ts](../../src/persistence/sharedCatalog.ts). Other constraints belong to domain resolvers and behavior tests. `catalog:check` verifies component references and generated document drift. These checks do not claim complete validation of every nested property or full accessibility/production readiness.
