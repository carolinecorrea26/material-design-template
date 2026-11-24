# Page review

Review one page at a time: components, rules, validations, configurations, content,
and global versus effective-Site ownership. Each checkpoint distinguishes
implemented behavior from planned requirements and deferred decisions.

The checkpoints below retain their reviewed ASCE scope. AMA, WAEPA and WAEPA GI
now inherit these global pages with their restored effective assignments; this
[Site restoration](sites.md) does not restart or expand the earlier policy reviews.

| Page | Sections | Fields | Rolled out (prototype, Library, Storybook) |
|---|---|---|---|
| Home | **agreed: 4 section groups** | **agreed: quote-entry fields** | Fresh-start source and storage reconciled (CHG-040/041); current behavior and retained draft decisions are recorded below. |
| Membership | **agreed: 2 sections** | **agreed** | **complete for reviewed ASCE scope**: fields (including Phone Type), participation, content, help labels, page note, member autofill and save boundary; email and lead rules documented in Library |
| Eligibility | **agreed: 3 sections** | **agreed** | **complete for reviewed ASCE scope**: fresh-start structure, fields, content and simulated verification flow; shared composition/surfaces, inheritance and submission checks audited (CHG-044) |
| Coverage | **agreed: shared structure and two-stage flow** | **reviewed through the ASCE effective Site** | Global template definitions are shared. [Coverage ownership and rule register](coverage.md) separates effective-site values from global amount controls and URL contracts; planned controls remain explicitly marked. |
| Beneficiary | **agreed: participation, self and spouse** | **agreed: shared individual/trust and dialog controls** | **complete for reviewed ASCE scope**: composition, rules, validations, configurations, content and storage use the shared fresh-start projection; at least one Primary beneficiary is required per applicable product/applicant, with individual designation totals reaching 100% on Next (CHG-048/049/050/051). |
| Contact | **reviewed: owner residential/business and spouse contact** | **agreed** | **complete for reviewed ASCE scope**: member owner address/correspondence for dependent-only applications and member employment for spouse DI (CHG-058). |
| Profile | **reviewed: 13 placement sections and shared carrier dialog** | **81 page bindings; 4 shared dialog fields** | **complete for reviewed global/ASCE scope**: active applicants, QD and coverage follow-ups, SSN policy, carrier validation, financial calculations, content and storage (CHG-059). |
| Review | **reviewed: readout, two legal sections and shared notice viewer** | **separate adult acknowledgement and policy surfaces** | **complete for reviewed global/ASCE scope**: shared legal defaults, applicable readout, consent/notice rules, validation, content/storage and IMPORTANT NOTICE standard/NM/VA viewer (CHG-060). |
| Payment | **reviewed: optional collection, elections and banking** | **shared runtime product and bank surfaces** | **complete for reviewed global/ASCE scope**: defaults, policy choices, notes, validations, storage and normal continuation to DocuSign (CHG-070). |
| DocuSign | **reviewed: shared external handoff** | **no portal signature fields** | **complete for reviewed global/ASCE scope**: production signers/submission, shared legal content, configured image simulation and storage boundary (CHG-073). |

After a page's JSON is agreed it is rolled out: the prototype, Portal Library and
Storybook read its field definitions from the JSON, and the result is reviewed on all
three before the page is marked done.

How to read the tables:

- **Person** is who a section asks about: You (`self`), Spouse, Child or Beneficiary.
- **On by default** fields appear for every site. **Optional** fields appear only when a site
  turns them on.
- Field ids are in `code`. The label is what the applicant sees.

---

## Home

### Ownership and source

Home is a **global template** page. `requirements/parked/home.json` owns its
definition, component-to-section relationships, section participation, content slots
and complete quote/needs tool placements. `layout.sectionOrder` references the
four-group order in `mappings/page-sections/home.json`. The compiler emits that
composition into the shared page-section projection consumed by Home, Library and
Storybook; it is no longer a documentation-only section list. Shared field,
content, configuration, rule and validation definitions stay under `global/`;
`mappings/requirements/home.json` and `quote-calculator.json` record applicability.

An effective Site supplies product assignments, values, content selections and
permitted overrides under `parked/sites/<site>/`. ASCE currently inherits the global
Home content, quote-capable `default` Hero, static applying steps, multi-page template
and no decorative artwork. `home-landing-notice` defaults off and its content is
empty; the optional association introduction is also empty (hidden). No ASCE
Home override file is needed for inherited defaults. ASCE products and policy
values remain in its existing Site files; MCR provenance does not change ownership.

### Components, content and configurations

