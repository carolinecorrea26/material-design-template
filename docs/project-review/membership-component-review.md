# Membership page review

Ownership follows the [fresh-start model](../requirements-spec/README.md); reviewed requirements and lifecycle boundaries are recorded in the [Membership checkpoint](../requirements-spec/page-review.md#membership-step-getting-started-required).

| Area | Canonical owner and implementation |
|---|---|
| Frame | Shared `FormRoutePage`: progress, header, optional note, error alert, required-field validation, Next, save and transitions. Membership uses this existing frame mapping. |
| Help | Two authored actions: coverage options and how applying works, using global `PageHelp`, `PageHelpChips` and `PageHelpDrawer` with compiled topic selections. There is no Membership-specific help component. Home is the only quote entry point. |
| Membership section | Authored `FieldGroup` composition contains `MembershipStatus` and `MemberInformation`; their field placements compile from the component tree. Name/contact fields and Phone Type follow the selected option’s member/new-member outcome. |
| Additional section | Authored order and outcome predicate control `AdditionalMembershipInformation`. The effective Site supplies enabled fields and overrides; no additional-field list is maintained by the page renderer. |
| ASCE assignment | Yes/no attestation, Title hidden, Membership ID enabled/required with digits format and minimum length six, selected profession note. No immediately hides follow-ups and disables Next; other validation occurs on submission. |
| Content and storage | Global content owns wording, labels, help, loading, association-link guidance and the association-specific attestation prompt. Page/field source owns composition and conditions; Site files own assignments/overrides. Generated catalog data is not an authoring source. |
| Storybook | Whole-page examples cover unanswered, member, non-member and genuinely configured new/current/category/association choices. Standalone sections read compiled component fields. Unsupported dormant-client examples were removed; shared Name examples remain with/without Title. |
| Lifecycle | Successful validated Membership submission/save establishes autosave. The initial email and nightly abandoned-lead rules describe actual system behavior. The prototype does not execute email delivery or batch processing; neither is outstanding prototype work. |

CHG-042 closes the shared composition, participation and example gaps identified when comparing Membership with Home. Verification covers source reconstruction and consumer agreement, synthetic configuration inheritance, both pages’ behavior, focused field/Library checks, TypeScript, requirements checks and production/Storybook builds. The removed applicant record-lookup dialog stays removed; approved exceptions and deferred decisions retain their status.


## Client configuration and copy review (CHG-077)

User decisions November 14, 2026. Global content owns all definitions/defaults. The six supported copy slots are declared in `requirements/parked/membership.json#contentSlots`; effective values go under `parked/sites/<site>/pages/membership.json` → `content`. Library Configurations lists that same allowlist. The prototype, Storybook and default page adapter read the same global source/projection.

| Membership item | Client configurable | Source / boundary |
| --- | --- | --- |
| Page title | Yes | `membership.title`; inherits the global title when omitted; supports the shared branding substitutions such as `{{clientAcronym}}` |
| Introductory description | Yes | `membership.subhead`; global default inherited when omitted |
| Optional information note | Yes | `membership.page-note`; global default is empty, blank hides the note. ASCE assigns its Civil Engineering profession text as a Site value |
| Non-member guidance heading | Yes | `membership.not-member.heading` |
| Non-member joining explanation | Yes | `membership.not-member.body`; `{{clientName}}` resolves through effective branding |
| Non-member contact guidance | Yes | `membership.not-member.website`; existing support-website visibility applies. `{{clientWebsite}}` is the position of the configured website link, and `{{clientPhone}}` resolves the configured support phone |
| Membership question wording, options, requiredness and other field labels | Through the shared field contract | Global field definitions and supported overrides under `parked/sites/<site>/fields.json`; no duplicate page-only fields |
| Included/hidden additional fields and membership question configuration | Through existing Site page/field assignments | Existing source mappings, inclusion and semantic option outcomes remain authoritative |
| Additional-section title, help-chip/drawer wording, breadcrumbs, loading/transitions and Next/Back labels | No new Site override | Existing global content and shared component ownership remain |
| Eligibility/association-link blocking messages and validation wording | No | Global rules/content; custom joining guidance never changes the decision or disabled Next behavior |
| Product/branding/support facts used by the page and help | Through their existing shared contracts | Effective product assignments, branding and support values remain shared across pages |

The three configurable non-member strings are explanatory guidance. The actual non-member blocking message, immediate stop, hidden follow-up fields, disabled Next and later restoration after an accepted answer retain the confirmed global rule. Copy cannot authorize ineligible applicants or change saving, autosave/email/batch requirements or navigation.

The former profession-specific global key `membership.note.member-profession` is retired. The global page points to the generic empty `membership.page-note` definition; ASCE supplies its existing wording without a new note variant in the global content library. The generic page-note compiler and source adapter resolve the effective Site value. Page-header defaults now import Membership content directly instead of repeating strings. No new component, story variation or real service is introduced.

Omitted values inherit defaults. Overrides use string values, rendered through the existing text/template components. Unsupported slot keys and non-string values are rejected. The optional note is a display string and does not receive an enabling business-rule switch. Shared field/helper/validation contracts remain separate from these six page-copy slots.

Non-member guidance is explicitly bound into `pages.membership.messages` and read through the existing ComponentContentContext, so the real page and standalone section both honor effective Site wording. The blocking message continues to read the global requirement.

CHG-077 verification: all 68 fresh-start checks and 55 focused Membership/shared-field/parity/Storybook checks pass. Checks include configured header/note/guidance, blank-note omission, retained global blocking and acceptance behavior, standalone status rendering, inherited defaults and isolated synthetic overrides. TypeScript, focused lint, requirements/component evidence and prototype/Storybook builds pass. Library, prototype and Storybook catalog hashes match.


## Non-copy configuration audit — complete (CHG-089 / CHG-090)

November 15, 2026. Configuration definitions/defaults remain global. Site page values use `parked/sites/<site>/pages/membership.json`; shared field choices/overrides use `parked/sites/<site>/fields.json`. The Library Fields view owns field settings; page-copy slots remain separately listed under Configurations. No duplicate page-level setting is added for an existing field configuration.

| Setting | Global definition/default | Effective ASCE | Scope / constraints |
| --- | --- | --- | --- |
| Question configuration | `membership` field: yes-no (default), new-or-current, category, association | yes-no | Shared field contract; type/options follow the selected configuration |
| Option meaning | Global field declares member, new-member, not-eligible | Yes → member; No → not-eligible | Custom categories supply their own stable values/labels with declared semantic outcomes; missing/unknown meanings reject |
| Core name/contact collection | First/last name, email, phone and companion Phone Type required after an accepted answer; membership question required | Inherits defaults | Global mapping constraints reject hiding, optional requiredness and optional-product exceptions for these six core fields; accepted-answer visibility remains unchanged |
| Title inclusion | Included, optional; shared Title options | Hidden | Existing Site page hide assignment; shared field labels/options/requiredness contract |
| Member ID inclusion | Default-off in the component mapping | Included | Only explicitly mapped optional fields can be enabled; arbitrary fields are not added through include |
| Member ID requiredness | Optional | Required | Shared field override |
| Member ID format/input | Plain text by default | Digits; numeric keyboard | Answer remains a string, retaining leading zeroes; selected formats must be supported by the shared field schema |
| Member ID length | No minimum; maximum 15 | Minimum 6; maximum 15 | Positive integer limits; minimum cannot exceed maximum |
| Phone type | Mobile default; Mobile/Home/Business choices | Inherits | Separate answer binding; preserve saved choice. Options may be restricted to authored values, and the inherited default must remain available |
| Email/phone formatting | Shared email format and phone formatting/10-digit validation | Inherits | Global format, input mode and length constraints are fixed on Membership; overrides that change them reject |
| Field labels/requiredness and option subsets | Supported shared field properties only | Membership wording and Member ID constraints assigned | Contextual label/required overrides retain their existing precedence. Unsupported properties, choices, defaults and inverted bounds reject |
| Association selection | Optional shared policy with fixed/select/URL modes and enabled Site associations | Fixed ASCE association | The policy supplies the association control or association-specific yes/no prompt. Invalid/missing required URL selection blocks progress. ASCE assignment: `sites/asce/products.json#records.sitePolicies`. This is Site configuration, not product-specific behavior or a second Membership field |
| Page/template structure | Membership is the required entry stage; shared multi/single frame and authored section order | Inherits | Global page configuration rejects skipping/moving Membership or changing any page position; Home remains the preceding landing page |
| Help | Two shared topic selections: coverage options and applying process | Inherits | No Membership quote tool or page-specific help component |
| Product/branding/support values | Existing shared effective Site contracts | Existing ASCE assignments | Used by shared help/guidance; no Membership-only duplicates |
| Autosave/email/retention/batches | Existing global lifecycle requirements | Inherits | Successful Membership save starts the saved application. Production email/batch rules remain recorded; the prototype executes no delivery or batch service |
| Copy | Six approved content slots | Existing profession note; remaining defaults inherited | Previous CHG-077 review remains authoritative |

Implemented gap closure: custom category semantics are validated against the global field's declared configuration outcomes, without a second hardcoded outcome list or Site identity branch. Valid configurations retain their existing UI and bindings. The user confirmed all three configuration boundaries on November 15, 2026 (CHG-090). They are implemented in the shared resolver/compiler and requirements checker; no current Membership configuration question remains open. No other real Site is rolled out.

Membership guidance also retains the global Link typography: its local font shorthand was narrowed to font-size inheritance so it no longer resets the shared weight.

CHG-089 verification: 79 fresh-start checks and 44 focused field, Membership and Storybook checks pass. TypeScript, focused lint, requirements/component/icon checks and prototype/Storybook builds pass. Library, prototype and Storybook catalogs have identical hashes. This verifies the implemented guard and existing effective behavior; the three permission decisions remain open.

CHG-090 ownership and implementation: `requirements/mappings/components/membership.json#constraints` declares required inclusion/requiredness and fixed validation properties for this placement. The shared field resolver rejects conflicting effective values, including contextual optionality and optional-product exceptions. Other placements retain their own contracts. CHG-091 supersedes the Membership-only entry flag with global page/position constraints in `requirements/parked/pages.json`; Membership remains the first required application form. The shared compiler and requirements checker reject conflicting page requirements/positions and earlier or tied application forms. The global rule `membership-core-configuration-constraints` is associated with Membership and visible under effective Site filters. Title, Member ID, accepted-answer visibility and ASCE assignments are unchanged. No new component or duplicate story is needed for configuration rejection; existing canonical page examples retain their shared structure.

CHG-090 verification: 80 fresh-start checks, 45 focused field/page/Storybook checks and four requirements-checker regression cases pass. The new cases cover synthetic-Site field constraints, permitted Title/Member ID and other-placement overrides, fixed entry, source reconstruction without superseded records, Library visibility and direct authored-file rejection. Requirements, TypeScript, focused lint, component/icon/Storybook-organization checks and prototype/Storybook builds pass; the three catalog hashes match. The configuration audit is complete with no deferred decision.

## Member wording and final declaration (CHG-134)

The global Armed Forces field now declares separate self and child labels. WAEPA's
existing Membership selection uses the member question; child Eligibility retains
the child question and its existing participation. No duplicate field or Site gate
is added. The optional declaration is last in the shared Membership mapping and
in the existing qualification renderer, after qualification details, military
status and referral fields. WAEPA continues to select it for new members only.

## WAEPA Membership page note (CHG-136)

WAEPA selects the supplied accelerated-death-benefit and New York war-restriction
wording in its existing `membership.page-note` slot. The shared page note renderer
preserves the two lines. WAEPA GI and global default wording remain unchanged.
