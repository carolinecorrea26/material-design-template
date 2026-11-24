# Beneficiary page review

Beneficiary follows Coverage. Shared definitions belong to the global template;
The global default is optional; ASCE assigns optional mode at position 4 and selects its product designation
notes. Other real Sites remain outside this rollout.

## Composition and ownership

`requirements/parked/beneficiary.json` declares the frame, ordered participation,
self and spouse sections, shared PageHelp topics, add/edit modal and copy modal. Nested
component placements and the shared section-order mapping drive rendering and
Library documentation. `FormRoutePage` supplies progress, header, help, alerts,
Back, saving and Next. Both applicants reuse `BeneficiaryProductRecords`,
`CategoryCard`, `ProductCard` and `DynamicListItem`.

| Area | Authoritative definition and effective behavior |
|---|---|
| Participation | Global `beneficiary-categories` defaults to LI/AD. Explicit product/applicant/Association policies override that default. Only selected member/spouse elections with positive requested amounts participate; retained amount defaults and child coverage do not create adult records. |
| Optional page | The effective page requirement controls the opt-in question. Yes reveals applicable records; No permits continuation. The global default and ASCE assignment are optional (CHG-051). The source-defined opt-in is registered with the form so restored Yes/No answers initialize, validate and save correctly. |
| Product presentation | Shared effective category/product order, names, featured-product and first-category priorities apply. QD uses the selected applicant/product underwriting result. |
| Product notes | Shared content keys are selected under the effective Site page's `productNotes`. ASCE Term Life/AD&D replace prior designations; 10/20-year Life notes apply to new insurance. Notes do not determine participation. |
| Fields and limits | Authored individual/trust surfaces supply labels, options, checks, bindings and limits: ten individuals or one trust per product/applicant/designation. Primary and contingent are independent; individuals and trust cannot mix within a designation. Individual shares use the canonical whole-percent field format and must be positive, totaling at most 100% during editing and exactly 100% per populated designation on Next. A trust represents its entire designation without a share input. |
| Add/edit/remove | Modal fields use the compiled definitions. Save validates the resulting record list and current participation before writing. Edit restores authored values; removal affects only that product/applicant and returns focus to Add. Percentage shortcuts and remaining-capacity feedback follow the same allocation rules. |
| Copy | Preserve CHG-009: offer all compatible member **and spouse** targets, preselected, with applicant headings where applicable. Existing records can be reused explicitly. Copies get independent IDs; editing does not automatically offer copying. All targets are rechecked before any copy is written. |
| Content and requirements | Page content keys, global rule definitions and mapped validation declarations are visible through the fresh-start projection. Field checks are shared by the editor and restored-record validation. No Site-specific template gate is added. |

## Storage and consumers

Application answers store records in `beneficiaries["<product>:<member|spouse>"]`.
Each record has `id`, `designation`, `beneficiaryType` and only the active type's
authored value bindings. Semantic display values are derived when reading; duplicate
aliases and inactive-type fields are excluded when saving. Dialog state, copy
targets and remaining-share calculations are transient. Inactive product records
do not participate in current-page validation.

The Admin Center Library, prototype and Storybook compile the same source.
Whole-page examples cover empty, individuals/trust, member/spouse, default optional, a synthetic required override
and no applicable products. They use supported fields/products and local fictional
answers. Section examples receive compiled names and relationship options.

## Migration verification checkpoint (historical)

Composition, requirement mappings, participation configuration, content, storage and
copy gaps have been updated. TypeScript, targeted lint and 28 focused tests pass.
All 46 fresh-start tests pass, including reconstruction without superseded records,
synthetic inheritance and Library/prototype/Storybook parity. The Storybook
and prototype production builds also pass. Generated catalogs agree across public,
prototype and Storybook output.

