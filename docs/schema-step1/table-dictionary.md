# Portal database table dictionary

Step 1 repository audit dated October 12, 2026. All 135 public tables are included; 129 have generic adapter contracts. Ownership here describes current columns, not the final ownership decision. `auth.users` is an external Supabase dependency. See [findings](audit.md), [relationship diagrams](relationships.md), and [machine-readable evidence](inventory.json).

SQL below includes CREATE columns plus additive ALTER columns. Table CHECKs and alterations are preserved rather than interpreted as stronger business rules. Nullability is SQL nullability; JSON `null` differs from SQL NULL. Default FK update/delete behavior is NO ACTION. SQL-only publication tables use RPCs; generic adapters assume an `id` column and do not support these tables.

| Table | Adapter key | Observed ownership | Reviewed / local seed rows |
| --- | --- | --- | --- |
| [aggregate_limits](#aggregate-limits) | aggregateLimits | Site reference; client derived | 4 / 0 |
| [amount_bands](#amount-bands) | amountBands | Shared catalog or source-evidence child; no organization/client/site owner column | 481 / 0 |
| [amount_options](#amount-options) | amountOptions | Shared catalog or source-evidence child; no organization/client/site owner column | 154 / 0 |
| [analytics_measurements](#analytics-measurements) | analyticsMeasurements | Site and client references; compatibility depends on composite FK or code (F03) | 40 / 40 |
| [analytics_metrics](#analytics-metrics) | analyticsMetrics | Shared catalog or source-evidence child; no organization/client/site owner column | 4 / 4 |
| [analytics_tags](#analytics-tags) | analyticsTags | Shared catalog or source-evidence child; no organization/client/site owner column | 915 / 0 |
| [applicant_types](#applicant-types) | applicantTypes | Shared catalog or source-evidence child; no organization/client/site owner column | 3 / 0 |
| [applicants](#applicants) | applicants | Client via client_id | 0 / 0 |
| [application_applicants](#application-applicants) | applicationApplicants | Site and client references; compatibility depends on composite FK or code (F03); application child | 0 / 0 |
| [application_associations](#application-associations) | applicationAssociations | Site reference; client derived; application child | 0 / 0 |
| [application_events](#application-events) | applicationEvents | Application via application_id | 0 / 0 |
| [application_participants](#application-participants) | applicationParticipants | Application via application_id | 0 / 0 |
| [applications](#applications) | applications | Site via site_id; client derived | 4 / 4 |
| [associations](#associations) | associations | Client reference | 127 / 0 |
| [audit_events](#audit-events) | auditEvents | Portal operations; entity/site scope only where a column provides it | 0 / 0 |
| [benefit_caps](#benefit-caps) | benefitCaps | Shared catalog or source-evidence child; no organization/client/site owner column | 2 / 0 |
| [benefit_period_options](#benefit-period-options) | benefitPeriodOptions | Site reference; client derived | 43 / 0 |
| [branding_profiles](#branding-profiles) | brandingProfiles | Global/client/site according to scope; see CHECK for required target | 10 / 0 |
| [change_items](#change-items) | changeItems | Site reference; client derived | 5 / 5 |
| [change_requests](#change-requests) | changeRequests | Portal operations; entity/site scope only where a column provides it | 5 / 5 |
| [client_environment_links](#client-environment-links) | clientEnvironmentLinks | Client reference | 249 / 0 |
| [clients](#clients) | clients | Organization via organization_id | 95 / 9 |
| [components](#components) | components | Shared catalog or source-evidence child; no organization/client/site owner column | 67 / 0 |
| [conditions](#conditions) | conditions | Shared catalog or source-evidence child; no organization/client/site owner column | 17 / 0 |
| [configuration_definitions](#configuration-definitions) | configurationDefinitions | Shared catalog or source-evidence child; no organization/client/site owner column | 775 / 0 |
| [configuration_values](#configuration-values) | configurationValues | Global/client/site according to scope; see CHECK for required target | 939 / 0 |
| [content_entries](#content-entries) | contentEntries | Shared catalog or source-evidence child; no organization/client/site owner column | 349 / 0 |
| [content_values](#content-values) | contentValues | Global/client/site according to scope; see CHECK for required target | 356 / 0 |
| [coverage_amount_patterns](#coverage-amount-patterns) | coverageAmountPatterns | Shared catalog or source-evidence child; no organization/client/site owner column | 1072 / 0 |
| [coverage_categories](#coverage-categories) | coverageCategories | Shared catalog or source-evidence child; no organization/client/site owner column | 25 / 0 |
| [coverage_dependencies](#coverage-dependencies) | coverageDependencies | Site reference; client derived | 3 / 0 |
| [coverage_plan_definitions](#coverage-plan-definitions) | coveragePlanDefinitions | Shared catalog or source-evidence child; no organization/client/site owner column | 69 / 0 |
| [coverage_plan_variants](#coverage-plan-variants) | coveragePlanVariants | Shared catalog or source-evidence child; no organization/client/site owner column | 75 / 0 |
| [document_definitions](#document-definitions) | documentDefinitions | Shared catalog or source-evidence child; no organization/client/site owner column | 8 / 0 |
| [eligibility_constraints](#eligibility-constraints) | eligibilityConstraints | Site reference; client derived | 766 / 0 |
| [email_templates](#email-templates) | emailTemplates | Shared catalog or source-evidence child; no organization/client/site owner column | 10 / 0 |
| [features](#features) | features | Shared catalog or source-evidence child; no organization/client/site owner column | 16 / 0 |
| [fields](#fields) | fields | Shared catalog or source-evidence child; no organization/client/site owner column | 321 / 0 |
| [flag_assignments](#flag-assignments) | flagAssignments | Global or one nullable target; application target also permitted (F08) | 0 / 0 |
| [flag_definitions](#flag-definitions) | flagDefinitions | Shared catalog or source-evidence child; no organization/client/site owner column | 7 / 0 |
| [flag_rules](#flag-rules) | flagRules | Shared catalog or source-evidence child; no organization/client/site owner column | 0 / 0 |
| [flag_values](#flag-values) | flagValues | Shared catalog or source-evidence child; no organization/client/site owner column | 4 / 0 |
| [flow_steps](#flow-steps) | flowSteps | Shared catalog or source-evidence child; no organization/client/site owner column | 74 / 0 |
| [flow_transitions](#flow-transitions) | flowTransitions | Shared catalog or source-evidence child; no organization/client/site owner column | 77 / 0 |
| [flows](#flows) | flows | Shared catalog or source-evidence child; no organization/client/site owner column | 8 / 0 |
| [identity_resolutions](#identity-resolutions) | identityResolutions | Shared catalog or source-evidence child; no organization/client/site owner column | 127 / 0 |
| [maximum_plan_rules](#maximum-plan-rules) | maximumPlanRules | Site reference; client derived | 3 / 0 |
| [migration_schedules](#migration-schedules) | migrationSchedules | Client reference not enforced (F02) | 0 / 0 |
| [organization_profiles](#organization-profiles) | organizationProfiles | Organization via organization_key | 33 / 0 |
| [organizations](#organizations) | organizations | Organization account root | 33 / 9 |
| [page_fields](#page-fields) | pageFields | Shared catalog or source-evidence child; no organization/client/site owner column | 205 / 0 |
| [page_section_fields](#page-section-fields) | pageSectionFields | Shared catalog or source-evidence child; no organization/client/site owner column | 139 / 0 |
| [page_sections](#page-sections) | pageSections | Shared catalog or source-evidence child; no organization/client/site owner column | 30 / 0 |
| [pages](#pages) | pages | Shared catalog or source-evidence child; no organization/client/site owner column | 30 / 0 |
| [pattern_assignments](#pattern-assignments) | patternAssignments | Site and client references; compatibility depends on composite FK or code (F03) | 6 / 0 |
| [pattern_conditions](#pattern-conditions) | patternConditions | Shared catalog or source-evidence child; no organization/client/site owner column | 0 / 0 |
| [pattern_configuration_definitions](#pattern-configuration-definitions) | patternConfigurationDefinitions | Shared catalog or source-evidence child; no organization/client/site owner column | 3 / 0 |
| [pattern_coverage_categories](#pattern-coverage-categories) | patternCoverageCategories | Shared catalog or source-evidence child; no organization/client/site owner column | 0 / 0 |
| [pattern_flag_definitions](#pattern-flag-definitions) | patternFlagDefinitions | Shared catalog or source-evidence child; no organization/client/site owner column | 12 / 0 |
| [pattern_flows](#pattern-flows) | patternFlows | Shared catalog or source-evidence child; no organization/client/site owner column | 0 / 0 |
| [pattern_products](#pattern-products) | patternProducts | Shared catalog or source-evidence child; no organization/client/site owner column | 369 / 0 |
| [pattern_question_sets](#pattern-question-sets) | patternQuestionSets | Shared catalog or source-evidence child; no organization/client/site owner column | 0 / 0 |
| [pattern_rules](#pattern-rules) | patternRules | Shared catalog or source-evidence child; no organization/client/site owner column | 9 / 0 |
| [patterns](#patterns) | patterns | Shared catalog or source-evidence child; no organization/client/site owner column | 5 / 0 |
| [plan_amount_rules](#plan-amount-rules) | planAmountRules | Shared catalog or source-evidence child; no organization/client/site owner column | 6 / 0 |
| [plan_benefit_periods](#plan-benefit-periods) | planBenefitPeriods | Shared catalog or source-evidence child; no organization/client/site owner column | 82 / 0 |
| [portal_admin_accounts](#portal-admin-accounts) | RPC only | Identity/access record; public users and auth.users are separate (F07) | — / — |
| [portal_library_drafts](#portal-library-drafts) | RPC only | Site reference; client derived | — / — |
| [portal_library_heads](#portal-library-heads) | RPC only | Site reference; client derived | — / — |
| [portal_library_publication_audit](#portal-library-publication-audit) | RPC only | Site reference; client derived | — / — |
| [portal_library_readiness](#portal-library-readiness) | RPC only | Site reference; client derived | — / — |
| [portal_library_releases](#portal-library-releases) | RPC only | Site reference; client derived | — / — |
| [product_amount_rules](#product-amount-rules) | productAmountRules | Site and client references; compatibility depends on composite FK or code (F03) | 755 / 0 |
| [product_applicant_eligibility](#product-applicant-eligibility) | productApplicantEligibility | Site reference; client derived | 1153 / 0 |
| [product_clients](#product-clients) | productClients | Client reference | 257 / 0 |
| [product_configuration_values](#product-configuration-values) | productConfigurationValues | Shared catalog or source-evidence child; no organization/client/site owner column | 5204 / 0 |
| [product_coverage_plans](#product-coverage-plans) | productCoveragePlans | Shared catalog or source-evidence child; no organization/client/site owner column | 27 / 0 |
| [product_identifiers](#product-identifiers) | productIdentifiers | Global/client/site according to scope; see CHECK for required target | 856 / 0 |
| [product_question_sets](#product-question-sets) | productQuestionSets | Shared catalog or source-evidence child; no organization/client/site owner column | 1 / 0 |
| [product_rate_tables](#product-rate-tables) | productRateTables | Site reference; client derived | 0 / 0 |
| [product_riders](#product-riders) | productRiders | Global/client/site according to scope; see CHECK for required target | 141 / 0 |
| [products](#products) | products | Shared catalog or source-evidence child; no organization/client/site owner column | 389 / 0 |
| [provenance_tags](#provenance-tags) | provenanceTags | Shared catalog or source-evidence child; no organization/client/site owner column | 9 / 0 |
| [question_definitions](#question-definitions) | questionDefinitions | Shared catalog or source-evidence child; no organization/client/site owner column | 226 / 0 |
| [question_set_fields](#question-set-fields) | questionSetFields | Shared catalog or source-evidence child; no organization/client/site owner column | 0 / 0 |
| [question_set_questions](#question-set-questions) | questionSetQuestions | Shared catalog or source-evidence child; no organization/client/site owner column | 347 / 0 |
| [question_sets](#question-sets) | questionSets | Shared catalog or source-evidence child; no organization/client/site owner column | 30 / 0 |
| [rate_table_presentations](#rate-table-presentations) | rateTablePresentations | Site reference; client derived | 0 / 0 |
| [rate_tables](#rate-tables) | rateTables | Shared catalog or source-evidence child; no organization/client/site owner column | 0 / 0 |
| [release_changes](#release-changes) | releaseChanges | Portal operations; entity/site scope only where a column provides it | 5 / 5 |
| [releases](#releases) | releases | Portal operations; entity/site scope only where a column provides it | 2 / 2 |
| [requirement_targets](#requirement-targets) | requirementTargets | Shared catalog or source-evidence child; no organization/client/site owner column | 21758 / 0 |
| [residency_jurisdictions](#residency-jurisdictions) | residencyJurisdictions | Shared catalog or source-evidence child; no organization/client/site owner column | 0 / 0 |
| [residency_rules](#residency-rules) | residencyRules | Site reference; client derived | 0 / 0 |
| [rider_amount_rules](#rider-amount-rules) | riderAmountRules | Shared catalog or source-evidence child; no organization/client/site owner column | 150 / 0 |
| [riders](#riders) | riders | Shared catalog or source-evidence child; no organization/client/site owner column | 92 / 0 |
| [roles](#roles) | roles | Shared catalog or source-evidence child; no organization/client/site owner column | 1 / 1 |
| [rule_actions](#rule-actions) | ruleActions | Shared catalog or source-evidence child; no organization/client/site owner column | 95 / 0 |
| [rule_assignments](#rule-assignments) | ruleAssignments | Global/client/site according to scope; see CHECK for required target | 94 / 0 |
| [rule_conditions](#rule-conditions) | ruleConditions | Shared catalog or source-evidence child; no organization/client/site owner column | 17 / 0 |
| [rule_flags](#rule-flags) | ruleFlags | Shared catalog or source-evidence child; no organization/client/site owner column | 3 / 0 |
| [rule_predicates](#rule-predicates) | rulePredicates | Shared catalog or source-evidence child; no organization/client/site owner column | 12 / 0 |
| [rules](#rules) | rules | Shared catalog or source-evidence child; no organization/client/site owner column | 106 / 0 |
| [semantic_requirements](#semantic-requirements) | semanticRequirements | Shared catalog or source-evidence child; no organization/client/site owner column | 7212 / 0 |
| [site_associations](#site-associations) | siteAssociations | Site reference; client derived | 30 / 0 |
| [site_builder_drafts](#site-builder-drafts) | siteBuilderDrafts | Site and client references; compatibility depends on composite FK or code (F03) | 2 / 2 |
| [site_configurations](#site-configurations) | siteConfigurations | Site reference; client derived | 2 / 2 |
| [site_coverages](#site-coverages) | siteCoverages | Site reference; client derived | 200 / 69 |
| [site_documents](#site-documents) | siteDocuments | Site reference; client derived | 70 / 0 |
| [site_email_templates](#site-email-templates) | siteEmailTemplates | Site reference; client derived | 100 / 0 |
| [site_environment_links](#site-environment-links) | siteEnvironmentLinks | Site reference; client derived | 7 / 7 |
| [site_features](#site-features) | siteFeatures | Site reference; client derived | 160 / 0 |
| [site_field_configurations](#site-field-configurations) | siteFieldConfigurations | Global/client/site according to scope; see CHECK for required target | 176 / 0 |
| [site_flows](#site-flows) | siteFlows | Global/client/site according to scope; see CHECK for required target | 8 / 0 |
| [site_pages](#site-pages) | sitePages | Site reference; client derived | 300 / 0 |
| [site_policies](#site-policies) | sitePolicies | Site reference; client derived | 10 / 0 |
| [site_product_applicants](#site-product-applicants) | siteProductApplicants | Site reference; client derived | 375 / 0 |
| [site_products](#site-products) | siteProducts | Site reference; client derived | 200 / 69 |
| [site_riders](#site-riders) | siteRiders | Site reference; client derived | 18 / 2 |
| [site_url_parameters](#site-url-parameters) | siteUrlParameters | Site reference; client derived | 0 / 0 |
| [sites](#sites) | sites | Client via client_id | 10 / 10 |
| [source_requirements](#source-requirements) | sourceRequirements | Shared catalog or source-evidence child; no organization/client/site owner column | 45320 / 0 |
| [source_sheets](#source-sheets) | sourceSheets | Shared catalog or source-evidence child; no organization/client/site owner column | 23 / 0 |
| [source_workbooks](#source-workbooks) | sourceWorkbooks | Shared catalog or source-evidence child; no organization/client/site owner column | 1 / 0 |
| [structured_rule_actions](#structured-rule-actions) | structuredRuleActions | Shared catalog or source-evidence child; no organization/client/site owner column | 17 / 0 |
| [support_profiles](#support-profiles) | supportProfiles | Global/client/site according to scope; see CHECK for required target | 9 / 0 |
| [underwriting_bands](#underwriting-bands) | underwritingBands | Site reference; client derived | 345 / 0 |
| [url_definitions](#url-definitions) | urlDefinitions | Shared catalog or source-evidence child; no organization/client/site owner column | 969 / 0 |
| [url_parameter_values](#url-parameter-values) | urlParameterValues | Shared catalog or source-evidence child; no organization/client/site owner column | 38 / 0 |
| [url_parameters](#url-parameters) | urlParameters | Shared catalog or source-evidence child; no organization/client/site owner column | 19 / 0 |
| [url_usages](#url-usages) | urlUsages | Client reference | 1166 / 0 |
| [user_roles](#user-roles) | userRoles | Identity/access record; public users and auth.users are separate (F07) | 1 / 1 |
| [user_scopes](#user-scopes) | userScopes | Identity/access record; public users and auth.users are separate (F07) | 1 / 1 |
| [users](#users) | users | Identity/access record; public users and auth.users are separate (F07) | 1 / 1 |
| [validation_rules](#validation-rules) | validationRules | Shared catalog or source-evidence child; no organization/client/site owner column | 185 / 0 |

## aggregate limits

Table: `aggregate_limits`. Coverage/product/role aggregate maximum or formula. Created at `supabase/migrations/202609280001_canonical_normalization.sql:445`. Current ownership: Site reference; client derived.

Contract: `AggregateLimits`; adapter key: `aggregateLimits`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/coverageNormalizationCanonical.ts:117` |
| key | text | no | key: string | `src/persistence/types/coverageNormalizationCanonical.ts:118` |
| category_key | text | yes | categoryKey: string \| null | `src/persistence/types/coverageNormalizationCanonical.ts:119` |
| product_key | text | yes | productKey: string \| null | `src/persistence/types/coverageNormalizationCanonical.ts:120` |
| applicant_type_key | text | yes | applicantTypeKey: string \| null | `src/persistence/types/coverageNormalizationCanonical.ts:121` |
| maximum | numeric | yes | maximum: number \| null | `src/persistence/types/coverageNormalizationCanonical.ts:122` |
| formula | text | yes | formula: string \| null | `src/persistence/types/coverageNormalizationCanonical.ts:123` |
| condition_key | text | yes | conditionKey: string \| null | `src/persistence/types/coverageNormalizationCanonical.ts:124` |
| site_key | text | yes | siteKey: string \| null | `src/persistence/types/coverageNormalizationCanonical.ts:125` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
category_key text references public.coverage_categories(key),
product_key text references public.products(key),
applicant_type_key text references public.applicant_types(key),
maximum numeric,
formula text,
condition_key text references public.conditions(key),
site_key text references public.sites(key),
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(category_key) → public.coverage_categories(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(product_key) → public.products(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(applicant_type_key) → public.applicant_types(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(condition_key) → public.conditions(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(site_key) → public.sites(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `formula`, `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:459`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## amount bands

Table: `amount_bands`. Conditional amount ranges/increments. Created at `supabase/migrations/202609280001_canonical_normalization.sql:385`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `AmountBands`; adapter key: `amountBands`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/coverageNormalizationCanonical.ts:77` |
| key | text | no | key: string | `src/persistence/types/coverageNormalizationCanonical.ts:78` |
| amount_pattern_key | text | no | amountPatternKey: string | `src/persistence/types/coverageNormalizationCanonical.ts:79` |
| minimum | numeric | yes | minimum: number \| null | `src/persistence/types/coverageNormalizationCanonical.ts:80` |
| maximum | numeric | yes | maximum: number \| null | `src/persistence/types/coverageNormalizationCanonical.ts:81` |
| increment | numeric | yes | increment: number \| null | `src/persistence/types/coverageNormalizationCanonical.ts:82` |
| condition_key | text | yes | conditionKey: string \| null | `src/persistence/types/coverageNormalizationCanonical.ts:83` |
| position | integer | no | position: number | `src/persistence/types/coverageNormalizationCanonical.ts:84` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
amount_pattern_key text not null references public.coverage_amount_patterns(key),
minimum numeric,
maximum numeric,
increment numeric,
condition_key text references public.conditions(key),
position integer not null,
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(amount_pattern_key) → public.coverage_amount_patterns(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(condition_key) → public.conditions(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:398`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## amount options

Table: `amount_options`. Ordered named amount choices. Created at `supabase/migrations/202609280001_canonical_normalization.sql:372`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `AmountOptions`; adapter key: `amountOptions`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/coverageNormalizationCanonical.ts:69` |
| key | text | no | key: string | `src/persistence/types/coverageNormalizationCanonical.ts:70` |
| amount_pattern_key | text | no | amountPatternKey: string | `src/persistence/types/coverageNormalizationCanonical.ts:71` |
| value | text | no | value: string | `src/persistence/types/coverageNormalizationCanonical.ts:72` |
| label | text | no | label: string | `src/persistence/types/coverageNormalizationCanonical.ts:73` |
| position | integer | no | position: number | `src/persistence/types/coverageNormalizationCanonical.ts:74` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
amount_pattern_key text not null references public.coverage_amount_patterns(key),
value text not null,
label text not null,
position integer not null,
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(amount_pattern_key) → public.coverage_amount_patterns(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:383`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## analytics measurements

Table: `analytics_measurements`. Sourced period measurements by optional client, site and device. Created at `supabase/migrations/202609240002_analytics_domain.sql:12`. Current ownership: Site and client references; compatibility depends on composite FK or code (F03).

Contract: `AnalyticsMeasurement`; adapter key: `analyticsMeasurements`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | uuid | no | id: string | `src/persistence/types/operations.ts:51` |
| metric_key | text | no | metricKey: string | `src/persistence/types/operations.ts:51` |
| period_start | date | no | periodStart: string | `src/persistence/types/operations.ts:51` |
| period_end | date | no | periodEnd: string | `src/persistence/types/operations.ts:51` |
| period_type | text | no | periodType: "month" \| "ytd" \| "year" | `src/persistence/types/operations.ts:51` |
| site_id | uuid | yes | siteId: string \| null | `src/persistence/types/operations.ts:52` |
| client_id | uuid | yes | clientId: string \| null | `src/persistence/types/operations.ts:52` |
| device | text | yes | device: "desktop" \| "mobile" \| null | `src/persistence/types/operations.ts:52` |
| value | numeric | no | value: number | `src/persistence/types/operations.ts:52` |
| source_report | text | no | sourceReport: string | `src/persistence/types/operations.ts:53` |
| source_system | text | no | sourceSystem: string | `src/persistence/types/operations.ts:53` |
| definition_version | text | no | definitionVersion: string | `src/persistence/types/operations.ts:53` |
| notes | text | yes | notes: string \| null | `src/persistence/types/operations.ts:53` |
| created_at | timestamptz | no | createdAt: string | `src/persistence/types/common.ts:13` |
| updated_at | timestamptz | no | updatedAt: string | `src/persistence/types/common.ts:13` |

```sql
id uuid primary key default gen_random_uuid(),
metric_key text not null references public.analytics_metrics(metric_key),
period_start date not null,
period_end date not null,
period_type text not null check (period_type in ('month', 'ytd', 'year')),
site_id uuid references public.sites,
client_id uuid references public.clients,
device text check (device in ('desktop', 'mobile')),
value numeric not null,
source_report text not null,
source_system text not null,
definition_version text not null,
notes text,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
check (period_end >= period_start)
```

Enforced foreign keys:

- `(metric_key) → public.analytics_metrics(metric_key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(site_id) → public.sites(id)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(client_id) → public.clients(id)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `period_type`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609240002_analytics_domain.sql:42`: enable row level security

Indexes and triggers:

```sql
create unique index analytics_measurements_natural_key
  on public.analytics_measurements (
    metric_key, period_start, period_end, period_type,
    coalesce(site_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(client_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(device, '')
  );
create index analytics_measurements_period_idx on public.analytics_measurements(metric_key, period_start, period_end);
create index analytics_measurements_site_idx on public.analytics_measurements(site_id, metric_key, period_start) where site_id is not null;
```

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## analytics metrics

Table: `analytics_metrics`. Measurement definitions and units. Created at `supabase/migrations/202609240002_analytics_domain.sql:1`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `AnalyticsMetric`; adapter key: `analyticsMetrics`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | uuid | no | id: string | `src/persistence/types/operations.ts:48` |
| metric_key | text | no | metricKey: string | `src/persistence/types/operations.ts:48` |
| name | text | no | name: string | `src/persistence/types/operations.ts:48` |
| description | text | no | description: string | `src/persistence/types/operations.ts:48` |
| unit | text | no | unit: AnalyticsUnit | `src/persistence/types/operations.ts:48` |
| source | text | no | source: string | `src/persistence/types/operations.ts:48` |
| created_at | timestamptz | no | createdAt: string | `src/persistence/types/common.ts:13` |
| updated_at | timestamptz | no | updatedAt: string | `src/persistence/types/common.ts:13` |

```sql
id uuid primary key default gen_random_uuid(),
metric_key text not null unique,
name text not null,
description text not null default '',
unit text not null check (unit in ('count', 'percent', 'percentage_points', 'duration_seconds')),
source text not null,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
```

No foreign keys.

Unenforced reference or vocabulary candidates: `metric_key`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609240002_analytics_domain.sql:41`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## analytics tags

Table: `analytics_tags`. Interaction instrumentation definitions and vendor mapping metadata. Created at `supabase/migrations/202610050002_analytics_tags.sql:2`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `AnalyticsTag`; adapter key: `analyticsTags`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/domain/analytics.ts:4` |
| page_id | text | no | pageId: string | `src/domain/analytics.ts:4` |
| element_key | text | no | elementKey: string | `src/domain/analytics.ts:4` |
| label | text | no | label: string | `src/domain/analytics.ts:4` |
| kind | text | no | kind: AnalyticsElementKind | `src/domain/analytics.ts:4` |
| events | jsonb | no | events: AnalyticsEvent[] | `src/domain/analytics.ts:5` |
| trigger | text | no | trigger: string | `src/domain/analytics.ts:5` |
| sites | jsonb | no | sites: string[] | `src/domain/analytics.ts:5` |
| status | text | no | status: "local-hook" \| "proposed" | `src/domain/analytics.ts:7` |
| permitted_properties | jsonb | no | permittedProperties: readonly string[] | `src/domain/analytics.ts:7` |
| description | text | no | description: string | `src/domain/analytics.ts:8` |
| source | text | no | source: "prototype-definition" \| "proposed-interaction" \| "shared-component" \| "component-definition" | `src/domain/analytics.ts:9` |
| source_file | text | no | sourceFile: string | `src/domain/analytics.ts:10` |
| condition | text | no | condition: string | `src/domain/analytics.ts:10` |
| adobe | jsonb | no | adobe: { mapping: string \| null; status: "not-configured"; } | `src/domain/analytics.ts:11` |
| contentsquare | jsonb | no | contentsquare: { mapping: string \| null; status: "not-configured"; } | `src/domain/analytics.ts:12` |

```sql
id text primary key,
page_id text not null,
element_key text not null,
label text not null,
kind text not null,
events jsonb not null default '[]',
trigger text not null,
sites jsonb not null default '[]',
status text not null,
permitted_properties jsonb not null default '[]',
description text not null,
source text not null,
source_file text not null,
condition text not null,
adobe jsonb not null,
contentsquare jsonb not null
```

No foreign keys.

Unenforced reference or vocabulary candidates: `page_id`, `element_key`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `events` (0 observed candidate paths), `sites` (0 observed candidate paths), `permitted_properties` (0 observed candidate paths), `adobe` (0 observed candidate paths), `contentsquare` (0 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202610050002_analytics_tags.sql:10`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## applicant types

Table: `applicant_types`. Applicant-role metadata, not people. Created at `supabase/migrations/202609240003_portal_library.sql:114`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `ApplicantTypeRow`; adapter key: `applicantTypes`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/catalog.ts:4` |
| key | text | no | key: string | `src/persistence/types/catalog.ts:4` |
| position | integer | no | position: number | `src/persistence/types/catalog.ts:4` |
| definition | jsonb | no | definition: { label: string; applicantType: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/coverage").CoverageApplicantId; } | `src/persistence/types/catalog.ts:4` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
definition jsonb not null check (jsonb_typeof(definition) = 'object'),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `definition` (1 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:120`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:896`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## applicants

Table: `applicants`. Client-owned people independent of sign-in accounts. Created at `supabase/migrations/202610120002_application_relationships.sql:9`. Current ownership: Client via client_id.

Contract: `Applicant`; adapter key: `applicants`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | uuid | no | id: string | `src/persistence/types/applicants.ts:5` |
| client_id | uuid | no | clientId: string | `src/persistence/types/applicants.ts:6` |
| display_name | text | no | displayName: string | `src/persistence/types/applicants.ts:7` |
| email | text | yes | email: string \| null | `src/persistence/types/applicants.ts:8` |
| status | public.record_status | no | status: RecordStatus | `src/persistence/types/applicants.ts:9` |
| created_at | timestamptz | no | createdAt: string | `src/persistence/types/common.ts:13` |
| updated_at | timestamptz | no | updatedAt: string | `src/persistence/types/common.ts:13` |
| deleted_at | timestamptz | yes | deletedAt: string \| null | `src/persistence/types/common.ts:14` |

```sql
id uuid primary key default gen_random_uuid(),
client_id uuid not null references public.clients(id),
display_name text not null check (length(btrim(display_name)) > 0),
email text,
status public.record_status not null default 'active',
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
deleted_at timestamptz,
unique (id, client_id)
```

Enforced foreign keys:

- `(client_id) → public.clients(id)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.

Additive migration history:

- `supabase/migrations/202610120002_application_relationships.sql:57`: enable row level security

Indexes and triggers:

```sql
create index applicants_client_id_idx on public.applicants(client_id) where deleted_at is null;
```

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## application applicants

Table: `application_applicants`. People and applicant roles on applications with tenant consistency columns. Created at `supabase/migrations/202610120002_application_relationships.sql:21`. Current ownership: Site and client references; compatibility depends on composite FK or code (F03); application child.

Contract: `ApplicationApplicant`; adapter key: `applicationApplicants`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | uuid | no | id: string | `src/persistence/types/applicants.ts:14` |
| application_id | uuid | no | applicationId: string | `src/persistence/types/applicants.ts:15` |
| site_id | uuid | no | siteId: string | `src/persistence/types/applicants.ts:16` |
| client_id | uuid | no | clientId: string | `src/persistence/types/applicants.ts:17` |
| applicant_id | uuid | no | applicantId: string | `src/persistence/types/applicants.ts:18` |
| applicant_type_key | text | no | applicantTypeKey: string | `src/persistence/types/applicants.ts:19` |
| created_at | timestamptz | no | createdAt: string | `src/persistence/types/common.ts:13` |
| updated_at | timestamptz | no | updatedAt: string | `src/persistence/types/common.ts:13` |

```sql
id uuid primary key default gen_random_uuid(),
application_id uuid not null,
site_id uuid not null,
client_id uuid not null,
applicant_id uuid not null,
applicant_type_key text not null references public.applicant_types(key),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
foreign key (application_id, site_id) references public.applications(id, site_id),
foreign key (site_id, client_id) references public.sites(id, client_id),
foreign key (applicant_id, client_id) references public.applicants(id, client_id),
unique (application_id, applicant_id)
```

Enforced foreign keys:

- `(applicant_type_key) → public.applicant_types(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(application_id, site_id) → public.applications(id, site_id)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(site_id, client_id) → public.sites(id, client_id)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(applicant_id, client_id) → public.applicants(id, client_id)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.

Additive migration history:

- `supabase/migrations/202610120002_application_relationships.sql:58`: enable row level security

Indexes and triggers:

```sql
create index application_applicants_applicant_id_idx on public.application_applicants(applicant_id);
create index application_applicants_site_client_idx on public.application_applicants(site_id, client_id);
```

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## application associations

Table: `application_associations`. Optional single association selected for an application. Created at `supabase/migrations/202610120002_application_relationships.sql:38`. Current ownership: Site reference; client derived; application child.

Contract: `ApplicationAssociation`; adapter key: `applicationAssociations`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | uuid | no | id: string | `src/persistence/types/applicants.ts:24` |
| application_id | uuid | no | applicationId: string | `src/persistence/types/applicants.ts:25` |
| site_id | uuid | no | siteId: string | `src/persistence/types/applicants.ts:26` |
| site_key | text | no | siteKey: string | `src/persistence/types/applicants.ts:27` |
| association_key | text | no | associationKey: string | `src/persistence/types/applicants.ts:28` |
| created_at | timestamptz | no | createdAt: string | `src/persistence/types/common.ts:13` |
| updated_at | timestamptz | no | updatedAt: string | `src/persistence/types/common.ts:13` |

```sql
id uuid primary key default gen_random_uuid(),
application_id uuid not null unique,
site_id uuid not null,
site_key text not null,
association_key text not null,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
foreign key (application_id, site_id) references public.applications(id, site_id),
foreign key (site_id, site_key) references public.sites(id, key),
foreign key (site_key, association_key) references public.site_associations(site_key, association_key)
```

Enforced foreign keys:

- `(application_id, site_id) → public.applications(id, site_id)`; required; unique child key; delete NO ACTION; update NO ACTION.
- `(site_id, site_key) → public.sites(id, key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(site_key, association_key) → public.site_associations(site_key, association_key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.

Additive migration history:

- `supabase/migrations/202610120002_application_relationships.sql:59`: enable row level security

Indexes and triggers:

```sql
create index application_associations_site_association_idx on public.application_associations(site_key, association_key);
```

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## application events

Table: `application_events`. Application workflow/status history. Created at `supabase/migrations/202609240001_initial_portal_schema.sql:45`. Current ownership: Application via application_id.

Contract: `ApplicationEvent`; adapter key: `applicationEvents`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | uuid | no | id: string | `src/persistence/types/operations.ts:12` |
| application_id | uuid | no | applicationId: string | `src/persistence/types/operations.ts:12` |
| event_type | text | no | eventType: string | `src/persistence/types/operations.ts:12` |
| from_status | application_status | yes | fromStatus: "In Progress" \| "Pending TPA Review" \| "Underwriting" \| "Waiting for Advisor" \| "Completed" \| "Rejected" \| null | `src/persistence/types/operations.ts:12` |
| to_status | application_status | yes | toStatus: "In Progress" \| "Pending TPA Review" \| "Underwriting" \| "Waiting for Advisor" \| "Completed" \| "Rejected" \| null | `src/persistence/types/operations.ts:13` |
| from_owner_type | action_owner_type | yes | fromOwnerType: "Applicant" \| "Advisor" \| "TPA" \| "NYL" \| "None" \| null | `src/persistence/types/operations.ts:13` |
| to_owner_type | action_owner_type | yes | toOwnerType: "Applicant" \| "Advisor" \| "TPA" \| "NYL" \| "None" \| null | `src/persistence/types/operations.ts:13` |
| performed_by | text | no | performedBy: string | `src/persistence/types/operations.ts:14` |
| notes | text | yes | notes: string \| null | `src/persistence/types/operations.ts:14` |
| created_at | timestamptz | no | createdAt: string | `src/persistence/types/operations.ts:14` |

```sql
id uuid primary key default gen_random_uuid(),
application_id uuid not null references public.applications,
event_type text not null,
from_status application_status,
to_status application_status,
from_owner_type action_owner_type,
to_owner_type action_owner_type,
performed_by text not null,
notes text,
created_at timestamptz not null default now()
```

Enforced foreign keys:

- `(application_id) → public.applications(id)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `event_type`, `from_owner_type`, `to_owner_type`, `performed_by`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609240001_initial_portal_schema.sql:95`: enable row level security

Indexes and triggers:

```sql
create index application_events_application_id_idx on public.application_events(application_id, created_at desc);
```

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## application participants

Table: `application_participants`. Workflow participants with optional public-user link and copied contact details. Created at `supabase/migrations/202609240001_initial_portal_schema.sql:41`. Current ownership: Application via application_id.

Contract: `ApplicationParticipant`; adapter key: `applicationParticipants`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | uuid | no | id: string | `src/persistence/types/operations.ts:8` |
| application_id | uuid | no | applicationId: string | `src/persistence/types/operations.ts:8` |
| participant_type | text | no | participantType: string | `src/persistence/types/operations.ts:8` |
| user_id | uuid | yes | userId: string \| null | `src/persistence/types/operations.ts:8` |
| name | text | no | name: string | `src/persistence/types/operations.ts:9` |
| email | text | no | email: string | `src/persistence/types/operations.ts:9` |
| relationship | text | yes | relationship: string \| null | `src/persistence/types/operations.ts:9` |
| created_at | timestamptz | no | createdAt: string | `src/persistence/types/common.ts:13` |
| updated_at | timestamptz | no | updatedAt: string | `src/persistence/types/common.ts:13` |

```sql
id uuid primary key default gen_random_uuid(),
application_id uuid not null references public.applications,
participant_type text not null,
user_id uuid references public.users,
name text not null,
email text not null,
relationship text,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
```

Enforced foreign keys:

- `(application_id) → public.applications(id)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(user_id) → public.users(id)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `participant_type`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609240001_initial_portal_schema.sql:95`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## applications

Table: `applications`. Operational application status, site and action owner. Created at `supabase/migrations/202609240001_initial_portal_schema.sql:34`. Current ownership: Site via site_id; client derived.

Contract: `Application`; adapter key: `applications`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | uuid | no | id: string | `src/persistence/types/operations.ts:3` |
| application_number | text | no | applicationNumber: string | `src/persistence/types/operations.ts:3` |
| site_id | uuid | no | siteId: string | `src/persistence/types/operations.ts:3` |
| product_key | text | no | productKey: string | `src/persistence/types/operations.ts:3` |
| status | application_status | no | status: "In Progress" \| "Pending TPA Review" \| "Underwriting" \| "Waiting for Advisor" \| "Completed" \| "Rejected" | `src/persistence/types/operations.ts:4` |
| current_action_owner_type | action_owner_type | no | currentActionOwnerType: "Applicant" \| "Advisor" \| "TPA" \| "NYL" \| "None" | `src/persistence/types/operations.ts:4` |
| current_action_owner_id | uuid | yes | currentActionOwnerId: string \| null | `src/persistence/types/operations.ts:4` |
| submitted_at | timestamptz | yes | submittedAt: string \| null | `src/persistence/types/operations.ts:5` |
| created_at | timestamptz | no | createdAt: string | `src/persistence/types/common.ts:13` |
| updated_at | timestamptz | no | updatedAt: string | `src/persistence/types/common.ts:13` |
| deleted_at | timestamptz | yes | deletedAt: string \| null | `src/persistence/types/common.ts:14` |

```sql
id uuid primary key default gen_random_uuid(),
application_number text not null unique,
site_id uuid not null references public.sites,
product_key text not null,
status application_status not null,
current_action_owner_type action_owner_type not null,
current_action_owner_id uuid,
submitted_at timestamptz,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
deleted_at timestamptz,
constraint applications_id_site_id_unique unique (id, site_id)
```

Enforced foreign keys:

- `(site_id) → public.sites(id)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `product_key`, `current_action_owner_type`, `current_action_owner_id`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609240001_initial_portal_schema.sql:94`: enable row level security
- `supabase/migrations/202610120002_application_relationships.sql:7`: add constraint applications_id_site_id_unique unique (id, site_id)

Indexes and triggers:

```sql
create index applications_site_id_idx on public.applications(site_id) where deleted_at is null;
```

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## associations

Table: `associations`. Client-owned membership association definitions. Created at `supabase/migrations/202609240003_portal_library.sql:15`. Current ownership: Client reference.

Contract: `AssociationRow`; adapter key: `associations`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/catalog.ts:4` |
| key | text | no | key: string | `src/persistence/types/catalog.ts:4` |
| position | integer | no | position: number | `src/persistence/types/catalog.ts:4` |
| client_key | text | no | clientKey: string | `src/persistence/types/library.ts:14` |
| definition | jsonb | no | definition: { name: string; acronym?: string; logo?: string; logoAlt?: string; } | `src/persistence/types/catalog.ts:4` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
client_key text not null references public.clients(key),
definition jsonb not null check (jsonb_typeof(definition) = 'object'),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(client_key) → public.clients(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `definition` (0 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:22`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:876`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## audit events

Table: `audit_events`. Operational entity change history and free-text actor. Created at `supabase/migrations/202609240001_initial_portal_schema.sql:79`. Current ownership: Portal operations; entity/site scope only where a column provides it.

Contract: `AuditEvent`; adapter key: `auditEvents`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | uuid | no | id: string | `src/persistence/types/operations.ts:42` |
| entity_type | text | no | entityType: string | `src/persistence/types/operations.ts:42` |
| entity_id | uuid | no | entityId: string | `src/persistence/types/operations.ts:42` |
| action | audit_action | no | action: AuditAction | `src/persistence/types/operations.ts:42` |
| field_key | text | yes | fieldKey: string \| null | `src/persistence/types/operations.ts:42` |
| old_value_json | jsonb | no | oldValueJson: Json | `src/persistence/types/operations.ts:43` |
| new_value_json | jsonb | no | newValueJson: Json | `src/persistence/types/operations.ts:43` |
| performed_by | text | no | performedBy: string | `src/persistence/types/operations.ts:43` |
| change_request_id | uuid | yes | changeRequestId: string \| null | `src/persistence/types/operations.ts:43` |
| created_at | timestamptz | no | createdAt: string | `src/persistence/types/operations.ts:43` |

```sql
id uuid primary key default gen_random_uuid(),
entity_type text not null,
entity_id uuid not null,
action audit_action not null,
field_key text,
old_value_json jsonb not null default 'null',
new_value_json jsonb not null default 'null',
performed_by text not null,
change_request_id uuid references public.change_requests,
created_at timestamptz not null default now()
```

Enforced foreign keys:

- `(change_request_id) → public.change_requests(id)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `entity_type`, `entity_id`, `field_key`, `performed_by`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `old_value_json` (0 observed candidate paths), `new_value_json` (0 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609240001_initial_portal_schema.sql:100`: enable row level security

Indexes and triggers:

```sql
create index audit_events_entity_idx on public.audit_events(entity_type, entity_id, created_at desc);
```

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## benefit caps

Table: `benefit_caps`. Conditional benefit caps under aggregate limits. Created at `supabase/migrations/202609280001_canonical_normalization.sql:572`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `BenefitCaps`; adapter key: `benefitCaps`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/underwritingCanonical.ts:80` |
| key | text | no | key: string | `src/persistence/types/underwritingCanonical.ts:81` |
| aggregate_limit_key | text | no | aggregateLimitKey: string | `src/persistence/types/underwritingCanonical.ts:82` |
| minimum_age_years | numeric | yes | minimumAgeYears: number \| null | `src/persistence/types/underwritingCanonical.ts:83` |
| maximum_age_years | numeric | yes | maximumAgeYears: number \| null | `src/persistence/types/underwritingCanonical.ts:84` |
| self_employed_less_than_years | numeric | yes | selfEmployedLessThanYears: number \| null | `src/persistence/types/underwritingCanonical.ts:85` |
| maximum | numeric | no | maximum: number | `src/persistence/types/underwritingCanonical.ts:86` |
| required_waiting_period | text | yes | requiredWaitingPeriod: string \| null | `src/persistence/types/underwritingCanonical.ts:87` |
| required_benefit_period | text | yes | requiredBenefitPeriod: string \| null | `src/persistence/types/underwritingCanonical.ts:88` |
| position | integer | no | position: number | `src/persistence/types/underwritingCanonical.ts:89` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
aggregate_limit_key text not null references public.aggregate_limits(key),
minimum_age_years numeric,
maximum_age_years numeric,
self_employed_less_than_years numeric,
maximum numeric not null,
required_waiting_period text,
required_benefit_period text,
position integer not null,
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(aggregate_limit_key) → public.aggregate_limits(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:587`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## benefit period options

Table: `benefit_period_options`. Product/site/applicant-role waiting and benefit choices. Created at `supabase/migrations/202609280001_canonical_normalization.sql:508`. Current ownership: Site reference; client derived.

Contract: `BenefitPeriodOptions`; adapter key: `benefitPeriodOptions`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/underwritingCanonical.ts:36` |
| key | text | no | key: string | `src/persistence/types/underwritingCanonical.ts:37` |
| product_key | text | no | productKey: string | `src/persistence/types/underwritingCanonical.ts:38` |
| site_key | text | yes | siteKey: string \| null | `src/persistence/types/underwritingCanonical.ts:39` |
| applicant_type_key | text | yes | applicantTypeKey: string \| null | `src/persistence/types/underwritingCanonical.ts:40` |
| kind | text | no | kind: string | `src/persistence/types/underwritingCanonical.ts:41` |
| value | text | no | value: string | `src/persistence/types/underwritingCanonical.ts:42` |
| label | text | no | label: string | `src/persistence/types/underwritingCanonical.ts:43` |
| days | integer | yes | days: number \| null | `src/persistence/types/underwritingCanonical.ts:44` |
| position | integer | no | position: number | `src/persistence/types/underwritingCanonical.ts:45` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
product_key text not null references public.products(key),
site_key text references public.sites(key),
applicant_type_key text references public.applicant_types(key),
kind text not null check (kind in ('waiting','benefit')),
value text not null,
label text not null,
days integer,
position integer not null,
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(product_key) → public.products(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(site_key) → public.sites(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(applicant_type_key) → public.applicant_types(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:523`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## branding profiles

Table: `branding_profiles`. Scoped brand presentation definitions. Created at `supabase/migrations/202609240003_portal_library.sql:352`. Current ownership: Global/client/site according to scope; see CHECK for required target.

Contract: `BrandingProfileRow`; adapter key: `brandingProfiles`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/catalog.ts:4` |
| key | text | no | key: string | `src/persistence/types/catalog.ts:4` |
| position | integer | no | position: number | `src/persistence/types/catalog.ts:4` |
| definition | jsonb | no | definition: Partial<import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/configuration").ClientBranding> | `src/persistence/types/catalog.ts:4` |
| scope | text | no | scope: "global" \| "client" \| "site" | `src/persistence/types/catalog.ts:5` |
| client_key | text | yes | clientKey: string \| null | `src/persistence/types/catalog.ts:5` |
| site_key | text | yes | siteKey: string \| null | `src/persistence/types/catalog.ts:5` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
definition jsonb not null check (jsonb_typeof(definition) = 'object'),
scope text not null check (scope in ('global','client','site')),
client_key text references public.clients(key),
site_key text references public.sites(key),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text,
unique nulls not distinct(scope, client_key, site_key),
check ((scope = 'global' and client_key is null and site_key is null) or (scope = 'client' and client_key is not null and site_key is null) or (scope = 'site' and site_key is not null and client_key is null))
```

Enforced foreign keys:

- `(client_key) → public.clients(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(site_key) → public.sites(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `definition` (0 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:363`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:942`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## change items

Table: `change_items`. Entity/field changes proposed under change requests. Created at `supabase/migrations/202609240001_initial_portal_schema.sql:60`. Current ownership: Site reference; client derived.

Contract: `ChangeItem`; adapter key: `changeItems`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | uuid | no | id: string | `src/persistence/types/operations.ts:23` |
| change_request_id | uuid | no | changeRequestId: string | `src/persistence/types/operations.ts:23` |
| site_id | uuid | yes | siteId: string \| null | `src/persistence/types/operations.ts:23` |
| entity_type | text | no | entityType: string | `src/persistence/types/operations.ts:23` |
| entity_id | text | yes | entityId: string \| null | `src/persistence/types/operations.ts:23` |
| field_key | text | no | fieldKey: string | `src/persistence/types/operations.ts:24` |
| current_value_json | jsonb | no | currentValueJson: Json | `src/persistence/types/operations.ts:24` |
| proposed_value_json | jsonb | no | proposedValueJson: Json | `src/persistence/types/operations.ts:24` |
| change_type | change_type | no | changeType: ChangeType | `src/persistence/types/operations.ts:24` |
| created_at | timestamptz | no | createdAt: string | `src/persistence/types/common.ts:13` |
| updated_at | timestamptz | no | updatedAt: string | `src/persistence/types/common.ts:13` |

```sql
id uuid primary key default gen_random_uuid(),
change_request_id uuid not null references public.change_requests on delete cascade,
site_id uuid references public.sites,
entity_type text not null,
entity_id text,
field_key text not null,
current_value_json jsonb not null default 'null',
proposed_value_json jsonb not null default 'null',
change_type change_type not null,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
```

Enforced foreign keys:

- `(change_request_id) → public.change_requests(id)`; required; multiple children permitted; delete cascade; update NO ACTION.
- `(site_id) → public.sites(id)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `entity_type`, `entity_id`, `field_key`, `change_type`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `current_value_json` (0 observed candidate paths), `proposed_value_json` (0 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609240001_initial_portal_schema.sql:96`: enable row level security

Indexes and triggers:

```sql
create index change_items_change_request_id_idx on public.change_items(change_request_id);
```

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## change requests

Table: `change_requests`. Change request tracking, owner and target release. Created at `supabase/migrations/202609240001_initial_portal_schema.sql:55`. Current ownership: Portal operations; entity/site scope only where a column provides it.

Contract: `ChangeRequest`; adapter key: `changeRequests`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | uuid | no | id: string | `src/persistence/types/operations.ts:19` |
| change_number | text | no | changeNumber: string | `src/persistence/types/operations.ts:19` |
| title | text | no | title: string | `src/persistence/types/operations.ts:19` |
| description | text | no | description: string | `src/persistence/types/operations.ts:19` |
| status | text | no | status: "Draft" \| "Requested" \| "Review" \| "Development" \| "QA" \| "Approved" \| "Scheduled" \| "Released" | `src/persistence/types/operations.ts:19` |
| requested_by | text | no | requestedBy: string | `src/persistence/types/operations.ts:20` |
| owner_id | text | yes | ownerId: string \| null | `src/persistence/types/operations.ts:20` |
| target_release_id | uuid | yes | targetReleaseId: string \| null | `src/persistence/types/operations.ts:20` |
| created_at | timestamptz | no | createdAt: string | `src/persistence/types/common.ts:13` |
| updated_at | timestamptz | no | updatedAt: string | `src/persistence/types/common.ts:13` |
| deleted_at | timestamptz | yes | deletedAt: string \| null | `src/persistence/types/common.ts:14` |

```sql
id uuid primary key default gen_random_uuid(),
change_number text not null unique,
title text not null,
description text not null default '',
status text not null,
requested_by text not null,
owner_id text,
target_release_id uuid references public.releases,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
deleted_at timestamptz
```

Enforced foreign keys:

- `(target_release_id) → public.releases(id)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `requested_by`, `owner_id`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609240001_initial_portal_schema.sql:96`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## client environment links

Table: `client_environment_links`. Client environment URLs. Created at `supabase/migrations/202609280001_canonical_normalization.sql:709`. Current ownership: Client reference.

Contract: `ClientEnvironmentLinks`; adapter key: `clientEnvironmentLinks`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/urlsCanonical.ts:20` |
| key | text | no | key: string | `src/persistence/types/urlsCanonical.ts:21` |
| client_key | text | no | clientKey: string | `src/persistence/types/urlsCanonical.ts:22` |
| environment | text | no | environment: string | `src/persistence/types/urlsCanonical.ts:23` |
| url | text | no | url: string | `src/persistence/types/urlsCanonical.ts:24` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
client_key text not null references public.clients(key),
environment text not null check (environment in ('production','test','pre-production','automation')),
url text not null check (url ~ '^https?://'),
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(client_key) → public.clients(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `url`, `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:719`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## clients

Table: `clients`. Client organization accounts under an organization. Created at `supabase/migrations/202609240001_initial_portal_schema.sql:13`. Current ownership: Organization via organization_id.

Contract: `Client`; adapter key: `clients`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | uuid | no | id: string | `src/persistence/types/organization.ts:9` |
| organization_id | uuid | no | organizationId: string | `src/persistence/types/organization.ts:9` |
| key | text | no | key: string | `src/persistence/types/organization.ts:9` |
| name | text | no | name: string | `src/domain/organizations.ts:12` |
| acronym | text | no | acronym: string | `src/domain/organizations.ts:13` |
| status | record_status | no | status: RecordStatus | `src/persistence/types/organization.ts:9` |
| created_at | timestamptz | no | createdAt: string | `src/persistence/types/common.ts:13` |
| updated_at | timestamptz | no | updatedAt: string | `src/persistence/types/common.ts:13` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id uuid primary key default gen_random_uuid(),
organization_id uuid not null references public.organizations,
key text not null unique,
name text not null,
acronym text not null,
status record_status not null default 'active',
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(organization_id) → public.organizations(id)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609240001_initial_portal_schema.sql:91`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:954`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## components

Table: `components`. Portal component catalog and Storybook metadata. Created at `supabase/migrations/202610120001_portal_components.sql:2`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `ComponentRow`; adapter key: `components`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/catalog.ts:4` |
| key | text | no | key: string | `src/persistence/types/catalog.ts:4` |
| position | integer | no | position: number | `src/persistence/types/catalog.ts:4` |
| definition | jsonb | no | definition: { name: string; description: string; section: string; storyId: string; storybookPath: string; source: string; } | `src/persistence/types/catalog.ts:4` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
definition jsonb not null check (jsonb_typeof(definition) = 'object'),
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `definition` (3 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202610120001_portal_components.sql:11`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## conditions

Table: `conditions`. Condition definitions and expressions. Created at `supabase/migrations/202609240003_portal_library.sql:122`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `ConditionRow`; adapter key: `conditions`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/catalog.ts:4` |
| key | text | no | key: string | `src/persistence/types/catalog.ts:4` |
| position | integer | no | position: number | `src/persistence/types/catalog.ts:4` |
| definition | jsonb | no | definition: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/rules").ConditionDefinition | `src/persistence/types/catalog.ts:4` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
definition jsonb not null check (jsonb_typeof(definition) = 'object'),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `definition` (2 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:128`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:898`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## configuration definitions

Table: `configuration_definitions`. Configuration paths, targets and metadata. Created at `supabase/migrations/202609240003_portal_library.sql:196`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `ConfigurationDefinitionRow`; adapter key: `configurationDefinitions`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/catalog.ts:4` |
| key | text | no | key: string | `src/persistence/types/catalog.ts:4` |
| position | integer | no | position: number | `src/persistence/types/catalog.ts:4` |
| definition | jsonb | no | definition: { path: string[] \| null; metadata: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/persistence/types").Json; target?: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/persistence/types").ConfigurationTarget \| null; } | `src/persistence/types/catalog.ts:4` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
definition jsonb not null check (jsonb_typeof(definition) = 'object'),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `definition` (11 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:202`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:914`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## configuration values

Table: `configuration_values`. Scoped configuration values. Created at `supabase/migrations/202609240003_portal_library.sql:324`. Current ownership: Global/client/site according to scope; see CHECK for required target.

Contract: `ConfigurationValueRow`; adapter key: `configurationValues`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/siteConfiguration.ts:17` |
| key | text | no | key: string | `src/persistence/types/siteConfiguration.ts:17` |
| position | integer | no | position: number | `src/persistence/types/siteConfiguration.ts:17` |
| configuration_key | text | no | configurationKey: string | `src/persistence/types/siteConfiguration.ts:17` |
| value | jsonb | no | value: Json | `src/persistence/types/siteConfiguration.ts:17` |
| scope | text | no | scope: "global" \| "client" \| "site" | `src/persistence/types/catalog.ts:5` |
| client_key | text | yes | clientKey: string \| null | `src/persistence/types/catalog.ts:5` |
| site_key | text | yes | siteKey: string \| null | `src/persistence/types/catalog.ts:5` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
configuration_key text not null references public.configuration_definitions(key),
value jsonb not null,
scope text not null check (scope in ('global','client','site')),
client_key text references public.clients(key),
site_key text references public.sites(key),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text,
unique nulls not distinct(configuration_key, scope, client_key, site_key),
check ((scope = 'global' and client_key is null and site_key is null) or (scope = 'client' and client_key is not null and site_key is null) or (scope = 'site' and site_key is not null and client_key is null))
```

Enforced foreign keys:

- `(configuration_key) → public.configuration_definitions(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(client_key) → public.clients(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(site_key) → public.sites(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `value` (146 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:336`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:938`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## content entries

Table: `content_entries`. Content slot definitions. Created at `supabase/migrations/202609240003_portal_library.sql:204`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `ContentEntryRow`; adapter key: `contentEntries`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/catalog.ts:4` |
| key | text | no | key: string | `src/persistence/types/catalog.ts:4` |
| position | integer | no | position: number | `src/persistence/types/catalog.ts:4` |
| definition | jsonb | no | definition: { path: string[] \| null; } | `src/persistence/types/catalog.ts:4` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
definition jsonb not null check (jsonb_typeof(definition) = 'object'),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `definition` (2 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:210`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:916`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## content values

Table: `content_values`. Scoped content values. Created at `supabase/migrations/202609240003_portal_library.sql:338`. Current ownership: Global/client/site according to scope; see CHECK for required target.

Contract: `ContentValueRow`; adapter key: `contentValues`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/siteConfiguration.ts:18` |
| key | text | no | key: string | `src/persistence/types/siteConfiguration.ts:18` |
| position | integer | no | position: number | `src/persistence/types/siteConfiguration.ts:18` |
| content_key | text | no | contentKey: string | `src/persistence/types/siteConfiguration.ts:18` |
| value | jsonb | no | value: Json | `src/persistence/types/siteConfiguration.ts:18` |
| scope | text | no | scope: "global" \| "client" \| "site" | `src/persistence/types/catalog.ts:5` |
| client_key | text | yes | clientKey: string \| null | `src/persistence/types/catalog.ts:5` |
| site_key | text | yes | siteKey: string \| null | `src/persistence/types/catalog.ts:5` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
content_key text not null references public.content_entries(key),
value jsonb not null,
scope text not null check (scope in ('global','client','site')),
client_key text references public.clients(key),
site_key text references public.sites(key),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text,
unique nulls not distinct(content_key, scope, client_key, site_key),
check ((scope = 'global' and client_key is null and site_key is null) or (scope = 'client' and client_key is not null and site_key is null) or (scope = 'site' and site_key is not null and client_key is null))
```

Enforced foreign keys:

- `(content_key) → public.content_entries(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(client_key) → public.clients(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(site_key) → public.sites(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `value` (1 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:350`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:940`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## coverage amount patterns

Table: `coverage_amount_patterns`. Amount calculation/selection strategy and optional base product/role. Created at `supabase/migrations/202609280001_canonical_normalization.sql:351`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `CoverageAmountPatterns`; adapter key: `coverageAmountPatterns`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/coverageNormalizationCanonical.ts:55` |
| key | text | no | key: string | `src/persistence/types/coverageNormalizationCanonical.ts:56` |
| pattern_key | text | no | patternKey: string | `src/persistence/types/coverageNormalizationCanonical.ts:57` |
| amount_type | text | no | amountType: string | `src/persistence/types/coverageNormalizationCanonical.ts:58` |
| minimum | numeric | yes | minimum: number \| null | `src/persistence/types/coverageNormalizationCanonical.ts:59` |
| maximum | numeric | yes | maximum: number \| null | `src/persistence/types/coverageNormalizationCanonical.ts:60` |
| increment | numeric | yes | increment: number \| null | `src/persistence/types/coverageNormalizationCanonical.ts:61` |
| formula | text | yes | formula: string \| null | `src/persistence/types/coverageNormalizationCanonical.ts:62` |
| base_product_key | text | yes | baseProductKey: string \| null | `src/persistence/types/coverageNormalizationCanonical.ts:63` |
| base_applicant_key | text | yes | baseApplicantKey: string \| null | `src/persistence/types/coverageNormalizationCanonical.ts:64` |
| base_applicant_class | text | yes | baseApplicantClass: string \| null | `src/persistence/types/coverageNormalizationCanonical.ts:65` |
| multiplier | numeric | yes | multiplier: number \| null | `src/persistence/types/coverageNormalizationCanonical.ts:66` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
pattern_key text not null references public.patterns(key),
amount_type text not null check (amount_type in ('fixed','set','range','tiered-range','range-plus-fixed','conditional','calculated','named-option','none','attribute-mapped','formula-capped','base-reference','multiplier','election-only','unspecified-increment')),
minimum numeric,
maximum numeric,
increment numeric,
formula text,
base_product_key text references public.products(key),
base_applicant_key text references public.applicant_types(key),
base_applicant_class text,
multiplier numeric,
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text,
check (minimum is null or maximum is null or minimum <= maximum),
check (increment is null or increment > 0)
```

Enforced foreign keys:

- `(pattern_key) → public.patterns(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(base_product_key) → public.products(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(base_applicant_key) → public.applicant_types(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `amount_type`, `formula`, `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:370`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## coverage categories

Table: `coverage_categories`. Coverage category catalog. Created at `supabase/migrations/202609240003_portal_library.sql:60`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `CoverageCategoryRow`; adapter key: `coverageCategories`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/catalog.ts:4` |
| key | text | no | key: string | `src/persistence/types/catalog.ts:4` |
| position | integer | no | position: number | `src/persistence/types/catalog.ts:4` |
| definition | jsonb | no | definition: { label: string; shortLabel?: string; iconKey: string; } | `src/persistence/types/catalog.ts:4` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
definition jsonb not null check (jsonb_typeof(definition) = 'object'),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `definition` (1 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:66`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:886`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## coverage dependencies

Table: `coverage_dependencies`. Required applicant-role/category relationships for coverage. Created at `supabase/migrations/202609280001_canonical_normalization.sql:543`. Current ownership: Site reference; client derived.

Contract: `CoverageDependencies`; adapter key: `coverageDependencies`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/underwritingCanonical.ts:61` |
| key | text | no | key: string | `src/persistence/types/underwritingCanonical.ts:62` |
| product_key | text | no | productKey: string | `src/persistence/types/underwritingCanonical.ts:63` |
| site_key | text | yes | siteKey: string \| null | `src/persistence/types/underwritingCanonical.ts:64` |
| applicant_type_key | text | no | applicantTypeKey: string | `src/persistence/types/underwritingCanonical.ts:65` |
| requires_applicant_key | text | no | requiresApplicantKey: string | `src/persistence/types/underwritingCanonical.ts:66` |
| category_key | text | no | categoryKey: string | `src/persistence/types/underwritingCanonical.ts:67` |
| same_product | boolean | no | sameProduct: boolean | `src/persistence/types/underwritingCanonical.ts:68` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
product_key text not null references public.products(key),
site_key text references public.sites(key),
applicant_type_key text not null references public.applicant_types(key),
requires_applicant_key text not null references public.applicant_types(key),
category_key text not null references public.coverage_categories(key),
same_product boolean not null,
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(product_key) → public.products(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(site_key) → public.sites(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(applicant_type_key) → public.applicant_types(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(requires_applicant_key) → public.applicant_types(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(category_key) → public.coverage_categories(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:556`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## coverage plan definitions

Table: `coverage_plan_definitions`. Reusable coverage plan families. Created at `supabase/migrations/202609280001_canonical_normalization.sql:195`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `CoveragePlanDefinitions`; adapter key: `coveragePlanDefinitions`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/coverageNormalizationCanonical.ts:18` |
| key | text | no | key: string | `src/persistence/types/coverageNormalizationCanonical.ts:19` |
| name | text | no | name: string | `src/persistence/types/coverageNormalizationCanonical.ts:20` |
| coverage_type | text | no | coverageType: string | `src/persistence/types/coverageNormalizationCanonical.ts:21` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
name text not null,
coverage_type text not null check (coverage_type in ('disability','overhead-expense')),
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `coverage_type`, `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:204`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## coverage plan variants

Table: `coverage_plan_variants`. Plan variants and applicant-role qualifiers. Created at `supabase/migrations/202609280001_canonical_normalization.sql:206`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `CoveragePlanVariants`; adapter key: `coveragePlanVariants`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/coverageNormalizationCanonical.ts:24` |
| key | text | no | key: string | `src/persistence/types/coverageNormalizationCanonical.ts:25` |
| plan_key | text | no | planKey: string | `src/persistence/types/coverageNormalizationCanonical.ts:26` |
| name | text | yes | name: string \| null | `src/persistence/types/coverageNormalizationCanonical.ts:27` |
| applicant_type_key | text | yes | applicantTypeKey: string \| null | `src/persistence/types/coverageNormalizationCanonical.ts:28` |
| position | integer | no | position: number | `src/persistence/types/coverageNormalizationCanonical.ts:29` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
plan_key text not null references public.coverage_plan_definitions(key),
name text,
applicant_type_key text references public.applicant_types(key),
position integer not null,
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(plan_key) → public.coverage_plan_definitions(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(applicant_type_key) → public.applicant_types(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:217`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## document definitions

Table: `document_definitions`. Document catalog definitions. Created at `supabase/migrations/202609240003_portal_library.sql:220`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `DocumentDefinitionRow`; adapter key: `documentDefinitions`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/catalog.ts:4` |
| key | text | no | key: string | `src/persistence/types/catalog.ts:4` |
| position | integer | no | position: number | `src/persistence/types/catalog.ts:4` |
| definition | jsonb | no | definition: { contentKey: string \| null; productKey: string \| null; source: string; } | `src/persistence/types/catalog.ts:4` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
definition jsonb not null check (jsonb_typeof(definition) = 'object'),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `definition` (3 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:226`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:920`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## eligibility constraints

Table: `eligibility_constraints`. Product/site/applicant-role age and work eligibility. Created at `supabase/migrations/202609280001_canonical_normalization.sql:525`. Current ownership: Site reference; client derived.

Contract: `EligibilityConstraints`; adapter key: `eligibilityConstraints`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/underwritingCanonical.ts:48` |
| key | text | no | key: string | `src/persistence/types/underwritingCanonical.ts:49` |
| product_key | text | no | productKey: string | `src/persistence/types/underwritingCanonical.ts:50` |
| site_key | text | yes | siteKey: string \| null | `src/persistence/types/underwritingCanonical.ts:51` |
| applicant_type_key | text | no | applicantTypeKey: string | `src/persistence/types/underwritingCanonical.ts:52` |
| minimum_age_days | numeric | yes | minimumAgeDays: number \| null | `src/persistence/types/underwritingCanonical.ts:53` |
| minimum_age_years | numeric | yes | minimumAgeYears: number \| null | `src/persistence/types/underwritingCanonical.ts:54` |
| maximum_age_years | numeric | yes | maximumAgeYears: number \| null | `src/persistence/types/underwritingCanonical.ts:55` |
| student_maximum_age_years | numeric | yes | studentMaximumAgeYears: number \| null | `src/persistence/types/underwritingCanonical.ts:56` |
| unmarried | boolean | yes | unmarried: boolean \| null | `src/persistence/types/underwritingCanonical.ts:57` |
| minimum_work_hours | numeric | yes | minimumWorkHours: number \| null | `src/persistence/types/underwritingCanonical.ts:58` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
product_key text not null references public.products(key),
site_key text references public.sites(key),
applicant_type_key text not null references public.applicant_types(key),
minimum_age_days numeric,
minimum_age_years numeric,
maximum_age_years numeric,
student_maximum_age_years numeric,
unmarried boolean,
minimum_work_hours numeric,
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(product_key) → public.products(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(site_key) → public.sites(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(applicant_type_key) → public.applicant_types(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:541`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## email templates

Table: `email_templates`. Email template definitions. Created at `supabase/migrations/202609240003_portal_library.sql:212`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `EmailTemplateRow`; adapter key: `emailTemplates`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/catalog.ts:4` |
| key | text | no | key: string | `src/persistence/types/catalog.ts:4` |
| position | integer | no | position: number | `src/persistence/types/catalog.ts:4` |
| definition | jsonb | no | definition: { rendererKey: string; source: string; } | `src/persistence/types/catalog.ts:4` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
definition jsonb not null check (jsonb_typeof(definition) = 'object'),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `definition` (2 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:218`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:918`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## features

Table: `features`. Feature catalog. Created at `supabase/migrations/202609240003_portal_library.sql:188`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `FeatureRow`; adapter key: `features`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/catalog.ts:4` |
| key | text | no | key: string | `src/persistence/types/catalog.ts:4` |
| position | integer | no | position: number | `src/persistence/types/catalog.ts:4` |
| definition | jsonb | no | definition: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/features").FeatureDefinition | `src/persistence/types/catalog.ts:4` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
definition jsonb not null check (jsonb_typeof(definition) = 'object'),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `definition` (0 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:194`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:912`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## fields

Table: `fields`. Reusable field definitions. Created at `supabase/migrations/202609240003_portal_library.sql:41`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `FieldRow`; adapter key: `fields`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/catalog.ts:4` |
| key | text | no | key: string | `src/persistence/types/catalog.ts:4` |
| position | integer | no | position: number | `src/persistence/types/catalog.ts:4` |
| definition | jsonb | no | definition: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/fields").FieldDefinition | `src/persistence/types/catalog.ts:4` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
definition jsonb not null check (jsonb_typeof(definition) = 'object'),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `definition` (3 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:47`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:882`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## flag assignments

Table: `flag_assignments`. Flag values attached to zero or one catalog/tenant/application target. Created at `supabase/migrations/202609280001_canonical_normalization.sql:99`. Current ownership: Global or one nullable target; application target also permitted (F08).

Contract: `FlagAssignments`; adapter key: `flagAssignments`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/flagsCanonical.ts:22` |
| key | text | no | key: string | `src/persistence/types/flagsCanonical.ts:23` |
| flag_key | text | no | flagKey: string | `src/persistence/types/flagsCanonical.ts:24` |
| client_key | text | yes | clientKey: string \| null | `src/persistence/types/flagsCanonical.ts:25` |
| site_key | text | yes | siteKey: string \| null | `src/persistence/types/flagsCanonical.ts:26` |
| product_key | text | yes | productKey: string \| null | `src/persistence/types/flagsCanonical.ts:27` |
| coverage_key | text | yes | coverageKey: string \| null | `src/persistence/types/flagsCanonical.ts:28` |
| rider_key | text | yes | riderKey: string \| null | `src/persistence/types/flagsCanonical.ts:29` |
| applicant_key | text | yes | applicantKey: string \| null | `src/persistence/types/flagsCanonical.ts:30` |
| application_id | uuid | yes | applicationId: string \| null | `src/persistence/types/flagsCanonical.ts:31` |
| value | jsonb | no | value: Json | `src/persistence/types/flagsCanonical.ts:32` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
flag_key text not null references public.flag_definitions(key),
client_key text references public.clients(key),
site_key text references public.sites(key),
product_key text references public.products(key),
coverage_key text references public.coverage_categories(key),
rider_key text references public.riders(key),
applicant_key text references public.applicant_types(key),
application_id uuid references public.applications(id),
value jsonb not null,
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text,
check (num_nonnulls(client_key,site_key,product_key,coverage_key,rider_key,applicant_key,application_id) <= 1)
```

Enforced foreign keys:

- `(flag_key) → public.flag_definitions(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(client_key) → public.clients(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(site_key) → public.sites(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(product_key) → public.products(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(coverage_key) → public.coverage_categories(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(rider_key) → public.riders(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(applicant_key) → public.applicant_types(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(application_id) → public.applications(id)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `value` (0 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:116`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## flag definitions

Table: `flag_definitions`. Flag vocabulary, value type and persistence intent. Created at `supabase/migrations/202609280001_canonical_normalization.sql:71`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `FlagDefinitions`; adapter key: `flagDefinitions`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/flagsCanonical.ts:5` |
| key | text | no | key: string | `src/persistence/types/flagsCanonical.ts:6` |
| name | text | no | name: string | `src/persistence/types/flagsCanonical.ts:7` |
| level | text | no | level: string | `src/persistence/types/flagsCanonical.ts:8` |
| value_type | text | no | valueType: string | `src/persistence/types/flagsCanonical.ts:9` |
| persistence | text | no | persistence: string | `src/persistence/types/flagsCanonical.ts:10` |
| description | text | no | description: string | `src/persistence/types/flagsCanonical.ts:11` |
| allowed_values | jsonb | yes | allowedValues: Json | `src/persistence/types/flagsCanonical.ts:12` |
| derivation | text | yes | derivation: string \| null | `src/persistence/types/flagsCanonical.ts:13` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
name text not null,
level text not null check (level in ('application','site','coverage','product','rider','applicant','client')),
value_type text not null check (value_type in ('boolean','enum','string','number')),
persistence text not null check (persistence in ('configuration','derived-runtime','session','application-record')),
description text not null,
allowed_values jsonb,
derivation text,
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `value_type`, `derivation`, `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `allowed_values` (0 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:85`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## flag rules

Table: `flag_rules`. Conditional flag derivation rules. Created at `supabase/migrations/202609280001_canonical_normalization.sql:118`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `FlagRules`; adapter key: `flagRules`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/flagsCanonical.ts:35` |
| key | text | no | key: string | `src/persistence/types/flagsCanonical.ts:36` |
| flag_key | text | no | flagKey: string | `src/persistence/types/flagsCanonical.ts:37` |
| condition_key | text | no | conditionKey: string | `src/persistence/types/flagsCanonical.ts:38` |
| value | jsonb | no | value: Json | `src/persistence/types/flagsCanonical.ts:39` |
| priority | integer | no | priority: number | `src/persistence/types/flagsCanonical.ts:40` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
flag_key text not null references public.flag_definitions(key),
condition_key text not null references public.conditions(key),
value jsonb not null,
priority integer not null,
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(flag_key) → public.flag_definitions(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(condition_key) → public.conditions(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `value` (0 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:129`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## flag values

Table: `flag_values`. Named values of flags. Created at `supabase/migrations/202609280001_canonical_normalization.sql:87`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `FlagValues`; adapter key: `flagValues`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/flagsCanonical.ts:16` |
| key | text | no | key: string | `src/persistence/types/flagsCanonical.ts:17` |
| flag_key | text | no | flagKey: string | `src/persistence/types/flagsCanonical.ts:18` |
| value | text | no | value: string | `src/persistence/types/flagsCanonical.ts:19` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
flag_key text not null references public.flag_definitions(key),
value text not null,
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text,
unique(flag_key,value)
```

Enforced foreign keys:

- `(flag_key) → public.flag_definitions(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:97`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## flow steps

Table: `flow_steps`. Nodes within flows. Created at `supabase/migrations/202609240003_portal_library.sql:165`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `FlowStepRow`; adapter key: `flowSteps`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/catalog.ts:4` |
| key | text | no | key: string | `src/persistence/types/catalog.ts:4` |
| position | integer | no | position: number | `src/persistence/types/catalog.ts:4` |
| flow_key | text | no | flowKey: string | `src/persistence/types/flows.ts:5` |
| definition | jsonb | no | definition: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/flows").FlowNodeDef | `src/persistence/types/catalog.ts:4` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
flow_key text not null references public.flows(key),
definition jsonb not null check (jsonb_typeof(definition) = 'object'),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text,
unique(flow_key, key)
```

Enforced foreign keys:

- `(flow_key) → public.flows(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `definition` (2 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:173`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:908`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## flow transitions

Table: `flow_transitions`. Edges with source and target nodes constrained to the same flow. Created at `supabase/migrations/202609240003_portal_library.sql:175`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `FlowTransitionRow`; adapter key: `flowTransitions`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/catalog.ts:4` |
| key | text | no | key: string | `src/persistence/types/catalog.ts:4` |
| position | integer | no | position: number | `src/persistence/types/catalog.ts:4` |
| flow_key | text | no | flowKey: string | `src/persistence/types/flows.ts:6` |
| source_step_key | text | no | sourceStepKey: string | `src/persistence/types/flows.ts:6` |
| target_step_key | text | no | targetStepKey: string | `src/persistence/types/flows.ts:6` |
| definition | jsonb | no | definition: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/flows").FlowEdgeDef | `src/persistence/types/catalog.ts:4` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
flow_key text not null references public.flows(key),
source_step_key text not null references public.flow_steps(key),
target_step_key text not null references public.flow_steps(key),
definition jsonb not null check (jsonb_typeof(definition) = 'object'),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text,
foreign key (flow_key, source_step_key) references public.flow_steps(flow_key, key),
foreign key (flow_key, target_step_key) references public.flow_steps(flow_key, key)
```

Enforced foreign keys:

- `(flow_key) → public.flows(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(source_step_key) → public.flow_steps(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(target_step_key) → public.flow_steps(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(flow_key, source_step_key) → public.flow_steps(flow_key, key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(flow_key, target_step_key) → public.flow_steps(flow_key, key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `definition` (4 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:186`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:910`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## flows

Table: `flows`. Flow catalog. Created at `supabase/migrations/202609240003_portal_library.sql:157`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `FlowRow`; adapter key: `flows`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/catalog.ts:4` |
| key | text | no | key: string | `src/persistence/types/catalog.ts:4` |
| position | integer | no | position: number | `src/persistence/types/catalog.ts:4` |
| definition | jsonb | no | definition: Pick<import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/flows").FlowDefinition, "id" \| "title" \| "intro"> | `src/persistence/types/catalog.ts:4` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
definition jsonb not null check (jsonb_typeof(definition) = 'object'),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `definition` (1 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:163`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:906`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## identity resolutions

Table: `identity_resolutions`. Source-row identity matches, candidates and explanations. Created at `supabase/migrations/202609280001_canonical_normalization.sql:773`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `IdentityResolutions`; adapter key: `identityResolutions`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/provenanceCanonical.ts:59` |
| key | text | no | key: string | `src/persistence/types/provenanceCanonical.ts:60` |
| sheet_key | text | no | sheetKey: string | `src/persistence/types/provenanceCanonical.ts:61` |
| source_row | integer | no | sourceRow: number | `src/persistence/types/provenanceCanonical.ts:62` |
| strategy | text | no | strategy: string | `src/persistence/types/provenanceCanonical.ts:63` |
| candidate_keys | jsonb | no | candidateKeys: Json | `src/persistence/types/provenanceCanonical.ts:64` |
| product_key | text | yes | productKey: string \| null | `src/persistence/types/provenanceCanonical.ts:65` |
| explanation | text | no | explanation: string | `src/persistence/types/provenanceCanonical.ts:66` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
sheet_key text not null references public.source_sheets(key),
source_row integer not null,
strategy text not null check (strategy in ('exact','semantic-key','g-number','plan-code','g-number+plan-code','multi-match','no-match')),
candidate_keys jsonb not null,
product_key text references public.products(key),
explanation text not null,
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(sheet_key) → public.source_sheets(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(product_key) → public.products(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `candidate_keys`, `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `candidate_keys` (0 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:786`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## maximum plan rules

Table: `maximum_plan_rules`. Limits on plan counts by product/site/applicant-role/category. Created at `supabase/migrations/202609280001_canonical_normalization.sql:558`. Current ownership: Site reference; client derived.

Contract: `MaximumPlanRules`; adapter key: `maximumPlanRules`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/underwritingCanonical.ts:71` |
| key | text | no | key: string | `src/persistence/types/underwritingCanonical.ts:72` |
| product_key | text | no | productKey: string | `src/persistence/types/underwritingCanonical.ts:73` |
| site_key | text | yes | siteKey: string \| null | `src/persistence/types/underwritingCanonical.ts:74` |
| applicant_type_key | text | no | applicantTypeKey: string | `src/persistence/types/underwritingCanonical.ts:75` |
| category_key | text | no | categoryKey: string | `src/persistence/types/underwritingCanonical.ts:76` |
| count | integer | no | count: number | `src/persistence/types/underwritingCanonical.ts:77` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
product_key text not null references public.products(key),
site_key text references public.sites(key),
applicant_type_key text not null references public.applicant_types(key),
category_key text not null references public.coverage_categories(key),
count integer not null check (count > 0),
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(product_key) → public.products(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(site_key) → public.sites(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(applicant_type_key) → public.applicant_types(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(category_key) → public.coverage_categories(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:570`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## migration schedules

Table: `migration_schedules`. Client migration milestones and expected dates. Created at `supabase/migrations/202610050001_migration_schedule.sql:2`. Current ownership: Client reference not enforced (F02).

Contract: `MigrationSchedule`; adapter key: `migrationSchedules`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/migrationSchedule.ts:15` |
| client_key | text | no | clientKey: string | `src/persistence/types/migrationSchedule.ts:16` |
| migrating | boolean | no | migrating: boolean | `src/persistence/types/migrationSchedule.ts:17` |
| milestones | jsonb | no | milestones: Record<"requirements" \| "prototype" \| "uat" \| "preprod" \| "production", MigrationMilestone> | `src/persistence/types/migrationSchedule.ts:18` |
| expected_date | date | yes | expectedDate: string \| null | `src/persistence/types/migrationSchedule.ts:19` |
| notes | text | no | notes: string | `src/persistence/types/migrationSchedule.ts:20` |
| created_at | timestamptz | no | createdAt: string | `src/persistence/types/common.ts:13` |
| updated_at | timestamptz | no | updatedAt: string | `src/persistence/types/common.ts:13` |

```sql
id text primary key,
client_key text not null unique,
migrating boolean not null default false,
milestones jsonb not null check (jsonb_typeof(milestones) = 'object'),
expected_date date,
notes text not null default '',
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
```

No foreign keys.

Unenforced reference or vocabulary candidates: `client_key`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `milestones` (0 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202610050001_migration_schedule.sql:12`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## organization profiles

Table: `organization_profiles`. Extended organization metadata. Created at `supabase/migrations/202609240003_portal_library.sql:5`. Current ownership: Organization via organization_key.

Contract: `LibraryRow<Omit<Tpa, "id">> & { organizationKey: string; }`; adapter key: `organizationProfiles`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/catalog.ts:4` |
| key | text | no | key: string | `src/persistence/types/catalog.ts:4` |
| position | integer | no | position: number | `src/persistence/types/catalog.ts:4` |
| organization_key | text | no | organizationKey: string | `src/persistence/types/library.ts:21` |
| definition | jsonb | no | definition: Omit<import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/organizations").Tpa, "id"> | `src/persistence/types/catalog.ts:4` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
organization_key text not null references public.organizations(key),
definition jsonb not null check (jsonb_typeof(definition) = 'object'),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text,
unique(organization_key)
```

Enforced foreign keys:

- `(organization_key) → public.organizations(key)`; required; unique child key; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `definition` (2 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:13`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:874`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## organizations

Table: `organizations`. Organization account roots, currently including TPAs. Created at `supabase/migrations/202609240001_initial_portal_schema.sql:9`. Current ownership: Organization account root.

Contract: `Organization`; adapter key: `organizations`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | uuid | no | id: string | `src/persistence/types/organization.ts:6` |
| key | text | no | key: string | `src/persistence/types/organization.ts:6` |
| name | text | no | name: string | `src/domain/organizations.ts:20` |
| type | text | no | type: string | `src/persistence/types/organization.ts:6` |
| status | record_status | no | status: RecordStatus | `src/persistence/types/organization.ts:6` |
| created_at | timestamptz | no | createdAt: string | `src/persistence/types/common.ts:13` |
| updated_at | timestamptz | no | updatedAt: string | `src/persistence/types/common.ts:13` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id uuid primary key default gen_random_uuid(),
key text not null unique,
name text not null,
type text not null,
status record_status not null default 'active',
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609240001_initial_portal_schema.sql:91`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:952`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## page fields

Table: `page_fields`. Ordered page-to-field composition. Created at `supabase/migrations/202609240003_portal_library.sql:49`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `PageFieldRow`; adapter key: `pageFields`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/template.ts:10` |
| key | text | no | key: string | `src/persistence/types/template.ts:10` |
| position | integer | no | position: number | `src/persistence/types/template.ts:10` |
| page_key | text | no | pageKey: string | `src/persistence/types/template.ts:10` |
| field_key | text | no | fieldKey: string | `src/persistence/types/template.ts:10` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
page_key text not null references public.pages(key),
field_key text not null references public.fields(key),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text,
unique(page_key, field_key),
unique(page_key, position)
```

Enforced foreign keys:

- `(page_key) → public.pages(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(field_key) → public.fields(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:58`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:884`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## page section fields

Table: `page_section_fields`. Field composition within page sections. Created at `supabase/migrations/202609280001_canonical_normalization.sql:732`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `PageSectionFields`; adapter key: `pageSectionFields`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/questionsCanonical.ts:35` |
| key | text | no | key: string | `src/persistence/types/questionsCanonical.ts:36` |
| section_key | text | no | sectionKey: string | `src/persistence/types/questionsCanonical.ts:37` |
| field_key | text | no | fieldKey: string | `src/persistence/types/questionsCanonical.ts:38` |
| position | integer | no | position: number | `src/persistence/types/questionsCanonical.ts:39` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
section_key text not null references public.page_sections(key),
field_key text not null references public.fields(key),
position integer not null,
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text,
unique(section_key,field_key)
```

Enforced foreign keys:

- `(section_key) → public.page_sections(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(field_key) → public.fields(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:743`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## page sections

Table: `page_sections`. Sections of catalog pages. Created at `supabase/migrations/202609240003_portal_library.sql:32`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `PageSectionRow`; adapter key: `pageSections`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/catalog.ts:4` |
| key | text | no | key: string | `src/persistence/types/catalog.ts:4` |
| position | integer | no | position: number | `src/persistence/types/catalog.ts:4` |
| page_key | text | no | pageKey: string | `src/persistence/types/template.ts:8` |
| definition | jsonb | no | definition: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/config/pageSections/types").PageSectionConfig | `src/persistence/types/catalog.ts:4` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
page_key text not null references public.pages(key),
definition jsonb not null check (jsonb_typeof(definition) = 'object'),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(page_key) → public.pages(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `definition` (5 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:39`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:880`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## pages

Table: `pages`. Page catalog and routing definitions. Created at `supabase/migrations/202609240003_portal_library.sql:24`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `PageRow`; adapter key: `pages`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/catalog.ts:4` |
| key | text | no | key: string | `src/persistence/types/catalog.ts:4` |
| position | integer | no | position: number | `src/persistence/types/catalog.ts:4` |
| definition | jsonb | no | definition: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/pages").Page & { healthGate: boolean; } | `src/persistence/types/catalog.ts:4` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
definition jsonb not null check (jsonb_typeof(definition) = 'object'),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text,
constraint pages_definition_contract check (
  coalesce(definition->>'id' = key and definition->>'flow' in ('application','resume','advisor','internal')
    and definition->>'type' in ('home','form','receipt','resume','internal')
    and definition->>'path' ~ '^/([^/?#[:space:]][^?#[:space:]]*)?$' and position >= 0, false)
)
```

Enforced foreign keys:

- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `definition` (4 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:30`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:878`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text
- `supabase/migrations/202610090001_page_catalog_contract.sql:58`: add constraint pages_definition_contract check (   coalesce(definition->>'id' = key and definition->>'flow' in ('application','resume','advisor','internal')     and definition->>'type' in ('home','form','receipt','resume','internal')     and definition->>'path' ~ '^/([^/?#[:space:]][^?#[:space:]]*)?$' and position >= 0, false) )

Indexes and triggers:

```sql
create unique index pages_route_unique on public.pages ((definition->>'path'));
```

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## pattern assignments

Table: `pattern_assignments`. Pattern configuration for optional client, site, product or applicant-role targets. Created at `supabase/migrations/202609280001_canonical_normalization.sql:245`. Current ownership: Site and client references; compatibility depends on composite FK or code (F03).

Contract: `PatternAssignments`; adapter key: `patternAssignments`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/patternsCanonical.ts:31` |
| key | text | no | key: string | `src/persistence/types/patternsCanonical.ts:32` |
| pattern_key | text | no | patternKey: string | `src/persistence/types/patternsCanonical.ts:33` |
| client_key | text | yes | clientKey: string \| null | `src/persistence/types/patternsCanonical.ts:34` |
| site_key | text | yes | siteKey: string \| null | `src/persistence/types/patternsCanonical.ts:35` |
| product_key | text | yes | productKey: string \| null | `src/persistence/types/patternsCanonical.ts:36` |
| applicant_key | text | yes | applicantKey: string \| null | `src/persistence/types/patternsCanonical.ts:37` |
| configuration | jsonb | no | configuration: Json | `src/persistence/types/patternsCanonical.ts:38` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
pattern_key text not null references public.patterns(key),
client_key text references public.clients(key),
site_key text references public.sites(key),
product_key text references public.products(key),
applicant_key text references public.applicant_types(key),
configuration jsonb not null,
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(pattern_key) → public.patterns(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(client_key) → public.clients(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(site_key) → public.sites(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(product_key) → public.products(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(applicant_key) → public.applicant_types(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `configuration` (3 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:258`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## pattern conditions

Table: `pattern_conditions`. Pattern-to-conditions composition with relationship type. Created at `supabase/migrations/202609280001_canonical_normalization.sql:273`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `PatternConditions`; adapter key: `patternConditions`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/patternsCanonical.ts:48` |
| key | text | no | key: string | `src/persistence/types/patternsCanonical.ts:49` |
| pattern_key | text | no | patternKey: string | `src/persistence/types/patternsCanonical.ts:50` |
| related_key | text | no | relatedKey: string | `src/persistence/types/patternsCanonical.ts:51` |
| relationship_type | text | no | relationshipType: string | `src/persistence/types/patternsCanonical.ts:52` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
pattern_key text not null references public.patterns(key),
related_key text not null references public.conditions(key),
relationship_type text not null check (relationship_type in ('implements','uses','constrains','triggers','documents')),
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text,
unique(pattern_key,related_key)
```

Enforced foreign keys:

- `(pattern_key) → public.patterns(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(related_key) → public.conditions(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `relationship_type`, `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:284`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## pattern configuration definitions

Table: `pattern_configuration_definitions`. Pattern-to-configuration definitions composition with relationship type. Created at `supabase/migrations/202609280001_canonical_normalization.sql:338`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `PatternConfigurationDefinitions`; adapter key: `patternConfigurationDefinitions`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/patternsCanonical.ts:83` |
| key | text | no | key: string | `src/persistence/types/patternsCanonical.ts:84` |
| pattern_key | text | no | patternKey: string | `src/persistence/types/patternsCanonical.ts:85` |
| related_key | text | no | relatedKey: string | `src/persistence/types/patternsCanonical.ts:86` |
| relationship_type | text | no | relationshipType: string | `src/persistence/types/patternsCanonical.ts:87` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
pattern_key text not null references public.patterns(key),
related_key text not null references public.configuration_definitions(key),
relationship_type text not null check (relationship_type in ('implements','uses','constrains','triggers','documents')),
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text,
unique(pattern_key,related_key)
```

Enforced foreign keys:

- `(pattern_key) → public.patterns(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(related_key) → public.configuration_definitions(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `relationship_type`, `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:349`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## pattern coverage categories

Table: `pattern_coverage_categories`. Pattern-to-coverage categories composition with relationship type. Created at `supabase/migrations/202609280001_canonical_normalization.sql:325`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `PatternCoverageCategories`; adapter key: `patternCoverageCategories`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/patternsCanonical.ts:76` |
| key | text | no | key: string | `src/persistence/types/patternsCanonical.ts:77` |
| pattern_key | text | no | patternKey: string | `src/persistence/types/patternsCanonical.ts:78` |
| related_key | text | no | relatedKey: string | `src/persistence/types/patternsCanonical.ts:79` |
| relationship_type | text | no | relationshipType: string | `src/persistence/types/patternsCanonical.ts:80` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
pattern_key text not null references public.patterns(key),
related_key text not null references public.coverage_categories(key),
relationship_type text not null check (relationship_type in ('implements','uses','constrains','triggers','documents')),
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text,
unique(pattern_key,related_key)
```

Enforced foreign keys:

- `(pattern_key) → public.patterns(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(related_key) → public.coverage_categories(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `relationship_type`, `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:336`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## pattern flag definitions

Table: `pattern_flag_definitions`. Pattern-to-flag definitions composition with relationship type. Created at `supabase/migrations/202609280001_canonical_normalization.sql:286`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `PatternFlagDefinitions`; adapter key: `patternFlagDefinitions`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/patternsCanonical.ts:55` |
| key | text | no | key: string | `src/persistence/types/patternsCanonical.ts:56` |
| pattern_key | text | no | patternKey: string | `src/persistence/types/patternsCanonical.ts:57` |
| related_key | text | no | relatedKey: string | `src/persistence/types/patternsCanonical.ts:58` |
| relationship_type | text | no | relationshipType: string | `src/persistence/types/patternsCanonical.ts:59` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
pattern_key text not null references public.patterns(key),
related_key text not null references public.flag_definitions(key),
relationship_type text not null check (relationship_type in ('implements','uses','constrains','triggers','documents')),
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text,
unique(pattern_key,related_key)
```

Enforced foreign keys:

- `(pattern_key) → public.patterns(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(related_key) → public.flag_definitions(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `relationship_type`, `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:297`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## pattern flows

Table: `pattern_flows`. Pattern-to-flows composition with relationship type. Created at `supabase/migrations/202609280001_canonical_normalization.sql:299`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `PatternFlows`; adapter key: `patternFlows`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/patternsCanonical.ts:62` |
| key | text | no | key: string | `src/persistence/types/patternsCanonical.ts:63` |
| pattern_key | text | no | patternKey: string | `src/persistence/types/patternsCanonical.ts:64` |
| related_key | text | no | relatedKey: string | `src/persistence/types/patternsCanonical.ts:65` |
| relationship_type | text | no | relationshipType: string | `src/persistence/types/patternsCanonical.ts:66` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
pattern_key text not null references public.patterns(key),
related_key text not null references public.flows(key),
relationship_type text not null check (relationship_type in ('implements','uses','constrains','triggers','documents')),
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text,
unique(pattern_key,related_key)
```

Enforced foreign keys:

- `(pattern_key) → public.patterns(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(related_key) → public.flows(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `relationship_type`, `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:310`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## pattern products

Table: `pattern_products`. Pattern-to-products composition with relationship type. Created at `supabase/migrations/202609280001_canonical_normalization.sql:312`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `PatternProducts`; adapter key: `patternProducts`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/patternsCanonical.ts:69` |
| key | text | no | key: string | `src/persistence/types/patternsCanonical.ts:70` |
| pattern_key | text | no | patternKey: string | `src/persistence/types/patternsCanonical.ts:71` |
| related_key | text | no | relatedKey: string | `src/persistence/types/patternsCanonical.ts:72` |
| relationship_type | text | no | relationshipType: string | `src/persistence/types/patternsCanonical.ts:73` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
pattern_key text not null references public.patterns(key),
related_key text not null references public.products(key),
relationship_type text not null check (relationship_type in ('implements','uses','constrains','triggers','documents')),
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text,
unique(pattern_key,related_key)
```

Enforced foreign keys:

- `(pattern_key) → public.patterns(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(related_key) → public.products(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `relationship_type`, `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:323`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## pattern question sets

Table: `pattern_question_sets`. Pattern-to-question sets composition with relationship type. Created at `supabase/migrations/202609280001_canonical_normalization.sql:841`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `PatternQuestionSets`; adapter key: `patternQuestionSets`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/patternsCanonical.ts:90` |
| key | text | no | key: string | `src/persistence/types/patternsCanonical.ts:91` |
| pattern_key | text | no | patternKey: string | `src/persistence/types/patternsCanonical.ts:92` |
| related_key | text | no | relatedKey: string | `src/persistence/types/patternsCanonical.ts:93` |
| relationship_type | text | no | relationshipType: string | `src/persistence/types/patternsCanonical.ts:94` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
pattern_key text not null references public.patterns(key),
related_key text not null references public.question_sets(key),
relationship_type text not null check (relationship_type in ('implements','uses','constrains','triggers','documents')),
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text,
unique(pattern_key,related_key)
```

Enforced foreign keys:

- `(pattern_key) → public.patterns(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(related_key) → public.question_sets(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `relationship_type`, `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:852`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## pattern rules

Table: `pattern_rules`. Pattern-to-rules composition with relationship type. Created at `supabase/migrations/202609280001_canonical_normalization.sql:260`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `PatternRules`; adapter key: `patternRules`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/patternsCanonical.ts:41` |
| key | text | no | key: string | `src/persistence/types/patternsCanonical.ts:42` |
| pattern_key | text | no | patternKey: string | `src/persistence/types/patternsCanonical.ts:43` |
| related_key | text | no | relatedKey: string | `src/persistence/types/patternsCanonical.ts:44` |
| relationship_type | text | no | relationshipType: string | `src/persistence/types/patternsCanonical.ts:45` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
pattern_key text not null references public.patterns(key),
related_key text not null references public.rules(key),
relationship_type text not null check (relationship_type in ('implements','uses','constrains','triggers','documents')),
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text,
unique(pattern_key,related_key)
```

Enforced foreign keys:

- `(pattern_key) → public.patterns(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(related_key) → public.rules(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `relationship_type`, `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:271`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## patterns

Table: `patterns`. Reusable behavior pattern catalog. Created at `supabase/migrations/202609280001_canonical_normalization.sql:57`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `Patterns`; adapter key: `patterns`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/patternsCanonical.ts:5` |
| key | text | no | key: string | `src/persistence/types/patternsCanonical.ts:6` |
| name | text | no | name: string | `src/persistence/types/patternsCanonical.ts:7` |
| category | text | no | category: string | `src/persistence/types/patternsCanonical.ts:8` |
| description | text | no | description: string | `src/persistence/types/patternsCanonical.ts:9` |
| version | text | yes | version: string \| null | `src/persistence/types/patternsCanonical.ts:10` |
| status | text | no | status: string | `src/persistence/types/patternsCanonical.ts:11` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
name text not null,
category text not null,
description text not null,
version text,
status text not null check (status in ('draft','active','deprecated')),
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:69`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## plan amount rules

Table: `plan_amount_rules`. Conditional amount strategies on plan variants. Created at `supabase/migrations/202609280001_canonical_normalization.sql:829`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `PlanAmountRules`; adapter key: `planAmountRules`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/coverageNormalizationCanonical.ts:32` |
| key | text | no | key: string | `src/persistence/types/coverageNormalizationCanonical.ts:33` |
| variant_key | text | no | variantKey: string | `src/persistence/types/coverageNormalizationCanonical.ts:34` |
| amount_pattern_key | text | no | amountPatternKey: string | `src/persistence/types/coverageNormalizationCanonical.ts:35` |
| condition_key | text | yes | conditionKey: string \| null | `src/persistence/types/coverageNormalizationCanonical.ts:36` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
variant_key text not null references public.coverage_plan_variants(key),
amount_pattern_key text not null references public.coverage_amount_patterns(key),
condition_key text references public.conditions(key),
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(variant_key) → public.coverage_plan_variants(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(amount_pattern_key) → public.coverage_amount_patterns(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(condition_key) → public.conditions(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:839`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## plan benefit periods

Table: `plan_benefit_periods`. Waiting/benefit durations on plan variants. Created at `supabase/migrations/202609280001_canonical_normalization.sql:231`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `PlanBenefitPeriods`; adapter key: `planBenefitPeriods`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/coverageNormalizationCanonical.ts:46` |
| key | text | no | key: string | `src/persistence/types/coverageNormalizationCanonical.ts:47` |
| variant_key | text | no | variantKey: string | `src/persistence/types/coverageNormalizationCanonical.ts:48` |
| kind | text | no | kind: string | `src/persistence/types/coverageNormalizationCanonical.ts:49` |
| value | numeric | no | value: number | `src/persistence/types/coverageNormalizationCanonical.ts:50` |
| unit | text | no | unit: string | `src/persistence/types/coverageNormalizationCanonical.ts:51` |
| position | integer | no | position: number | `src/persistence/types/coverageNormalizationCanonical.ts:52` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
variant_key text not null references public.coverage_plan_variants(key),
kind text not null check (kind in ('waiting','benefit')),
value numeric not null,
unit text not null check (unit in ('days','months','years')),
position integer not null,
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(variant_key) → public.coverage_plan_variants(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:243`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## portal admin accounts

Table: `portal_admin_accounts`. Approved Supabase authentication identities for publication administration. Created at `supabase/migrations/202610020001_library_publication.sql:3`. Current ownership: Identity/access record; public users and auth.users are separate (F07).

No DatabaseSchema collection or generic adapter mapping. Publication RPCs and trusted service writes access this table. No ordinary demo seed rows.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| user_id | uuid | no | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:3` |
| username | text | no | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:3` |
| active | boolean | no | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:3` |

```sql
user_id uuid primary key references auth.users(id),
username text not null unique check (username = 'caroline'),
active boolean not null default true
```

Enforced foreign keys:

- `(user_id) → auth.users(id)`; required; unique child key; delete NO ACTION; update NO ACTION.

Additive migration history:

- `supabase/migrations/202610020001_library_publication.sql:58`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## portal library drafts

Table: `portal_library_drafts`. Versioned site configuration drafts owned by an auth identity. Created at `supabase/migrations/202610020001_library_publication.sql:8`. Current ownership: Site reference; client derived.

No DatabaseSchema collection or generic adapter mapping. Publication RPCs and trusted service writes access this table. No ordinary demo seed rows.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | uuid | no | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:8` |
| site_key | text | no | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:8` |
| owner_id | uuid | no | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:8` |
| edit_version | integer | no | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:8` |
| base_release_id | uuid | yes | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:8` |
| payload | jsonb | no | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:8` |
| payload_hash | text | no | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:8` |
| updated_at | timestamptz | no | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:8` |

```sql
id uuid primary key default gen_random_uuid(),
site_key text not null references public.sites(key),
owner_id uuid not null references auth.users(id),
edit_version integer not null default 1,
base_release_id uuid,
payload jsonb not null check (jsonb_typeof(payload) = 'object'),
payload_hash text not null,
updated_at timestamptz not null default now(),
constraint portal_draft_base_release foreign key (base_release_id) references public.portal_library_releases(id)
```

Enforced foreign keys:

- `(site_key) → public.sites(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(owner_id) → auth.users(id)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(base_release_id) → public.portal_library_releases(id)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

JSON surfaces: `payload` (0 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202610020001_library_publication.sql:34`: add constraint portal_draft_base_release foreign key (base_release_id) references public.portal_library_releases(id)
- `supabase/migrations/202610020001_library_publication.sql:59`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## portal library heads

Table: `portal_library_heads`. Current published release pointer and generation per site. Created at `supabase/migrations/202610020001_library_publication.sql:29`. Current ownership: Site reference; client derived.

No DatabaseSchema collection or generic adapter mapping. Publication RPCs and trusted service writes access this table. No ordinary demo seed rows.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| site_key | text | no | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:29` |
| release_id | uuid | yes | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:29` |
| generation | integer | no | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:29` |

```sql
site_key text primary key references public.sites(key),
release_id uuid references public.portal_library_releases(id),
generation integer not null default 0
```

Enforced foreign keys:

- `(site_key) → public.sites(key)`; required; unique child key; delete NO ACTION; update NO ACTION.
- `(release_id) → public.portal_library_releases(id)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Additive migration history:

- `supabase/migrations/202610020001_library_publication.sql:61`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## portal library publication audit

Table: `portal_library_publication_audit`. Auth actor and draft/release history of publication actions. Created at `supabase/migrations/202610020001_library_publication.sql:47`. Current ownership: Site reference; client derived.

No DatabaseSchema collection or generic adapter mapping. Publication RPCs and trusted service writes access this table. No ordinary demo seed rows.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | uuid | no | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:47` |
| site_key | text | no | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:47` |
| action | text | no | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:47` |
| actor_id | uuid | no | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:47` |
| draft_id | uuid | yes | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:47` |
| previous_release_id | uuid | yes | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:47` |
| release_id | uuid | yes | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:47` |
| occurred_at | timestamptz | no | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:47` |

```sql
id uuid primary key default gen_random_uuid(),
site_key text not null references public.sites(key),
action text not null check (action in ('save-draft','publish','rollback')),
actor_id uuid not null references auth.users(id),
draft_id uuid references public.portal_library_drafts(id),
previous_release_id uuid references public.portal_library_releases(id),
release_id uuid references public.portal_library_releases(id),
occurred_at timestamptz not null default now()
```

Enforced foreign keys:

- `(site_key) → public.sites(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(actor_id) → auth.users(id)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(draft_id) → public.portal_library_drafts(id)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(previous_release_id) → public.portal_library_releases(id)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(release_id) → public.portal_library_releases(id)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Additive migration history:

- `supabase/migrations/202610020001_library_publication.sql:63`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## portal library readiness

Table: `portal_library_readiness`. Service-written readiness evidence bound to site and payload hash. Created at `supabase/migrations/202610020001_library_publication.sql:35`. Current ownership: Site reference; client derived.

No DatabaseSchema collection or generic adapter mapping. Publication RPCs and trusted service writes access this table. No ordinary demo seed rows.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| site_key | text | no | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:35` |
| payload_hash | text | no | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:35` |
| domain | text | no | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:35` |
| result | text | no | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:35` |
| evidence_reference | text | no | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:35` |
| verified_at | timestamptz | no | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:35` |
| valid_until | timestamptz | no | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:35` |

```sql
site_key text not null references public.sites(key),
payload_hash text not null,
domain text not null check (domain in ('migration','parity','rates','payments','analytics','submission','admin-recovery')),
result text not null check (result in ('passed','approved-unavailable')),
evidence_reference text not null check (length(trim(evidence_reference)) > 0),
verified_at timestamptz not null default now(),
valid_until timestamptz not null,
primary key(site_key, payload_hash, domain),
check (valid_until > verified_at),
check (result = 'passed' or domain = 'rates')
```

Enforced foreign keys:

- `(site_key) → public.sites(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `evidence_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202610020001_library_publication.sql:62`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## portal library releases

Table: `portal_library_releases`. Published site configuration payloads and publisher identity. Created at `supabase/migrations/202610020001_library_publication.sql:18`. Current ownership: Site reference; client derived.

No DatabaseSchema collection or generic adapter mapping. Publication RPCs and trusted service writes access this table. No ordinary demo seed rows.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | uuid | no | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:18` |
| site_key | text | no | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:18` |
| version | integer | no | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:18` |
| draft_id | uuid | no | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:18` |
| payload | jsonb | no | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:18` |
| payload_hash | text | no | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:18` |
| published_by | uuid | no | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:18` |
| published_at | timestamptz | no | RPC only / absent | `supabase/migrations/202610020001_library_publication.sql:18` |

```sql
id uuid primary key default gen_random_uuid(),
site_key text not null references public.sites(key),
version integer not null,
draft_id uuid not null references public.portal_library_drafts(id),
payload jsonb not null,
payload_hash text not null,
published_by uuid not null references auth.users(id),
published_at timestamptz not null default now(),
unique(site_key, version)
```

Enforced foreign keys:

- `(site_key) → public.sites(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(draft_id) → public.portal_library_drafts(id)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(published_by) → auth.users(id)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.

JSON surfaces: `payload` (0 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202610020001_library_publication.sql:60`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## product amount rules

Table: `product_amount_rules`. Conditional amount strategy for product and optional role/tenant. Created at `supabase/migrations/202609280001_canonical_normalization.sql:400`. Current ownership: Site and client references; compatibility depends on composite FK or code (F03).

Contract: `ProductAmountRules`; adapter key: `productAmountRules`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/coverageNormalizationCanonical.ts:87` |
| key | text | no | key: string | `src/persistence/types/coverageNormalizationCanonical.ts:88` |
| product_key | text | no | productKey: string | `src/persistence/types/coverageNormalizationCanonical.ts:89` |
| applicant_type_key | text | yes | applicantTypeKey: string \| null | `src/persistence/types/coverageNormalizationCanonical.ts:90` |
| applicant_class | text | yes | applicantClass: string \| null | `src/persistence/types/coverageNormalizationCanonical.ts:91` |
| amount_pattern_key | text | no | amountPatternKey: string | `src/persistence/types/coverageNormalizationCanonical.ts:92` |
| condition_key | text | yes | conditionKey: string \| null | `src/persistence/types/coverageNormalizationCanonical.ts:93` |
| client_key | text | yes | clientKey: string \| null | `src/persistence/types/coverageNormalizationCanonical.ts:94` |
| site_key | text | yes | siteKey: string \| null | `src/persistence/types/coverageNormalizationCanonical.ts:95` |
| position | integer | no | position: number | `src/persistence/types/coverageNormalizationCanonical.ts:96` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
product_key text not null references public.products(key),
applicant_type_key text references public.applicant_types(key),
applicant_class text,
amount_pattern_key text not null references public.coverage_amount_patterns(key),
condition_key text references public.conditions(key),
client_key text references public.clients(key),
site_key text references public.sites(key),
position integer not null,
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(product_key) → public.products(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(applicant_type_key) → public.applicant_types(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(amount_pattern_key) → public.coverage_amount_patterns(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(condition_key) → public.conditions(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(client_key) → public.clients(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(site_key) → public.sites(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:415`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## product applicant eligibility

Table: `product_applicant_eligibility`. Product applicant-role eligibility with optional site/condition. Created at `supabase/migrations/202609280001_canonical_normalization.sql:417`. Current ownership: Site reference; client derived.

Contract: `ProductApplicantEligibility`; adapter key: `productApplicantEligibility`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/coverageNormalizationCanonical.ts:99` |
| key | text | no | key: string | `src/persistence/types/coverageNormalizationCanonical.ts:100` |
| product_key | text | no | productKey: string | `src/persistence/types/coverageNormalizationCanonical.ts:101` |
| applicant_type_key | text | no | applicantTypeKey: string | `src/persistence/types/coverageNormalizationCanonical.ts:102` |
| site_key | text | yes | siteKey: string \| null | `src/persistence/types/coverageNormalizationCanonical.ts:103` |
| eligible | boolean | no | eligible: boolean | `src/persistence/types/coverageNormalizationCanonical.ts:104` |
| condition_key | text | yes | conditionKey: string \| null | `src/persistence/types/coverageNormalizationCanonical.ts:105` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
product_key text not null references public.products(key),
applicant_type_key text not null references public.applicant_types(key),
site_key text references public.sites(key),
eligible boolean not null,
condition_key text references public.conditions(key),
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(product_key) → public.products(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(applicant_type_key) → public.applicant_types(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(site_key) → public.sites(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(condition_key) → public.conditions(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:429`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## product clients

Table: `product_clients`. Products available to clients. Created at `supabase/migrations/202609280001_canonical_normalization.sql:183`. Current ownership: Client reference.

Contract: `ProductClients`; adapter key: `productClients`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/coverageNormalizationCanonical.ts:12` |
| key | text | no | key: string | `src/persistence/types/coverageNormalizationCanonical.ts:13` |
| product_key | text | no | productKey: string | `src/persistence/types/coverageNormalizationCanonical.ts:14` |
| client_key | text | no | clientKey: string | `src/persistence/types/coverageNormalizationCanonical.ts:15` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
product_key text not null references public.products(key),
client_key text not null references public.clients(key),
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text,
unique(product_key,client_key)
```

Enforced foreign keys:

- `(product_key) → public.products(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(client_key) → public.clients(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:193`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## product configuration values

Table: `product_configuration_values`. Product-specific configuration values. Created at `supabase/migrations/202609280001_canonical_normalization.sql:171`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `ProductConfigurationValues`; adapter key: `productConfigurationValues`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/coverageNormalizationCanonical.ts:5` |
| key | text | no | key: string | `src/persistence/types/coverageNormalizationCanonical.ts:6` |
| product_key | text | no | productKey: string | `src/persistence/types/coverageNormalizationCanonical.ts:7` |
| configuration_key | text | no | configurationKey: string | `src/persistence/types/coverageNormalizationCanonical.ts:8` |
| value | jsonb | no | value: Json | `src/persistence/types/coverageNormalizationCanonical.ts:9` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
product_key text not null references public.products(key),
configuration_key text not null references public.configuration_definitions(key),
value jsonb not null,
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(product_key) → public.products(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(configuration_key) → public.configuration_definitions(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `value` (0 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:181`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## product coverage plans

Table: `product_coverage_plans`. Product-to-plan and applicant-role assignments. Created at `supabase/migrations/202609280001_canonical_normalization.sql:219`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `ProductCoveragePlans`; adapter key: `productCoveragePlans`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/coverageNormalizationCanonical.ts:39` |
| key | text | no | key: string | `src/persistence/types/coverageNormalizationCanonical.ts:40` |
| product_key | text | no | productKey: string | `src/persistence/types/coverageNormalizationCanonical.ts:41` |
| plan_key | text | no | planKey: string | `src/persistence/types/coverageNormalizationCanonical.ts:42` |
| applicant_type_key | text | no | applicantTypeKey: string | `src/persistence/types/coverageNormalizationCanonical.ts:43` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
product_key text not null references public.products(key),
plan_key text not null references public.coverage_plan_definitions(key),
applicant_type_key text not null references public.applicant_types(key),
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(product_key) → public.products(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(plan_key) → public.coverage_plan_definitions(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(applicant_type_key) → public.applicant_types(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:229`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## product identifiers

Table: `product_identifiers`. Scoped product identifiers such as G number and plan code. Created at `supabase/migrations/202609240003_portal_library.sql:99`. Current ownership: Global/client/site according to scope; see CHECK for required target.

Contract: `ProductIdentifierRow`; adapter key: `productIdentifiers`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/catalog.ts:4` |
| key | text | no | key: string | `src/persistence/types/catalog.ts:4` |
| position | integer | no | position: number | `src/persistence/types/catalog.ts:4` |
| product_key | text | no | productKey: string | `src/persistence/types/coverage.ts:12` |
| kind | text | no | kind: "gNumber" \| "planCode" | `src/persistence/types/coverage.ts:12` |
| definition | jsonb | no | definition: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/persistence/types").Json | `src/persistence/types/catalog.ts:4` |
| scope | text | no | scope: "global" \| "client" \| "site" | `src/persistence/types/catalog.ts:5` |
| client_key | text | yes | clientKey: string \| null | `src/persistence/types/catalog.ts:5` |
| site_key | text | yes | siteKey: string \| null | `src/persistence/types/catalog.ts:5` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
product_key text not null references public.products(key),
kind text not null check (kind in ('gNumber','planCode')),
definition jsonb not null check (jsonb_typeof(definition) = 'object'),
scope text not null check (scope in ('global','client','site')),
client_key text references public.clients(key),
site_key text references public.sites(key),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text,
unique nulls not distinct(product_key, kind, scope, client_key, site_key),
check ((scope = 'global' and client_key is null and site_key is null) or (scope = 'client' and client_key is not null and site_key is null) or (scope = 'site' and site_key is not null and client_key is null))
```

Enforced foreign keys:

- `(product_key) → public.products(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(client_key) → public.clients(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(site_key) → public.sites(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `definition` (0 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:112`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:894`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## product question sets

Table: `product_question_sets`. Product question-set assignments with optional applicant-role. Created at `supabase/migrations/202609280001_canonical_normalization.sql:816`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `ProductQuestionSets`; adapter key: `productQuestionSets`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/questionsCanonical.ts:42` |
| key | text | no | key: string | `src/persistence/types/questionsCanonical.ts:43` |
| product_key | text | no | productKey: string | `src/persistence/types/questionsCanonical.ts:44` |
| question_set_key | text | no | questionSetKey: string | `src/persistence/types/questionsCanonical.ts:45` |
| applicant_type_key | text | yes | applicantTypeKey: string \| null | `src/persistence/types/questionsCanonical.ts:46` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
product_key text not null references public.products(key),
question_set_key text not null references public.question_sets(key),
applicant_type_key text references public.applicant_types(key),
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text,
unique nulls not distinct(product_key,question_set_key,applicant_type_key)
```

Enforced foreign keys:

- `(product_key) → public.products(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(question_set_key) → public.question_sets(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(applicant_type_key) → public.applicant_types(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:827`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## product rate tables

Table: `product_rate_tables`. Conditional product/site assignment of rate tables. Created at `supabase/migrations/202609280001_canonical_normalization.sql:655`. Current ownership: Site reference; client derived.

Contract: `ProductRateTables`; adapter key: `productRateTables`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/ratesCanonical.ts:14` |
| key | text | no | key: string | `src/persistence/types/ratesCanonical.ts:15` |
| product_key | text | no | productKey: string | `src/persistence/types/ratesCanonical.ts:16` |
| rate_table_key | text | no | rateTableKey: string | `src/persistence/types/ratesCanonical.ts:17` |
| site_key | text | yes | siteKey: string \| null | `src/persistence/types/ratesCanonical.ts:18` |
| condition_key | text | yes | conditionKey: string \| null | `src/persistence/types/ratesCanonical.ts:19` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
product_key text not null references public.products(key),
rate_table_key text not null references public.rate_tables(key),
site_key text references public.sites(key),
condition_key text references public.conditions(key),
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(product_key) → public.products(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(rate_table_key) → public.rate_tables(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(site_key) → public.sites(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(condition_key) → public.conditions(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:666`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## product riders

Table: `product_riders`. Scoped product-to-rider assignments. Created at `supabase/migrations/202609240003_portal_library.sql:85`. Current ownership: Global/client/site according to scope; see CHECK for required target.

Contract: `ProductRiderRow`; adapter key: `productRiders`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/coverage.ts:11` |
| key | text | no | key: string | `src/persistence/types/coverage.ts:11` |
| position | integer | no | position: number | `src/persistence/types/coverage.ts:11` |
| product_key | text | no | productKey: string | `src/persistence/types/coverage.ts:11` |
| rider_key | text | no | riderKey: string | `src/persistence/types/coverage.ts:11` |
| scope | text | no | scope: "global" \| "client" \| "site" | `src/persistence/types/catalog.ts:5` |
| client_key | text | yes | clientKey: string \| null | `src/persistence/types/catalog.ts:5` |
| site_key | text | yes | siteKey: string \| null | `src/persistence/types/catalog.ts:5` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
product_key text not null references public.products(key),
rider_key text not null references public.riders(key),
scope text not null check (scope in ('global','client','site')),
client_key text references public.clients(key),
site_key text references public.sites(key),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text,
unique nulls not distinct(product_key, rider_key, scope, client_key, site_key),
check ((scope = 'global' and client_key is null and site_key is null) or (scope = 'client' and client_key is not null and site_key is null) or (scope = 'site' and site_key is not null and client_key is null))
```

Enforced foreign keys:

- `(product_key) → public.products(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(rider_key) → public.riders(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(client_key) → public.clients(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(site_key) → public.sites(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:97`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:892`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## products

Table: `products`. Products classified by coverage category. Created at `supabase/migrations/202609240003_portal_library.sql:68`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `ProductRow`; adapter key: `products`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/catalog.ts:4` |
| key | text | no | key: string | `src/persistence/types/catalog.ts:4` |
| position | integer | no | position: number | `src/persistence/types/catalog.ts:4` |
| category_key | text | no | categoryKey: string | `src/persistence/types/coverage.ts:8` |
| definition | jsonb | no | definition: Omit<import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/coverage").CoverageDefinition, "riders" \| "gNumber" \| "planCode" \| "categoryId" \| "code"> & { categoryId: string; code: string \| null; } | `src/persistence/types/catalog.ts:4` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
category_key text not null references public.coverage_categories(key),
definition jsonb not null check (jsonb_typeof(definition) = 'object'),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(category_key) → public.coverage_categories(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `definition` (6 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:75`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:888`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## provenance tags

Table: `provenance_tags`. Controlled provider/evidence vocabulary. Created at `supabase/migrations/202609280001_canonical_normalization.sql:3`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `ProvenanceTags`; adapter key: `provenanceTags`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/provenanceCanonical.ts:5` |
| key | text | no | key: string | `src/persistence/types/provenanceCanonical.ts:6` |
| name | text | no | name: string | `src/persistence/types/provenanceCanonical.ts:7` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
name text not null,
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:11`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## question definitions

Table: `question_definitions`. Individual questions, response type and status. Created at `supabase/migrations/202609280001_canonical_normalization.sql:602`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `QuestionDefinitions`; adapter key: `questionDefinitions`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/questionsCanonical.ts:12` |
| key | text | no | key: string | `src/persistence/types/questionsCanonical.ts:13` |
| text | text | no | text: string | `src/persistence/types/questionsCanonical.ts:14` |
| response_type | text | yes | responseType: string \| null | `src/persistence/types/questionsCanonical.ts:15` |
| status | text | no | status: string | `src/persistence/types/questionsCanonical.ts:16` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
text text not null,
response_type text,
status text not null check (status in ('documented','unresolved')),
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `response_type`, `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:612`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## question set fields

Table: `question_set_fields`. Ordered conditional field membership in question sets. Created at `supabase/migrations/202609280001_canonical_normalization.sql:627`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `QuestionSetFields`; adapter key: `questionSetFields`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/questionsCanonical.ts:27` |
| key | text | no | key: string | `src/persistence/types/questionsCanonical.ts:28` |
| question_set_key | text | no | questionSetKey: string | `src/persistence/types/questionsCanonical.ts:29` |
| field_key | text | no | fieldKey: string | `src/persistence/types/questionsCanonical.ts:30` |
| position | integer | no | position: number | `src/persistence/types/questionsCanonical.ts:31` |
| condition_key | text | yes | conditionKey: string \| null | `src/persistence/types/questionsCanonical.ts:32` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
question_set_key text not null references public.question_sets(key),
field_key text not null references public.fields(key),
position integer not null,
condition_key text references public.conditions(key),
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(question_set_key) → public.question_sets(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(field_key) → public.fields(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(condition_key) → public.conditions(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:638`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## question set questions

Table: `question_set_questions`. Ordered conditional question membership in sets. Created at `supabase/migrations/202609280001_canonical_normalization.sql:614`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `QuestionSetQuestions`; adapter key: `questionSetQuestions`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/questionsCanonical.ts:19` |
| key | text | no | key: string | `src/persistence/types/questionsCanonical.ts:20` |
| question_set_key | text | no | questionSetKey: string | `src/persistence/types/questionsCanonical.ts:21` |
| question_key | text | no | questionKey: string | `src/persistence/types/questionsCanonical.ts:22` |
| position | integer | no | position: number | `src/persistence/types/questionsCanonical.ts:23` |
| condition_key | text | yes | conditionKey: string \| null | `src/persistence/types/questionsCanonical.ts:24` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
question_set_key text not null references public.question_sets(key),
question_key text not null references public.question_definitions(key),
position integer not null,
condition_key text references public.conditions(key),
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(question_set_key) → public.question_sets(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(question_key) → public.question_definitions(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(condition_key) → public.conditions(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:625`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## question sets

Table: `question_sets`. Versioned question group definitions. Created at `supabase/migrations/202609280001_canonical_normalization.sql:589`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `QuestionSets`; adapter key: `questionSets`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/questionsCanonical.ts:4` |
| key | text | no | key: string | `src/persistence/types/questionsCanonical.ts:5` |
| name | text | no | name: string | `src/persistence/types/questionsCanonical.ts:6` |
| question_type | text | no | questionType: string | `src/persistence/types/questionsCanonical.ts:7` |
| version | text | yes | version: string \| null | `src/persistence/types/questionsCanonical.ts:8` |
| description | text | yes | description: string \| null | `src/persistence/types/questionsCanonical.ts:9` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
name text not null,
question_type text not null,
version text,
description text,
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `question_type`, `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:600`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## rate table presentations

Table: `rate_table_presentations`. Rate table placement/display mode by site/product/flag. Created at `supabase/migrations/202609280001_canonical_normalization.sql:668`. Current ownership: Site reference; client derived.

Contract: `RateTablePresentations`; adapter key: `rateTablePresentations`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/ratesCanonical.ts:22` |
| key | text | no | key: string | `src/persistence/types/ratesCanonical.ts:23` |
| rate_table_key | text | no | rateTableKey: string | `src/persistence/types/ratesCanonical.ts:24` |
| site_key | text | yes | siteKey: string \| null | `src/persistence/types/ratesCanonical.ts:25` |
| product_key | text | yes | productKey: string \| null | `src/persistence/types/ratesCanonical.ts:26` |
| placement | text | no | placement: string | `src/persistence/types/ratesCanonical.ts:27` |
| mode | text | no | mode: string | `src/persistence/types/ratesCanonical.ts:28` |
| enabled | boolean | no | enabled: boolean | `src/persistence/types/ratesCanonical.ts:29` |
| flag_key | text | yes | flagKey: string \| null | `src/persistence/types/ratesCanonical.ts:30` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
rate_table_key text not null references public.rate_tables(key),
site_key text references public.sites(key),
product_key text references public.products(key),
placement text not null check (placement in ('estimated-cost','product-card')),
mode text not null check (mode in ('inline','link')),
enabled boolean not null,
flag_key text references public.flag_definitions(key),
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(rate_table_key) → public.rate_tables(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(site_key) → public.sites(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(product_key) → public.products(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(flag_key) → public.flag_definitions(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:682`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## rate tables

Table: `rate_tables`. Rate table content and external assets. Created at `supabase/migrations/202609280001_canonical_normalization.sql:640`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `RateTables`; adapter key: `rateTables`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/ratesCanonical.ts:4` |
| key | text | no | key: string | `src/persistence/types/ratesCanonical.ts:5` |
| name | text | no | name: string | `src/persistence/types/ratesCanonical.ts:6` |
| format | text | no | format: string | `src/persistence/types/ratesCanonical.ts:7` |
| content | text | yes | content: string \| null | `src/persistence/types/ratesCanonical.ts:8` |
| url | text | yes | url: string \| null | `src/persistence/types/ratesCanonical.ts:9` |
| image_ref | text | yes | imageRef: string \| null | `src/persistence/types/ratesCanonical.ts:10` |
| source_system | text | yes | sourceSystem: string \| null | `src/persistence/types/ratesCanonical.ts:11` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
name text not null,
format text not null check (format in ('html','url','image')),
content text,
url text,
image_ref text,
source_system text,
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `url`, `image_ref`, `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:653`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## release changes

Table: `release_changes`. Release-to-change request assignments. Created at `supabase/migrations/202609240001_initial_portal_schema.sql:66`. Current ownership: Portal operations; entity/site scope only where a column provides it.

Contract: `ReleaseChange`; adapter key: `releaseChanges`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | uuid | no | id: string | `src/persistence/types/operations.ts:29` |
| release_id | uuid | no | releaseId: string | `src/persistence/types/operations.ts:29` |
| change_request_id | uuid | no | changeRequestId: string | `src/persistence/types/operations.ts:29` |
| created_at | timestamptz | no | createdAt: string | `src/persistence/types/operations.ts:29` |

```sql
id uuid primary key default gen_random_uuid(),
release_id uuid not null references public.releases on delete cascade,
change_request_id uuid not null references public.change_requests on delete cascade,
created_at timestamptz not null default now(),
unique(release_id, change_request_id)
```

Enforced foreign keys:

- `(release_id) → public.releases(id)`; required; multiple children permitted; delete cascade; update NO ACTION.
- `(change_request_id) → public.change_requests(id)`; required; multiple children permitted; delete cascade; update NO ACTION.

Additive migration history:

- `supabase/migrations/202609240001_initial_portal_schema.sql:97`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## releases

Table: `releases`. Operational delivery release planning. Created at `supabase/migrations/202609240001_initial_portal_schema.sql:51`. Current ownership: Portal operations; entity/site scope only where a column provides it.

Contract: `Release`; adapter key: `releases`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | uuid | no | id: string | `src/persistence/types/operations.ts:27` |
| release_key | text | no | releaseKey: string | `src/persistence/types/operations.ts:27` |
| name | text | no | name: string | `src/persistence/types/operations.ts:27` |
| release_date | date | no | releaseDate: string | `src/persistence/types/operations.ts:27` |
| status | text | no | status: "In Progress" \| "QA" \| "Scheduled" \| "Released" \| "Planning" | `src/persistence/types/operations.ts:27` |
| notes | text | no | notes: string | `src/persistence/types/operations.ts:27` |
| created_at | timestamptz | no | createdAt: string | `src/persistence/types/common.ts:13` |
| updated_at | timestamptz | no | updatedAt: string | `src/persistence/types/common.ts:13` |
| deleted_at | timestamptz | yes | deletedAt: string \| null | `src/persistence/types/common.ts:14` |

```sql
id uuid primary key default gen_random_uuid(),
release_key text not null unique,
name text not null,
release_date date not null,
status text not null,
notes text not null default '',
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
deleted_at timestamptz
```

No foreign keys.

Unenforced reference or vocabulary candidates: `release_key`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609240001_initial_portal_schema.sql:97`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## requirement targets

Table: `requirement_targets`. Source evidence links to polymorphic table/key/column targets. Created at `supabase/migrations/202609280001_canonical_normalization.sql:745`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `RequirementTargets`; adapter key: `requirementTargets`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/provenanceCanonical.ts:41` |
| key | text | no | key: string | `src/persistence/types/provenanceCanonical.ts:42` |
| requirement_key | text | no | requirementKey: string | `src/persistence/types/provenanceCanonical.ts:43` |
| target_table | text | no | targetTable: string | `src/persistence/types/provenanceCanonical.ts:44` |
| target_key | text | no | targetKey: string | `src/persistence/types/provenanceCanonical.ts:45` |
| target_column | text | no | targetColumn: string | `src/persistence/types/provenanceCanonical.ts:46` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
requirement_key text not null references public.source_requirements(key),
target_table text not null,
target_key text not null,
target_column text not null,
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(requirement_key) → public.source_requirements(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `target_table`, `target_key`, `target_column`, `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:756`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## residency jurisdictions

Table: `residency_jurisdictions`. Jurisdictions under residency policies. Created at `supabase/migrations/202609280001_canonical_normalization.sql:497`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `ResidencyJurisdictions`; adapter key: `residencyJurisdictions`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/underwritingCanonical.ts:30` |
| key | text | no | key: string | `src/persistence/types/underwritingCanonical.ts:31` |
| residency_rule_key | text | no | residencyRuleKey: string | `src/persistence/types/underwritingCanonical.ts:32` |
| jurisdiction | text | no | jurisdiction: string | `src/persistence/types/underwritingCanonical.ts:33` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
residency_rule_key text not null references public.residency_rules(key),
jurisdiction text not null,
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(residency_rule_key) → public.residency_rules(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:506`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## residency rules

Table: `residency_rules`. Site/product/rider jurisdiction eligibility policy. Created at `supabase/migrations/202609280001_canonical_normalization.sql:483`. Current ownership: Site reference; client derived.

Contract: `ResidencyRules`; adapter key: `residencyRules`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/underwritingCanonical.ts:21` |
| key | text | no | key: string | `src/persistence/types/underwritingCanonical.ts:22` |
| site_key | text | yes | siteKey: string \| null | `src/persistence/types/underwritingCanonical.ts:23` |
| product_key | text | yes | productKey: string \| null | `src/persistence/types/underwritingCanonical.ts:24` |
| rider_key | text | yes | riderKey: string \| null | `src/persistence/types/underwritingCanonical.ts:25` |
| mode | text | no | mode: string | `src/persistence/types/underwritingCanonical.ts:26` |
| condition_key | text | yes | conditionKey: string \| null | `src/persistence/types/underwritingCanonical.ts:27` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
site_key text references public.sites(key),
product_key text references public.products(key),
rider_key text references public.riders(key),
mode text not null check (mode in ('include','exclude')),
condition_key text references public.conditions(key),
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(site_key) → public.sites(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(product_key) → public.products(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(rider_key) → public.riders(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(condition_key) → public.conditions(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:495`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## rider amount rules

Table: `rider_amount_rules`. Rider amount strategy and optional base product/condition. Created at `supabase/migrations/202609280001_canonical_normalization.sql:431`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `RiderAmountRules`; adapter key: `riderAmountRules`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/coverageNormalizationCanonical.ts:108` |
| key | text | no | key: string | `src/persistence/types/coverageNormalizationCanonical.ts:109` |
| rider_key | text | no | riderKey: string | `src/persistence/types/coverageNormalizationCanonical.ts:110` |
| applicant_type_key | text | yes | applicantTypeKey: string \| null | `src/persistence/types/coverageNormalizationCanonical.ts:111` |
| amount_pattern_key | text | no | amountPatternKey: string | `src/persistence/types/coverageNormalizationCanonical.ts:112` |
| base_product_key | text | yes | baseProductKey: string \| null | `src/persistence/types/coverageNormalizationCanonical.ts:113` |
| condition_key | text | yes | conditionKey: string \| null | `src/persistence/types/coverageNormalizationCanonical.ts:114` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
rider_key text not null references public.riders(key),
applicant_type_key text references public.applicant_types(key),
amount_pattern_key text not null references public.coverage_amount_patterns(key),
base_product_key text references public.products(key),
condition_key text references public.conditions(key),
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(rider_key) → public.riders(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(applicant_type_key) → public.applicant_types(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(amount_pattern_key) → public.coverage_amount_patterns(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(base_product_key) → public.products(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(condition_key) → public.conditions(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:443`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## riders

Table: `riders`. Optional benefit/rider definitions. Created at `supabase/migrations/202609240003_portal_library.sql:77`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `RiderRow`; adapter key: `riders`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/catalog.ts:4` |
| key | text | no | key: string | `src/persistence/types/catalog.ts:4` |
| position | integer | no | position: number | `src/persistence/types/catalog.ts:4` |
| definition | jsonb | no | definition: Omit<import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/coverage").RiderDefinition, "premiumFactor"> & { premiumFactor: number \| null; } | `src/persistence/types/catalog.ts:4` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
definition jsonb not null check (jsonb_typeof(definition) = 'object'),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `definition` (5 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:83`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:890`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## roles

Table: `roles`. Role vocabulary. Created at `supabase/migrations/202609240001_initial_portal_schema.sql:76`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `Role`; adapter key: `roles`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | uuid | no | id: string | `src/persistence/types/operations.ts:36` |
| key | text | no | key: string | `src/persistence/types/operations.ts:36` |
| name | text | no | name: string | `src/persistence/types/operations.ts:36` |
| created_at | timestamptz | no | createdAt: string | `src/persistence/types/common.ts:13` |
| updated_at | timestamptz | no | updatedAt: string | `src/persistence/types/common.ts:13` |

```sql
id uuid primary key default gen_random_uuid(),
key text not null unique,
name text not null,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
```

No foreign keys.

Additive migration history:

- `supabase/migrations/202609240001_initial_portal_schema.sql:99`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## rule actions

Table: `rule_actions`. Legacy JSON action definitions under rules. Created at `supabase/migrations/202609240003_portal_library.sql:148`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `RuleActionRow`; adapter key: `ruleActions`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/catalog.ts:4` |
| key | text | no | key: string | `src/persistence/types/catalog.ts:4` |
| position | integer | no | position: number | `src/persistence/types/catalog.ts:4` |
| rule_key | text | no | ruleKey: string | `src/persistence/types/rules.ts:8` |
| definition | jsonb | no | definition: { kind: "documented-behavior"; description: string; source: string; } | `src/persistence/types/catalog.ts:4` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
rule_key text not null references public.rules(key),
definition jsonb not null check (jsonb_typeof(definition) = 'object'),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(rule_key) → public.rules(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `definition` (1 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:155`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:904`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## rule assignments

Table: `rule_assignments`. Scoped rule activation/order. Created at `supabase/migrations/202609240003_portal_library.sql:311`. Current ownership: Global/client/site according to scope; see CHECK for required target.

Contract: `RuleAssignmentRow`; adapter key: `ruleAssignments`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/siteConfiguration.ts:16` |
| key | text | no | key: string | `src/persistence/types/siteConfiguration.ts:16` |
| position | integer | no | position: number | `src/persistence/types/siteConfiguration.ts:16` |
| rule_key | text | no | ruleKey: string | `src/persistence/types/siteConfiguration.ts:16` |
| scope | text | no | scope: "global" \| "client" \| "site" | `src/persistence/types/catalog.ts:5` |
| client_key | text | yes | clientKey: string \| null | `src/persistence/types/catalog.ts:5` |
| site_key | text | yes | siteKey: string \| null | `src/persistence/types/catalog.ts:5` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
rule_key text not null references public.rules(key),
scope text not null check (scope in ('global','client','site')),
client_key text references public.clients(key),
site_key text references public.sites(key),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text,
unique nulls not distinct(rule_key, scope, client_key, site_key),
check ((scope = 'global' and client_key is null and site_key is null) or (scope = 'client' and client_key is not null and site_key is null) or (scope = 'site' and site_key is not null and client_key is null))
```

Enforced foreign keys:

- `(rule_key) → public.rules(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(client_key) → public.clients(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(site_key) → public.sites(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:322`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:936`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## rule conditions

Table: `rule_conditions`. Rule-to-condition composition. Created at `supabase/migrations/202609240003_portal_library.sql:138`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `RuleConditionRow`; adapter key: `ruleConditions`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/rules.ts:7` |
| key | text | no | key: string | `src/persistence/types/rules.ts:7` |
| position | integer | no | position: number | `src/persistence/types/rules.ts:7` |
| rule_key | text | no | ruleKey: string | `src/persistence/types/rules.ts:7` |
| condition_key | text | no | conditionKey: string | `src/persistence/types/rules.ts:7` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
rule_key text not null references public.rules(key),
condition_key text not null references public.conditions(key),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text,
unique(rule_key, condition_key)
```

Enforced foreign keys:

- `(rule_key) → public.rules(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(condition_key) → public.conditions(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:146`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:902`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## rule flags

Table: `rule_flags`. Flag predicates associated with rules. Created at `supabase/migrations/202609280001_canonical_normalization.sql:131`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `RuleFlags`; adapter key: `ruleFlags`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/flagsCanonical.ts:43` |
| key | text | no | key: string | `src/persistence/types/flagsCanonical.ts:44` |
| rule_key | text | no | ruleKey: string | `src/persistence/types/flagsCanonical.ts:45` |
| flag_key | text | no | flagKey: string | `src/persistence/types/flagsCanonical.ts:46` |
| operator | text | no | operator: string | `src/persistence/types/flagsCanonical.ts:47` |
| value | jsonb | no | value: Json | `src/persistence/types/flagsCanonical.ts:48` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
rule_key text not null references public.rules(key),
flag_key text not null references public.flag_definitions(key),
operator text not null check (operator in ('equals','not-equals')),
value jsonb not null,
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(rule_key) → public.rules(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(flag_key) → public.flag_definitions(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `value` (0 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:142`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## rule predicates

Table: `rule_predicates`. Normalized rule facts/operators/values. Created at `supabase/migrations/202609280001_canonical_normalization.sql:144`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `RulePredicates`; adapter key: `rulePredicates`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/patternsCanonical.ts:14` |
| key | text | no | key: string | `src/persistence/types/patternsCanonical.ts:15` |
| rule_key | text | no | ruleKey: string | `src/persistence/types/patternsCanonical.ts:16` |
| fact | text | no | fact: string | `src/persistence/types/patternsCanonical.ts:17` |
| operator | text | no | operator: string | `src/persistence/types/patternsCanonical.ts:18` |
| value | jsonb | no | value: Json | `src/persistence/types/patternsCanonical.ts:19` |
| position | integer | no | position: number | `src/persistence/types/patternsCanonical.ts:20` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
rule_key text not null references public.rules(key),
fact text not null,
operator text not null check (operator in ('equals','not-equals','greater-than','less-than','exists')),
value jsonb not null,
position integer not null,
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(rule_key) → public.rules(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `fact`, `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `value` (0 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:156`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## rules

Table: `rules`. Rule definitions. Created at `supabase/migrations/202609240003_portal_library.sql:130`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `RuleRow`; adapter key: `rules`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/catalog.ts:4` |
| key | text | no | key: string | `src/persistence/types/catalog.ts:4` |
| position | integer | no | position: number | `src/persistence/types/catalog.ts:4` |
| definition | jsonb | no | definition: Omit<import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/rules").RuleDefinition, "scope" \| "siteIds" \| "clientIds" \| "conditionIds"> | `src/persistence/types/catalog.ts:4` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
definition jsonb not null check (jsonb_typeof(definition) = 'object'),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `definition` (4 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:136`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:900`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## semantic requirements

Table: `semantic_requirements`. Documented semantic predicates for polymorphic subjects. Created at `supabase/migrations/202609280001_canonical_normalization.sql:758`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `SemanticRequirements`; adapter key: `semanticRequirements`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/provenanceCanonical.ts:49` |
| key | text | no | key: string | `src/persistence/types/provenanceCanonical.ts:50` |
| domain | text | no | domain: string | `src/persistence/types/provenanceCanonical.ts:51` |
| subject_table | text | no | subjectTable: string | `src/persistence/types/provenanceCanonical.ts:52` |
| subject_key | text | no | subjectKey: string | `src/persistence/types/provenanceCanonical.ts:53` |
| predicate | text | no | predicate: string | `src/persistence/types/provenanceCanonical.ts:54` |
| value | jsonb | no | value: Json | `src/persistence/types/provenanceCanonical.ts:55` |
| status | text | no | status: string | `src/persistence/types/provenanceCanonical.ts:56` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
domain text not null,
subject_table text not null,
subject_key text not null,
predicate text not null,
value jsonb not null,
status text not null check (status in ('documented','partial')),
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `subject_table`, `subject_key`, `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `value` (89 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:771`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## site associations

Table: `site_associations`. Associations assigned to sites. Created at `supabase/migrations/202609240003_portal_library.sql:237`. Current ownership: Site reference; client derived.

Contract: `SiteAssociationRow`; adapter key: `siteAssociations`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/siteConfiguration.ts:7` |
| key | text | no | key: string | `src/persistence/types/siteConfiguration.ts:7` |
| position | integer | no | position: number | `src/persistence/types/siteConfiguration.ts:7` |
| site_key | text | no | siteKey: string | `src/persistence/types/siteConfiguration.ts:7` |
| association_key | text | no | associationKey: string | `src/persistence/types/siteConfiguration.ts:7` |
| enabled | boolean | no | enabled: boolean | `src/persistence/types/siteConfiguration.ts:7` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
site_key text not null references public.sites(key),
association_key text not null references public.associations(key),
enabled boolean not null,
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text,
unique(site_key, association_key)
```

Enforced foreign keys:

- `(site_key) → public.sites(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(association_key) → public.associations(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:246`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:924`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

Indexes and triggers:

```sql
create trigger site_association_client_guard before insert or update on public.site_associations
for each row execute function public.check_site_association_client();
```

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## site builder drafts

Table: `site_builder_drafts`. Proposed site construction data before publication. Created at `supabase/migrations/202609240001_initial_portal_schema.sql:70`. Current ownership: Site and client references; compatibility depends on composite FK or code (F03).

Contract: `SiteBuilderDraft`; adapter key: `siteBuilderDrafts`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | uuid | no | id: string | `src/persistence/types/operations.ts:31` |
| client_id | uuid | yes | clientId: string \| null | `src/persistence/types/operations.ts:31` |
| site_key | text | no | siteKey: string | `src/persistence/types/operations.ts:31` |
| site_name | text | no | siteName: string | `src/persistence/types/operations.ts:31` |
| status | text | no | status: string | `src/persistence/types/operations.ts:31` |
| current_step | text | no | currentStep: string | `src/persistence/types/operations.ts:32` |
| draft_data_json | jsonb | no | draftDataJson: Json | `src/persistence/types/operations.ts:32` |
| owner_id | text | yes | ownerId: string \| null | `src/persistence/types/operations.ts:32` |
| created_at | timestamptz | no | createdAt: string | `src/persistence/types/common.ts:13` |
| updated_at | timestamptz | no | updatedAt: string | `src/persistence/types/common.ts:13` |
| deleted_at | timestamptz | yes | deletedAt: string \| null | `src/persistence/types/common.ts:14` |

```sql
id uuid primary key default gen_random_uuid(),
client_id uuid references public.clients,
site_key text not null,
site_name text not null,
status text not null,
current_step text not null,
draft_data_json jsonb not null default '{}',
owner_id text,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
deleted_at timestamptz
```

Enforced foreign keys:

- `(client_id) → public.clients(id)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `site_key`, `current_step`, `owner_id`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `draft_data_json` (1 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609240001_initial_portal_schema.sql:98`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## site configurations

Table: `site_configurations`. Legacy dated site configuration values. Created at `supabase/migrations/202609240001_initial_portal_schema.sql:27`. Current ownership: Site reference; client derived.

Contract: `SiteConfiguration`; adapter key: `siteConfigurations`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | uuid | no | id: string | `src/persistence/types/organization.ts:19` |
| site_id | uuid | no | siteId: string | `src/persistence/types/organization.ts:19` |
| configuration_key | text | no | configurationKey: string | `src/persistence/types/organization.ts:19` |
| value_json | jsonb | no | valueJson: Json | `src/persistence/types/organization.ts:19` |
| source | text | no | source: string | `src/persistence/types/organization.ts:19` |
| effective_date | date | yes | effectiveDate: string \| null | `src/persistence/types/organization.ts:19` |
| created_at | timestamptz | no | createdAt: string | `src/persistence/types/common.ts:13` |
| updated_at | timestamptz | no | updatedAt: string | `src/persistence/types/common.ts:13` |
| deleted_at | timestamptz | yes | deletedAt: string \| null | `src/persistence/types/common.ts:14` |

```sql
id uuid primary key default gen_random_uuid(),
site_id uuid not null references public.sites,
configuration_key text not null,
value_json jsonb not null default 'null',
source text not null default 'site_override',
effective_date date,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
deleted_at timestamptz,
unique(site_id, configuration_key, effective_date)
```

Enforced foreign keys:

- `(site_id) → public.sites(id)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `configuration_key`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `value_json` (2 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609240001_initial_portal_schema.sql:94`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## site coverages

Table: `site_coverages`. Legacy site-to-coverage assignment. Created at `supabase/migrations/202609240001_initial_portal_schema.sql:24`. Current ownership: Site reference; client derived.

Contract: `SiteCoverage`; adapter key: `siteCoverages`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | uuid | no | id: string | `src/persistence/types/organization.ts:15` |
| site_id | uuid | no | siteId: string | `src/persistence/types/organization.ts:15` |
| coverage_key | text | no | coverageKey: string | `src/persistence/types/organization.ts:15` |
| enabled | boolean | no | enabled: boolean | `src/persistence/types/organization.ts:15` |
| created_at | timestamptz | no | createdAt: string | `src/persistence/types/common.ts:13` |
| updated_at | timestamptz | no | updatedAt: string | `src/persistence/types/common.ts:13` |
| key | text | no | key?: string \| undefined | `src/persistence/types/organization.ts:15` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id uuid primary key default gen_random_uuid(),
site_id uuid not null references public.sites,
coverage_key text not null,
enabled boolean not null default true,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
key text unique,
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text,
unique(site_id, coverage_key)
```

Enforced foreign keys:

- `(site_id) → public.sites(id)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `coverage_key`, `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609240001_initial_portal_schema.sql:92`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:966`: add column key text unique, add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text
- `supabase/migrations/202609280001_canonical_normalization.sql:968`: alter column key set not null

Indexes and triggers:

```sql
create trigger site_coverages_semantic_key before insert on public.site_coverages for each row execute function public.fill_legacy_assignment_key('coverage_key');
```

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## site documents

Table: `site_documents`. Document assignments on sites. Created at `supabase/migrations/202609240003_portal_library.sql:389`. Current ownership: Site reference; client derived.

Contract: `SiteDocumentRow`; adapter key: `siteDocuments`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/siteConfiguration.ts:22` |
| key | text | no | key: string | `src/persistence/types/siteConfiguration.ts:22` |
| position | integer | no | position: number | `src/persistence/types/siteConfiguration.ts:22` |
| site_key | text | no | siteKey: string | `src/persistence/types/siteConfiguration.ts:22` |
| document_key | text | no | documentKey: string | `src/persistence/types/siteConfiguration.ts:22` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
site_key text not null references public.sites(key),
document_key text not null references public.document_definitions(key),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text,
unique(site_key, document_key)
```

Enforced foreign keys:

- `(site_key) → public.sites(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(document_key) → public.document_definitions(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:397`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:948`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## site email templates

Table: `site_email_templates`. Email templates enabled on sites. Created at `supabase/migrations/202609240003_portal_library.sql:378`. Current ownership: Site reference; client derived.

Contract: `SiteEmailTemplateRow`; adapter key: `siteEmailTemplates`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/siteConfiguration.ts:21` |
| key | text | no | key: string | `src/persistence/types/siteConfiguration.ts:21` |
| position | integer | no | position: number | `src/persistence/types/siteConfiguration.ts:21` |
| site_key | text | no | siteKey: string | `src/persistence/types/siteConfiguration.ts:21` |
| email_template_key | text | no | emailTemplateKey: string | `src/persistence/types/siteConfiguration.ts:21` |
| enabled | boolean | no | enabled: boolean | `src/persistence/types/siteConfiguration.ts:21` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
site_key text not null references public.sites(key),
email_template_key text not null references public.email_templates(key),
enabled boolean not null,
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text,
unique(site_key, email_template_key)
```

Enforced foreign keys:

- `(site_key) → public.sites(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(email_template_key) → public.email_templates(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:387`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:946`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## site environment links

Table: `site_environment_links`. Site launch/reference links by environment. Created at `supabase/migrations/202609250001_site_environment_links.sql:2`. Current ownership: Site reference; client derived.

Contract: `SiteEnvironmentLink & Partial<LibraryMetadata>`; adapter key: `siteEnvironmentLinks`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/domain/sites.ts:48` |
| key | text | no | key: string | `src/domain/sites.ts:49` |
| site_key | text | no | siteKey: string | `src/domain/sites.ts:50` |
| environment | text | no | environment: SiteEnvironment | `src/domain/sites.ts:51` |
| link_type | text | no | linkType: "launch" \| "campaign" \| "apply" \| "returning" \| "reference" | `src/domain/sites.ts:52` |
| label | text | no | label: string | `src/domain/sites.ts:53` |
| url | text | no | url: string | `src/domain/sites.ts:54` |
| active | boolean | no | active: boolean | `src/domain/sites.ts:55` |
| position | integer | no | position: number | `src/domain/sites.ts:56` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
site_key text not null references public.sites(key),
environment text not null check (environment in ('prototype','test','pre-production','production','automation')),
link_type text not null check (link_type in ('launch','campaign','apply','returning','reference')),
label text not null,
url text not null check (url ~ '^https?://'),
active boolean not null,
position integer not null default 0,
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(site_key) → public.sites(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `link_type`, `url`, `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609250001_site_environment_links.sql:13`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:872`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## site features

Table: `site_features`. Feature activation on sites. Created at `supabase/migrations/202609240003_portal_library.sql:286`. Current ownership: Site reference; client derived.

Contract: `SiteFeatureRow`; adapter key: `siteFeatures`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/siteConfiguration.ts:14` |
| key | text | no | key: string | `src/persistence/types/siteConfiguration.ts:14` |
| position | integer | no | position: number | `src/persistence/types/siteConfiguration.ts:14` |
| site_key | text | no | siteKey: string | `src/persistence/types/siteConfiguration.ts:14` |
| feature_key | text | no | featureKey: string | `src/persistence/types/siteConfiguration.ts:14` |
| enabled | boolean | no | enabled: boolean | `src/persistence/types/siteConfiguration.ts:14` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
site_key text not null references public.sites(key),
feature_key text not null references public.features(key),
enabled boolean not null,
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text,
unique(site_key, feature_key)
```

Enforced foreign keys:

- `(site_key) → public.sites(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(feature_key) → public.features(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:295`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:932`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## site field configurations

Table: `site_field_configurations`. Scoped page-field inclusion and override values. Created at `supabase/migrations/202609240003_portal_library.sql:259`. Current ownership: Global/client/site according to scope; see CHECK for required target.

Contract: `SiteFieldConfigurationRow`; adapter key: `siteFieldConfigurations`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/siteConfiguration.ts:10` |
| key | text | no | key: string | `src/persistence/types/siteConfiguration.ts:10` |
| position | integer | no | position: number | `src/persistence/types/siteConfiguration.ts:10` |
| page_key | text | no | pageKey: string | `src/persistence/types/siteConfiguration.ts:10` |
| field_key | text | no | fieldKey: string | `src/persistence/types/siteConfiguration.ts:10` |
| include | boolean | yes | include: boolean \| null | `src/persistence/types/siteConfiguration.ts:11` |
| hidden | boolean | yes | hidden: boolean \| null | `src/persistence/types/siteConfiguration.ts:11` |
| values | jsonb | no | values: Partial<Omit<import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/fields").FieldDefinition, "id">> | `src/persistence/types/siteConfiguration.ts:11` |
| scope | text | no | scope: "global" \| "client" \| "site" | `src/persistence/types/catalog.ts:5` |
| client_key | text | yes | clientKey: string \| null | `src/persistence/types/catalog.ts:5` |
| site_key | text | yes | siteKey: string \| null | `src/persistence/types/catalog.ts:5` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
page_key text not null references public.pages(key),
field_key text not null references public.fields(key),
include boolean,
hidden boolean,
values jsonb not null check (jsonb_typeof("values") = 'object'),
scope text not null check (scope in ('global','client','site')),
client_key text references public.clients(key),
site_key text references public.sites(key),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text,
check ((scope = 'global' and client_key is null and site_key is null) or (scope = 'client' and client_key is not null and site_key is null) or (scope = 'site' and site_key is not null and client_key is null))
```

Enforced foreign keys:

- `(page_key) → public.pages(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(field_key) → public.fields(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(client_key) → public.clients(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(site_key) → public.sites(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `values` (2 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:273`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:928`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## site flows

Table: `site_flows`. Scoped flow selection and runtime alias. Created at `supabase/migrations/202609240003_portal_library.sql:297`. Current ownership: Global/client/site according to scope; see CHECK for required target.

Contract: `SiteFlowRow`; adapter key: `siteFlows`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/siteConfiguration.ts:15` |
| key | text | no | key: string | `src/persistence/types/siteConfiguration.ts:15` |
| position | integer | no | position: number | `src/persistence/types/siteConfiguration.ts:15` |
| flow_key | text | no | flowKey: string | `src/persistence/types/siteConfiguration.ts:15` |
| flow_id | text | no | flowId: string | `src/persistence/types/siteConfiguration.ts:15` |
| scope | text | no | scope: "global" \| "client" \| "site" | `src/persistence/types/catalog.ts:5` |
| client_key | text | yes | clientKey: string \| null | `src/persistence/types/catalog.ts:5` |
| site_key | text | yes | siteKey: string \| null | `src/persistence/types/catalog.ts:5` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
flow_key text not null references public.flows(key),
flow_id text not null,
scope text not null check (scope in ('global','client','site')),
client_key text references public.clients(key),
site_key text references public.sites(key),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text,
unique nulls not distinct(flow_id, scope, client_key, site_key),
check ((scope = 'global' and client_key is null and site_key is null) or (scope = 'client' and client_key is not null and site_key is null) or (scope = 'site' and site_key is not null and client_key is null))
```

Enforced foreign keys:

- `(flow_key) → public.flows(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(client_key) → public.clients(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(site_key) → public.sites(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `flow_id`, `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:309`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:934`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## site pages

Table: `site_pages`. Page participation and ordering on sites. Created at `supabase/migrations/202609240003_portal_library.sql:248`. Current ownership: Site reference; client derived.

Contract: `SitePageRow`; adapter key: `sitePages`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/siteConfiguration.ts:8` |
| key | text | no | key: string | `src/persistence/types/siteConfiguration.ts:8` |
| position | integer | no | position: number | `src/persistence/types/siteConfiguration.ts:8` |
| site_key | text | no | siteKey: string | `src/persistence/types/siteConfiguration.ts:8` |
| page_key | text | no | pageKey: string | `src/persistence/types/siteConfiguration.ts:8` |
| requirement | text | no | requirement: "required" \| "optional" \| "none" | `src/persistence/types/siteConfiguration.ts:8` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
site_key text not null references public.sites(key),
page_key text not null references public.pages(key),
requirement text not null check (requirement in ('required','optional','none')),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text,
unique(site_key, page_key),
constraint site_pages_nonnegative_order check (position >= 0)
```

Enforced foreign keys:

- `(site_key) → public.sites(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(page_key) → public.pages(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:257`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:926`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text
- `supabase/migrations/202610090001_page_catalog_contract.sql:64`: add constraint site_pages_nonnegative_order check (position >= 0)

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## site policies

Table: `site_policies`. Site association and payment policy definitions. Created at `supabase/migrations/202609240003_portal_library.sql:399`. Current ownership: Site reference; client derived.

Contract: `SitePolicyRow`; adapter key: `sitePolicies`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/catalog.ts:4` |
| key | text | no | key: string | `src/persistence/types/catalog.ts:4` |
| position | integer | no | position: number | `src/persistence/types/catalog.ts:4` |
| site_key | text | no | siteKey: string | `src/persistence/types/siteConfiguration.ts:23` |
| definition | jsonb | no | definition: { associationSelection?: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/associations").AssociationSelection; associationBranding?: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/associations").AssociationBranding; payment?: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/paymentPolicy").PaymentPolicy; } | `src/persistence/types/catalog.ts:4` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
site_key text not null references public.sites(key),
definition jsonb not null check (jsonb_typeof(definition) = 'object'),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text,
unique(site_key)
```

Enforced foreign keys:

- `(site_key) → public.sites(key)`; required; unique child key; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `definition` (3 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:407`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:950`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## site product applicants

Table: `site_product_applicants`. Applicant-role types offered for products on sites. Created at `supabase/migrations/202609240003_portal_library.sql:275`. Current ownership: Site reference; client derived.

Contract: `SiteProductApplicantRow`; adapter key: `siteProductApplicants`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/siteConfiguration.ts:13` |
| key | text | no | key: string | `src/persistence/types/siteConfiguration.ts:13` |
| position | integer | no | position: number | `src/persistence/types/siteConfiguration.ts:13` |
| site_key | text | no | siteKey: string | `src/persistence/types/siteConfiguration.ts:13` |
| product_key | text | no | productKey: string | `src/persistence/types/siteConfiguration.ts:13` |
| applicant_key | text | no | applicantKey: string | `src/persistence/types/siteConfiguration.ts:13` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
site_key text not null references public.sites(key),
product_key text not null references public.products(key),
applicant_key text not null references public.applicant_types(key),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text,
unique(site_key, product_key, applicant_key)
```

Enforced foreign keys:

- `(site_key) → public.sites(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(product_key) → public.products(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(applicant_key) → public.applicant_types(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:284`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:930`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## site products

Table: `site_products`. Site-to-product assignment. Created at `supabase/migrations/202609240001_initial_portal_schema.sql:25`. Current ownership: Site reference; client derived.

Contract: `SiteProduct`; adapter key: `siteProducts`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | uuid | no | id: string | `src/persistence/types/organization.ts:16` |
| site_id | uuid | no | siteId: string | `src/persistence/types/organization.ts:16` |
| product_key | text | no | productKey: string | `src/persistence/types/organization.ts:16` |
| enabled | boolean | no | enabled: boolean | `src/persistence/types/organization.ts:16` |
| created_at | timestamptz | no | createdAt: string | `src/persistence/types/common.ts:13` |
| updated_at | timestamptz | no | updatedAt: string | `src/persistence/types/common.ts:13` |
| key | text | no | key?: string \| undefined | `src/persistence/types/organization.ts:16` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id uuid primary key default gen_random_uuid(),
site_id uuid not null references public.sites,
product_key text not null,
enabled boolean not null default true,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
key text unique,
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text,
unique(site_id, product_key)
```

Enforced foreign keys:

- `(site_id) → public.sites(id)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `product_key`, `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609240001_initial_portal_schema.sql:93`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:971`: add column key text unique, add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text
- `supabase/migrations/202609280001_canonical_normalization.sql:973`: alter column key set not null

Indexes and triggers:

```sql
create trigger site_products_semantic_key before insert on public.site_products for each row execute function public.fill_legacy_assignment_key('product_key');
```

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## site riders

Table: `site_riders`. Site-to-rider assignment. Created at `supabase/migrations/202609240001_initial_portal_schema.sql:26`. Current ownership: Site reference; client derived.

Contract: `SiteRider`; adapter key: `siteRiders`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | uuid | no | id: string | `src/persistence/types/organization.ts:17` |
| site_id | uuid | no | siteId: string | `src/persistence/types/organization.ts:17` |
| rider_key | text | no | riderKey: string | `src/persistence/types/organization.ts:17` |
| enabled | boolean | no | enabled: boolean | `src/persistence/types/organization.ts:17` |
| created_at | timestamptz | no | createdAt: string | `src/persistence/types/common.ts:13` |
| updated_at | timestamptz | no | updatedAt: string | `src/persistence/types/common.ts:13` |
| key | text | no | key?: string \| undefined | `src/persistence/types/organization.ts:17` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id uuid primary key default gen_random_uuid(),
site_id uuid not null references public.sites,
rider_key text not null,
enabled boolean not null default true,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
key text unique,
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text,
unique(site_id, rider_key)
```

Enforced foreign keys:

- `(site_id) → public.sites(id)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `rider_key`, `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609240001_initial_portal_schema.sql:93`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:976`: add column key text unique, add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text
- `supabase/migrations/202609280001_canonical_normalization.sql:978`: alter column key set not null

Indexes and triggers:

```sql
create trigger site_riders_semantic_key before insert on public.site_riders for each row execute function public.fill_legacy_assignment_key('rider_key');
```

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## site url parameters

Table: `site_url_parameters`. URL parameters enabled on sites. Created at `supabase/migrations/202609280001_canonical_normalization.sql:696`. Current ownership: Site reference; client derived.

Contract: `SiteUrlParameters`; adapter key: `siteUrlParameters`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/urlsCanonical.ts:12` |
| key | text | no | key: string | `src/persistence/types/urlsCanonical.ts:13` |
| site_key | text | no | siteKey: string | `src/persistence/types/urlsCanonical.ts:14` |
| url_parameter_key | text | no | urlParameterKey: string | `src/persistence/types/urlsCanonical.ts:15` |
| enabled | boolean | no | enabled: boolean | `src/persistence/types/urlsCanonical.ts:16` |
| default_value | text | yes | defaultValue: string \| null | `src/persistence/types/urlsCanonical.ts:17` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
site_key text not null references public.sites(key),
url_parameter_key text not null references public.url_parameters(key),
enabled boolean not null,
default_value text,
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(site_key) → public.sites(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(url_parameter_key) → public.url_parameters(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:707`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## sites

Table: `sites`. Portal application experiences owned by a client. Created at `supabase/migrations/202609240001_initial_portal_schema.sql:18`. Current ownership: Client via client_id.

Contract: `Site`; adapter key: `sites`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | uuid | no | id: string | `src/persistence/types/organization.ts:12` |
| client_id | uuid | no | clientId: string | `src/persistence/types/organization.ts:12` |
| key | text | no | key: string | `src/persistence/types/organization.ts:12` |
| name | text | no | name: string | `src/domain/sites.ts:12` |
| display_name | text | no | displayName: string | `src/persistence/types/organization.ts:12` |
| status | record_status | no | status: RecordStatus | `src/persistence/types/organization.ts:13` |
| environment | text | no | environment: string | `src/persistence/types/organization.ts:13` |
| template_type | text | no | templateType: "single" \| "multi" | `src/domain/sites.ts:13` |
| legacy_client_id | text | no | legacyClientId: string | `src/persistence/types/organization.ts:13` |
| created_at | timestamptz | no | createdAt: string | `src/persistence/types/common.ts:13` |
| updated_at | timestamptz | no | updatedAt: string | `src/persistence/types/common.ts:13` |
| deleted_at | timestamptz | yes | deletedAt: string \| null | `src/persistence/types/common.ts:14` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id uuid primary key default gen_random_uuid(),
client_id uuid not null references public.clients,
key text not null unique,
name text not null,
display_name text not null,
status record_status not null default 'active',
environment text not null default 'demo',
template_type text not null check (template_type in ('single','multi')),
legacy_client_id text not null,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
deleted_at timestamptz,
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text,
constraint sites_id_client_id_unique unique (id, client_id),
constraint sites_id_key_unique unique (id, key)
```

Enforced foreign keys:

- `(client_id) → public.clients(id)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `template_type`, `legacy_client_id`, `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609240001_initial_portal_schema.sql:92`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:956`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text
- `supabase/migrations/202610120002_application_relationships.sql:5`: add constraint sites_id_client_id_unique unique (id, client_id)
- `supabase/migrations/202610120002_application_relationships.sql:6`: add constraint sites_id_key_unique unique (id, key)

Indexes and triggers:

```sql
create index sites_client_id_idx on public.sites(client_id) where deleted_at is null;
```

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## source requirements

Table: `source_requirements`. Cell-level source evidence and adoption state. Created at `supabase/migrations/202609280001_canonical_normalization.sql:38`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `SourceRequirements`; adapter key: `sourceRequirements`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/provenanceCanonical.ts:25` |
| key | text | no | key: string | `src/persistence/types/provenanceCanonical.ts:26` |
| sheet_key | text | no | sheetKey: string | `src/persistence/types/provenanceCanonical.ts:27` |
| cell | text | no | cell: string | `src/persistence/types/provenanceCanonical.ts:28` |
| value | jsonb | yes | value: Json | `src/persistence/types/provenanceCanonical.ts:29` |
| formula | text | yes | formula: string \| null | `src/persistence/types/provenanceCanonical.ts:30` |
| comment | text | yes | comment: string \| null | `src/persistence/types/provenanceCanonical.ts:31` |
| hyperlink | text | yes | hyperlink: string \| null | `src/persistence/types/provenanceCanonical.ts:32` |
| classification | text | no | classification: string | `src/persistence/types/provenanceCanonical.ts:36` |
| reason | text | no | reason: string | `src/persistence/types/provenanceCanonical.ts:37` |
| checklist_notes | text | yes | checklistNotes: string \| null | `src/persistence/types/provenanceCanonical.ts:38` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |
| promotion_state | text | no | promotionState: "SOURCE_ONLY" \| "PATTERN_CANDIDATE" \| "CANONICAL_LIBRARY" \| "SITE_CONFIGURATION" \| "UNRESOLVED" | `src/persistence/types/provenanceCanonical.ts:33` |
| promotion_reason | text | no | promotionReason: string | `src/persistence/types/provenanceCanonical.ts:34` |
| active_site_keys | jsonb | no | activeSiteKeys: Json | `src/persistence/types/provenanceCanonical.ts:35` |

```sql
id text primary key,
key text not null unique,
sheet_key text not null references public.source_sheets(key),
cell text not null,
value jsonb,
formula text,
comment text,
hyperlink text,
classification text not null check (classification in ('MAPPED','INTENTIONALLY_EXCLUDED','UNMAPPED_SEMANTIC','PARSER_GAP','MODEL_GAP','IDENTITY_CONFLICT','SOURCE_TBD','SOURCE_CONFLICT','REQUIRES_CLIENT_CONFIRMATION','REQUIRES_AM_CONFIRMATION','REQUIRES_UW_CONFIRMATION','REQUIRES_CONTRACTS_CONFIRMATION','REQUIRES_COMPLIANCE_CONFIRMATION','IMAGE_REVIEW_REQUIRED','NON_FUNCTIONAL_OR_REFERENCE')),
reason text not null,
checklist_notes text,
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text,
promotion_state text not null default 'SOURCE_ONLY'
    check (promotion_state in ('SOURCE_ONLY','PATTERN_CANDIDATE','CANONICAL_LIBRARY','SITE_CONFIGURATION','UNRESOLVED')),
promotion_reason text not null default 'Archived evidence; no adoption decision.',
active_site_keys jsonb not null default '[]'::jsonb
    check (jsonb_typeof(active_site_keys) = 'array'),
unique(sheet_key, cell),
constraint source_promotion_scope check (
    promotion_state not in ('SOURCE_ONLY','PATTERN_CANDIDATE') or active_site_keys = '[]'::jsonb
  )
```

Enforced foreign keys:

- `(sheet_key) → public.source_sheets(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `formula`, `display_id`, `source_reference`, `active_site_keys`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `value` (0 observed candidate paths), `active_site_keys` (0 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:55`: enable row level security
- `supabase/migrations/202609280002_source_promotion.sql:2`: add column promotion_state text not null default 'SOURCE_ONLY'     check (promotion_state in ('SOURCE_ONLY','PATTERN_CANDIDATE','CANONICAL_LIBRARY','SITE_CONFIGURATION','UNRESOLVED')),   add column promotion_reason text not null default 'Archived evidence; no adoption decision.',   add column active_site_keys jsonb not null default '[]'::jsonb     check (jsonb_typeof(active_site_keys) = 'array'),   add constraint source_promotion_scope check (     promotion_state not in ('SOURCE_ONLY','PATTERN_CANDIDATE') or active_site_keys = '[]'::jsonb   )

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## source sheets

Table: `source_sheets`. Workbook sheets and extraction metadata. Created at `supabase/migrations/202609280001_canonical_normalization.sql:24`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `SourceSheets`; adapter key: `sourceSheets`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/provenanceCanonical.ts:16` |
| key | text | no | key: string | `src/persistence/types/provenanceCanonical.ts:17` |
| workbook_key | text | no | workbookKey: string | `src/persistence/types/provenanceCanonical.ts:18` |
| name | text | no | name: string | `src/persistence/types/provenanceCanonical.ts:19` |
| cell_count | integer | no | cellCount: number | `src/persistence/types/provenanceCanonical.ts:20` |
| merged_ranges | jsonb | no | mergedRanges: Json | `src/persistence/types/provenanceCanonical.ts:21` |
| image_count | integer | no | imageCount: number | `src/persistence/types/provenanceCanonical.ts:22` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
workbook_key text not null references public.source_workbooks(key),
name text not null,
cell_count integer not null,
merged_ranges jsonb not null,
image_count integer not null,
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(workbook_key) → public.source_workbooks(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `merged_ranges` (0 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:36`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## source workbooks

Table: `source_workbooks`. Imported workbook identity and content hash. Created at `supabase/migrations/202609280001_canonical_normalization.sql:13`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `SourceWorkbooks`; adapter key: `sourceWorkbooks`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/provenanceCanonical.ts:10` |
| key | text | no | key: string | `src/persistence/types/provenanceCanonical.ts:11` |
| name | text | no | name: string | `src/persistence/types/provenanceCanonical.ts:12` |
| sha256 | text | no | sha256: string | `src/persistence/types/provenanceCanonical.ts:13` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
name text not null,
sha256 text not null unique,
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:22`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## structured rule actions

Table: `structured_rule_actions`. Normalized action type and value under rules. Created at `supabase/migrations/202609280001_canonical_normalization.sql:158`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `StructuredRuleActions`; adapter key: `structuredRuleActions`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/patternsCanonical.ts:23` |
| key | text | no | key: string | `src/persistence/types/patternsCanonical.ts:24` |
| rule_key | text | no | ruleKey: string | `src/persistence/types/patternsCanonical.ts:25` |
| action_type | text | no | actionType: string | `src/persistence/types/patternsCanonical.ts:26` |
| value | jsonb | yes | value: Json | `src/persistence/types/patternsCanonical.ts:27` |
| position | integer | no | position: number | `src/persistence/types/patternsCanonical.ts:28` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
rule_key text not null references public.rules(key),
action_type text not null check (action_type in ('lookup-membership','lookup-coverage','verify-identity','show-portfolio','set-decision','suppress-rates','calculate-benefit')),
value jsonb,
position integer not null,
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(rule_key) → public.rules(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `action_type`, `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `value` (0 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:169`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## support profiles

Table: `support_profiles`. Scoped support contact/presentation definitions. Created at `supabase/migrations/202609240003_portal_library.sql:365`. Current ownership: Global/client/site according to scope; see CHECK for required target.

Contract: `SupportProfileRow`; adapter key: `supportProfiles`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/catalog.ts:4` |
| key | text | no | key: string | `src/persistence/types/catalog.ts:4` |
| position | integer | no | position: number | `src/persistence/types/catalog.ts:4` |
| definition | jsonb | no | definition: Partial<import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/configuration").ClientSupport> | `src/persistence/types/catalog.ts:4` |
| scope | text | no | scope: "global" \| "client" \| "site" | `src/persistence/types/catalog.ts:5` |
| client_key | text | yes | clientKey: string \| null | `src/persistence/types/catalog.ts:5` |
| site_key | text | yes | siteKey: string \| null | `src/persistence/types/catalog.ts:5` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
definition jsonb not null check (jsonb_typeof(definition) = 'object'),
scope text not null check (scope in ('global','client','site')),
client_key text references public.clients(key),
site_key text references public.sites(key),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text,
unique nulls not distinct(scope, client_key, site_key),
check ((scope = 'global' and client_key is null and site_key is null) or (scope = 'client' and client_key is not null and site_key is null) or (scope = 'site' and site_key is not null and client_key is null))
```

Enforced foreign keys:

- `(client_key) → public.clients(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(site_key) → public.sites(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `definition` (1 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:376`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:944`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## underwriting bands

Table: `underwriting_bands`. Product underwriting pathways by age and amount band. Created at `supabase/migrations/202609280001_canonical_normalization.sql:461`. Current ownership: Site reference; client derived.

Contract: `UnderwritingBands`; adapter key: `underwritingBands`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/underwritingCanonical.ts:4` |
| key | text | no | key: string | `src/persistence/types/underwritingCanonical.ts:5` |
| product_key | text | no | productKey: string | `src/persistence/types/underwritingCanonical.ts:6` |
| applicant_type_key | text | yes | applicantTypeKey: string \| null | `src/persistence/types/underwritingCanonical.ts:7` |
| site_key | text | yes | siteKey: string \| null | `src/persistence/types/underwritingCanonical.ts:8` |
| pathway | text | yes | pathway: string \| null | `src/persistence/types/underwritingCanonical.ts:9` |
| minimum_age | numeric | yes | minimumAge: number \| null | `src/persistence/types/underwritingCanonical.ts:10` |
| maximum_age | numeric | yes | maximumAge: number \| null | `src/persistence/types/underwritingCanonical.ts:11` |
| minimum_amount | numeric | yes | minimumAmount: number \| null | `src/persistence/types/underwritingCanonical.ts:12` |
| maximum_amount | numeric | yes | maximumAmount: number \| null | `src/persistence/types/underwritingCanonical.ts:13` |
| minimum_amount_exclusive | boolean | no | minimumAmountExclusive: boolean | `src/persistence/types/underwritingCanonical.ts:14` |
| applicant_class | text | yes | applicantClass: string \| null | `src/persistence/types/underwritingCanonical.ts:15` |
| mortality_morbidity | text | yes | mortalityMorbidity: string \| null | `src/persistence/types/underwritingCanonical.ts:16` |
| condition_key | text | yes | conditionKey: string \| null | `src/persistence/types/underwritingCanonical.ts:17` |
| status | text | no | status: string | `src/persistence/types/underwritingCanonical.ts:18` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
product_key text not null references public.products(key),
applicant_type_key text references public.applicant_types(key),
site_key text references public.sites(key),
pathway text,
minimum_age numeric,
maximum_age numeric,
minimum_amount numeric,
maximum_amount numeric,
minimum_amount_exclusive boolean not null,
applicant_class text,
mortality_morbidity text,
condition_key text references public.conditions(key),
status text not null,
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(product_key) → public.products(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(applicant_type_key) → public.applicant_types(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(site_key) → public.sites(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(condition_key) → public.conditions(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:481`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## url definitions

Table: `url_definitions`. Parsed URL identity, parts and parameters. Created at `supabase/migrations/202609280001_canonical_normalization.sql:788`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `UrlDefinitions`; adapter key: `urlDefinitions`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/urlsCanonical.ts:33` |
| key | text | no | key: string | `src/persistence/types/urlsCanonical.ts:34` |
| url | text | no | url: string | `src/persistence/types/urlsCanonical.ts:35` |
| protocol | text | no | protocol: string | `src/persistence/types/urlsCanonical.ts:36` |
| host | text | no | host: string | `src/persistence/types/urlsCanonical.ts:37` |
| pathname | text | no | pathname: string | `src/persistence/types/urlsCanonical.ts:38` |
| parameters | jsonb | no | parameters: Json | `src/persistence/types/urlsCanonical.ts:39` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
url text not null,
protocol text not null,
host text not null,
pathname text not null,
parameters jsonb not null,
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `url`, `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `parameters` (1 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:800`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## url parameter values

Table: `url_parameter_values`. Named values of URL parameters. Created at `supabase/migrations/202609280001_canonical_normalization.sql:721`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `UrlParameterValues`; adapter key: `urlParameterValues`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/urlsCanonical.ts:27` |
| key | text | no | key: string | `src/persistence/types/urlsCanonical.ts:28` |
| url_parameter_key | text | no | urlParameterKey: string | `src/persistence/types/urlsCanonical.ts:29` |
| value | text | no | value: string | `src/persistence/types/urlsCanonical.ts:30` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
url_parameter_key text not null references public.url_parameters(key),
value text not null,
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(url_parameter_key) → public.url_parameters(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:730`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## url parameters

Table: `url_parameters`. URL parameter vocabulary and behavior. Created at `supabase/migrations/202609280001_canonical_normalization.sql:684`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `UrlParameters`; adapter key: `urlParameters`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/urlsCanonical.ts:5` |
| key | text | no | key: string | `src/persistence/types/urlsCanonical.ts:6` |
| parameter | text | no | parameter: string | `src/persistence/types/urlsCanonical.ts:7` |
| behavior | text | no | behavior: string | `src/persistence/types/urlsCanonical.ts:8` |
| status | text | no | status: string | `src/persistence/types/urlsCanonical.ts:9` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
parameter text not null,
behavior text not null,
status text not null,
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:694`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## url usages

Table: `url_usages`. Recorded URL usage and optional client. Created at `supabase/migrations/202609280001_canonical_normalization.sql:802`. Current ownership: Client reference.

Contract: `UrlUsages`; adapter key: `urlUsages`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/urlsCanonical.ts:42` |
| key | text | no | key: string | `src/persistence/types/urlsCanonical.ts:43` |
| url_key | text | no | urlKey: string | `src/persistence/types/urlsCanonical.ts:44` |
| client_key | text | yes | clientKey: string \| null | `src/persistence/types/urlsCanonical.ts:45` |
| usage | text | no | usage: string | `src/persistence/types/urlsCanonical.ts:46` |
| source_owner | text | no | sourceOwner: string | `src/persistence/types/urlsCanonical.ts:47` |
| status | text | no | status: string | `src/persistence/types/urlsCanonical.ts:48` |
| display_id | bigint | no | displayId: number | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy: string \| null | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference: string \| null | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
url_key text not null references public.url_definitions(key),
client_key text references public.clients(key),
usage text not null,
source_owner text not null,
status text not null check (status in ('documented','unresolved')),
display_id bigint not null unique check (display_id > 0),
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(url_key) → public.url_definitions(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(client_key) → public.clients(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `source_owner`, `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609280001_canonical_normalization.sql:814`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## user roles

Table: `user_roles`. User-to-role assignments. Created at `supabase/migrations/202609240001_initial_portal_schema.sql:77`. Current ownership: Identity/access record; public users and auth.users are separate (F07).

Contract: `UserRole`; adapter key: `userRoles`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | uuid | no | id: string | `src/persistence/types/operations.ts:37` |
| user_id | uuid | no | userId: string | `src/persistence/types/operations.ts:37` |
| role_id | uuid | no | roleId: string | `src/persistence/types/operations.ts:37` |
| created_at | timestamptz | no | createdAt: string | `src/persistence/types/operations.ts:37` |

```sql
id uuid primary key default gen_random_uuid(),
user_id uuid not null references public.users on delete cascade,
role_id uuid not null references public.roles on delete cascade,
created_at timestamptz not null default now(),
unique(user_id, role_id)
```

Enforced foreign keys:

- `(user_id) → public.users(id)`; required; multiple children permitted; delete cascade; update NO ACTION.
- `(role_id) → public.roles(id)`; required; multiple children permitted; delete cascade; update NO ACTION.

Additive migration history:

- `supabase/migrations/202609240001_initial_portal_schema.sql:99`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## user scopes

Table: `user_scopes`. User access scope assignments with polymorphic target. Created at `supabase/migrations/202609240001_initial_portal_schema.sql:78`. Current ownership: Identity/access record; public users and auth.users are separate (F07).

Contract: `UserScope`; adapter key: `userScopes`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | uuid | no | id: string | `src/persistence/types/operations.ts:39` |
| user_id | uuid | no | userId: string | `src/persistence/types/operations.ts:39` |
| scope_type | text | no | scopeType: UserScopeType | `src/persistence/types/operations.ts:39` |
| scope_id | uuid | yes | scopeId: string \| null | `src/persistence/types/operations.ts:39` |
| created_at | timestamptz | no | createdAt: string | `src/persistence/types/operations.ts:39` |

```sql
id uuid primary key default gen_random_uuid(),
user_id uuid not null references public.users on delete cascade,
scope_type text not null check (scope_type in ('global','organization','client','site','advisor')),
scope_id uuid,
created_at timestamptz not null default now()
```

Enforced foreign keys:

- `(user_id) → public.users(id)`; required; multiple children permitted; delete cascade; update NO ACTION.

Unenforced reference or vocabulary candidates: `scope_type`, `scope_id`. These require semantic review; a vocabulary field is not automatically an entity reference.

Additive migration history:

- `supabase/migrations/202609240001_initial_portal_schema.sql:100`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## users

Table: `users`. Portal user profiles, separate from Supabase auth identities. Created at `supabase/migrations/202609240001_initial_portal_schema.sql:40`. Current ownership: Identity/access record; public users and auth.users are separate (F07).

Contract: `PortalUser`; adapter key: `users`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | uuid | no | id: string | `src/persistence/types/operations.ts:35` |
| email | text | no | email: string | `src/persistence/types/operations.ts:35` |
| display_name | text | no | displayName: string | `src/persistence/types/operations.ts:35` |
| status | record_status | no | status: RecordStatus | `src/persistence/types/operations.ts:35` |
| created_at | timestamptz | no | createdAt: string | `src/persistence/types/common.ts:13` |
| updated_at | timestamptz | no | updatedAt: string | `src/persistence/types/common.ts:13` |

```sql
id uuid primary key default gen_random_uuid(),
email text not null unique,
display_name text not null,
status record_status not null default 'active',
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
```

No foreign keys.

Additive migration history:

- `supabase/migrations/202609240001_initial_portal_schema.sql:98`: enable row level security

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.

## validation rules

Table: `validation_rules`. Field validation definitions. Created at `supabase/migrations/202609240003_portal_library.sql:228`. Current ownership: Shared catalog or source-evidence child; no organization/client/site owner column.

Contract: `ValidationRuleRow`; adapter key: `validationRules`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.

| Column | SQL type | SQL nullable | Contract field and type | Definition source |
| --- | --- | --- | --- | --- |
| id | text | no | id: string | `src/persistence/types/catalog.ts:4` |
| key | text | no | key: string | `src/persistence/types/catalog.ts:4` |
| position | integer | no | position: number | `src/persistence/types/catalog.ts:4` |
| field_key | text | no | fieldKey: string | `src/persistence/types/template.ts:11` |
| definition | jsonb | no | definition: { required?: boolean; format?: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/fields").FieldDefinition["format"]; inputType: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/fields").FieldDefinition["inputType"]; } | `src/persistence/types/catalog.ts:4` |
| display_id | bigint | no | displayId?: number \| undefined | `src/domain/provenance.ts:4` |
| provided_by | text | yes | providedBy?: string \| null \| undefined | `src/domain/provenance.ts:5` |
| source_reference | text | yes | sourceReference?: string \| null \| undefined | `src/domain/provenance.ts:6` |

```sql
id text primary key,
key text not null unique,
position integer not null default 0,
field_key text not null references public.fields(key),
definition jsonb not null check (jsonb_typeof(definition) = 'object'),
display_id bigint generated by default as identity unique,
provided_by text references public.provenance_tags(key),
source_reference text
```

Enforced foreign keys:

- `(field_key) → public.fields(key)`; required; multiple children permitted; delete NO ACTION; update NO ACTION.
- `(provided_by) → public.provenance_tags(key)`; nullable/MATCH SIMPLE; multiple children permitted; delete NO ACTION; update NO ACTION.

Unenforced reference or vocabulary candidates: `display_id`, `source_reference`. These require semantic review; a vocabulary field is not automatically an entity reference.

JSON surfaces: `definition` (1 observed candidate paths). Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.

Additive migration history:

- `supabase/migrations/202609240003_portal_library.sql:235`: enable row level security
- `supabase/migrations/202609280001_canonical_normalization.sql:922`: add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text

RLS enabled: yes. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.
