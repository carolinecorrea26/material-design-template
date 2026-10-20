# Stored field collections and controls

Stored Fields now covers section membership/order, children, disability-company records, beneficiaries, health follow-ups, calculator inputs, payment and member-verification controls. React components, calculations, conditional workflow rules and summary formatting remain in code.

Ordinary section membership/order comes from `pageSectionFields`. Repeated children and disability-company policies use the `fieldCollections` configuration path. The additional form and tool surfaces use `fieldSurfaces`; their canonical input definitions live in `fields`. Field definitions and validation resolve with Global → Client → Site precedence. Both applicant rendering and Library inspection use the resolved definitions.

## Additional surfaces

| Surface | Stored behavior | Code-owned behavior |
| --- | --- | --- |
| Beneficiaries | Individual/trust fields, order, individual grid placement, labels, requirements, bindings, designation limits, type/opt-in control definitions | Product/applicant ownership, primary/contingent workflow, share arithmetic, individual/trust exclusivity, summaries |
| Health follow-ups | Detail fields, labels, bindings, order, grids and per-question record limits; answer definitions use existing stored page fields | Applicant participation, Yes-triggered details, DI summary renderer selection |
| Needs calculator | Inputs, order, bindings, labels, formats, requirements and input lengths | Arithmetic and transient calculator state |
| Quote calculator | Eligibility and question inputs, order, labels, requirements and options; product-selection, amount, category and rate-display control definitions | Eligibility derivations, rating, product choices/amount limits, category participation, applying a quote |
| Payment | Opt-in, product/shared method and frequency definitions, labels/options, bank-field membership/order and validation | Product payment policy, shared-choice intersection, frequency normalization, synthetic authorization |
| Member verification | Method and sample security-question definitions, labels, choices, membership/order and requirements | Prototype verification steps and sample success/failure calculation |

Authored payment options are intersected with the product's stored journey policy. Shared choices must remain available for every participating product. An authored option cannot grant a product a payment method or frequency its policy rejects. Quote amounts/categories continue to come from stored product definitions and eligibility rules.

Beneficiary and health bindings map canonical fields into repeated record properties. Summary adapters project those properties into semantic values; beneficiary records retain compatible summary properties. Needs-calculator bindings also select local input keys. Named quote/payment/verification controls consumed by existing application APIs retain their semantic binding names; unsupported renames and unsupported specialized control kinds are rejected instead of silently ignored.

Stored limits also apply to restored beneficiary/health records. Editing repeated records preserves values belonging to hidden fields. Missing/ambiguous surface configuration, unsafe/duplicate/reserved bindings, conflicting overrides, invalid limits and unsupported control options fail closed in an active stored prototype. Catalog-mode defaults remain available outside the active prototype. An unassigned page does not invalidate its globally stored collection definitions.

## Database and older snapshots

`supabase/migrations/202610090002_field_collections.sql` supplies the first collection batch. `supabase/migrations/202610090003_field_surfaces.sql` supplies the additional controls and follow-ups. Both preserve authored definitions and values when reapplied. These migrations were checked only in the disposable PostgreSQL database inside `portal-migration-review`; they have not been applied to staging or production.

The explicit snapshot converter described in [Page catalog upgrades](page-catalog-migration.md) inserts missing surface metadata as well as collection metadata. It produces a detached new draft, preserves the original release/draft, and requires normal review and publishing. It does not activate a release. Existing authored policies remain authoritative; conversion does not overwrite them to repair an invalid policy.

## Verification

The [PostgreSQL report](field-surfaces-postgres-validation.json) covers thirteen migrations, legacy upgrades, preservation of authored values, double seed application, ten-Site readback equivalence, snapshot checks and RLS. Readback explicitly compares resolved surfaces and collections.

Focused tests cover stored labels, bindings, field membership/order, limits, Site isolation, payment-policy filtering, restored-record validation, unsafe/conflicting definitions, original-preserving snapshot conversion, and actual repeated-field/calculator/verification rendering. Mock-service tests cover save/reload/restart, conversion, publication review, applicant saves and Site isolation. Browser checks exercised beneficiary add/edit, health-detail save, bank-field visibility and quote inputs/results using synthetic local data.

Build and lint pass. The wider suite exposed older Library-navigation assertions about column headers and an unmatched analytics fixture; those unrelated assertions are not part of the passing focused gate. Sandbox port-binding failures in mock-service tests were rerun outside the sandbox, where all forty script tests passed.