**Beneficiary decisions resolved (CHG-049/050):** when the page is required or the user chooses Yes on the optional page, each applicable product/applicant must have at least one Primary beneficiary
before Next. The Primary can be an individual or a trust. Contingent beneficiaries
remain optional, and Contingent-only records cannot satisfy the requirement.
Each designation containing individuals must total exactly 100%, independently
for Primary and Contingent. Trusts need no share input. Draft add/edit/copy may
remain incomplete while users assemble records; Next enforces both Primary
presence and allocation completion. Optional No and inactive products/applicants
remain exempt. These are global rules inherited by ASCE.
No policy question from this review remains open.

Related: [page review](../requirements-spec/page-review.md),
[component boundaries](standalone-component-boundaries.md).


CHG-067: PageHelp owns topic selection and drawer state. Beneficiary’s two global help topics are source-authored and compile into the page definition; its content is supplied to PageHelpDrawer. No Beneficiary-specific help wrapper or local drawer state remains.


## Client configuration and copy review (CHG-080)

User decision November 15, 2026. Beneficiary has four declared content slots in `requirements/parked/beneficiary.json#contentSlots`. Definitions/defaults remain global; effective Site overrides use `parked/sites/<site>/pages/beneficiary.json` → `content`. ASCE inherits its existing wording and retains its current product/applicant assignments.

| Beneficiary item | Client configurable | Source / boundary |
| --- | --- | --- |
| Page title and introduction | Yes | `beneficiary.title`, `beneficiary.subhead`; shared application-header contract |
| Replaces-prior designation statement | Yes | `beneficiary.note.replaces-prior`; global default inherited when omitted |
| New-insurance-only designation statement | Yes | `beneficiary.note.new-insurance`; global default inherited when omitted |
| Which statement applies to a product/applicant | Yes, independently of wording | Existing `productNotes` assignments select a content key, covered member/spouse applicants and source references |
| Required/optional/not-collected page mode | Existing Site setting | Global default and ASCE assignment remain optional; opting out skips inactive beneficiary records |
| Product/applicant participation | Existing shared policy | Default categories and explicit product/applicant/association assignments; child records remain excluded |
| Editor field labels and supported relationship subsets | Yes | Shared definitions and supported Site assignments; stable record bindings and semantic option values remain |
| Core collection and requiredness | Global (CHG-097) | Applicable individual names, relationship/share, trust name/date and optional-page Yes/No stay included/required. Page/type applicability determines when they are collected. |
| Product/category names and order | Existing shared product presentation | Same effective values and ordering used elsewhere |
| Record/designation display labels, buttons, modal headings, help, navigation/loading and validation/capacity wording | Global/shared | No new free-form page-copy slots; computed values still follow the actual rules |
| Primary/Contingent, individual/trust, allocation, limits and copy rules | Global rules/authored surfaces | Wording overrides do not change these rules or make an incomplete record valid |

A statement override applies wherever that key is assigned on that Site. Product/applicant applicability remains separate; overriding one statement does not reassign products or enable beneficiaries for children. Assigned statements must contain nonblank string text. Incorrect shapes, unsupported copy keys and blank assigned statements are rejected. Omission inherits the global text; removing an assignment is separate from editing its statement.

The compiler resolves each assigned content key using effective Site wording before creating the existing note-policy projection. The Beneficiary page and existing BeneficiaryProductRecords display that projection through the shared info Alert. Library content/configuration values and Storybook use the same source and resolved policy. No component, production document/delivery service, validation rule or answer binding is duplicated or introduced.

Designation wording is plain text, displayed as supplied through the existing pre-wrapped info Alert; the override adds no new template/HTML language. CHG-080 verification: all 71 fresh-start checks and 16 focused page/validation/actual-story checks pass, along with TypeScript, focused lint, requirements/component checks and both production builds. Synthetic Site wording is isolated, product/applicant assignments remain unchanged, and custom statements do not bypass beneficiary validation.


## Non-copy configuration audit (CHG-097)

