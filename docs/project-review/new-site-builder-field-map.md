# New Site Builder field map

Workflow for creating an effective Site in Portal Admin. **Build new site** starts
with an enrolled Site’s Library configuration and collects the identity and
assignments for a new Site. [Current Builder](../../src/pages/admin/SiteBuilderWorkspace.tsx) ·
[Requirements ownership](../requirements-spec/README.md)

## Local implementation

- The identity steps collect a TPA and its first Association, or use an existing
  TPA and one of its Associations. Both forms collect name, editable acronym,
  website, email, phone, and address in the same order. **Same as TPA** copies
  available contact details into the new Association form for editing. The TPA
  logo is optional and the Association logo is required. Both uploads accept PNG,
  JPEG, or WebP up to 1 MB.
- Pages and fields exposes declared page participation, supported page settings
  and copy, Membership question variants and outcomes, and Member ID collection
  under the shared follow-up rule. Products and rates exposes participation for
  copied products, applicant eligibility bounds, benefit formulas, billing,
  quote settings, and reference rates.
- Edits use the effective Site draft read by the applicant prototype. Shared
  template definitions remain in the fresh-start requirements. Saved drafts
  use the local mock service. The remaining workflow below describes planned
  controls, including reset to inheritance, approval of authored requirements,
  and configuration for product and document assignments beyond the starting Site.

## Form flow

Keep one form with **Site details**, **Products and eligibility**, **Application
setup**, and **Customize by page**. Open the fields that apply as the user makes
selections. The review summary groups outstanding items by section and links to
their fields.

- **Use existing** links to a current TPA, association, product, or
  reusable content record. Show the source of any values it supplies.
- **Add new** opens a small form in place for the missing entity. Keep proposed
  entities with the draft and check their names and keys against existing records.
- **Use template default** shows the resolved value. **Customize** reveals the
  allowed controls for a Site override. Returning to the default removes the
  override. An explicit blank value is available where the source allows blank
  content to suppress a section.
- **Still needed** means there is no valid value for the current setup. The user
  can save the draft and return to it later. Check setup explains what is missing
  and which selection made it necessary.

## Site details

| Field or group | How the form supplies it | When it needs attention |
| --- | --- | --- |
| Site name, display name, URL key | Enter a Site name. Suggest the display name and a URL key. Allow a different display name and confirm the key on review. | Check that the key is valid and unique before creation. Use it for the Site URL and assignment references. |
| TPA | Select an existing TPA or add one inline. | Required. Adding a TPA opens the form for its first Association. Both stay in the draft until the Site is created. |
| Hosting Association | Under an existing TPA, select one of its Associations or add one inline. Under a new TPA, collect the new Association's details inline. | Every Site requires exactly one hosting Association. That Association belongs to exactly one TPA and can host several Sites. Changing the selected TPA clears any incompatible Association selection. |
| Member associations and selection | Add or reuse member associations as needed. Select fixed, applicant selection, or URL-based selection where supported. | Show this when the Site has associated membership groups or requires an association-specific eligibility or branding decision. Validate the relevant choices, affiliations, and URL values. |
| Brand and support details | Reuse approved branding and support profiles. Offer Site-specific display copy, logo and alt text, theme, support phone and hours, email or website, and appropriate address or sales contact. | Ask for assets and contact details when an active surface needs them and a usable value has not been supplied. Use the selected association's context where the existing policy calls for it. |
| Site links and migration details | Generate the prototype link from the Site key. Collect a legacy Site or template reference and environment links when available. Initialize migration status from the portfolio default. | Show a legacy reference as optional migration evidence. Validate user-supplied links. Keep migration status editable in the portfolio. |
| Internal identity and version | Generate IDs, relationship keys, draft version, catalog revision and timestamps. Link the Site to its hosting Association and derive the TPA from that Association. | Surface identity conflicts and stale drafts in review. |

