# Health final fresh-start review

November 13, 2026 — CHG-066; help removal CHG-067. Covers the five final Health page definitions, their shared components, content, rules, validations, configurations, answer storage and ASCE assignments. This checkpoint corrects CHG-065's six-page taxonomy and supersedes the October QD loader description. No current Health policy question is deferred. Payment is next.

## Ownership and effective ASCE behavior

| Layer | Source and responsibility |
| --- | --- |
| Global pages | `requirements/parked/health-{si,tele,qd,di-supp,cir}.json`: structure, canonical fields, surfaces, collection mappings and content placements. These files are global despite the directory name. |
| Global policy | `requirements/global/rules/{application,health,applicants}.json`, `validations/forms.json`, `workflows/{forms,application}.json` and `requirements/mappings/requirements/health-*.json`: questionnaire resolution, participation, grouping, validation and handoff contracts. |
| Global content | `requirements/global/content/health.json`: page headings and applicant/question labels. Field labels/options remain on canonical field definitions. Validation wording is in `content/validation.json`; handoff labels are in `content/application-ui.json`. Content bindings expose the same definitions to the Library. Health help chips, their drawer and unused explanation copy were removed by CHG-067. |
| Effective Site | `requirements/parked/sites/asce/pages/*.json` and `{products,application,prototype-handoffs}.json`: approved header copy, assigned product journeys/questionnaires and external image selections. Page definitions/positions are global; Health has no Site on/off setting (CHG-091). Source references to ASCE or its MCR do not make shared definitions ASCE-owned. |
| Consumers | Library readers and prototype resolve through the fresh-start compiler. Internal Health Storybook examples compile detached synthetic source assignments using canonical fields. QD uses the real ASCE effective image assignment. No Health example patches the resolved questionnaire or journey policy. |

All five Health templates are global and remain documented under Site filters. ASCE applicant participation uses only `health-qd`. Life products `li-term`, `li-10yr` and `li-20yr` route both QD and FUW processing to it. DI FUW maps to no online questionnaire. SI, TELE, DI SUPP and CIR do not participate for ASCE’s current product/questionnaire assignments. They are not separately disabled pages. The MCR's **SUP DI Health questions!A19:F19** records ASCE DI with no QD DI, TELE-Supp or SUP DI questionnaire. DI-only therefore does not display Health; Life plus DI displays the external Life questionnaire. The independently confirmed Review underwriting flag remains product-based even without online Health questions (CHG-061).

## Components and page rules

| Page | Global composition and rule |
| --- | --- |
| SI | Five default Yes/No questions; active Yes answers use the shared condition-details surface. |
| TELE | One page for LI/DI/CI telesupplement questionnaires. Effective product/combination policies choose each adult’s questions, order and follow-ups. The default set retains fifteen questions; configured CI wording includes California variation. Default Yes answers use repeated condition details. |
| DI SUPP | Separate disability supplemental questionnaire with seven default questions or an effective configured set. Assistance, fall, condition and general-detail surfaces follow their questions. An explicit product/portfolio assignment participates; ordinary DI TELE processing does not automatically show this page. |
| CIR | Requires page enablement, the applicant's selected rider and a uniquely resolved questionnaire assignment. The global fields support activities and dwelling/Other follow-ups. |
| QD | Shared `PrototypeHandoffPage` displays the effective two-image sequence fullscreen. Click advances; the final click submits the shared page. No portal medical-answer controls or inferred underwriting results are created. |

The four internal pages use `FormRoutePage`, `HealthQuestionList`, `HealthQuestion`, FieldRenderer and the shared DynamicList editor. Question headings group the same question; member/spouse answer IDs and records stay independent. The shared applicant-heading policy controls when person labels appear. Only current adult elections participate: spouse-only does not collect member medical answers; children never create adult medical sections; removed-product maps and retained answers do not activate a page. Combined questionnaire policies can suppress superseded pages.

DynamicList owns Add/Edit/Save/Cancel and confirmed removal; Health does not duplicate those operations. Default collections allow at most ten records, using their canonical mappings. Configured repeatable questionnaire items require at least one active detail record and do not expose a separate record-count configuration. Active required answers, valid options, details, field lengths, month/year and calendar dates are validated using the shared definitions, including restored rows. Yes requires the configured minimum; No hides and retains details. Inactive answers do not block progression. Missing required CI-within-TELE/CIR assignments, and invalid/ambiguous assigned TELE/DI SUPP policies, block Next rather than silently choosing another form.