November 16, 2026. Shared definitions/defaults, validation, URL contracts and component structure remain global. Effective Site values/overrides are authored under `parked/sites/<site>/`; ASCE's reviewed values are retained.

| Configuration | Global / effective Site boundary |
| --- | --- |
| Page structure and participation | Fixed global page/position 4. Site may select none/optional/required. Global default and ASCE assignment are optional. No other page reorder or duplicate implementation. |
| Default categories | Global `beneficiary-categories` LI/AD; Site may override the supported category list. Effective assigned products, selected adult applicants and positive requested amounts determine records. Default amounts alone never elect beneficiaries. |
| Product/applicant/Association exceptions | Global `shared.beneficiary-participation` definition, optionally assigned at Site scope with collect true/false and assigned Association keys. Omission inherits category defaults. Rules/notes must reference assigned products/applicants; retained disabled assignments do not become active offerings. Children never collect records here. |
| Association context | Fixed, selected and URL Association modes use the shared resolved context, identically in page rendering and flow/applicant gates. Attestation Yes/No is not an Association key. Synthetic Storybook Association client ownership matches its synthetic Site. |
| Core fields | User-confirmed: individual first/last name, relationship/share, trust name/date and optional-page opt-in remain included and required whenever applicable. No field hiding, optional-product exception or relaxed requiredness may bypass this. Optional No and page none still skip record validation. |
| Supported field customization | Labels and canonical relationship subsets remain supported. Structural Yes/No and Individual/Trust choices stay global; shared share/date formats cannot be replaced. Aliased record surfaces retain the same authored bindings. |
| Records and allocation | Global ten individuals or one trust per product/applicant/designation. No mixing types within a designation. Primary required when collecting; contingent optional. Whole percentages are positive, at most 100 while editing, exactly 100 per populated designation on Next. Reject fractional/scientific/noncanonical restored values. |
| Product note assignment and copy | Site selects the global designation statement per product/applicant, independently of participation. Approved title/introduction and statement wording slots retain Site overrides with global defaults. Other structural, validation, capacity, help and action wording remains shared. |
| Product/category presentation | Shared names/order plus available featured product and firstCategory priorities. No Beneficiary-specific product order or URL parameter. |
| URL effects and saved answers | category/categories/prods/applicant narrow the offering and record targets. Existing elected amounts determine participation; amt/dprods/preselect do not create beneficiary records by themselves. URL-filtered or otherwise inactive saved records are retained but excluded from current collection/validation/copy targets. Resume restores the application's shared entry scope. |
| Copy and modal behavior | Compatible member/spouse targets are preselected under the existing global copy rule and revalidated before writing. No Site copy switch, duplicate Name example or new page-specific helper/component is introduced. Existing PageHelp, record cards and shared field/modal components remain their owners. |

Implemented gaps: global field constraints prevent missing mandatory record data; structural/format protections close generic-override bypasses; routing uses the same effective category defaults as page rendering instead of an independent category-gate fallback; normalized Association resolution makes explicit Site participation policies consistent across routing and page rendering; current product applicant scope prevents retained spouse elections leaking into a member-only URL; product/applicant guards reject unsupported note/policy assignments; the reusable participation definition is visible globally even without an ASCE override. ASCE uses its existing category defaults and notes.

CHG-097 verification: 87 Fresh-start checks and 43 focused field, policy, validation, page, actual-story and requirements-checker cases pass. They verify required core collection and permitted label/relationship overrides, global structural choices/formats, strict restored share values, assigned applicant policy scope, resolved fixed Association overrides, effective category overrides, member-only URL exclusion without deleting saved data, and source reconstruction with Library/prototype/Storybook parity. Synthetic Storybook Association ownership resolves correctly. Requirements, TypeScript, scoped lint, component/Storybook organization, icon/handoff checks and prototype/Storybook builds pass. All three catalog hashes match. The confirmed collection decision is resolved; no Beneficiary configuration question remains open.