[Catalog and database identity](portal-database.md#tpa-association-and-site-identity) ·
[Site enrollment evidence](../requirements-spec/sites.md)

## Products and eligibility

Start with product selection. Each selected product shows its setup status and
opens a panel for the dimensions that apply. Use approved shared definitions
and defaults when the compiler supplies them. The Site supplies any missing
business values and their approved source.

| Field or group | How the form supplies it | When it needs attention |
| --- | --- | --- |
| Product and category participation | Pick published products and show their category and applicant capabilities. Select member, spouse and child where supported. | Require an intentional offering for an applicant Site. Explain how selections affect Home, Coverage, and later steps. |
| Product identity and reference documents | Collect the identifier and its role where applicable, such as plan code, G-number, rating or issuance reference, and brochure or other assigned document. | Ask for identifiers required by the chosen product or integration. Validate active document and product references. |
| Eligibility by applicant and association | Enter or inherit allowed ages, including day-based ages where supported, states or provinces, class, dependent or association participation, work hours, income and student thresholds. | Surface only the dimensions used by the chosen product or eligibility policy. Check ordered age bands, matching applicants and jurisdiction conflicts. |
| Amounts and periods | Choose the supported amount pattern. Show fixed options, ranges and increments, age/association caps, income-based amounts, waiting periods and benefit periods as applicable. | Require a usable amount for each offered applicant combination. Check overlap, bounds, increments and any required income facts. |
| Elections and existing coverage | Show minimums, required base or member coverage, mutually exclusive selections, maximum plans, aggregate limits and in-force adjustments where applicable. | Require confirmed policy values for the combinations in use. Check unavailable dependencies and conflicts across products. |
| Riders | Select compatible riders for the base product and applicable people. Collect amount rules, thresholds, caps, notes and rider-only participation where the shared contract supports it. | Validate compatibility, base requirements, rider amounts and applicant availability. |
| Underwriting and health route | Select or inherit the reviewed underwriting pathway and any applicable applicant, age or amount bands. Show the resulting Health steps. | Require a resolved pathway for the choices offered. Validate routing when a selection can trigger a different Health step. |
| Quoting and payment | Resolve the applicable quote presentation and rate policy, rate inputs/modifiers or reference table, and product payment options. | Ask for the approved setup when quoting or collection is enabled. Verify that the available applicant facts and assigned products support it. The prototype uses fictional estimates. |
| Product presentation | Review names, descriptions, notes or warnings, category and product order, featured product, and which questions or amounts to display or default. | Show advanced controls only when the underlying presentation setting supports a Site, product or applicant assignment. |

[Coverage and eligibility requirements](../requirements-spec/coverage.md) ·
[Product assignment validation](../../src/domain/requirementProductCatalog.mjs)

## Application setup and page customization

Show the effective pages after the product, household and layout choices are
resolved. For each page, indicate **Using template default**, **Customized** or
**Needs input**. Also show when the page or section appears in the journey, such
as after an accepted membership answer or for a selected product. Use plain
language for the condition shown next to an editable field.

| Page or area | Controls to expose | Source and dependency |
| --- | --- | --- |
| Layout | Single-page or multi-page. Show the current default and a preview of the resulting journey. | `form-template` selects a layout of the shared application. Shared page placement and order come from the template. |
| Home | Hero tagline, heading, description, default quote/image behavior or explicit image, image and alt text, introduction and section copy, and the entry notice. | The default hero shows a quote when rates and quoting are enabled and an image otherwise. An enabled entry notice needs a title and text. Quote and image controls follow the effective configuration. |
| Membership question | Prompt, supported configuration, and answer choices. Show the resulting radio, dropdown or association control. For custom categories, collect option labels and valid answer outcomes. | The shared Membership field defines Yes/No, New or Current Member, category and association. Each applicable answer resolves to a declared outcome. Accepted answers reveal the shared name and contact collection. |
| Additional Membership information | Select supported optional fields such as Member ID. Show the rule that reveals them. Allow requiredness, label, format and length where supported. Include applicable guidance and ineligible-answer copy. | Field participation and rules come from the shared component mapping and selected configuration. ASCE uses a required numeric Member ID with a six-character minimum. AMA-GI illustrates the related student details that appear with the Spouse choice. |
| Eligibility | Show Site applicant types, residence restrictions, child collection and repeat limits, optional fields and notes. Select an applicable TPA verification mode. | Show lookup inputs and address prerequisites when the enabled verification policy uses them. Each lookup input must be available before lookup. Test with appropriate fictional records. |
| Coverage | Review participating questions, work/income and dependent conditions, ordering, amount display/default/lock, price frequency and cost breakdown, and additional-versus-total coverage guidance. | Selections must correspond to active categories, products and eligible applicants. Coverage policy values and presentation controls have separate approved assignment sources. |
| Beneficiary | Use the template default, require, make optional or omit the page. Review applicable product categories and permitted designation copy and notes. | Product and applicant participation determine the records requested. Notes must reference active products and valid contexts. |
| Contact | Review residential/contact collection, business address visibility and product scope, correspondence choice and allowed page copy. | Show business-related controls when applicable. Individual product settings reference enabled Site products. |
| Profile | Review whether the Physician and Other coverage sections apply, per-person optional fields and requiredness, and applicable questionnaire policy and copy. | Underwriting and product rules drive eligibility for conditional questions. Shared calculations remain template settings. |
| Review and documents | Review permitted header copy, effective acknowledgement rules, and assigned consent, disclosure and notice documents with jurisdiction applicability. | Values come from shared documents and approved Site or product selectors. Show a missing applicable document as a setup problem. |
| Health and signing | Show the Health route and supported copy slots for the variants that apply. Select the approved prototype QuickDecision and DocuSign handoff assets when a Site needs an assignment. | Products and underwriting bands select the path. The template supplies signing rules and continuation. Asset requirements follow the handoff contract. |
| Payment | Use the template default, require, make optional or omit the page. Review collection method/frequency sharing, available elections and allowed notes and copy. | Only show methods and frequencies allowed by the applicable product policy. Honor Site choices across products where supported, including optional payment. |
| Receipt and emails | Review supported Receipt wording, outcome labels and explanations, payment and underwriting notices, and assigned document/email templates. | The completed journey and applicable payment answers drive the rendered Receipt. Global delivery and retention rules are reference information. |
| Advisor, Resume and utility pages | Show the effective shared flows for review. Expose supported Advisor entry text, Maintenance text, and declared flow or communication assignments where applicable. | Use the authoritative flow and content definitions. The form shows which settings are reference-only and which feed a supported prototype behavior. |

For each field, resolve the allowed placements and people from the template's
field mapping. Present only supported overrides for its configuration, label,
requiredness, options, format, input mode, minimum/maximum length and optional
product exceptions. Show participation choices for mapped fields and applicable
people. Existing visibility rules should be readable in the form. Where the
template supports a Site-selectable rule or outcome, offer its allowed choices.
Record an unsupported control, field placement or new condition as a template
gap for review before using it in the Site.

[Page requirements and options](../../requirements/parked/pages.json) ·
[Site field resolver](../../src/domain/requirementFieldDefinitions.mjs) ·
[Home configuration](home-component-review.md#client-configuration-and-copy-review-chg-076) ·
[Membership configuration](membership-component-review.md#non-copy-configuration-audit--complete-chg-089--chg-090)

## Settings inventory and source of each value

The tables establish the user-facing groups. Build the detailed control
inventory from the sources below to keep the form in step with the Library.
The current scan found 66 configuration definitions, 15 marked global-only,
and 74 declared Site copy slots across 17 pages. A setting needs a recognized
Site assignment path and an applicable runtime use before it becomes an editor
control. A definition or captured row alone is evidence for inspection.

| Read from the shared template | Record the Site decision in the matching owner |
| --- | --- |
| Identity schemas and the existing TPA and association catalog | Site identity and relationships, branding/support, documents, selected flows and emails use the effective Site application assignments and their referenced entities. Internal catalog identity records are resolved from the selected TPA or association. |
| Shared product definitions, identifiers, allowed Site product tables and typed policies | Product participation, riders, identifiers, feature and URL selections, policy records and associations use the Site product assignments. Eligibility bands, residency, caps and notes use their declared Site owner. |
| Site-assignable configuration definitions and bindings | Page configuration values use the owning Site page. Eligibility, TPA and coverage policy values use their respective Site assignments. The same setting appears once in the form even when it affects several pages. |
| Page `contentSlots` and shared content defaults | Page copy and typed assets use the Site page's allowed slots. Structured inputs such as images, notices, paragraphs and product notes preserve the declared shape. |
| Shared field definitions, configurations and mapping constraints | Field properties use Site field overrides. Include/hide choices and per-person placement use the Site page assignment. Display the inherited condition beside the control. |
| Page participation options and shared flow and rule definitions | Only Beneficiary and Payment currently declare editable page participation. Rules, order, shared legal copy, session and recovery policy, and other global-only settings appear as shared context where relevant. |

[Fresh-start source loader](../../src/domain/freshStartCatalog.ts) ·
[Configuration definitions](../../requirements/global/configurations/) ·
[Site source examples](../../requirements/parked/sites/) ·
[Page and copy validation](../../src/domain/requirementCatalog.mjs)

## Save draft, check setup, preview and create

1. **Save draft** stores a proposed Site identity, referenced entities, proposed
   new entities, and Site assignments against the current template/catalog
   revision in PostgreSQL. The existing Builder draft requires an enrolled Site
   key. New Site needs a draft identity before it has a Site key in the portfolio.
2. **Check setup** validates required values, relationships, supported scopes and
   dependencies using the same domain checks as the compiler. Group issues by
   the input the user can fix. Check that the Site's hosting Association belongs
   to the selected TPA and that a proposed TPA has its first Association.
   Recheck a draft against the current source if its base revision changed.
   Show missing information separately from confirmed template capability gaps.
3. **Preview** compiles the proposed Site with the shared template. Check the
   resulting pages and eligible branches, with appropriate fictional inputs.
   Show the user the Site values the preview is using and any unresolved setup
   that limits it.
4. **Create Site** confirms the reviewed identity and assignments, creates any
   accepted linked records once, and publishes the validated projection to the
   Sites overview, Library and prototype. When a TPA is new, create it with its
   first Association and Site in the same database transaction. Decide how this
   action records the canonical Site assignments before implementing it. The
   established owners are the effective Site requirements files, and the
   database serves the compiled catalog. The create action needs a defined write path for those
   approved inputs and a retry that preserves identity when publication fails.

## Review examples before designing screens

Use the existing configurations as intake examples. Test any proposed new
identity in a draft fixture while the portfolio holds the ten enrolled Sites.

| Example | What the field map needs to collect or explain |
| --- | --- |
| ASCE | Shared multi-page layout, five Site products, Yes/No membership, accepted-answer Member ID, TPA lookup, Life constraints, QuickDecision routing and optional Beneficiary and Payment. |
| AMA-GI | Single-page, Student/Spouse membership choices, related student fields on the Spouse branch, two assigned products, limited Profile collection, and Payment omitted. |
| ISI Trust | Hosting and member associations and association-dependent choices. Show which eligibility and product settings refer to the selected association. |
| Existing TPA and Association | The form shows only that TPA's Associations. Reuse the Association for a new Site, as AMA and AMA-GI share one Association today. |
| Existing TPA and new Association | Add the Association inline under the selected TPA. Reopening the draft preserves the proposed relationship, and setup review catches duplicates. |
| New TPA | The form collects both the TPA and its first Association. An incomplete draft can be saved. Creation requires both and a failed save leaves no published TPA or Association on its own. |
| Missing or conflicting assignments | An enabled product with missing policy, an unavailable TPA lookup field, an enabled entry notice without text, and a protected shared field flagged for hiding each lead to an explanation and the relevant input. |

The design is ready for implementation review when each field family has an
owner, a source or default, an explicit trigger for asking the user, and an
acceptance example. The setup review should show a proposed Site can compile from
its own assignments and produce consistent Library and prototype views.
