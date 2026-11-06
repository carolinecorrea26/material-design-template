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

## Older JSON snapshots

The optional converter inserts missing page, surface and collection metadata in
older Library snapshots. It writes a new detached draft and a change report,
preserves the source, and refuses to overwrite output files:

```sh
npm run pages:migrate-snapshot -- --input /absolute/path/old-snapshot.json --output /absolute/path/new-draft.json
```

For a record in a copy of local prototype state, add `--collection` with
`drafts`, `releases` or `prototypeReleases` and `--id` with the record ID.
The output is not published automatically: review the draft and collect fresh
acceptance evidence before publishing. Existing authored values remain
authoritative; invalid or ambiguous snapshots fail validation.

## Verification

Focused tests cover stored labels, bindings, field membership/order, limits, Site isolation, payment-policy filtering, restored-record validation, unsafe/conflicting definitions, original-preserving snapshot conversion, and actual repeated-field/calculator/verification rendering. Mock-service tests cover save/reload/restart, conversion, publication review, applicant saves and Site isolation. Browser checks exercised beneficiary add/edit, health-detail save, bank-field visibility and quote inputs/results using synthetic local data.

Build and lint pass. The wider suite exposed older Library-navigation assertions about column headers and an unmatched analytics fixture; those unrelated assertions are not part of the passing focused gate. Sandbox port-binding failures in mock-service tests were rerun outside the sandbox, where all forty script tests passed.