Home copy configurability (CHG-076): [the complete Home copy/configuration boundary](../project-review/home-component-review.md#client-configuration-and-copy-review-chg-076) records all 12 supported slots. Clients may override the hero tagline, section headings/introductions and quote introduction while inheriting global defaults. The three applying-step titles/descriptions and Home action labels remain global. Shared product, field, branding/support and insurer/help content keep their existing owners.

| Section | Components and current behavior | Source/configuration |
|---|---|---|
| Hero | `HomeHero`: badge, heading, description, Start my application and Continue application; quote card or image. Quote requires Site rates and quoting enabled; otherwise the default resolves to image. A Site may choose image explicitly. | `global/content/home.json`, `home-variant`; Hero tagline/text/subtext and the image source/alternative text are permitted Site content slots. The shared `/hero.svg` default is a real asset, rather than an inferred client path. |
| How applying works | `HowApplyingWorksPanel`: heading, description, three steps, static illustrations or animated preview; application-review and QuickDecision help. | `global/content/home.json`, `global/content/help.json`, `applying-steps-presentation` (static default). |
| Coverage options | `HomeCoverageSection` / `CoverageOptionsPanel`: available category tabs, descriptions, assigned products, applicant-specific amount ranges and shared expandable QuickDecision information only when an assigned product supports QD. Empty offerings show the shared information message without claiming QD availability. | Global product/category definitions and ordering; effective-Site products and policies. QuickDecision message and Show more/less wording are shared help content. |
| About | `AssociationIntroduction` is optional and hidden when its tagline/paragraphs are empty. `UnderwriterCredentials` shows the insurer logo, name, description, ratings and dated footnote. | `home.client-section` content slot, effective branding, shared Home copy and `global/content/insurer.json`; insurer identity, logo, ratings and footnote are authored once for Home/footer. |

The shared `AppShell` supplies header/menu, support, cookie notice and footer/legal
content; those shared definitions are not duplicated as Home-owned components.
Multi-page Home shows the marketing groups above. Existing single-page presentation
embeds the application and suppresses the marketing quote/image, actions and lower
sections. Template and `single-page-artwork` definitions retain draft status; their
defaults and Site values now project from fresh-start configuration, including the
existing `Site.templateType` consumer contract. Existing legacy
`welcome-back` / `quoteFirst` preview modes remain outside the supported Home
configuration options and are not newly enabled by this checkpoint.

### Fields, rules and validations

| Order | Global field | Control | Required |
|---|---|---|---|
| 1 | `zip-postal-code` | Text input | Yes |
| 2 | `state-province` | Searchable list | Yes |
| 3 | `birth-date` | Date input | Yes |

The prototype and standalone Hero example consume the same compiled quote field
surface, including effective options, formats and Site overrides. Get an instant
quote checks effective field definitions (requiredness, postal format, available
State/Province selection, authored length and valid calendar date) before opening.
Invalid input stays on Home with field errors; valid input shows loading and opens
the calculator. There is no separate age-80 limit in the compiled Home presentation;
product age eligibility is evaluated separately using effective product policies.

`state-province-from-postal-code` derives a matching location when the postal value
changes. Manual State/Province selection persists until that value changes again.
Missing lookup matches do not clear the selection or establish ineligibility.
`eligible-state-options` uses authored options and the effective filter. Browser
autofill follows the shared applicant-only rule. Geographic configuration definitions
retain their recorded draft status; this reconciliation adds no eligibility policy.

### Entry actions and quote workflow

Start resets the prior application/session and opens Membership. Continue opens
the resume flow. An optional `home-landing-notice` setting selects whether the `home.landing-notice`
content unit interrupts Start; Cancel stays on Home and Continue proceeds. Enabled
notices require a nonempty title and text. ASCE inherits disabled and has no notice
content assigned. The retired `applicantExperience.landingNotice` catalog definition
and saved values cannot activate this reviewed surface. Template selection
retains URL → session setting → Site setting → global default precedence.

The Home-opened calculator receives ZIP, State and Birthday internally and does
**not** display those fields again. Home is the only quote entry point; Membership
has no quote helper. The shared calculator asks applicable self-only questions
once, shows tobacco follow-ups for Yes, resolves available products/member riders
and amounts from effective policy, and includes selected riders in fictional estimates.
Category/product ordering is shared across Home, quoting and Coverage; a valid
`featured_prod` takes precedence without enabling unavailable products.

Apply requires a product and revalidates applicable answers, eligibility facts,
amounts and selections. Invalid input remains in the calculator with errors.
Success starts a fresh application, carries current quote data (including tobacco
answers and rider selections), closes the calculator and opens Membership. Coverage
restores the carried answers as editable values. Home/quote entry does not start
saved-application autosave; successful Membership submission establishes that save.

### Implementation and retained decisions (CHG-040/041)

The five final-audit gaps are closed: Home applicability includes applying steps,
form-template and complete field-definition checks; QuickDecision panel wording is
authored once in shared content; Hero and landing-notice examples use the correct
projection/configuration; the quote flow no longer lists Membership; stale Home
review statements have been replaced with this checkpoint.

Library, prototype and Storybook compile the same fresh-start sources. Reconstruction
and stale-record checks verify that superseded authored records cannot supply the
reviewed Home definition, fields or content. Focused checks cover Home entry,
manual location selection, quote handoff/carry-forward, section content and examples.
Current component references and verification are in
[the Home component checkpoint](../project-review/home-component-review.md).

The subsequent storage audit (CHG-041) also closed:

| Stored item | Authoritative owner and projection |
|---|---|
| Sections | Home layout/component relationships plus the section-order mapping; compiled component membership and template/preview participation drive rendering. |
| Quote/needs tool placement | Complete page-owned `surfaces` definitions, marked `kind: tool`; the generic consumer surface container is a shared application contract, with no tool placement left under Products. Hosted inputs cannot become extra inline Home fields. |
| Notice | Global enablement default and typed content slot; effective-Site Home configuration/content overrides. Superseded catalog notice records are retired. |
| Assets and insurer content | Explicit Hero image slot and shared insurer source; local images and alternative text are checked. No ASCE-specific image path is constructed in React. |
| Template/artwork | Global definitions/defaults and optional Site Home assignments; `Site.templateType` is a consumer projection of the same template value. |
| URL overrides | Global `variant` and `template` definitions/allowed values shown by Library and read by the runtime. Legacy variants are identified as preview-only; Site options remain quote/image. |

Global sections, field placements, content defaults and bound configuration definitions
also reconstruct without an enrolled Site. Generated deployment/catalog and handoff
outputs are refreshed from authoring; they are not separately edited requirements.
Cross-client legacy regression cases are parked when their Sites are absent from the
active bundle. Active Library checks use the deployed fresh-start projection and
reject attempts to make superseded saved records authoritative.

This closes the identified documentation/source/storage gaps. Existing draft rate-frequency,
geographic and form-template settings, fictional pricing formulas and deferred
product-policy decisions retain their statuses; source reconciliation does not
approve new business values or certify production services.

---

## Membership (step: Getting started, required)

What ASCE shows, top to bottom:

1. The membership question.
2. If the answer is No: a message that only members can apply.
3. If the answer is Yes: first name, last name, email, phone.
4. Then the membership follow-up question: Membership ID.

### Sections (agreed)

| # | Section | Person | Shown when | What it holds |
|---|---|---|---|---|
| 1 | **membership** | You | always | The membership question, then the applicant's title, name, email and phone. Those wait until the answer is Yes or the applicant is joining. The "only members can apply" message appears here when the answer is No. |
| 2 | **follow-up** | You | the answer is Yes, or the applicant is joining | Follow-up questions about membership. Empty unless a site turns one on. |

### Fields

| Section | Field | Type | Required | Shown when | Default |
|---|---|---|---|---|---|
| membership | Are you currently a member? (`membership`) | Yes / No | Yes | always | on |
| membership | Title (`title`) | Dropdown | No | member or joining | on |
| membership | First Name (`first-name`) | Text | Yes | member or joining | on |
| membership | Last Name (`last-name`) | Text | Yes | member or joining | on |
| membership | Email (`email`) | Text | Yes | member or joining | on |
| membership | Phone Number (`phone`) | Text | Yes | member or joining | on |
| membership | Phone Type (`phone-type`) | Dropdown: Mobile / Home / Business; defaults to Mobile | Yes | member or joining | on |
| follow-up | Membership ID (`member-id`) | Text | No | member or joining | **optional**: a site turns it on |

### ASCE

- Title is **hidden**.
- Membership ID is **turned on** and **required**.
- The question reads "Are you a member of the American Society of Civil Engineers?"

### Confirmed

- Field ids: `membership`, `title`, `first-name`, `last-name`, `email`, `phone`, `phone-type`, `member-id`.
- Membership ID is optional by default and **required for ASCE**.
- If the applicant answers the way the site's membership rule accepts (Yes for ASCE), they see
  name, email, phone and the follow-up section. Otherwise they see only the first question.
- Phone Type is its own field, shown next to the phone number.

### Fresh-start storage checkpoint (CHG-042)

- **Global definition:** `parked/membership.json` owns the nested frame/section composition, component field placement, order reference and explicit outcome visibility predicates. The shared compiler projects these into the same section/field conditions used by Library, prototype and Storybook. React owns rendering and style; it no longer repeats the member-information field list or guesses follow-up participation from answer spelling.
- **Effective ASCE assignment:** the existing Site page/field files still select yes-no, hide Title and include the required, numeric, minimum-six-character Membership ID. Phone Type is a distinct companion binding with the same visibility as Phone; Membership inherits the shared Mobile default and preserves an existing saved selection. No other real Site is rolled out.
- **Validation and content:** standard Next validation/save behavior comes from the shared form-route mapping. The confirmed yes/no inline exception remains isolated; other not-eligible outcomes report the page error on submission. Association-link guidance and the association-specific attestation prompt are shared content. Available field configurations, runtime option sources and association outcomes are part of the compiled field projection. Name/contact and additional-field examples use compiled placement; new/current, category and association-selection examples compile isolated synthetic assignments. The shared Name group retains only its with-Title/without-Title examples.
- **Shared reuse:** Home and Membership use the same composition projector. Optional content can declare its enabling configuration and required properties; Home's notice no longer needs a page-specific compiler branch. Shared definitions remain global under Site filters and reconstruct without superseded page records.
- **Prototype boundary:** field collection, participation, feedback, submission validation and the saved-application boundary are implemented. The email and nightly abandoned-lead rules below describe actual system behavior. The prototype does not execute email delivery or batch processing; neither is outstanding prototype work.

### Membership attestation exception (agreed, CHG-018)

The applicant's yes/no membership attestation on Membership is the only field that
stops a page inline: No immediately shows the non-member feedback, hides the
follow-up fields and disables Next. Yes restores those fields and enables Next.
Leaving the attestation unanswered uses normal required-field validation on Next.
All other field and page-level checks use standard submission validation and the
page error alert; this exception does not apply to the spouse membership question
on Eligibility. Submission/loading states may still temporarily disable Next.

The rule is defined once in `global/rules/membership.json` and assigned through
`mappings/requirements/membership.json`; the shared `form-next-validation`
workflow records the standard behavior and this sole field-answer exception.

### Configurations and lifecycle (agreed)

| Requirement | Definition and applicability |
|---|---|
| Attestation control | The shared `membership` field owns its four configurations (yes-no, new-or-current, category, association), including control type and options. ASCE selects yes-no in its field overrides. This is not duplicated as a second configuration setting. |
| Additional fields | The component field mapping lists available fields; `member-id` is default-off. ASCE's Membership page file includes it and hides Title; its field file makes Member ID required. Additional Membership Information follows an accepted attestation. |
| Autosave start | `membership-starts-autosave` in `global/workflows/application.json`: successful validated Membership submission and save establishes the saved application and starts autosave, for consumer and advisor-assisted applications. Later page saves use `form-next-save`. Browser caching is separate. |
| Initial autosave email | `membership-initial-autosave-email` in `global/rules/application.json`: triggered as soon as Membership is successfully submitted and saved. This is the actual system rule. The prototype does not execute email delivery or automatically create a mock email preview. |
| Browser autofill | Shared `browser-autofill-self-only` rule in `global/rules/fields.json`: authored autocomplete hints for name, email, phone, addresses and birthday apply only to self/member wherever those fields appear. Dependents receive autocomplete off. This is independent of input type and keyboard mode; browser suggestions depend on availability. |
| Abandoned leads | `abandoned-lead-nightly-batch` in `global/rules/application.json`: successfully submitted and saved Membership makes applicant name, email and phone available. Applications still incomplete enter nightly batch files for the site's TPA. This is the actual system rule. The prototype does not execute batch processing, XML generation, scheduling or transmission. |
| Page note | Global `membership.page-note` defaults empty; a Site supplies its optional text through the declared content slot. ASCE supplies: “Throughout this site you will be referred to as a Member of the Civil Engineering profession.” It no longer appears on Eligibility (CHG-020). |

The Library displays confirmed rules and workflows directly from these definitions
and their applicability mappings. They are declarative records, not an executable
workflow engine. Membership's component tree uses the same named frame and section
structure as Eligibility; React still owns layout rendering.

The save client now requires the Membership submission event to create a saved
application. Email in a local draft cannot start autosave; browser caching and
reloads do not send application saves. Later successful page submissions update
the established saved application (CHG-022).

### Membership question configurations (agreed)

The membership question is one field (`membership`, "Membership attestation"). It has four **configurations**.
The default is Yes / No. A site picks a configuration and may re-word the label. Each answer maps to an
outcome (member, new member, not eligible).

| Configuration | Control | Default label | Answers (outcome) |
|---|---|---|---|
| **yes-no** (default) | Radio | Are you currently a member? | Yes (member), No (not eligible) |
| **new-or-current** | Radio | Are you a current member, or are you becoming a new member? | New Member (new member), Current Member (member) |
| **category** | Dropdown | I am a (select one) | the site lists its categories; each maps to an outcome |
| **association** | Search | I am a member of: | the site's associations (all members) |

ASCE uses the **yes-no** configuration, re-worded to "Are you a member of the American Society of Civil Engineers?"

---

## Eligibility (step: Getting started, required)

What ASCE shows, top to bottom: the applicant's ZIP, state and date of birth; the question
about adding dependents; spouse details if Spouse is chosen; children (added one at a time) if
Child is chosen. The global template owns three sections; dependent choices are part of self.

### Sections (agreed)

| # | Section | Person | Shown when | What it holds |
|---|---|---|---|---|
| 1 | **self** | You | always | ZIP or postal code, state or province, date of birth, and the question "Would you like to add dependent coverage?" (spouse, child). |
| 2 | **spouse** | Spouse | Spouse chosen | The spouse's membership question, name and date of birth. |
| 3 | **children** | Child | Child chosen | Children added one at a time (up to 10): name, date of birth, gender. |

ASCE turns on one extra child question: full-time student. There is no child unmarried
question or rule on any site; the child section's note ("Only unmarried children are eligible
for coverage.") is the only mention.

### Fields (agreed)

Checked against ASCE's old data: same labels, types and required values. The old data also
had "Is the child unmarried?"; it was removed for every site (CHG-013).

How these are set, the same way as every field on every page:

- A field is on by default; the mapping marks it `"default": "off"` when most sites do not ask it.
  A site's page file (`parked/sites/<site>/pages/eligibility.json`) `include`s an off field or
  `hide`s an on one. ASCE includes `full-time-student`.
- Field IDs come from the JSON: one field asked of a person (`first-name` for spouse and child),
  not a spouse copy. Saved answer keys follow one kebab-case rule: the field ID for you, and
  `<person>-<field ID>` for anyone else (`spouse-first-name`, `child-first-name`,
  `child-full-time-student`; later `beneficiary-first-name`).

| Section | Field | Type | Required | Shown when | Default |
|---|---|---|---|---|---|
| self | Zip / Postal Code (`zip-postal-code`) | Text | Yes | always | on |
| self | State / Province (`state-province`) | Searchable list of 67: states, DC, territories and Canadian provinces | Yes | always | on |
| self | Date of Birth (`birth-date`) | Date | Yes | always | on |
| self | Would you like to add dependent coverage? (`dependents`) | Checkboxes: Spouse, Child | No | always | on |
| spouse | Is your spouse also an active member? (`membership`, spouse label; ASCE: "Is your spouse also a member of the American Society of Civil Engineers?") | Yes / No | Yes | Spouse chosen | on |
| spouse | First Name (`first-name`) | Text | Yes | Spouse chosen | on |
| spouse | Last Name (`last-name`) | Text | Yes | Spouse chosen | on |
| spouse | Date of Birth (`birth-date`) | Date | Yes | Spouse chosen | on |
| children (each) | First Name (`first-name`) | Text | Yes | Child chosen | on |
| children (each) | Last Name (`last-name`) | Text | Yes | Child chosen | on |
| children (each) | Date of Birth (`birth-date`) | Date | Yes | Child chosen | on |
| children (each) | Gender (`gender`) | Male / Female | Yes | Child chosen | on |
| children (each) | Is the child a full-time student? (`full-time-student`, saved as `child-full-time-student`) | Yes / No | Yes | Child chosen | **off**: ASCE includes it |

### Section notes (CHG-015)

Info alerts use global content definitions referenced by each section’s `note`. Effective Sites override the five approved Eligibility strings under the page file’s `content`; existing `notes` content-key selections remain supported.

| Section | Content key | ASCE text |
|---|---|---|
| self | `eligibility.note.self` (empty global default; Site override allowed) | Hidden unless populated; no member heading is introduced. |
| spouse | `eligibility.note.spouse` (global default; Site override allowed) | Domestic Partnership/Civil Union is determined by State Law and they will be referred to as "Spouse" throughout the application. |
| children | `eligibility.note.children` (global default; Site override allowed) | Only unmarried children are eligible for coverage. |

The profession note formerly assigned to self was moved to the Membership page (CHG-020).

### Page structure (agreed)

| Aspect | Where | Eligibility draft |
|---|---|---|
| Configuration | `parked/pages.json` | `type: form`, `step: getting-started`; order within the type follows `global/pages.json` (after Membership, before Coverage). |
| Components | `parked/eligibility.json` `components` | FormRoutePage › ProgressStep, PageHeader, PageAlert, EligibilitySections (three authored section compositions), PageNav; MemberVerification and VerificationAddress dialogs. The self group includes dependent choices. |
| Configurations | `global/configurations/people.json` | `site-people` (self, spouse, child), `child-list-maximum` (10), `child-collection-mode` (details / notice-only), `tpa-integration` (none / member-lookup / membership-auto-approval), lookup fields and address-before-verification. Shared defaults are global; Site values remain under `parked/sites/<site>/`. Eligible states stay in `address.json`. |
| Rules | `global/rules/eligibility.json` | repeating-entry-list, dependents-from-site-people, applicant-disqualifying-answer, tpa-member-lookup, applicant-product-eligibility (age limits per product). Autosave on Next is the existing `form-next-save`. |
| Validations | `global/validations/eligibility.json` | Page level, on Next: eligible-state-required, child-required, spouse-details-required, each with a content message and code `VALIDATION_FAILED`. Inline (before Next): only format checks, ZIP (`postal-code-format`) and dates of birth (`date-value-format`). Everything else on Next. |
| Error codes | `global/error-codes.json` | The established recovery codes (`src/domain/recoveryIncident.ts`, Storybook's Error pages); a validation `code` must be one of them. |
| Ineligible | rule `applicant-disqualifying-answer` | The reason shows when Next is clicked and the page does not continue; Next is no longer disabled (CHG-017). |


### Fresh-start audit checkpoint (CHG-044)

| Area | Definition, storage and behavior |
|---|---|
| Section composition | `parked/eligibility.json` references the shared order mapping. Nested components own their field placements: the shared ZIP/State/Birthday group plus dependent choices, spouse attestation/name/Birthday, and the child list. The renderer consumes that composition, including notes and responsive name grids. No separate dependent-selection section or page-owned field-ID grouping remains. |
| Repeated children | The section's `collection` and `repeats` declare `children`, item wording, name-grid fields and the maximum configuration. The generic compiler projects the collection globally; effective Site field inclusion and maximum overrides apply afterward. ASCE includes the required full-time-student field and inherits the maximum of 10. Add/edit uses normal field checks; Next also checks saved/restored record shape, enabled fields and the effective maximum. Notice-only and unselected child sections do not validate retained child rows. |
| Verification dialogs | The page declares address, method-control and fictional security-question surfaces. Library, prototype and detached Storybook examples use the same compiled definitions and bindings. The address fields reuse their canonical field definitions; fictional questions have one source in `global/prototype-fixtures/verification.json`. The legacy question constant now references that fixture. |
| Covered people | The effective covered-people setting narrows dependent choices and field participation. A section requires an offered and selected person; retained selections cannot reveal an unoffered section. With only self covered, the dependent question is absent. Synthetic examples verify this without enabling another real Site. |
| Location and field checks | Format and required checks remain on the effective fields. ZIP derives State when ZIP changes; manual State persists until the next ZIP change. An unresolved ZIP does not invalidate a permitted manual State. Eligible-only options and acceptance use the same effective list. The shared group reserves feedback space in both application and quote contexts. |
| Page acceptance | Existing ineligibility feedback stays on Next; the Membership-only inline exception does not apply to spouse attestation. Participating repeated child answers are read from their canonical record bindings for configured disqualification rules. Inactive records do not participate. Product age, residency and other policy values retain their existing product/Site owners. |
| TPA settings and outcomes | Shared definitions/defaults own the modes, lookup-field list and address requirement. ASCE assigns member lookup using name, DOB, Membership ID and State, requires address confirmation, and supplies fictional matching records. The shared Next workflow validates and saves before opening intermediate verification; completing verification resubmits and saves its outcome before navigation. None performs no lookup or identity/portfolio approval. Coverage verification requires an existing member with active coverage and an identity pass for portfolio access; failure/skip continues for manual review. Membership auto-approval is a separate shared mode without identity verification or portfolio access. Lookup-input changes require a new verification attempt. |
| Scope of execution | The requirements describe actual system rules. Prototype TPA records, security answers and text/voice outcomes simulate the verification flow; no live lookup, identity service or code delivery is performed. This is the prototype boundary, not outstanding prototype work. |
| Storybook and inheritance | Whole-page examples cover member, spouse, child, notice-only and applicant-only assignments. Section examples use compiled fields and real synthetic residency/student settings. Obsolete blank/deferred-client variants and the separate dependent-selection family were removed. Shared Name examples remain with/without Title. |
| Status | Global definitions stay global under Site filters. ASCE values and confirmed exceptions are preserved; existing draft requirement/configuration statuses are retained. Source reconstruction, synthetic assignments, Library/prototype/Storybook agreement and focused behavior checks verify this checkpoint. |


---

## Coverage (step: Choose your coverage, required)

### Structure and stages (agreed, CHG-024)

The shared form frame contains progress, header and page alerts; an optional
verified portfolio action; category selection; personal/work questions for self
and a participating spouse; the reveal action; products and inline estimate/cart;
and Next. Portfolio, dependent-only confirmation and selection-feedback surfaces
are related drawers/dialogs, not extra application pages. Children's details remain
on Eligibility. The current review covers ASCE only.

Keep two stages: answer applicable questions, click See my coverage options,
then choose products and use Next. The reveal action validates on click and
reports errors using a page alert. Categories without preliminary questions, such
as AD&D, can reveal automatically. Next is hidden during loading and while the
reveal action is showing. Membership attestation remains the sole field-answer
inline stopping exception.

The named component tree is in `parked/coverage.json`; `coverage-page-stages` is
confirmed in `global/workflows/coverage.json` and mapped only to Coverage.
The approved question and MCR-policy decisions are implemented in the ASCE
fresh-start JSON layer (CHG-025). The spouse maximum wording is a configurable
section note only. Values, sources, exceptions and remaining staged scope are
recorded in [coverage.md](coverage.md).


### Fresh-start audit checkpoint (CHG-045)

Coverage composition, conditional question participation, generated product controls,
validation applicability and saved-answer ownership now use the shared fresh-start
projection. Global defaults remain separate from ASCE assignments; detached examples
use supported compiled fields and products. Source reconstruction and focused
behavior checks cover reveal, Next, entry restrictions, dependent-only confirmation,
reference-rate configuration and existing ASCE policies. Storage details and the decisions resolved in CHG-046 are in [coverage.md](coverage.md#coverage-audit-checkpoint-chg-045).


Coverage decision closure (CHG-046): existing verified base coverage can support
dependent-only applications; the Term Life minimum follows the TPA-only $10,000 existing / $20,000 new decision (CHG-047); CIR uses
verified existing plus requested matching Life; and `preselect=TRUE` elects offered
base products/applicants once while preserving subsequent edits. `firstCategory`
now uses the shared ordering resolver. No policy question from this review remains
open. Raise future questions during migration before calling a page complete.


---

## Beneficiary (step: Your application details, optional globally and for ASCE)

The global template owns participation/self/spouse composition, help and editor/copy
dialogs, individual/trust/control surfaces, content, category defaults, rules and
validation declarations. The global default is optional; ASCE assigns position 4, optional mode and product note
selections in `parked/sites/asce/pages/beneficiary.json`. The renderer, Library and
Storybook use this shared projection.

Selected positive member/spouse elections participate under the effective default
category configuration and explicit participation policies. Product names/order,
featured/first-category priorities and underwriting indicators use shared readers.
CHG-009 copying includes compatible Self and Spouse targets with independent records
and IDs. Fields, option lists and per-designation limits have one authored owner;
save and copy recheck the resulting records and current participation.

Records live under `beneficiaries["<product>:<member|spouse>"]`, with structural keys
and only the active type's authored field bindings. Dialog/copy selections are
transient. Canonical content keys describe placement and configurable copy, while
effective Site product-note selections remain separate from participation rules.

Beneficiary decisions closed (CHG-049/050): each applicable product/applicant must
have at least one Primary beneficiary when beneficiary questions are active (required mode or optional Yes).
Primary may be an individual or a trust. Contingent beneficiaries are optional;
Contingent-only records do not permit continuation. Each designation containing
individuals must total exactly 100% on Next, independently for Primary and Contingent.
Trusts need no share input. Draft add/edit/copy may remain incomplete while records
are assembled. Optional No and inactive product/applicant records remain exempt.
These global rules apply through the shared fresh-start projection; no policy
question remains open. Details are in
[the Beneficiary review](../project-review/beneficiary-component-review.md).


---

## Shared error-page layout (CHG-052)

This review covers prototype presentation and Library/Storybook documentation.
It does not wire new service failures or application flows to these pages.

| Aspect | Shared model |
|---|---|
| Components | One `ApplicationErrorState` frame with minimal recovery header, centered card and shared footer. Ordered slots: indicator, title, message, guidance, configured actions and SiteSupport. |
| Cases | One redirect-page component with source-defined HTTP 400/404/500, generic technical error, Maintenance, Session expired content. Magic-link expiry is an inline page error on Resume with the email request form available. No payment/submission, unavailable saved application or outcome-specific pages. |
| Rules | Specific error-code mappings take priority; generic technical content applies only when an error has no specific mapping. Session expiry follows the inactivity countdown reaching zero. Expired/invalid magic links land on Resume with an inline page error; no standalone expiry page or automatic request. `global/rules/recovery.json` also records resume privacy, maintenance and support. No new service failure interception is added. |
| Validation | Utility previews collect no fields. Field/business issues remain ordinary errors within their current page. |
| Configuration and ownership | Structure, content definitions and action contracts are global. ASCE inherits them with its effective branding/contacts. Existing session settings and workflow implementations are outside this presentation change. |
| Content | `global/content/recovery.json` owns case wording. Operation metadata does not select payment-specific or other business-specific full-page text/actions. |
| Storage | Narrow incident metadata can supply a code and safe support reference; raw diagnostics and private payloads are excluded. Superseded page/content/component records cannot restore retired variants. |
| Scope | Prototype screens and Library/Storybook documentation only. No new resume/autosave/payment/submission redirects or service implementation. |

Production resume shows a uniform link-request confirmation without disclosing
whether a matching saved application exists before successful resume. Technical
submission failures follow ordinary Error/session rules. Payment/business issues
use ordinary page feedback; they have no specialized full-page variant.

See [the shared layout review](../project-review/recovery-state-plan.md).


Shared support presentation (CHG-053): Questions support uses a standard MUI info
Alert with AlertTitle everywhere the shared component appears, including Receipt
and utility pages. Email-compatible HTML uses matching info-alert styling. Contact
content, links, Site resolution and existing email visibility settings retain their
shared owners. This adds no workflow or service wiring.

Shared support refinement (CHG-055): the global component uses contact-channel icons, accessible channel names and configured MUI links. It omits the product-support heading and places the configured technical-support sentence below the divider with Send an email linked. Email-compatible output follows the same content and link styling. Error pages pair MUI document artwork with HTTP codes; CHG-056 removes the X overlay and the leading support-alert icon. Contact-channel icons remain.

CHG-057: Magic-link expiry is page feedback on Resume. `global/recovery.json` owns the inline error definition, `parked/resume.json` places it with the request form, and shared content bindings project its wording into Resume. Standalone link-expired page/catalog records are retired. Session expiry remains a redirect at countdown zero.

Expiry distinction confirmed: session inactivity countdown reaching zero redirects to Session expired. Magic-link expiry is a page error on Resume; phone-code expiry is a page error on the code-entry page with resend available. The session-expired page and existing redirect remain in place.


## Contact (CHG-058)

Contact is reviewed in the global fresh-start model with ASCE as the effective Site.
Page structure, fields/companions, content, business and correspondence rules,
copying, validations and configuration defaults have shared owners. ASCE assigns
required mode and position 5 and inherits the defaults. The member address remains
required for dependent-only applications; spouse contact follows current selected
product participation. Hidden drafts do not reveal sections or block Next.

The [Contact checkpoint](../project-review/contact-component-review.md) records all
19 answer bindings, content placement/overrides, state filtering, carry-forward,
same-as-home storage, source retirement and Library/prototype/Storybook checks.
Both policy questions are resolved: collect the member address for dependent-only applications; spouse-only DI also displays the member employer section because coverage depends on member employment. No separate spouse employer fields are collected. Superseded spouse-business bindings are retired and their values are not reassigned to the member. No decision is deferred.


## Profile final audit — CHG-059

[Profile review and storage contract](../project-review/profile-component-review.md)
records ownership, component reuse, content/configuration locations and all confirmed
rules. Global sources compile the same Profile projection for Library, prototype and
Storybook. ASCE keeps its questionnaire disabled and assigns optional spouse SSN for
DI-only elections. User-confirmed carrier minimum and financial calculations are
implemented; no Profile decisions are deferred.


## Review final audit — CHG-060

[Review ownership, policy and storage contract](../project-review/review-component-review.md)
records global defaults and ASCE inheritance, active/ordered preview data, adult
acknowledgements and source-compiled examples. The user approved the IMPORTANT NOTICE
viewer with standard, New Mexico and Virginia source documents; its old deferral is
retired from the current projection. No Review question is deferred.


Review MCR reconciliation (CHG-061): [the state/product matrix](../project-review/review-mcr-audit.md)
records the user-confirmed adult Life/DI/Overhead underwriting flag, independent of
online health pages, VA QD consent, MN/processing precedence and exact fraud wording.
CT warning is directly above the member Review checkbox; production signing must
also place it above the member e-signature. Superseded ASCE health-participation
exceptions are retired from the current projection. The shared supplemental-health
attestation is modeled without enabling an ASCE product. No decision is deferred.


## Shared form applicant rules — CHG-062

[The shared applicant checkpoint](../project-review/shared-form-applicants.md) records
application-wide heading context, page-specific adult/child participation, owner
exceptions, retained hidden answers and the applicant URL scope. Coverage Information
shows offered amounts independently of form selections; supported applicant URL
values narrow its person rows and the application offering consistently.


Advisor and Resume final audit (CHG-063): [Advisor ownership and handoff](../project-review/advisor-component-review.md)
and [Resume policy, privacy and storage](../project-review/resume-component-review.md)
record the completed six-page migration. Global defaults own retention and recovery
limits; ASCE inherits them. Advisor restart retains identity while clearing the
applicant; confirmation uses the original saved deadline. Uniform link-request
confirmation, safe inline errors and verification-before-restoration preserve the
confirmed privacy contract. Production delivery/authorization/batch rules are
recorded without real-service implementation. No policy question is deferred.


Resume workbook reconciliation (CHG-064): [the current Resume checkpoint](../project-review/resume-component-review.md)
maps all 18 Rules - Resume rows and six confirmed clarifications. Global source
owns one-use email entry, separate fixed MFA sessions, phone-only verification,
shared request windows, fixed cooldowns and application recovery locks. The pages,
Library flow and Storybook use that model. This supersedes CHG-063 recovery defaults
and its link-bound session; ten-day application retention and settled return routes
remain unchanged. No decision is deferred and no real delivery/batch service is added.


Health final audit (CHG-065): [Health ownership, rules and storage](../project-review/health-component-review.md) records all six global templates and the effective ASCE external-QD assignment. Internal examples compile source policies; QD uses the assigned image sequence. Shared handoff validation, pending protection and image fallback are implemented without external services. No current Health decision is deferred. Payment final review is recorded in CHG-070 below; DocuSign final review is recorded in CHG-073 below; Receipt final review is recorded in CHG-074 below.


Health taxonomy correction (CHG-066): [the current Health checkpoint](../project-review/health-component-review.md) supersedes CHG-065’s six-page list. The final five pages are SI, TELE, QD, DI SUPP and CIR. TELE resolves LI/DI/CI variants; self/spouse share each page while retaining independent answers and records. CI is not a separate page. Superseded page identities are removed by compilation, and ordinary DI TELE does not automatically show DI SUPP. ASCE remains QD-only.


Shared page help (CHG-067): [the global help contract](../project-review/shared-page-help.md) replaces page-specific help wrappers and repeated drawer state with PageHelp, PageHelpChips and PageHelpDrawer. Membership, Beneficiary and Payment use compiled topic metadata and effective content. Health pages and source-form previews have no help chips; removed components/copy cannot return from old catalogs.

Payment final audit (CHG-070): [Payment ownership, MCR reconciliation and storage](../project-review/payment-component-review.md) records the shared sections/surfaces, defaults, independent product choices, configurable shared/product notes and active payment document filtering. ASCE Payment is optional following the November 17 correction (CHG-105); Canadian taxes remain informational notes. Payment collects and saves details before DocuSign without authorizing or submitting. No Payment decision is deferred. DocuSign final review is recorded in CHG-073 below; Receipt final review is recorded in CHG-074 below.

Prototype corrections (CHG-071, November 14, 2026): Membership Phone Type defaults to Mobile while retaining saved choices. Its scalar entry-loading message has a separate content binding from its two forward-transition messages. Shared ZIP/State/DOB retains the standard gap after reserved feedback without the extra helper bottom margin across Eligibility and quotes. Eligibility never shows a member heading; later-page headings retain applicable applicant participation. Rider controls use source-authored applicant wording, with member-only notes in quotes and member/spouse notes in their respective Coverage controls.

CHG-071 verification: all 63 fresh-start checks and 47 focused field, page, rider, quote and real-entry transition checks pass. Prototype/Storybook production builds, both TypeScript configurations, focused lint, requirements and component evidence checks pass. Browser checks confirm Mobile, the Eligibility heading exception and matching Eligibility/quote spacing. All three catalog artifacts match.

DocuSign final audit (CHG-073): [DocuSign ownership, signing rules and storage](../project-review/docusign-component-review.md) records the shared handoff, inherited ASCE page requirement, Site image assignment, common legal-document source and production boundary. The member always signs; an applying spouse also signs, with no separate child signature. Completed required signing submits and proceeds to Receipt without another portal Submit. The prototype uses its existing final-image simulation. No DocuSign decision is deferred. Receipt final review is recorded in CHG-074 below.


Receipt final audit (CHG-074): [Receipt ownership, MCR reconciliation and storage](../project-review/receipt-component-review.md) records the two source sections, shared decisions/support/error presentation, explicit QD outcomes, active payment documents, conditional global ExamOne wording and confirmation-only email contract. Missing/unrecognized results use existing technical-error handling; no extra underwriting status is introduced. Reference storage is isolated by Site/application, and examples supply explicit outcomes. No Receipt decision is deferred. The global/ASCE page inventory reviewed in this sequence has no remaining page migration; other real Sites remain out of scope. Production services remain documented requirements, with explicit prototype simulations/placeholders.

CHG-074 verification: 65 fresh-start checks, 54 focused Receipt/payment/document/storage/email/story checks, TypeScript, focused lint, requirements and component evidence checks pass. Prototype and Storybook production builds pass; all three shared catalog artifacts match. Browser checks confirm the conditional note, document availability and shared technical-error state.

CHG-075: ExamOne note wording is a global Receipt default, inherited by ASCE. A synthetic Site verifies inheritance and independent content overrides. Source provenance does not make the note Site-owned; the existing review-only display rule is unchanged.

CHG-075 verification: 66 fresh-start checks and 38 focused checks pass, along with prototype/Storybook builds, TypeScript, focused lint and source/evidence checks. All three catalog artifacts match.


Membership copy/configuration (CHG-077): [the six-slot Membership contract](../project-review/membership-component-review.md#client-configuration-and-copy-review-chg-077) permits title, introduction, optional note and three non-member guidance strings. Global defaults inherit; ASCE’s profession text is a Site value. The profession-specific global note key is retired. Eligibility/blocking, validation, help, breadcrumbs, loading and navigation wording remain global; field configuration retains its shared owner. Source/compiler and actual page checks verify inheritance and unchanged eligibility behavior.

CHG-076/077 verification: 68 fresh-start checks pass. Home’s four actual-story checks and Membership’s 55 focused page/shared-field/parity/story checks pass. TypeScript, focused lint, requirements/component evidence and both production builds pass; all three catalogs match. Eligibility copy decisions are the next page review, not part of these approvals.


Eligibility copy/configuration (CHG-078): [the five-slot Eligibility contract](../project-review/eligibility-component-review.md#client-configuration-and-copy-review-chg-078) permits title/introduction and member/spouse/child note wording overrides. The member note is globally empty and ASCE inherits it. Dependent-note participation and the suppressed member heading are unchanged. Child notice-only mode retains its nonblank-note requirement. Library, source adapters, prototype and Storybook resolve the same effective copy; eligibility, verification, validation and navigation contracts remain independently owned.


Shared application headers and Coverage copy (CHG-079): the approved title/introduction override pattern is implemented for Coverage, Beneficiary, Contact, Profile, Review, Payment and all five Health pages, sharing the same rule with Membership and Eligibility. Definitions/defaults remain global and Site values remain independent; page requirements and health participation are unchanged. Health QD host-header settings do not alter its full-screen images. Coverage’s [copy/configuration boundary](../project-review/coverage-component-review.md#client-configuration-and-copy-review-chg-079) retains global policy/limit warnings, total/additional instructions and estimate disclaimers, with product copy managed through the shared product model. This completes Coverage’s copy classification; header approval alone does not mark the remaining pages’ other copy reviewed.

CHG-078/079 final verification: 70 fresh-start checks and 39 focused Eligibility page/field/validation/parity/story checks pass. TypeScript, focused lint, requirements/component evidence and both production builds pass. Library, prototype and Storybook catalogs match. Beneficiary’s non-header copy review continues with the designation-wording decision.


Beneficiary copy/configuration (CHG-080): [the four-slot Beneficiary contract](../project-review/beneficiary-component-review.md#client-configuration-and-copy-review-chg-080) permits title/introduction and both designation-statement overrides. Global defaults inherit, with product/applicant assignments remaining independent. Assigned statements must be nonblank. ASCE keeps its existing wording/assignments. The compiler resolves Site text into the same note policy consumed by the page and Storybook; help, controls, allocation/Primary/trust rules and validation keep their existing global/shared owners.


Contact copy/configuration (CHG-081): [the three-slot Contact contract](../project-review/contact-component-review.md#client-configuration-and-copy-review-chg-081) permits title, introduction and business/employer heading overrides. Defaults remain global and ASCE inherits them. The existing BusinessInformation component uses effective content in the page and standalone examples. Member employment, dependent-only residential collection, correspondence, copying, section visibility and validation stay with their existing rules and configurations.


CHG-080/081 final verification: 72 fresh-start checks and 13 focused Contact page/standalone/Storybook checks pass, following the 16 focused Beneficiary checks. TypeScript, focused lint, requirements/component evidence and both production builds pass; all three catalog artifacts match.

Profile, Review, Payment and Health copy/configuration (CHG-082): confirmed global-only body copy is recorded in each page review. Profile keeps its three section headings and Other coverage note global. Review keeps both section headings/descriptions global. Payment keeps billing-timing/estimate wording global and retains configurable shared/product notes. All five Health pages keep generic question numbering/detail headings global; medical wording retains its questionnaire/field owner and QD content its provider owner. Existing title/introduction slots and effective field/legal/payment/questionnaire configuration remain independent. No new Site copy slot or ASCE value is added. Advisor, Resume, redirect/confirmation and Receipt copy reviews remain separate.


CHG-082 verification: **73 fresh-start checks passed**, including effective header inheritance and rejection of global-only Profile, Review, Payment and Health copy overrides. TypeScript, focused ESLint, requirements mapping, component/reuse/icon/handoff checks and prototype/Storybook production builds pass. Public, application and Storybook catalog artifacts match. No runtime page composition or Site assignment changed in this checkpoint.


Advisor/confirmation, Resume and DocuSign copy (CHG-083): Advisor entry permits exactly two title/introduction slots. Both advisor confirmation pages, all Resume screens and DocuSign portal/handoff wording remain global by explicit user decision. Existing identity/retention/recovery/field/legal/image configurations are independent; no behavior or effective ASCE value changes. The confirmation/DocuSign default adapters now import global content.

Receipt copy (CHG-084): all individual decisions are resolved. Eighteen slots permit the approved header, decision, payment/next-step/provider and three email wording overrides. Documents/security note, coverage-decisions introduction and email reference sentence remain global; their old slots are removed. The existing introduction now renders through ReceiptConfirmation.


## Completed client copy pass — November 15, 2026

CHG-076–085 classify all **28 reviewed pages**, with **72 declared Site content slots**. Global definitions/defaults remain authoritative; Site content values belong in `requirements/parked/sites/<site>/pages/<page>.json`. ASCE keeps its existing effective values. Counts below describe page content slots, independently of supported shared field, product, legal-policy, questionnaire, image, branding, support and other configuration contracts. No unreviewed copy is implicitly made editable.

| Page | Site copy slots | Confirmed boundary |
| --- | ---: | --- |
| Home | 12 | Approved marketing/hero/section copy, image, about-client and notice slots; steps/actions global |
| Membership | 6 | Header, optional note and three non-member guidance strings |
| Eligibility | 5 | Header and member/spouse/child notes |
| Coverage | 2 | Header; policy/system copy global, product copy retains shared owner |
| Beneficiary | 4 | Header and two designation statements; assignments independent |
| Contact | 3 | Header and employer heading |
| Profile | 2 | Header; reviewed section headings and Other coverage note global |
| Review | 2 | Header; section headings/descriptions and behavioral guidance global |
| Health SI | 2 | Host header; medical copy retains questionnaire/field contracts |
| Health TELE | 2 | Same; LI/DI/CI remain one TELE page |
| Health QD | 2 | Host header only; provider/image content remains external |
| Health DI SUPP | 2 | Host header; medical copy retains questionnaire/field contracts |
| Health CIR | 2 | Host header; medical copy retains questionnaire/field contracts |
| Payment | 3 | Header and shared/product notes; timing/estimate copy global |
| DocuSign | 0 | Portal/handoff copy global; image/legal assignments independent |
| Receipt | 18 | Individually reviewed slots; three protected strings global |
| Advisor entry | 2 | Header; instructions and shared controls global |
| Advisor sent confirmation | 0 | Global copy |
| Edit request confirmation | 0 | Global copy |
| Resume request | 0 | Global copy; privacy and recovery settings independent |
| Resume method | 0 | Global copy |
| Resume code | 0 | Global copy |
| Error 400 | 0 | Global copy |
| Error 404 | 0 | Global copy |
| Error 500 | 0 | Global copy |
| Generic technical error | 0 | Global copy |
| Maintenance | 3 | Title, explanation and optional guidance |
| Session expired | 0 | Global copy |

This completes this page-copy/configurability pass with no unresolved decision. Existing global fields/components, policy values and answer/storage contracts remain as recorded in each page review; this checkpoint does not reopen them or expand to other real Sites. Library, prototype and Storybook use the same fresh-start content contract.


November 15 follow-through (CHG-086–088): Home mockup copy is the global default with effective branding substitutions; Home still has twelve content slots and the completed page-copy matrix still totals 72. Hero actions use a primary button plus paragraph/link. The shared QD notice supports Home's one-second reveal animation and reduced motion. Both application and Resume MFA session expiry now use the existing shared expiration page; link/code expiry remains inline. Global action tokens set links/buttons to weight 600 with no link underline, and shared EligibilityFields removes empty helper-space paragraphs. Definitions/defaults are global; ASCE receives no new copy/configuration assignment.


CHG-086–088 final verification: **78 Fresh-start checks and 97 focused checks passed**. TypeScript, focused ESLint, requirements mapping and component/Storybook/icon/handoff checks pass. Prototype and Storybook production bundles build successfully; public, prototype and Storybook catalogs have identical SHA-256 `51ff0996bcb99a2ac4cef20e3583c03e99e35df05cf0ac81323b0b527c7a7e57`. All 110 canonical component owners remain covered. HomeHero and QuickDecisionExplainer explicitly declare their existing shared MUI Link dependency in the global component inventory.

Browser verification confirmed global Home wording with synthetic effective branding, the primary action/continuation link, no blank helpers, 16px ZIP/state/DOB gaps at desktop and 390px width, no mobile horizontal overflow, a 1s QD reveal transform and weight-600/no-underline controls, including shared recovery/support/footer links. The shared expiration page uses the generic session wording. Timer, late-response and inline link/code expiry behavior is covered by focused integration tests. ASCE has no new Site-owned copy or configuration assignment.


Global page configuration boundary (CHG-091, November 15, 2026): all public page definitions/routes and their order are global. Effective Sites can set only Beneficiary/Payment participation to required, optional or none; their positions remain global. Global defaults remain Beneficiary optional and Payment required; ASCE assigns both pages optional following CHG-105. No Site may add, remove or reorder other pages. Health templates are always available in the shared Library, with actual routes/applicants determined by existing product/underwriting/questionnaire applicability. Redundant ASCE page requirements/positions and Health on/off assignments are removed. The shared compiler/checker reject conflicting assignments and the compiler removes stale non-template public pages from old saved data. Internal authoring tools remain outside the applicant page list.

The Admin composition editor reads those same declared requirement options and offers only Beneficiary/Payment selectors. The shared draft mutation boundary rejects core-page edits; product/feature controls retain their separate contracts. The existing editor, MUI fields and page templates are reused.

CHG-091 verification: 81 fresh-start checks and 102 focused routing, MCR, Health, Storybook, editor and requirements-checker checks pass. Coverage includes all declared page permissions/positions, stale-page removal without superseded records, optional/required/disabled Beneficiary and Payment projections, ASCE QD-only applicant routing, DI-only and CIR behavior, no-health Review legal wording and Admin permission enforcement. TypeScript, focused lint, requirements/component/icon/organization checks and prototype/Storybook builds pass. Library, prototype and Storybook catalog hashes match. No decision is deferred.

Eligibility non-copy configuration review (CHG-092): [the complete configuration matrix](../project-review/eligibility-component-review.md#non-copy-configuration-review) records defaults, ASCE values, supported Site overrides and shared-component boundaries. Dependent inclusion/requiredness overrides remain allowed; CHG-093 fixes member ZIP/state/DOB collection globally. Postal/date formats remain global. Page-specific field overrides now apply through component mappings without changing other pages. Active TPA lookup fields must be available by Eligibility submission and are the sole matching inputs; incomplete or ambiguous fictional records reject. ASCE settings remain unchanged. All 82 fresh-start and 64 scoped focused checks pass, along with both builds and matching consumer catalogs. Two unrelated legacy WAEPA theme assertions are recorded separately in the checkpoint; no Eligibility decision remains open.


Eligibility member/dependent clarification (CHG-093): member ZIP, state and DOB are globally included and required, while supported options such as eligible-state filtering remain configurable. Sites can scope default dependent field selection per spouse/child and enable additional globally defined questions. Student and Armed Forces questions are default-off; ASCE retains all default spouse/child fields and enables student only. Scoped selection changes no global member field, page order or product eligibility rule. The shared mapping, field resolver/compiler, Library and existing child-dialog Storybook family use one source; see the current [Eligibility matrix](../project-review/eligibility-component-review.md#non-copy-configuration-review).

CHG-093 verification: all 83 fresh-start checks and 47 focused/checker cases pass, along with TypeScript, source evidence checks and both builds. The three consumer catalog hashes match; ASCE’s effective child collection remains its defaults plus student status only.


ASCE Payment correction (CHG-105, November 17, 2026): ASCE now assigns Payment optional, superseding its earlier required exception; Beneficiary remains optional. The global Payment default remains required. Existing shared opt-in, active-answer filtering and required/optional Storybook examples use the same Fresh-start projection. See [Payment checkpoint](../project-review/payment-component-review.md#asce-optional-payment-correction-chg-105).
