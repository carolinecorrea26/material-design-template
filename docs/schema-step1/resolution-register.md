# Portal structural finding resolution register

This register tracks work following the step 1 audit. A documented observation, a proposed model, an implemented constraint, and a validated migration are separate states. A finding is not structurally resolved merely because its intended fix is described.

October 13 implementation update: the historical states below precede the additive canonical Association, application storage, reference validation and selection-history migrations. The [current ASCE setup and evidence](../asce-database-setup.md) records the complete fresh/upgrade PostgreSQL gate and distinguishes SQL verification from the running mock stores. These earlier open states must not be used as the current migration status, and the new SQL evidence must not be interpreted as deployment or complete source/business acceptance.

## Confirmed business terminology and behavior

Scope confirmed on October 13, 2026: focus implementation and Site configuration validation on **ASCE, ABE, AMA, AVMA, CSEA, NSO, ISI Trust, WAEPA, WAEPA GI, and demo**, with ASCE first. Other imported records remain preserved as deferred source evidence. Their configuration and business accuracy review are deferred. Shared schema constraints must continue to support all stored records, and narrowing the Site scope does not establish that the schema completion gate has passed.

The business hierarchy is **TPA → Association → Site**. “Client” is existing implementation terminology and is not a separate entity in the business hierarchy.

- A TPA can have multiple Associations.
- An Association can have multiple Sites.
- AMA is a single Association with multiple Sites. Its Sites do not present an association membership choice.
- A Site configured for multiple Associations presents the relevant association choices on the membership page. The existing association URL parameter also supplies association context for such Sites.
- Each Application has at most one selected Association.

The phrase “Association” can describe the top-level setup under a TPA and, for a multi-association Site, the individual associations offered for selection. These roles must be distinguished in the storage contract without inventing a membership-choice record or selector for a single-association Site such as AMA.

The [proposed storage mapping](association-site-model.md) and [complete existing identity crosswalk](hierarchy-crosswalk.md) now reconcile the roles of current `clients`, `associations` and `site_associations` records against this terminology. Record-specific identity, ownership and alias decisions remain unresolved and are retained in the crosswalk. The existing `clients` layer must not be retained as an additional business entity merely because the code currently uses that name. Conversely, renaming both current tables to “associations” would not resolve their overlapping meanings or identities.

## Historical resolution states before implementation

| Finding | Current state | Resolution dependency |
| --- | --- | --- |
| F01 Table inventory and access surfaces | Inventory discrepancy resolved; existing access distinction documented | Publication coherence and identity remain F07/F10 |
| F02 Unenforced catalog keys | Product versus category meaning traced; model proposal below | Canonical assignment source and historical product identity reconciliation |
| F03 Parent ownership consistency | Hierarchy mapping proposed; implementation open | Resolve source TPA differences, applicant tenancy and canonical ownership targets |
| F04 Association ownership | All existing Association/Site rows crosswalked; implementation open | Reconcile singleton aliases and affiliations; enforce parent consistency |
| F05 Application relationships | At most one selected Association confirmed; remaining model open | Single-association context versus explicit multi-association selection; people, coverage, answers and snapshots |
| F06 Action owners | Open | Actor model and typed owner targets |
| F07 Identity and actors | Open | Human/service identities, public/auth identity mapping and history |
| F08 Operational flags in configuration reads | Open | Separate operational value ownership from catalog configuration |
| F09 JSON references | Open | Per-surface reference validation contract and historical snapshot rules |
| F10 Publication relationships | Open | Same-site composites and payload validation boundary |
| F11 Duplicate sources and natural identity | Open | Canonical source choices and conditional assignment uniqueness |
| F12 Adapter and seed equivalence | Open | Identity mapping and common structural validation contract |
| F13 Manifest/migration equivalence | Open | Complete schema inventory versus subset seed export definitions |
| F14 Seed and historical documentation inventories | Open | Explicit source designation and existing database reconciliation |

At the time of this historical resolution pass, no migrations or runtime changes had been made and no structural finding was marked implemented or database-validated. See the implementation update above for subsequent evidence.

## F01 Resolution of the inventory discrepancy

The authoritative repository table count is 135 public tables, plus the external `auth.users` dependency. The 129-table count describes the generic persistence adapter's collection map. The full dictionary and diagram cover both access surfaces.

Retain the existing dedicated publication access boundary for the six additional tables. Treat their RPC/service contracts as explicit persistence contracts rather than forcing every table into generic CRUD with an `id` field. `portal_admin_accounts`, `portal_library_heads`, and `portal_library_readiness` have different primary-key shapes; their omission from generic CRUD is justified by that boundary.