## Storage and configuration

One shared route exists per Health type, not separate self/spouse routes. Generic SI, TELE and DI SUPP retain the stable `health-si-qN`, `health-li-qN` and `health-di-qN` member keys; spouse keys add `-spouse`. CI TELE variants retain `health-ci-*` field identities without a CI page. These field namespaces identify stored questions, not additional routes. Their detail arrays use `<answer-id>-details`, preserving canonical record value keys such as `onset`, `conditionsDetails` and `physicianAddress`. Configured questionnaires retain their policy-defined stable question IDs, applicant suffixes, direct-field IDs and collection names. `FormRoutePage` restores both canonical and configured collections; switching Yes/No preserves records. Shared question rendering never combines adult answers.

The compiler retires `/health-li`, `/health-di` and `/health-ci` page records and placements without rewriting or merging stored answers. The global questionnaire schema supports product, applicant, processing, gender, jurisdiction, rider, order, follow-up and supersession configuration. Effective Site assignments select supported policies. `requirements/global/prototype-fixtures/health-questionnaires.json` contains explicitly synthetic Storybook assignments that reference real canonical fields; it is not an ASCE medical form. No other real Site is enabled by these examples.

Handoff structure/default placeholders are global in `prototype-fixtures/handoffs.json`; ASCE image selections are in its Site file. The compiler and renderer share assignment validation. An installed projection missing its configuration fails explicitly. Supplied images require accessible descriptions. Unprovided screens use their configured placeholder; failed images show the global image-unavailable wording with the prototype continue action. Saving/navigation disables repeat advancement. Shared save failures retain the current screen and ordinary page feedback, with retry. No new production error routing is wired.

## Production and prototype boundary

The production external provider owns QD questions, state variations and validation. The supplied prototype images model that handoff; they do not capture answers, prove external completion, return underwriting results or call a service. This is the accepted prototype implementation, not a deferred portal questionnaire. The superseded captured loader decision is removed from the current projection. Carrier forms, external implementation and historical other-Site source previews do not become ASCE assignments. Their provenance remains in the historical [source-form reference](health-storybook-pages.md). The confirmed October 20 note about the unavailable provider state-variation document remains intact; no missing wording or state behavior is invented.

## Verification

Current checks cover source reconstruction without superseded authored records; global rules under effective-Site Library filters; ASCE routing; source-compiled synthetic questionnaire assignments; all six page examples; independent adults; spouse-only/removed-election participation; active and restored detail validation; retained records through No/Yes; California wording; and handoff order, pending protection, image failure and save-error retry contract. Shared RoutePage persistence checks cover the underlying save/transition behavior. Current correction checks cover the five-page projection, retired identities, LI/DI/CI and combined TELE policy resolution, DI SUPP participation and shared adult controls. CHG-066 baseline: all 91 focused checks across fourteen files and all 56 fresh-start checks passed. Application and Storybook TypeScript, scoped ESLint, requirements mapping, component/icon audits and both builds pass. Browser verification shows exactly SI, TELE, QD, DI SUPP and CIR whole-page families, with CI variants beneath TELE and member/spouse controls within the same questions. All three published catalogs share SHA-1 `d91460ed26f8457639b44aa99f5dd84408769e42`. The application adapter supplies heading visibility and effective labels; the reusable question list remains independent of the active Site. Historical October counts in `health-review-evidence.json` remain dated evidence, not current completion evidence.


CHG-067 removes contextual help chips from every Health route and source-form preview. The Health-specific component, drawer example and unused content are retired; older catalogs cannot restore them. Other pages use [the global page-help pattern](shared-page-help.md).

CHG-067 verification: 73 focused checks, 57 fresh-start checks, both builds and browser checks pass. Current shared-help ownership and catalog parity are recorded in [shared page help](shared-page-help.md).


## Client configuration and copy review (CHG-082)

User decision November 15, 2026. SI, TELE, QD, DI SUPP and CIR each retain exactly two Site page content slots: `page.<page-id>.title` and `page.<page-id>.subhead`. Definitions/defaults are global; Site values belong in `parked/sites/<site>/pages/<page-id>.json` → `content`. ASCE inherits the header defaults. The QD host-header slots do not modify full-screen provider images.

