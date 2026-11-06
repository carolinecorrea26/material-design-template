# Portal Library ownership and schema review

Portal Library owns the complete site requirements reference. Storybook owns executable component examples and their states. The Library groups business rules, products and riders, configurations, URL parameters and validations in Rules & configuration. Shared calculation structures and decision values retain their storage relationships and appear under the requirement that uses them.

This pass establishes ownership and inspection structure. ASCE source accuracy, the ASCE applicant journey and the single PDF requirements export are the subsequent phases. Existing stored or documented requirements are not marked verified merely because they appear in a table.

## Complete inventory

`npm run library:audit` generates [the schema inventory](portal-library-schema-audit.json) from the current TypeScript database contracts, SQL table definitions, persisted Library snapshot and Storybook source. The current schema has 147 public SQL tables, 141 generic adapter collections and 100 tables in the Library snapshot. Each snapshot table has exactly one logical owner or an explicit shared or evidence role, including the four canonical Association identity/context tables. The six dedicated publication/admin tables use their RPC/service boundary. The complete installed SQL column and constraint inventory is in [the PostgreSQL dictionary](schema-validation/table-dictionary.json); current ASCE fresh/upgrade evidence and runtime storage boundaries are in [ASCE database setup](asce-database-setup.md).

The current component catalog contains 67 component records. The Storybook build contains 65 component story modules and 225 examples, including the existing Administration component examples. Components may share a story module; module and component counts therefore differ. Story IDs use Storybook's own naming functions. The inventory checks all literal component links in application source and records broken links.

The counts include stored catalog and source-only records. They do not assert that every record applies to ASCE or is executable. Field names ending in Key or Id are marked as reference candidates in the inventory; actual storage constraints are retained in each table's SQL definition.

## Library responsibilities

| Area | Owns | Storage and references |
| --- | --- | --- |
| Client information | Client, administrator, association and environment identity | Organizations, profiles, clients, sites, associations, assignments and environment links |
| Components | Component catalog, examples and recorded page compositions | Stored components linked to generated Storybook IDs; page composition reference |
| Pages | Page definitions, sections, order and site availability | Pages, sections and site page assignments |
| Fields | Inputs, placements, collections, questionnaires and options | Field definitions and placements, section fields, question sets and product question relationships |
| Flows | Journey diagrams, branches and saved application decision states | Flow definitions, steps, transitions and assignments; application-record state definitions |
| Products & riders | Catalog identities, categories, identifiers, rider relationships and plans | Products, riders, categories, codes, product and rider assignments, reusable plans and variants |
| Business rules | Availability, eligibility, amounts, benefits, limits, underwriting, rating, payment, verification and application behavior | Typed policy tables, business policy values and rule relationships; shared conditions and derived decision outputs |
| Configurations | Administrative settings and their effective values | Configuration definitions and scoped values; configured site switches; references to business or product policies |
| URL parameters | Parameter behavior, recorded values, site enablement and defaults | Parameter definitions joined to allowed values and site assignments |
| Validations | Field and page checks, triggers and displayed messages | Existing form validation definitions and page error inventory |
| Features | Capabilities, site settings and migration context | Feature definitions, site assignments and the template change reference |
| Content | Managed copy, assets, disclosures and documents | Content definitions and values, document definitions and site document relationships |
| Emails | Transactional email previews and related settings | Existing previews, templates and site assignments; contact settings remain referenced from Configurations |
| Branding & Design | Brand assets, theme preview, icons and design foundations | Existing interactive previews, branding profiles and values read from the executable theme |
| Accessibility | Acceptance criteria and implementation guidance | Shared AA criteria and reviews, plus the relocated implementation guide |
| Analytics | Tracking requirements, stored mappings and gaps | The existing saved analytics records and inspection projections |

## Business tables

Business rules displays one requirement per source assignment. Amount bands and options are joined to their product, rider or plan amount assignment. Conditional benefit caps are joined to the limit they constrain. The amount structure remains reusable without becoming a second independent Library definition. Site coverage rows remain explicit site sets; global catalog rows are not silently substituted for missing site policies.

Typed configuration targets establish business ownership even when a policy is physically stored in configurationValues. The Configurations table retains a reference to the owning rule or product and omits its value there. Business rules renders business policy values. Products & riders renders product presentation. Legacy amount configuration values are identified as compatibility references when a normalized assignment for the same product and site exists.