This resolves the count and inventory issue. It does not resolve publication same-site consistency, actor identity, payload references, or historical retention. Those remain F07, F09 and F10.

## F02 Product identity and coverage categories

The code provides additional evidence for the meaning of `site_coverages.coverage_key`:

- `src/migration/fixtures.tsx` builds both `siteCoverages.coverageKey` and `siteProducts.productKey` from `product.id`.
- `src/migration/waepaGiAdoption.ts` compares `coverageKey` to a product key when changing offered coverage.
- `src/repositories/persistedSiteAdapter.ts` reconstructs compatibility coverage assignments from enabled coverage configuration values rather than reading SQL `site_coverages`.
- `src/repositories/portalDataRepository.ts` includes `siteProducts` in effective site resolution and excludes `siteCoverages`.

Consequently, `coverage_key` is not a category identity in the existing data. A foreign key to `coverage_categories` would be incorrect. The names “coverage” and “product” currently describe overlapping selection identities, whereas a coverage category groups products.

### Proposed canonical assignment model

Use `products` for product definitions and `coverage_categories` for category definitions. A product references its category. Use `site_products` for site assignment. Retain multi-product Sites. The existing `product_clients` availability relationship must be remapped once the Association identities and ownership are reconciled; its current name is not a reason to introduce a business Client entity.

Use `site_products` as the canonical persisted site/product assignment source. Treat the legacy coverage assignment representation as a compatibility projection of that source, subject to reconciliation of existing disagreements. If site-level category activation is needed independently of product activation, it needs an explicitly named category relationship rather than overloading `site_coverages.coverage_key`.

This is a proposal, not a migration decision already enforced. Before retiring or deriving legacy records, identify any existing coverage/product assignment disagreement and preserve it as unresolved evidence. No records should be removed or overwritten merely because the two seeds currently populate overlapping lists.

Application product labels remain unresolved historical input. Preserve their original text independently of any future canonical product reference. A label such as “Term Life” is insufficient to invent the specific product, identifier, association, plan or original configuration revision.

## F03 Ownership under the corrected hierarchy

The earlier organization → Client → Site proposal is superseded by the user's TPA → Association → Site clarification. Preserve the confirmed one-to-many capabilities: multiple Associations per TPA and multiple Sites per Association.

Current `client_id`, `client_key` and `scope = 'client'` references occur throughout configuration, operational and identity data. Each must be mapped to its actual Association or Site meaning before constraints or naming are changed. This includes product availability, applicants, configuration inheritance and actor scopes. No ownership is being inferred solely from a legacy column name.

Rows naming several ownership contexts must enforce their compatibility once the canonical identities are established. Scoped configuration inheritance and multi-dimensional rules remain distinct models; they must not receive the same CHECK indiscriminately.

## F04 Single and multi-association Sites

AMA establishes the single-association case: one Association, multiple Sites, no association selector or membership-choice collection. Its association context follows from the Site's relationship to AMA.

Multi-association Sites need an explicit list of associations available for the membership-page selection or association URL context. A valid selection must refer to an association available on that Site. A single-association Site must not be modeled as requiring a user to pick its only Association.

The existing schema stores singleton rows such as AMA in `associations` as well as an AMA record in `clients`, while multi-association data such as ISI Trust use one `clients` record with many `associations` rows. This evidence explains why a blanket table rename or treating all lower rows as membership choices would be inaccurate. The proposed [storage mapping](association-site-model.md) unifies canonical Association identity and separates fixed Site context from multi-association offerings. The [crosswalk](hierarchy-crosswalk.json) preserves all old IDs, source references and Site links without authorizing merges.

The parent-reassignment consistency gap remains open. Its implementation depends on that reconciled ownership model rather than the superseded Client boundary.

## F05 At most one Association per Application

The user confirmed that each Application may select at most one Association. Retain that upper bound; do not introduce multi-association application selection.

For an AMA Site, the application has the Site's AMA context without a membership-page choice. For a multi-association Site, the application retains the one association selected through the supported page or URL context. Association context and the user interaction that supplies it are separate concerns.

The existing unique `application_associations.application_id` already declares an upper bound of one selection row. How single-association context is stored, when a multi-association selection becomes mandatory, and how the original context survives historical configuration changes remain application-model decisions. They are not resolved merely by retaining this unique constraint.

## Completion rule

Confirmed ownership/cardinality decisions must be recorded before dependent constraints are implemented. Implementation must then update migrations, contracts, adapters, seeds and the complete inventory together. Fresh/upgrade checks and application to the intended database remain later phases. The full schema completion gate remains open.