| Health item | Owner / configurability |
| --- | --- |
| Each page title and introduction | Site wording overrides with global defaults |
| Generic Question numbering and condition-details headings | Global; no Health page copy override |
| Medical questions, follow-ups, order, jurisdiction/product/applicant variations and detail fields | Existing assigned questionnaire and shared field configurations; stable question/answer identities |
| Shared record controls, validation, navigation/loading and applicant labels | Existing global/shared component and field/presentation contracts |
| QD questionnaire screen content | Production provider-owned; prototype image selections use the existing effective-Site handoff assignment |

This completes copy classification for the five Health pages without changing medical wording, assignments, participation, stored answers or shared components. No Health help chips return, and no external-provider copy is duplicated into portal content. Library, prototype and Storybook retain the same fresh-start projection.


CHG-082 verification: **73 fresh-start checks passed**, including effective header inheritance and rejection of global-only Profile, Review, Payment and Health copy overrides. TypeScript, focused ESLint, requirements mapping, component/reuse/icon/handoff checks and prototype/Storybook production builds pass. Public, application and Storybook catalog artifacts match. No runtime page composition or Site assignment changed in this checkpoint.


Global page configuration clarification (CHG-091): all Health page requirements and positions inherit from the template. Existing product, underwriting and questionnaire rules still decide active routes/applicants. CIR requires an applicable assigned separate questionnaire as well as the elected rider. An absent separate questionnaire does not add a CIR page; malformed assigned questionnaire configuration still blocks validation. Synthetic no-health Review examples suppress health through product policies, never Site page switches. No new component or duplicated story is introduced.


## Non-copy configuration review (CHG-104)

User decision November 16, 2026. Medical fields are questionnaire-controlled.
The global SI, TELE, DI SUPP and CIR field mappings enforce that boundary through
the existing shared field constraints; no new Health component or parallel
configuration resolver is introduced.

| Setting | Boundary |
| --- | --- |
| Medical questions and follow-up fields | Shared questionnaire definitions own wording, included fields, requiredness, canonical choices and validation. Ordinary Site field overrides and page/person hide selections reject. Source-defined optional fields retain their optionality. |
| Applicable questionnaire and variation | Canonical effective Site Association selection resolves Association-scoped assignments; Yes/No membership and stale association answers cannot replace it. Existing effective product journeys and questionnaire assignments determine product combinations, underwriting, applicable adults, rider participation, state/gender/answer follow-ups, order and supersession. These are policy assignments, not generic page field switches. |
| Page requirement and position | Fixed globally; Health has no Site none/optional/required or reorder setting. Effective participation still decides which pages appear. |
| Page title and introduction | Approved Site overrides with global defaults for each of the five pages. Generic numbering, detail headings, actions, validation and navigation stay shared/global. |
| QD | Provider owns production medical content and validation. Effective Site prototype image selections retain the shared handoff contract and accessible descriptions; portal field overrides do not edit provider content. |
| Details and saved answers | Default detail surfaces retain their global ten-record bounds and field contracts. Configured repeated items require details but have no separate count setting. Adult answers/collections stay independent; inactive answers are retained and ignored by active validation. |

The shared ConfiguredHealthPage adapter remains a justified composition of the
form frame, HealthQuestionList, HealthQuestion, FieldRenderer and DynamicList.
CIR resolves its distinct assigned rider questionnaire through the same entries
and controls; QD uses the generic PrototypeHandoffPage. Wording, applicant and
Site differences do not introduce duplicate components or stories.

ASCE retains its existing QD-only online Health assignment and Site images.
No internal questionnaire is enabled, no medical wording or stored answer key is
changed, and no external provider or delivery integration is added. Existing
synthetic Storybook assignments continue to demonstrate all four internal page
structures and independent member/spouse answers through the real compiler.

CHG-104 verification: **89 Fresh-start and 71 focused checks passed**. Checks cover both-adult medical field override rejection, preserved source optionality, shared source reconstruction and Library/prototype/Storybook agreement, all five Health examples, product/applicant/rider participation, configured variants, state wording, restored details and separate answers. Association-scoped resolution is verified for fixed, URL and selected modes, including stale answers and unavailable selections; detached Site-wide questionnaires do not require an Association lookup. TypeScript, focused lint, requirements, component/reuse/icon/organization/handoff checks and application/Storybook builds passed. Public, application and Storybook catalog artifacts match. No Health configuration decision remains open.
