# Shared tobacco-product answers — approved

October 21, 2026. The user approved exactly the twelve source choices, removing Other, and clarified that answers are standardized across Sites. Both shared fields, `tobacco-products` and `spouse-tobacco-products`, use this list. There is no ABE-specific option override.

The source lists in current v78 **Smoker Question C5 and C20** agree. Display labels follow the source; existing supported stored values remain compatible.

| Source display label | Stored value |
| --- | --- |
| Cigarettes | Cigarettes |
| Nicotine patch | Nicotine Patch |
| Nicotine inhaler | Nicotine Inhaler |
| Nasal spray | Nasal Spray |
| Nicotine gum | Nicotine Gum |
| Nicotine lozenge | Nicotine Lozenge |
| E-Cigarettes | E-Cigarettes |
| Cigar | Cigars |
| Pipe | Pipe |
| Chewing tobacco | Chewing Tobacco |
| Snuff | Snuff |
| Betel nut | Betel Nut |

Old Other answers remain stored. The existing available-option validator requires a current selection before proceeding; no automatic replacement or deletion is performed. Saved supported values such as Cigars remain valid under the source's displayed Cigar label.

This changes shared answer options only. Existing question wording, Yes-only date/product followups, applicant/category applicability, lookbacks and rate classification retain their separate configuration. The approved child unmarried note and DI spouse 30-hour minimum are unchanged.

Owners: [shared option definition](../../src/config/fields/tobaccoProductOptions.ts), [shared member/spouse field definitions](../../src/config/fields/index.ts) and [recorded approval/source guard](../../src/migration/sharedTobaccoOptionsDecision.ts). [Tests](../../src/migration/sharedTobaccoOptionsDecision.test.ts) verify every current Site, both applicants, supported saved values, removal of Other, conditional followups, idempotent compilation and independently captured edits.

ABE's Site review remains open. This authorized shared-field correction does not sign off another Site's requirements.