Sequence describes documentation order. It does not establish execution precedence. Dependencies, condition IDs, predicate inputs and structured outcomes remain inspectable. Planned requirements remain visible with a Planned status. Null source attributes are shown as Not specified rather than supplied with an invented default.

## Shared structures and states

Patterns and Flags are absent from navigation. Their persisted tables are retained to preserve relationships and migration evidence. Coverage calculations appear with coverage requirements. Integration behaviors appear in the business rules and verification policies that specify them. Configuration switches appear in Configurations; derived values appear as conditions or decision outputs in Business rules; saved decision states appear below the Flows diagrams.

A missing configured flag assignment is shown as Not configured. A missing URL parameter assignment is shown as No site assignment recorded. Neither establishes a false value or implies that a parameter is disabled.

## Storybook information accounted for

| Previous Storybook information | Current home |
| --- | --- |
| Colors, typography, spacing, shape, elevation, breakpoints and theme overrides | Branding & Design → Design foundations |
| Branding and icons | Existing Branding guidelines and Icons views |
| Feedback and status conventions | Design foundations → Feedback & status guidance; component state examples remain in Storybook |
| Accessibility implementation guide | Accessibility → Implementation guidance |
| Page coverage matrix | Components → Recorded page composition and component coverage |
| Project overview and template comparison | Features → Template change reference |
| Separate business rules table in Project Overview | Removed; the owning Business rules table is the reference |
| Design system and foundations overview pages | Superseded by the Library areas and ownership table above |
| Instructions for operating Storybook | Repository authoring reference; excluded from the component catalog |
| Admin account example | Retained as executable Administration component examples; their requirements belong to the Administration workspace and are excluded from applicant site requirements |
| FormRoutePage example | Retained as an executable composition component in Storybook |

The relocated source modules have no Storybook metadata and are no longer story files. Component stories retain their existing categories and IDs. CMS links formerly targeting documentation pages now target actual component examples.

## Main site identity

Main sites use demo, abe, ama, asce, avma, csea, nso, isitrust and waepa. The separate Guaranteed Issue site remains waepa-gi. Older main site names are accepted at read and navigation boundaries. Saved structured site references are normalized on detached reads; source references and revision labels remain verbatim. The ASCE approval validator accepts the exact known prior record through this identity change, including its original source and display ID, while still rejecting altered approvals or business values.

Source workbook and checklist JSON, historical SQL migrations and original evidence are preserved. No connected database has been deployed or reset. A production rollout must reconcile persisted keys through its normal database migration process; the compatibility reader does not apply a remote migration.

## Remaining schema and accuracy work

1. Verify ASCE values against the approved sources, distinguishing current implementation, required behavior, provisional decisions and missing information.
2. Reconcile overlap between legacy CoverageDefinition policy attributes, typed normalized tables and business policy JSON before retiring compatibility storage. Classification establishes ownership; it does not prove these representations agree.
3. Confirm URL parameter runtime behavior, supported values and actual site applicability. Site assignments are currently absent in the reviewed export, and removed or proposed parameters remain explicitly identified.
4. Decide whether applicant type definitions and additional source-only relationships need to enter the effective snapshot as new categories or classes are introduced. They remain accounted for in the storage inventory.
5. Reconcile stored flow, content, email and branding configuration with their existing rich preview adapters during ASCE verification. The previews are preserved; the schema inventory does not establish full persisted runtime parity for these areas.
6. Capture analytics and shared implementation guidance consistently with the selected site revision when building the PDF. The present analytics catalog is read separately from the normalized snapshot.
7. Define typed expression and precedence contracts for conditional calculations that the current resolver reports as unsupported. Preserve those gaps rather than converting them into apparently complete rules.

## Verification and next phases

The first phase requires schema ownership coverage, uniqueness of projected requirement identities, site scope and disabled-product checks, joined amount and URL relationships, classification of conditions and saved state, component link integrity, navigation regressions, browser inspection, and successful application and Storybook builds.

The next phase establishes ASCE information accuracy using this ownership model. Applicant journey verification follows that review. The final phase produces the complete site requirements PDF from a captured revision and removes the per-table CSV and XML actions. Those export actions remain available during this first phase.
