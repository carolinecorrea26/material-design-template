# Eligibility (ASCE)

Eligibility uses fresh-start sources for its complete page surface (CHG-026).
Its route is `/eligibility`, after Membership in Getting started.

| Source | Owns |
|---|---|
| [parked/eligibility.json](../../requirements/parked/eligibility.json) | Page definition, route/order, section placement, conditional visibility and child collection layout |
| [Eligibility mapping](../../requirements/mappings/components/eligibility.json) | Reusable fields and applicant roles |
| [field-details.json](../../requirements/parked/field-details.json) | Labels, types, required status and member-only browser hints |
| [option-lists.json](../../requirements/global/option-lists.json) | Shared state/province and other option lists |
| [Eligibility content](../../requirements/global/content/eligibility.json) | Header, notes, errors, verification copy and child labels |
| [ASCE page](../../requirements/parked/sites/asce/pages/eligibility.json) | Includes the optional full-time student field |
| [ASCE settings](../../requirements/parked/sites/asce/eligibility.json) | TPA verification mode, lookup fields and prototype member record |
| [Verification address](../../requirements/mappings/components/verification-address.json) | Address modal field definitions, independent of Contact placement |
| [Verification fixture](../../requirements/global/prototype-fixtures/verification.json) | Simulated security questions and failure answer |

## Sections

| Section | Fields | Shown when |
|---|---|---|
| You | ZIP/postal code, state/province, date of birth, dependent choices | Always |
| Your Spouse | Spouse membership, first name, last name, date of birth | Spouse selected |
| Your Child(ren) | First name, last name, date of birth, gender, full-time student for each child | Child selected |

Children use an add/edit dialog and the shared list maximum (10). Names appear in
the list's grid. The mapping/site file controls optional fields; no child marital
status question is collected. The child section keeps its unmarried-children note.
The profession note belongs to Membership. Spouse names and birth dates and child
inputs have browser autocomplete off; the member's date of birth uses `bday`.

## Existing behavior

ZIP/postal code accepts five-digit US ZIPs, ZIP+4 and Canadian postal codes, with
formatting shared by application and quote fields. A matching code can infer
state/province. An unmatched code leaves the current selection unchanged and
allows manual selection. Applicants can override an inferred state; that choice
persists until the ZIP/postal code changes again. Lookup failure is not an
eligibility decision. Applicable field and page checks run on
Next and report errors through the standard page error alert. Selecting spouse
requires the spouse details; selecting child requires a child record. Membership
attestation remains the only answer-driven inline page stop.

ASCE's configured member lookup may collect a residential address before opening
member verification. Verification controls and questions use the fresh definitions
and prototype fixture. This records and simulates the current flow; it does not
connect a live TPA service. Resuming an application shows the configured loaded
notice. Autosave starts only after successful Membership submission.

The confirmed `coverage-tpa-portfolio-access` rule is shared with Coverage. Only an
existing member with active coverage and successful identity verification receives
portfolio access. The [Coverage review](coverage.md#verified-existing-member-portfolio-chg-029)
documents the fictional ASCE member, verification steps and automated journey
checks. Failed/skipped verification continues as manual review without portfolio
access, as confirmed during Coverage review.

The shared compiler produces these page records for Library, prototype and
Storybook. Old saved page definitions, content and placements cannot supply missing
defaults. The legacy Eligibility page file and superseded authored records have
been removed. Product eligibility and remaining business-rule decisions continue
in the staged Coverage review.
