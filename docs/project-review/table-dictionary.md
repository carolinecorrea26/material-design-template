# Current table dictionary

Captured PostgreSQL columns and constraints joined to current TypeScript contracts and detached reviewed/operational seeds. All 147 public tables; auth.users is external. See [ownership](ownership.md), [references](references.md), [relationships](relationships.md), and [limits and blockers](README.md). Types, nullability and defaults below are SQL values. Dedicated RPC tables intentionally have no generic CRUD contract. SQL checks are not browser fallback enforcement.

## aggregate limits

`aggregate_limits`: Coverage/product/role aggregate maximum or formula.

Owner: Site-scoped or optional Site dimension; inspect nullable links and any paired Association target. Group: library-rules. RLS: true. Contract: AggregateLimits. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L117) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L118) |
| category_key | text | true | — | categoryKey: string \| null | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L119) |
| product_key | text | true | — | productKey: string \| null | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L120) |
| applicant_type_key | text | true | — | applicantTypeKey: string \| null | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L121) |
| maximum | numeric | true | — | maximum: number \| null | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L122) |
| formula | text | true | — | formula: string \| null | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L123) |
| condition_key | text | true | — | conditionKey: string \| null | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L124) |
| site_key | text | true | — | siteKey: string \| null | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L125) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
aggregate_limits_applicant_type_key_fkey: FOREIGN KEY (applicant_type_key) REFERENCES applicant_types(key)
aggregate_limits_category_key_fkey: FOREIGN KEY (category_key) REFERENCES coverage_categories(key)
aggregate_limits_condition_key_fkey: FOREIGN KEY (condition_key) REFERENCES conditions(key)
aggregate_limits_display_id_check: CHECK ((display_id > 0))
aggregate_limits_display_id_key: UNIQUE (display_id)
aggregate_limits_key_key: UNIQUE (key)
aggregate_limits_pkey: PRIMARY KEY (id)
aggregate_limits_product_key_fkey: FOREIGN KEY (product_key) REFERENCES products(key)
aggregate_limits_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
aggregate_limits_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## amount bands

`amount_bands`: Conditional amount ranges/increments.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-rules. RLS: true. Contract: AmountBands. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L77) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L78) |
| amount_pattern_key | text | false | — | amountPatternKey: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L79) |
| minimum | numeric | true | — | minimum: number \| null | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L80) |
| maximum | numeric | true | — | maximum: number \| null | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L81) |
| increment | numeric | true | — | increment: number \| null | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L82) |
| condition_key | text | true | — | conditionKey: string \| null | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L83) |
| position | integer | false | — | position: number | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L84) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
amount_bands_amount_pattern_key_fkey: FOREIGN KEY (amount_pattern_key) REFERENCES coverage_amount_patterns(key)
amount_bands_condition_key_fkey: FOREIGN KEY (condition_key) REFERENCES conditions(key)
amount_bands_display_id_check: CHECK ((display_id > 0))
amount_bands_display_id_key: UNIQUE (display_id)
amount_bands_key_key: UNIQUE (key)
amount_bands_pkey: PRIMARY KEY (id)
amount_bands_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## amount options

`amount_options`: Ordered named amount choices.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-rules. RLS: true. Contract: AmountOptions. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L69) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L70) |
| amount_pattern_key | text | false | — | amountPatternKey: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L71) |
| value | text | false | — | value: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L72) |
| label | text | false | — | label: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L73) |
| position | integer | false | — | position: number | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L74) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
amount_options_amount_pattern_key_fkey: FOREIGN KEY (amount_pattern_key) REFERENCES coverage_amount_patterns(key)
amount_options_display_id_check: CHECK ((display_id > 0))
amount_options_display_id_key: UNIQUE (display_id)
amount_options_key_key: UNIQUE (key)
amount_options_pkey: PRIMARY KEY (id)
amount_options_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## analytics measurements

`analytics_measurements`: Sourced period measurements by optional client, site and device.

Owner: Site-scoped or optional Site dimension; inspect nullable links and any paired Association target. Group: analytics. RLS: true. Contract: AnalyticsMeasurement. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/operations.ts#L61) |
| metric_key | text | false | — | metricKey: string | [contract](../../src/persistence/types/operations.ts#L61) |
| period_start | date | false | — | periodStart: string | [contract](../../src/persistence/types/operations.ts#L61) |
| period_end | date | false | — | periodEnd: string | [contract](../../src/persistence/types/operations.ts#L61) |
| period_type | text | false | — | periodType: "month" \| "ytd" \| "year" | [contract](../../src/persistence/types/operations.ts#L61) |
| site_id | uuid | true | — | siteId: string \| null | [contract](../../src/persistence/types/operations.ts#L62) |
| client_id | uuid | true | — | clientId: string \| null | [contract](../../src/persistence/types/operations.ts#L62) |
| device | text | true | — | device: "desktop" \| "mobile" \| null | [contract](../../src/persistence/types/operations.ts#L62) |
| value | numeric | false | — | value: number | [contract](../../src/persistence/types/operations.ts#L62) |
| source_report | text | false | — | sourceReport: string | [contract](../../src/persistence/types/operations.ts#L63) |
| source_system | text | false | — | sourceSystem: string | [contract](../../src/persistence/types/operations.ts#L63) |
| definition_version | text | false | — | definitionVersion: string | [contract](../../src/persistence/types/operations.ts#L63) |
| notes | text | true | — | notes: string \| null | [contract](../../src/persistence/types/operations.ts#L63) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| updated_at | timestamp with time zone | false | now() | updatedAt: string | [contract](../../src/persistence/types/common.ts#L13) |

Installed constraints:

```sql
analytics_measurements_check: CHECK ((period_end >= period_start))
analytics_measurements_client_id_fkey: FOREIGN KEY (client_id) REFERENCES clients(id)
analytics_measurements_device_check: CHECK ((device = ANY (ARRAY['desktop'::text, 'mobile'::text])))
analytics_measurements_metric_key_fkey: FOREIGN KEY (metric_key) REFERENCES analytics_metrics(metric_key)
analytics_measurements_period_type_check: CHECK ((period_type = ANY (ARRAY['month'::text, 'ytd'::text, 'year'::text])))
analytics_measurements_pkey: PRIMARY KEY (id)
analytics_measurements_site_id_fkey: FOREIGN KEY (site_id) REFERENCES sites(id)
```

Migration sources mentioning this table: [supabase/migrations/202609240002_analytics_domain.sql](../../supabase/migrations/202609240002_analytics_domain.sql), [supabase/migrations/202610120003_relationship_integrity.sql](../../supabase/migrations/202610120003_relationship_integrity.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [analytics_measurements_natural_key](../../supabase/migrations/202609240002_analytics_domain.sql#L31): `create unique index analytics_measurements_natural_key   on public.analytics_measurements (     metric_key, period_start, period_end, period_type,     coalesce(site_id, '00000000-0000-0000-0000-000000000000'::uuid),     coalesce(client_id, '00000000-0000-0000-0000-000000000000'::uuid),     coalesce(device, '')   );`
- [analytics_measurements_period_idx](../../supabase/migrations/202609240002_analytics_domain.sql#L38): `create index analytics_measurements_period_idx on public.analytics_measurements(metric_key, period_start, period_end);`
- [analytics_measurements_site_idx](../../supabase/migrations/202609240002_analytics_domain.sql#L39): `create index analytics_measurements_site_idx on public.analytics_measurements(site_id, metric_key, period_start) where site_id is not null;`
- [analytics_measurements_owner_guard](../../supabase/migrations/202610120003_relationship_integrity.sql#L94): `create trigger analytics_measurements_owner_guard before insert or update on public.analytics_measurements for each row execute function public.check_site_owner_pair();`

## analytics metrics

`analytics_metrics`: Measurement definitions and units.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: analytics. RLS: true. Contract: AnalyticsMetric. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/operations.ts#L58) |
| metric_key | text | false | — | metricKey: string | [contract](../../src/persistence/types/operations.ts#L58) |
| name | text | false | — | name: string | [contract](../../src/persistence/types/operations.ts#L58) |
| description | text | false | ''::text | description: string | [contract](../../src/persistence/types/operations.ts#L58) |
| unit | text | false | — | unit: AnalyticsUnit | [contract](../../src/persistence/types/operations.ts#L58) |
| source | text | false | — | source: string | [contract](../../src/persistence/types/operations.ts#L58) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| updated_at | timestamp with time zone | false | now() | updatedAt: string | [contract](../../src/persistence/types/common.ts#L13) |

Installed constraints:

```sql
analytics_metrics_metric_key_key: UNIQUE (metric_key)
analytics_metrics_pkey: PRIMARY KEY (id)
analytics_metrics_unit_check: CHECK ((unit = ANY (ARRAY['count'::text, 'percent'::text, 'percentage_points'::text, 'duration_seconds'::text])))
```

Migration sources mentioning this table: [supabase/migrations/202609240002_analytics_domain.sql](../../supabase/migrations/202609240002_analytics_domain.sql). Mentions include references and function bodies, not just table declarations.

## analytics tags

`analytics_tags`: Interaction instrumentation definitions and vendor mapping metadata.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: analytics. RLS: true. Contract: AnalyticsTag. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/domain/analytics.ts#L4) |
| page_id | text | false | — | pageId: string | [contract](../../src/domain/analytics.ts#L4) |
| element_key | text | false | — | elementKey: string | [contract](../../src/domain/analytics.ts#L4) |
| label | text | false | — | label: string | [contract](../../src/domain/analytics.ts#L4) |
| kind | text | false | — | kind: AnalyticsElementKind | [contract](../../src/domain/analytics.ts#L4) |
| events | jsonb | false | '[]'::jsonb | events: AnalyticsEvent[] | [contract](../../src/domain/analytics.ts#L5) |
| trigger | text | false | — | trigger: string | [contract](../../src/domain/analytics.ts#L5) |
| sites | jsonb | false | '[]'::jsonb | sites: string[] | [contract](../../src/domain/analytics.ts#L5) |
| status | text | false | — | status: "local-hook" \| "proposed" | [contract](../../src/domain/analytics.ts#L7) |
| permitted_properties | jsonb | false | '[]'::jsonb | permittedProperties: readonly string[] | [contract](../../src/domain/analytics.ts#L7) |
| description | text | false | — | description: string | [contract](../../src/domain/analytics.ts#L8) |
| source | text | false | — | source: "prototype-definition" \| "proposed-interaction" \| "shared-component" \| "component-definition" | [contract](../../src/domain/analytics.ts#L9) |
| source_file | text | false | — | sourceFile: string | [contract](../../src/domain/analytics.ts#L10) |
| condition | text | false | — | condition: string | [contract](../../src/domain/analytics.ts#L10) |
| adobe | jsonb | false | — | adobe: { mapping: string \| null; status: "not-configured"; } | [contract](../../src/domain/analytics.ts#L11) |
| contentsquare | jsonb | false | — | contentsquare: { mapping: string \| null; status: "not-configured"; } | [contract](../../src/domain/analytics.ts#L12) |

Installed constraints:

```sql
analytics_tags_pkey: PRIMARY KEY (id)
```

Migration sources mentioning this table: [supabase/migrations/202610050002_analytics_tags.sql](../../supabase/migrations/202610050002_analytics_tags.sql). Mentions include references and function bodies, not just table declarations.

## applicant types

`applicant_types`: Applicant-role metadata, not people.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: catalog. RLS: true. Contract: ApplicantTypeRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/catalog.ts#L4) |
| definition | jsonb | false | — | definition: { label: string; applicantType: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/coverage").CoverageApplicantId; } | [contract](../../src/persistence/types/catalog.ts#L4) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
applicant_types_definition_check: CHECK ((jsonb_typeof(definition) = 'object'::text))
applicant_types_display_id_key: UNIQUE (display_id)
applicant_types_key_key: UNIQUE (key)
applicant_types_pkey: PRIMARY KEY (id)
applicant_types_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610120002_application_relationships.sql](../../supabase/migrations/202610120002_application_relationships.sql), [supabase/migrations/202610120005_application_storage.sql](../../supabase/migrations/202610120005_application_storage.sql). Mentions include references and function bodies, not just table declarations.

## applicants

`applicants`: People in hosting Association tenancy, independent of sign-in accounts.

Owner: Hosting Association via legacy client_id; selected Association belongs to application context. Group: applications. RLS: true. Contract: Applicant. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/applicants.ts#L5) |
| client_id | uuid | false | — | clientId: string | [contract](../../src/persistence/types/applicants.ts#L6) |
| display_name | text | false | — | displayName: string | [contract](../../src/persistence/types/applicants.ts#L7) |
| email | text | true | — | email: string \| null | [contract](../../src/persistence/types/applicants.ts#L8) |
| status | record_status | false | 'active'::record_status | status: RecordStatus | [contract](../../src/persistence/types/applicants.ts#L9) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| updated_at | timestamp with time zone | false | now() | updatedAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| deleted_at | timestamp with time zone | true | — | deletedAt: string \| null | [contract](../../src/persistence/types/common.ts#L14) |

Installed constraints:

```sql
applicants_client_id_fkey: FOREIGN KEY (client_id) REFERENCES clients(id)
applicants_display_name_check: CHECK ((length(btrim(display_name)) > 0))
applicants_id_client_id_key: UNIQUE (id, client_id)
applicants_pkey: PRIMARY KEY (id)
```

Migration sources mentioning this table: [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120002_application_relationships.sql](../../supabase/migrations/202610120002_application_relationships.sql), [supabase/migrations/202610120003_relationship_integrity.sql](../../supabase/migrations/202610120003_relationship_integrity.sql), [supabase/migrations/202610120005_application_storage.sql](../../supabase/migrations/202610120005_application_storage.sql), [supabase/migrations/202610120009_application_context_history.sql](../../supabase/migrations/202610120009_application_context_history.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [applicants_client_id_idx](../../supabase/migrations/202610120002_application_relationships.sql#L51): `create index applicants_client_id_idx on public.applicants(client_id) where deleted_at is null;`

## application answers

`application_answers`: Field answers with optional person and repeat occurrence.

Owner: Application child via application_id; Site/Association/person dimensions must agree where present. Group: applications. RLS: true. Contract: ApplicationAnswer. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/structure.ts#L34) |
| application_id | uuid | false | — | applicationId: string | [contract](../../src/persistence/types/structure.ts#L34) |
| application_applicant_id | uuid | true | — | applicationApplicantId: string \| null | [contract](../../src/persistence/types/structure.ts#L34) |
| field_key | text | false | — | fieldKey: string | [contract](../../src/persistence/types/structure.ts#L35) |
| occurrence_key | text | false | ''::text | occurrenceKey: string | [contract](../../src/persistence/types/structure.ts#L35) |
| value_json | jsonb | false | — | valueJson: Json | [contract](../../src/persistence/types/structure.ts#L35) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| updated_at | timestamp with time zone | false | now() | updatedAt: string | [contract](../../src/persistence/types/common.ts#L13) |

Installed constraints:

```sql
application_answers_application_applicant_id_application_i_fkey: FOREIGN KEY (application_applicant_id, application_id) REFERENCES application_applicants(id, application_id)
application_answers_application_id_application_applicant_id_key: UNIQUE NULLS NOT DISTINCT (application_id, application_applicant_id, field_key, occurrence_key)
application_answers_application_id_fkey: FOREIGN KEY (application_id) REFERENCES applications(id)
application_answers_field_key_fkey: FOREIGN KEY (field_key) REFERENCES fields(key)
application_answers_pkey: PRIMARY KEY (id)
```

Migration sources mentioning this table: [supabase/migrations/202610120005_application_storage.sql](../../supabase/migrations/202610120005_application_storage.sql), [supabase/migrations/202610120009_application_context_history.sql](../../supabase/migrations/202610120009_application_context_history.sql), [supabase/migrations/202610130001_application_selection_integrity.sql](../../supabase/migrations/202610130001_application_selection_integrity.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [application_answers_field_idx](../../supabase/migrations/202610120005_application_storage.sql#L230): `create index application_answers_field_idx on public.application_answers(field_key);`
- [application_answers_history](../../supabase/migrations/202610120005_application_storage.sql#L198): `create trigger application_answers_history before insert or update or delete on public.application_answers for each row execute function public.guard_operational_selection_write();`

## application applicants

`application_applicants`: People and applicant roles on applications with tenant consistency columns.

Owner: Application child via application_id; Site/Association/person dimensions must agree where present. Group: applications. RLS: true. Contract: ApplicationApplicant. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/applicants.ts#L14) |
| application_id | uuid | false | — | applicationId: string | [contract](../../src/persistence/types/applicants.ts#L15) |
| site_id | uuid | false | — | siteId: string | [contract](../../src/persistence/types/applicants.ts#L16) |
| client_id | uuid | false | — | clientId: string | [contract](../../src/persistence/types/applicants.ts#L17) |
| applicant_id | uuid | false | — | applicantId: string | [contract](../../src/persistence/types/applicants.ts#L18) |
| applicant_type_key | text | false | — | applicantTypeKey: string | [contract](../../src/persistence/types/applicants.ts#L19) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| updated_at | timestamp with time zone | false | now() | updatedAt: string | [contract](../../src/persistence/types/common.ts#L13) |

Installed constraints:

```sql
application_applicants_applicant_id_client_id_fkey: FOREIGN KEY (applicant_id, client_id) REFERENCES applicants(id, client_id)
application_applicants_applicant_type_key_fkey: FOREIGN KEY (applicant_type_key) REFERENCES applicant_types(key)
application_applicants_application_id_applicant_id_key: UNIQUE (application_id, applicant_id)
application_applicants_application_id_site_id_fkey: FOREIGN KEY (application_id, site_id) REFERENCES applications(id, site_id)
application_applicants_identity: UNIQUE (id, application_id)
application_applicants_pkey: PRIMARY KEY (id)
application_applicants_site_id_client_id_fkey: FOREIGN KEY (site_id, client_id) REFERENCES sites(id, client_id)
application_person_role_identity: UNIQUE (id, application_id, applicant_type_key)
```

Migration sources mentioning this table: [supabase/migrations/202610120002_application_relationships.sql](../../supabase/migrations/202610120002_application_relationships.sql), [supabase/migrations/202610120005_application_storage.sql](../../supabase/migrations/202610120005_application_storage.sql), [supabase/migrations/202610130001_application_selection_integrity.sql](../../supabase/migrations/202610130001_application_selection_integrity.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [application_applicants_applicant_id_idx](../../supabase/migrations/202610120002_application_relationships.sql#L52): `create index application_applicants_applicant_id_idx on public.application_applicants(applicant_id);`
- [application_applicants_site_client_idx](../../supabase/migrations/202610120002_application_relationships.sql#L53): `create index application_applicants_site_client_idx on public.application_applicants(site_id, client_id);`
- [application_person_history](../../supabase/migrations/202610130001_application_selection_integrity.sql#L78): `create trigger application_person_history before insert or update or delete on public.application_applicants   for each row execute function public.guard_operational_selection_write();`

## application associations

`application_associations`: Optional single association selected for an application.

Owner: Application child via application_id; Site/Association/person dimensions must agree where present. Group: applications. RLS: true. Contract: ApplicationAssociation. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/applicants.ts#L24) |
| application_id | uuid | false | — | applicationId: string | [contract](../../src/persistence/types/applicants.ts#L25) |
| site_id | uuid | false | — | siteId: string | [contract](../../src/persistence/types/applicants.ts#L26) |
| site_key | text | false | — | siteKey: string | [contract](../../src/persistence/types/applicants.ts#L27) |
| association_key | text | true | — | associationKey: string \| null | [contract](../../src/persistence/types/applicants.ts#L28) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| updated_at | timestamp with time zone | false | now() | updatedAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| association_entity_id | uuid | true | — | associationEntityId?: string \| null \| undefined | [contract](../../src/persistence/types/applicants.ts#L29) |

Installed constraints:

```sql
application_association_canonical_site: FOREIGN KEY (site_id, association_entity_id) REFERENCES site_association_contexts(site_id, association_id)
application_association_entity_unique: UNIQUE (application_id, association_entity_id)
application_association_identity_required: CHECK (((association_key IS NOT NULL) OR (association_entity_id IS NOT NULL)))
application_associations_application_id_key: UNIQUE (application_id)
application_associations_application_id_site_id_fkey: FOREIGN KEY (application_id, site_id) REFERENCES applications(id, site_id)
application_associations_association_entity_id_fkey: FOREIGN KEY (association_entity_id) REFERENCES association_entities(id)
application_associations_pkey: PRIMARY KEY (id)
application_associations_site_id_site_key_fkey: FOREIGN KEY (site_id, site_key) REFERENCES sites(id, key)
application_associations_site_key_association_key_fkey: FOREIGN KEY (site_key, association_key) REFERENCES site_associations(site_key, association_key)
```

Migration sources mentioning this table: [supabase/migrations/202610120002_application_relationships.sql](../../supabase/migrations/202610120002_application_relationships.sql), [supabase/migrations/202610120005_application_storage.sql](../../supabase/migrations/202610120005_application_storage.sql), [supabase/migrations/202610120009_application_context_history.sql](../../supabase/migrations/202610120009_application_context_history.sql), [supabase/migrations/202610130001_application_selection_integrity.sql](../../supabase/migrations/202610130001_application_selection_integrity.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [application_associations_site_association_idx](../../supabase/migrations/202610120002_application_relationships.sql#L54): `create index application_associations_site_association_idx on public.application_associations(site_key, association_key);`
- [application_associations_canonical](../../supabase/migrations/202610120005_application_storage.sql#L110): `create trigger application_associations_canonical before insert or update on public.application_associations   for each row execute function public.resolve_application_association_reference();`
- [application_association_history](../../supabase/migrations/202610130001_application_selection_integrity.sql#L76): `create trigger application_association_history before insert or update or delete on public.application_associations   for each row execute function public.guard_operational_selection_write();`

## application coverages

`application_coverages`: Application selections linked to Site products and optional application people.

Owner: Application child via application_id; Site/Association/person dimensions must agree where present. Group: applications. RLS: true. Contract: ApplicationCoverage. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/structure.ts#L25) |
| application_id | uuid | false | — | applicationId: string | [contract](../../src/persistence/types/structure.ts#L25) |
| site_id | uuid | false | — | siteId: string | [contract](../../src/persistence/types/structure.ts#L25) |
| application_applicant_id | uuid | true | — | applicationApplicantId: string \| null | [contract](../../src/persistence/types/structure.ts#L25) |
| applicant_type_key | text | false | — | applicantTypeKey: string | [contract](../../src/persistence/types/structure.ts#L26) |
| product_key | text | false | — | productKey: string | [contract](../../src/persistence/types/structure.ts#L26) |
| association_entity_id | uuid | true | — | associationEntityId: string \| null | [contract](../../src/persistence/types/structure.ts#L26) |
| selection_key | text | false | ''::text | selectionKey: string | [contract](../../src/persistence/types/structure.ts#L27) |
| amount | numeric | true | — | amount: number \| null | [contract](../../src/persistence/types/structure.ts#L27) |
| selections | jsonb | false | '{}'::jsonb | selections: Json | [contract](../../src/persistence/types/structure.ts#L27) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| updated_at | timestamp with time zone | false | now() | updatedAt: string | [contract](../../src/persistence/types/common.ts#L13) |

Installed constraints:

```sql
application_coverage_person_role: FOREIGN KEY (application_applicant_id, application_id, applicant_type_key) REFERENCES application_applicants(id, application_id, applicant_type_key)
application_coverages_amount_check: CHECK (((amount IS NULL) OR (amount >= (0)::numeric)))
application_coverages_applicant_type_key_fkey: FOREIGN KEY (applicant_type_key) REFERENCES applicant_types(key)
application_coverages_application_applicant_id_application_fkey: FOREIGN KEY (application_applicant_id, application_id) REFERENCES application_applicants(id, application_id)
application_coverages_application_id_application_applicant__key: UNIQUE NULLS NOT DISTINCT (application_id, application_applicant_id, applicant_type_key, product_key, selection_key)
application_coverages_application_id_association_entity_id_fkey: FOREIGN KEY (application_id, association_entity_id) REFERENCES application_associations(application_id, association_entity_id)
application_coverages_application_id_site_id_fkey: FOREIGN KEY (application_id, site_id) REFERENCES applications(id, site_id)
application_coverages_id_application_id_product_key_key: UNIQUE (id, application_id, product_key)
application_coverages_pkey: PRIMARY KEY (id)
application_coverages_site_id_product_key_fkey: FOREIGN KEY (site_id, product_key) REFERENCES site_products(site_id, product_key)
```

Migration sources mentioning this table: [supabase/migrations/202610120005_application_storage.sql](../../supabase/migrations/202610120005_application_storage.sql), [supabase/migrations/202610120009_application_context_history.sql](../../supabase/migrations/202610120009_application_context_history.sql), [supabase/migrations/202610130001_application_selection_integrity.sql](../../supabase/migrations/202610130001_application_selection_integrity.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [application_coverages_application_idx](../../supabase/migrations/202610120005_application_storage.sql#L227): `create index application_coverages_application_idx on public.application_coverages(application_id);`
- [application_coverages_applicant_idx](../../supabase/migrations/202610120005_application_storage.sql#L228): `create index application_coverages_applicant_idx on public.application_coverages(application_applicant_id);`
- [application_coverages_history](../../supabase/migrations/202610120005_application_storage.sql#L196): `create trigger application_coverages_history before insert or update or delete on public.application_coverages for each row execute function public.guard_operational_selection_write();`
- [application_coverage_availability](../../supabase/migrations/202610130001_application_selection_integrity.sql#L27): `create trigger application_coverage_availability before insert or update on public.application_coverages   for each row execute function public.check_application_coverage_availability();`

## application events

`application_events`: Application workflow/status history.

Owner: Application child via application_id; Site/Association/person dimensions must agree where present. Group: applications. RLS: true. Contract: ApplicationEvent. Access: Mock server operational arrays; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/operations.ts#L15) |
| application_id | uuid | false | — | applicationId: string | [contract](../../src/persistence/types/operations.ts#L15) |
| event_type | text | false | — | eventType: string | [contract](../../src/persistence/types/operations.ts#L15) |
| from_status | application_status | true | — | fromStatus: "In Progress" \| "Pending TPA Review" \| "Underwriting" \| "Waiting for Advisor" \| "Completed" \| "Rejected" \| null | [contract](../../src/persistence/types/operations.ts#L15) |
| to_status | application_status | true | — | toStatus: "In Progress" \| "Pending TPA Review" \| "Underwriting" \| "Waiting for Advisor" \| "Completed" \| "Rejected" \| null | [contract](../../src/persistence/types/operations.ts#L16) |
| from_owner_type | action_owner_type | true | — | fromOwnerType: "Applicant" \| "Advisor" \| "TPA" \| "NYL" \| "None" \| null | [contract](../../src/persistence/types/operations.ts#L16) |
| to_owner_type | action_owner_type | true | — | toOwnerType: "Applicant" \| "Advisor" \| "TPA" \| "NYL" \| "None" \| null | [contract](../../src/persistence/types/operations.ts#L16) |
| performed_by | text | false | — | performedBy: string | [contract](../../src/persistence/types/operations.ts#L17) |
| notes | text | true | — | notes: string \| null | [contract](../../src/persistence/types/operations.ts#L17) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/operations.ts#L17) |
| actor_id | uuid | false | — | actorId?: string \| undefined | [contract](../../src/persistence/types/operations.ts#L18) |
| from_owner_actor_id | uuid | true | — | fromOwnerActorId?: string \| null \| undefined | [contract](../../src/persistence/types/operations.ts#L19) |
| to_owner_actor_id | uuid | true | — | toOwnerActorId?: string \| null \| undefined | [contract](../../src/persistence/types/operations.ts#L19) |

Installed constraints:

```sql
application_events_actor_id_fkey: FOREIGN KEY (actor_id) REFERENCES portal_actors(id)
application_events_application_id_fkey: FOREIGN KEY (application_id) REFERENCES applications(id)
application_events_from_owner_actor_id_fkey: FOREIGN KEY (from_owner_actor_id) REFERENCES portal_actors(id)
application_events_pkey: PRIMARY KEY (id)
application_events_to_owner_actor_id_fkey: FOREIGN KEY (to_owner_actor_id) REFERENCES portal_actors(id)
```

Migration sources mentioning this table: [supabase/migrations/202609240001_initial_portal_schema.sql](../../supabase/migrations/202609240001_initial_portal_schema.sql), [supabase/migrations/202610120005_application_storage.sql](../../supabase/migrations/202610120005_application_storage.sql), [supabase/migrations/202610120009_application_context_history.sql](../../supabase/migrations/202610120009_application_context_history.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [application_events_application_id_idx](../../supabase/migrations/202609240001_initial_portal_schema.sql#L87): `create index application_events_application_id_idx on public.application_events(application_id, created_at desc);`
- [application_events_actor_idx](../../supabase/migrations/202610120005_application_storage.sql#L233): `create index application_events_actor_idx on public.application_events(actor_id);`
- [application_events_actor](../../supabase/migrations/202610120005_application_storage.sql#L57): `create trigger application_events_actor before insert or update on public.application_events for each row execute function public.fill_operational_actor_references();`
- [application_events_history_immutable](../../supabase/migrations/202610120009_application_context_history.sql#L93): `create trigger application_events_history_immutable before update or delete on public.application_events for each row execute function public.guard_published_configuration_history();`

## application participants

`application_participants`: Workflow participants with optional public-user link and copied contact details.

Owner: Application child via application_id; Site/Association/person dimensions must agree where present. Group: applications. RLS: true. Contract: ApplicationParticipant. Access: Mock server operational arrays; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/operations.ts#L10) |
| application_id | uuid | false | — | applicationId: string | [contract](../../src/persistence/types/operations.ts#L10) |
| participant_type | text | false | — | participantType: string | [contract](../../src/persistence/types/operations.ts#L10) |
| user_id | uuid | true | — | userId: string \| null | [contract](../../src/persistence/types/operations.ts#L10) |
| name | text | false | — | name: string | [contract](../../src/persistence/types/operations.ts#L11) |
| email | text | false | — | email: string | [contract](../../src/persistence/types/operations.ts#L11) |
| relationship | text | true | — | relationship: string \| null | [contract](../../src/persistence/types/operations.ts#L11) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| updated_at | timestamp with time zone | false | now() | updatedAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| actor_id | uuid | true | — | actorId?: string \| null \| undefined | [contract](../../src/persistence/types/operations.ts#L12) |
| application_applicant_id | uuid | true | — | applicationApplicantId?: string \| null \| undefined | [contract](../../src/persistence/types/operations.ts#L12) |

Installed constraints:

```sql
application_participants_actor_id_fkey: FOREIGN KEY (actor_id) REFERENCES portal_actors(id)
application_participants_application_id_fkey: FOREIGN KEY (application_id) REFERENCES applications(id)
application_participants_pkey: PRIMARY KEY (id)
application_participants_user_id_fkey: FOREIGN KEY (user_id) REFERENCES users(id)
participant_application_person: FOREIGN KEY (application_applicant_id, application_id) REFERENCES application_applicants(id, application_id)
```

Migration sources mentioning this table: [supabase/migrations/202609240001_initial_portal_schema.sql](../../supabase/migrations/202609240001_initial_portal_schema.sql), [supabase/migrations/202610120005_application_storage.sql](../../supabase/migrations/202610120005_application_storage.sql), [supabase/migrations/202610120009_application_context_history.sql](../../supabase/migrations/202610120009_application_context_history.sql), [supabase/migrations/202610130001_application_selection_integrity.sql](../../supabase/migrations/202610130001_application_selection_integrity.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [application_participant_actor_role](../../supabase/migrations/202610120005_application_storage.sql#L116): `create unique index application_participant_actor_role on public.application_participants(application_id,actor_id,participant_type) where actor_id is not null;`
- [application_participant_history](../../supabase/migrations/202610130001_application_selection_integrity.sql#L80): `create trigger application_participant_history before insert or update or delete on public.application_participants   for each row execute function public.guard_operational_selection_write();`

## application riders

`application_riders`: Riders linked to exact application coverage and product assignment.

Owner: Application child via application_id; Site/Association/person dimensions must agree where present. Group: applications. RLS: true. Contract: ApplicationRider. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/structure.ts#L30) |
| application_id | uuid | false | — | applicationId: string | [contract](../../src/persistence/types/structure.ts#L30) |
| application_coverage_id | uuid | false | — | applicationCoverageId: string | [contract](../../src/persistence/types/structure.ts#L30) |
| product_key | text | false | — | productKey: string | [contract](../../src/persistence/types/structure.ts#L30) |
| product_rider_id | text | false | — | productRiderId: string | [contract](../../src/persistence/types/structure.ts#L31) |
| rider_key | text | false | — | riderKey: string | [contract](../../src/persistence/types/structure.ts#L31) |
| amount | numeric | true | — | amount: number \| null | [contract](../../src/persistence/types/structure.ts#L31) |
| selections | jsonb | false | '{}'::jsonb | selections: Json | [contract](../../src/persistence/types/structure.ts#L31) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/structure.ts#L31) |

Installed constraints:

```sql
application_riders_amount_check: CHECK (((amount IS NULL) OR (amount >= (0)::numeric)))
application_riders_application_coverage_id_application_id__fkey: FOREIGN KEY (application_coverage_id, application_id, product_key) REFERENCES application_coverages(id, application_id, product_key)
application_riders_application_coverage_id_rider_key_key: UNIQUE (application_coverage_id, rider_key)
application_riders_pkey: PRIMARY KEY (id)
application_riders_product_rider_id_product_key_rider_key_fkey: FOREIGN KEY (product_rider_id, product_key, rider_key) REFERENCES product_riders(id, product_key, rider_key)
```

Migration sources mentioning this table: [supabase/migrations/202610120005_application_storage.sql](../../supabase/migrations/202610120005_application_storage.sql), [supabase/migrations/202610120009_application_context_history.sql](../../supabase/migrations/202610120009_application_context_history.sql), [supabase/migrations/202610130001_application_selection_integrity.sql](../../supabase/migrations/202610130001_application_selection_integrity.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [application_riders_coverage_idx](../../supabase/migrations/202610120005_application_storage.sql#L229): `create index application_riders_coverage_idx on public.application_riders(application_coverage_id);`
- [application_riders_history](../../supabase/migrations/202610120005_application_storage.sql#L197): `create trigger application_riders_history before insert or update or delete on public.application_riders for each row execute function public.guard_operational_selection_write();`
- [application_rider_scope](../../supabase/migrations/202610120009_application_context_history.sql#L72): `create trigger application_rider_scope before insert or update on public.application_riders for each row execute function public.validate_rider_application_scope();`

## application snapshots

`application_snapshots`: Immutable configuration, answer, coverage, participant and Association capture.

Owner: Application child via application_id; Site/Association/person dimensions must agree where present. Group: applications. RLS: true. Contract: ApplicationSnapshot. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/structure.ts#L38) |
| application_id | uuid | false | — | applicationId: string | [contract](../../src/persistence/types/structure.ts#L38) |
| site_id | uuid | false | — | siteId: string | [contract](../../src/persistence/types/structure.ts#L38) |
| site_key | text | false | — | siteKey: string | [contract](../../src/persistence/types/structure.ts#L38) |
| association_entity_id | uuid | true | — | associationEntityId: string \| null | [contract](../../src/persistence/types/structure.ts#L38) |
| configuration_release_id | uuid | false | — | configurationReleaseId: string | [contract](../../src/persistence/types/structure.ts#L39) |
| version | integer | false | — | version: number | [contract](../../src/persistence/types/structure.ts#L39) |
| configuration_snapshot | jsonb | false | — | configurationSnapshot: Json | [contract](../../src/persistence/types/structure.ts#L39) |
| answers_snapshot | jsonb | false | — | answersSnapshot: Json | [contract](../../src/persistence/types/structure.ts#L40) |
| coverages_snapshot | jsonb | false | — | coveragesSnapshot: Json | [contract](../../src/persistence/types/structure.ts#L40) |
| participants_snapshot | jsonb | false | — | participantsSnapshot: Json | [contract](../../src/persistence/types/structure.ts#L40) |
| association_snapshot | jsonb | false | — | associationSnapshot: Json | [contract](../../src/persistence/types/structure.ts#L40) |
| payload_hash | text | false | — | payloadHash: string | [contract](../../src/persistence/types/structure.ts#L41) |
| captured_by | uuid | false | — | capturedBy: string | [contract](../../src/persistence/types/structure.ts#L41) |
| captured_at | timestamp with time zone | false | now() | capturedAt: string | [contract](../../src/persistence/types/structure.ts#L41) |

Installed constraints:

```sql
application_snapshots_answers_snapshot_check: CHECK ((jsonb_typeof(answers_snapshot) = 'array'::text))
application_snapshots_application_id_association_entity_id_fkey: FOREIGN KEY (application_id, association_entity_id) REFERENCES application_associations(application_id, association_entity_id)
application_snapshots_application_id_site_id_fkey: FOREIGN KEY (application_id, site_id) REFERENCES applications(id, site_id)
application_snapshots_application_id_version_key: UNIQUE (application_id, version)
application_snapshots_association_entity_id_fkey: FOREIGN KEY (association_entity_id) REFERENCES association_entities(id)
application_snapshots_association_snapshot_check: CHECK ((jsonb_typeof(association_snapshot) = 'object'::text))
application_snapshots_captured_by_fkey: FOREIGN KEY (captured_by) REFERENCES portal_actors(id)
application_snapshots_configuration_release_id_fkey: FOREIGN KEY (configuration_release_id) REFERENCES portal_library_releases(id)
application_snapshots_configuration_release_id_site_key_fkey: FOREIGN KEY (configuration_release_id, site_key) REFERENCES portal_library_releases(id, site_key)
application_snapshots_configuration_snapshot_check: CHECK ((jsonb_typeof(configuration_snapshot) = 'object'::text))
application_snapshots_coverages_snapshot_check: CHECK ((jsonb_typeof(coverages_snapshot) = 'array'::text))
application_snapshots_participants_snapshot_check: CHECK ((jsonb_typeof(participants_snapshot) = 'array'::text))
application_snapshots_pkey: PRIMARY KEY (id)
application_snapshots_site_id_site_key_fkey: FOREIGN KEY (site_id, site_key) REFERENCES sites(id, key)
application_snapshots_version_check: CHECK ((version > 0))
```

Migration sources mentioning this table: [supabase/migrations/202610120005_application_storage.sql](../../supabase/migrations/202610120005_application_storage.sql), [supabase/migrations/202610120008_reference_validation.sql](../../supabase/migrations/202610120008_reference_validation.sql), [supabase/migrations/202610120009_application_context_history.sql](../../supabase/migrations/202610120009_application_context_history.sql), [supabase/migrations/202610130001_application_selection_integrity.sql](../../supabase/migrations/202610130001_application_selection_integrity.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [application_snapshots_release_idx](../../supabase/migrations/202610120005_application_storage.sql#L231): `create index application_snapshots_release_idx on public.application_snapshots(configuration_release_id);`
- [application_snapshots_immutable](../../supabase/migrations/202610120005_application_storage.sql#L199): `create trigger application_snapshots_immutable before update or delete on public.application_snapshots for each row execute function public.guard_published_configuration_history();`
- [application_snapshot_truth](../../supabase/migrations/202610120009_application_context_history.sql#L91): `create trigger application_snapshot_truth before insert on public.application_snapshots for each row execute function public.populate_application_snapshot();`

## applications

`applications`: Operational application status, site and action owner.

Owner: Site via site_id; hosting Association and TPA derived. Group: applications. RLS: true. Contract: Application. Access: Mock server operational arrays; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/operations.ts#L3) |
| application_number | text | false | — | applicationNumber: string | [contract](../../src/persistence/types/operations.ts#L3) |
| site_id | uuid | false | — | siteId: string | [contract](../../src/persistence/types/operations.ts#L3) |
| product_key | text | false | — | productKey: string | [contract](../../src/persistence/types/operations.ts#L3) |
| status | application_status | false | — | status: "In Progress" \| "Pending TPA Review" \| "Underwriting" \| "Waiting for Advisor" \| "Completed" \| "Rejected" | [contract](../../src/persistence/types/operations.ts#L4) |
| current_action_owner_type | action_owner_type | false | — | currentActionOwnerType: "Applicant" \| "Advisor" \| "TPA" \| "NYL" \| "None" | [contract](../../src/persistence/types/operations.ts#L4) |
| current_action_owner_id | uuid | true | — | currentActionOwnerId: string \| null | [contract](../../src/persistence/types/operations.ts#L4) |
| submitted_at | timestamp with time zone | true | — | submittedAt: string \| null | [contract](../../src/persistence/types/operations.ts#L5) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| updated_at | timestamp with time zone | false | now() | updatedAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| deleted_at | timestamp with time zone | true | — | deletedAt: string \| null | [contract](../../src/persistence/types/common.ts#L14) |
| legacy_action_owner_id | uuid | true | — | legacyActionOwnerId?: string \| null \| undefined | [contract](../../src/persistence/types/operations.ts#L6) |
| product_catalog_key | text | true | — | productCatalogKey?: string \| null \| undefined | [contract](../../src/persistence/types/operations.ts#L6) |
| record_origin | text | false | 'native'::text | recordOrigin?: "native" \| "legacy-import" \| undefined | [contract](../../src/persistence/types/operations.ts#L7) |
| import_reference | text | true | — | importReference?: string \| null \| undefined | [contract](../../src/persistence/types/operations.ts#L7) |

Installed constraints:

```sql
application_site_product_reference: FOREIGN KEY (site_id, product_catalog_key) REFERENCES site_products(site_id, product_key)
applications_application_number_key: UNIQUE (application_number)
applications_id_site_id_unique: UNIQUE (id, site_id)
applications_import_evidence: CHECK (((record_origin <> 'legacy-import'::text) OR (COALESCE(length(btrim(import_reference)), 0) > 0)))
applications_none_owner: CHECK (((current_action_owner_type <> 'None'::action_owner_type) OR (current_action_owner_id IS NULL)))
applications_owner_actor: FOREIGN KEY (current_action_owner_id) REFERENCES portal_actors(id)
applications_pkey: PRIMARY KEY (id)
applications_product_catalog_key_fkey: FOREIGN KEY (product_catalog_key) REFERENCES products(key)
applications_record_origin_check: CHECK ((record_origin = ANY (ARRAY['native'::text, 'legacy-import'::text])))
applications_site_id_fkey: FOREIGN KEY (site_id) REFERENCES sites(id)
```

Migration sources mentioning this table: [supabase/migrations/202609240001_initial_portal_schema.sql](../../supabase/migrations/202609240001_initial_portal_schema.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120002_application_relationships.sql](../../supabase/migrations/202610120002_application_relationships.sql), [supabase/migrations/202610120003_relationship_integrity.sql](../../supabase/migrations/202610120003_relationship_integrity.sql), [supabase/migrations/202610120005_application_storage.sql](../../supabase/migrations/202610120005_application_storage.sql), [supabase/migrations/202610120008_reference_validation.sql](../../supabase/migrations/202610120008_reference_validation.sql), [supabase/migrations/202610120009_application_context_history.sql](../../supabase/migrations/202610120009_application_context_history.sql), [supabase/migrations/202610130001_application_selection_integrity.sql](../../supabase/migrations/202610130001_application_selection_integrity.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [applications_site_id_idx](../../supabase/migrations/202609240001_initial_portal_schema.sql#L86): `create index applications_site_id_idx on public.applications(site_id) where deleted_at is null;`
- [applications_product_catalog](../../supabase/migrations/202610120005_application_storage.sql#L90): `create trigger applications_product_catalog before insert or update of product_key,product_catalog_key,site_id on public.applications   for each row execute function public.resolve_application_product_reference();`
- [application_automatic_context](../../supabase/migrations/202610120009_application_context_history.sql#L48): `create trigger application_automatic_context after insert on public.applications for each row execute function public.set_automatic_application_context();`
- [application_submission_snapshot](../../supabase/migrations/202610130001_application_selection_integrity.sql#L74): `create trigger application_submission_snapshot before insert or update on public.applications   for each row execute function public.check_application_submission_history();`

## association affiliations

`association_affiliations`: Same-TPA hosting/member Association affiliations.

Owner: Two Association endpoints constrained to one TPA. Group: hierarchy. RLS: true. Contract: AssociationAffiliation. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/structure.ts#L13) |
| hosting_association_id | uuid | false | — | hostingAssociationId: string | [contract](../../src/persistence/types/structure.ts#L13) |
| member_association_id | uuid | false | — | memberAssociationId: string | [contract](../../src/persistence/types/structure.ts#L13) |
| organization_id | uuid | false | — | organizationId: string | [contract](../../src/persistence/types/structure.ts#L13) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/structure.ts#L13) |

Installed constraints:

```sql
association_affiliations_check: CHECK ((hosting_association_id <> member_association_id))
association_affiliations_hosting_association_id_member_asso_key: UNIQUE (hosting_association_id, member_association_id)
association_affiliations_hosting_association_id_organizati_fkey: FOREIGN KEY (hosting_association_id, organization_id) REFERENCES association_entities(id, organization_id)
association_affiliations_member_association_id_organizatio_fkey: FOREIGN KEY (member_association_id, organization_id) REFERENCES association_entities(id, organization_id)
association_affiliations_pkey: PRIMARY KEY (id)
```

Migration sources mentioning this table: [supabase/migrations/202610120004_association_identity.sql](../../supabase/migrations/202610120004_association_identity.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [association_affiliations_member_idx](../../supabase/migrations/202610120004_association_identity.sql#L165): `create index association_affiliations_member_idx on public.association_affiliations(member_association_id);`

## association aliases

`association_aliases`: Explicit source identity crosswalk and original records.

Owner: Canonical Association when resolved; otherwise archived source identity. Group: hierarchy. RLS: true. Contract: AssociationAlias. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/structure.ts#L9) |
| source_table | text | false | — | sourceTable: "clients" \| "associations" | [contract](../../src/persistence/types/structure.ts#L9) |
| source_id | text | false | — | sourceId: string | [contract](../../src/persistence/types/structure.ts#L9) |
| source_key | text | false | — | sourceKey: string | [contract](../../src/persistence/types/structure.ts#L9) |
| association_id | uuid | true | — | associationId: string \| null | [contract](../../src/persistence/types/structure.ts#L10) |
| state | text | false | — | state: "resolved" \| "source-only" | [contract](../../src/persistence/types/structure.ts#L10) |
| original_record | jsonb | false | — | originalRecord: Json | [contract](../../src/persistence/types/structure.ts#L10) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/structure.ts#L10) |

Installed constraints:

```sql
association_aliases_association_id_fkey: FOREIGN KEY (association_id) REFERENCES association_entities(id)
association_aliases_check: CHECK (((state = 'resolved'::text) = (association_id IS NOT NULL)))
association_aliases_original_record_check: CHECK ((jsonb_typeof(original_record) = 'object'::text))
association_aliases_pkey: PRIMARY KEY (id)
association_aliases_source_table_check: CHECK ((source_table = ANY (ARRAY['clients'::text, 'associations'::text])))
association_aliases_source_table_source_id_key: UNIQUE (source_table, source_id)
association_aliases_source_table_source_key_key: UNIQUE (source_table, source_key)
association_aliases_state_check: CHECK ((state = ANY (ARRAY['resolved'::text, 'source-only'::text])))
```

Migration sources mentioning this table: [supabase/migrations/202610120004_association_identity.sql](../../supabase/migrations/202610120004_association_identity.sql), [supabase/migrations/202610120005_application_storage.sql](../../supabase/migrations/202610120005_application_storage.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql), [supabase/migrations/202610120009_application_context_history.sql](../../supabase/migrations/202610120009_application_context_history.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [association_aliases_entity_idx](../../supabase/migrations/202610120004_association_identity.sql#L164): `create index association_aliases_entity_idx on public.association_aliases(association_id);`

## association entities

`association_entities`: Canonical hosting/member Association identities under a TPA.

Owner: TPA via organization_id; clients is the hosting Association compatibility identity. Group: hierarchy. RLS: true. Contract: AssociationEntity. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/structure.ts#L5) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/structure.ts#L5) |
| organization_id | uuid | false | — | organizationId: string | [contract](../../src/persistence/types/structure.ts#L5) |
| name | text | false | — | name: string | [contract](../../src/persistence/types/structure.ts#L5) |
| kind | text | false | — | kind: "member" \| "hosting" | [contract](../../src/persistence/types/structure.ts#L6) |
| status | record_status | false | 'active'::record_status | status: RecordStatus | [contract](../../src/persistence/types/structure.ts#L6) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| updated_at | timestamp with time zone | false | now() | updatedAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| deleted_at | timestamp with time zone | true | — | deletedAt: string \| null | [contract](../../src/persistence/types/common.ts#L14) |

Installed constraints:

```sql
association_entities_id_organization_id_key: UNIQUE (id, organization_id)
association_entities_key_key: UNIQUE (key)
association_entities_kind_check: CHECK ((kind = ANY (ARRAY['hosting'::text, 'member'::text])))
association_entities_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id)
association_entities_pkey: PRIMARY KEY (id)
```

Migration sources mentioning this table: [supabase/migrations/202610120004_association_identity.sql](../../supabase/migrations/202610120004_association_identity.sql), [supabase/migrations/202610120005_application_storage.sql](../../supabase/migrations/202610120005_application_storage.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql), [supabase/migrations/202610120008_reference_validation.sql](../../supabase/migrations/202610120008_reference_validation.sql), [supabase/migrations/202610120009_application_context_history.sql](../../supabase/migrations/202610120009_application_context_history.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [association_entities_organization_idx](../../supabase/migrations/202610120004_association_identity.sql#L163): `create index association_entities_organization_idx on public.association_entities(organization_id);`

## associations

`associations`: Legacy Association definition/profile retained through canonical aliases.

Owner: Hosting Association through compatibility reference; optional links do not establish mandatory ownership. Group: hierarchy. RLS: true. Contract: AssociationRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/catalog.ts#L4) |
| client_key | text | false | — | clientKey: string | [contract](../../src/persistence/types/library.ts#L14) |
| definition | jsonb | false | — | definition: { name: string; acronym?: string; logo?: string; logoAlt?: string; } | [contract](../../src/persistence/types/catalog.ts#L4) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
associations_client_key_fkey: FOREIGN KEY (client_key) REFERENCES clients(key)
associations_definition_check: CHECK ((jsonb_typeof(definition) = 'object'::text))
associations_display_id_key: UNIQUE (display_id)
associations_key_key: UNIQUE (key)
associations_pkey: PRIMARY KEY (id)
associations_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120003_relationship_integrity.sql](../../supabase/migrations/202610120003_relationship_integrity.sql), [supabase/migrations/202610120004_association_identity.sql](../../supabase/migrations/202610120004_association_identity.sql), [supabase/migrations/202610120005_application_storage.sql](../../supabase/migrations/202610120005_application_storage.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql), [supabase/migrations/202610120008_reference_validation.sql](../../supabase/migrations/202610120008_reference_validation.sql), [supabase/migrations/202610120009_application_context_history.sql](../../supabase/migrations/202610120009_application_context_history.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [associations_site_parent_guard](../../supabase/migrations/202610120003_relationship_integrity.sql#L74): `create trigger associations_site_parent_guard before update of client_key on public.associations   for each row execute function public.guard_association_parent_change();`
- [associations_refresh_identity](../../supabase/migrations/202610120004_association_identity.sql#L158): `create trigger associations_refresh_identity after insert on public.associations for each statement execute function public.refresh_association_contexts_after_write();`

## audit events

`audit_events`: Immutable operational changes with actor and registered entity references.

Owner: Portal operations; entity/Site ownership only through declared references. Group: changes. RLS: true. Contract: AuditEvent. Access: Mock server operational arrays; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/operations.ts#L50) |
| entity_type | text | false | — | entityType: string | [contract](../../src/persistence/types/operations.ts#L50) |
| entity_id | uuid | false | — | entityId: string | [contract](../../src/persistence/types/operations.ts#L50) |
| action | audit_action | false | — | action: AuditAction | [contract](../../src/persistence/types/operations.ts#L50) |
| field_key | text | true | — | fieldKey: string \| null | [contract](../../src/persistence/types/operations.ts#L50) |
| old_value_json | jsonb | false | 'null'::jsonb | oldValueJson: Json | [contract](../../src/persistence/types/operations.ts#L51) |
| new_value_json | jsonb | false | 'null'::jsonb | newValueJson: Json | [contract](../../src/persistence/types/operations.ts#L51) |
| performed_by | text | false | — | performedBy: string | [contract](../../src/persistence/types/operations.ts#L51) |
| change_request_id | uuid | true | — | changeRequestId: string \| null | [contract](../../src/persistence/types/operations.ts#L51) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/operations.ts#L51) |
| actor_id | uuid | false | — | actorId?: string \| undefined | [contract](../../src/persistence/types/operations.ts#L52) |
| entity_reference_id | uuid | false | — | entityReferenceId?: string \| undefined | [contract](../../src/persistence/types/operations.ts#L53) |

Installed constraints:

```sql
audit_events_actor_id_fkey: FOREIGN KEY (actor_id) REFERENCES portal_actors(id)
audit_events_change_request_id_fkey: FOREIGN KEY (change_request_id) REFERENCES change_requests(id)
audit_events_entity_reference_id_fkey: FOREIGN KEY (entity_reference_id) REFERENCES portal_entity_references(id)
audit_events_pkey: PRIMARY KEY (id)
```

Migration sources mentioning this table: [supabase/migrations/202609240001_initial_portal_schema.sql](../../supabase/migrations/202609240001_initial_portal_schema.sql), [supabase/migrations/202610120005_application_storage.sql](../../supabase/migrations/202610120005_application_storage.sql), [supabase/migrations/202610120008_reference_validation.sql](../../supabase/migrations/202610120008_reference_validation.sql), [supabase/migrations/202610120009_application_context_history.sql](../../supabase/migrations/202610120009_application_context_history.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [audit_events_entity_idx](../../supabase/migrations/202609240001_initial_portal_schema.sql#L89): `create index audit_events_entity_idx on public.audit_events(entity_type, entity_id, created_at desc);`
- [audit_events_actor_idx](../../supabase/migrations/202610120005_application_storage.sql#L232): `create index audit_events_actor_idx on public.audit_events(actor_id);`
- [audit_events_reference_idx](../../supabase/migrations/202610120008_reference_validation.sql#L215): `create index audit_events_reference_idx on public.audit_events(entity_reference_id);`
- [audit_events_actor](../../supabase/migrations/202610120005_application_storage.sql#L58): `create trigger audit_events_actor before insert or update on public.audit_events for each row execute function public.fill_operational_actor_references();`
- [audit_entity_reference](../../supabase/migrations/202610120008_reference_validation.sql#L108): `create trigger audit_entity_reference before insert on public.audit_events for each row execute function public.fill_history_entity_reference();`
- [audit_history_immutable](../../supabase/migrations/202610120009_application_context_history.sql#L92): `create trigger audit_history_immutable before update or delete on public.audit_events for each row execute function public.guard_published_configuration_history();`

## benefit caps

`benefit_caps`: Conditional benefit caps under aggregate limits.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-rules. RLS: true. Contract: BenefitCaps. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L80) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L81) |
| aggregate_limit_key | text | false | — | aggregateLimitKey: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L82) |
| minimum_age_years | numeric | true | — | minimumAgeYears: number \| null | [contract](../../src/persistence/types/underwritingCanonical.ts#L83) |
| maximum_age_years | numeric | true | — | maximumAgeYears: number \| null | [contract](../../src/persistence/types/underwritingCanonical.ts#L84) |
| self_employed_less_than_years | numeric | true | — | selfEmployedLessThanYears: number \| null | [contract](../../src/persistence/types/underwritingCanonical.ts#L85) |
| maximum | numeric | false | — | maximum: number | [contract](../../src/persistence/types/underwritingCanonical.ts#L86) |
| required_waiting_period | text | true | — | requiredWaitingPeriod: string \| null | [contract](../../src/persistence/types/underwritingCanonical.ts#L87) |
| required_benefit_period | text | true | — | requiredBenefitPeriod: string \| null | [contract](../../src/persistence/types/underwritingCanonical.ts#L88) |
| position | integer | false | — | position: number | [contract](../../src/persistence/types/underwritingCanonical.ts#L89) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
benefit_caps_aggregate_limit_key_fkey: FOREIGN KEY (aggregate_limit_key) REFERENCES aggregate_limits(key)
benefit_caps_display_id_check: CHECK ((display_id > 0))
benefit_caps_display_id_key: UNIQUE (display_id)
benefit_caps_key_key: UNIQUE (key)
benefit_caps_pkey: PRIMARY KEY (id)
benefit_caps_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## benefit period options

`benefit_period_options`: Product/site/applicant-role waiting and benefit choices.

Owner: Site-scoped or optional Site dimension; inspect nullable links and any paired Association target. Group: library-rules. RLS: true. Contract: BenefitPeriodOptions. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L36) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L37) |
| product_key | text | false | — | productKey: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L38) |
| site_key | text | true | — | siteKey: string \| null | [contract](../../src/persistence/types/underwritingCanonical.ts#L39) |
| applicant_type_key | text | true | — | applicantTypeKey: string \| null | [contract](../../src/persistence/types/underwritingCanonical.ts#L40) |
| kind | text | false | — | kind: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L41) |
| value | text | false | — | value: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L42) |
| label | text | false | — | label: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L43) |
| days | integer | true | — | days: number \| null | [contract](../../src/persistence/types/underwritingCanonical.ts#L44) |
| position | integer | false | — | position: number | [contract](../../src/persistence/types/underwritingCanonical.ts#L45) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
benefit_period_options_applicant_type_key_fkey: FOREIGN KEY (applicant_type_key) REFERENCES applicant_types(key)
benefit_period_options_display_id_check: CHECK ((display_id > 0))
benefit_period_options_display_id_key: UNIQUE (display_id)
benefit_period_options_key_key: UNIQUE (key)
benefit_period_options_kind_check: CHECK ((kind = ANY (ARRAY['waiting'::text, 'benefit'::text])))
benefit_period_options_pkey: PRIMARY KEY (id)
benefit_period_options_product_key_fkey: FOREIGN KEY (product_key) REFERENCES products(key)
benefit_period_options_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
benefit_period_options_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## branding profiles

`branding_profiles`: Scoped brand presentation definitions.

Owner: Global, hosting Association (legacy client), or Site by declared scope; inspect CHECK/targets. Group: library-themes. RLS: true. Contract: BrandingProfileRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/catalog.ts#L4) |
| definition | jsonb | false | — | definition: Partial<import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/configuration").ClientBranding> | [contract](../../src/persistence/types/catalog.ts#L4) |
| scope | text | false | — | scope: "global" \| "client" \| "site" | [contract](../../src/persistence/types/catalog.ts#L5) |
| client_key | text | true | — | clientKey: string \| null | [contract](../../src/persistence/types/catalog.ts#L5) |
| site_key | text | true | — | siteKey: string \| null | [contract](../../src/persistence/types/catalog.ts#L5) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
branding_profiles_check: CHECK ((((scope = 'global'::text) AND (client_key IS NULL) AND (site_key IS NULL)) OR ((scope = 'client'::text) AND (client_key IS NOT NULL) AND (site_key IS NULL)) OR ((scope = 'site'::text) AND (site_key IS NOT NULL) AND (client_key IS NULL))))
branding_profiles_client_key_fkey: FOREIGN KEY (client_key) REFERENCES clients(key)
branding_profiles_definition_check: CHECK ((jsonb_typeof(definition) = 'object'::text))
branding_profiles_display_id_key: UNIQUE (display_id)
branding_profiles_key_key: UNIQUE (key)
branding_profiles_pkey: PRIMARY KEY (id)
branding_profiles_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
branding_profiles_scope_check: CHECK ((scope = ANY (ARRAY['global'::text, 'client'::text, 'site'::text])))
branding_profiles_scope_client_key_site_key_key: UNIQUE NULLS NOT DISTINCT (scope, client_key, site_key)
branding_profiles_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## change items

`change_items`: Entity/field changes proposed under change requests.

Owner: Site-scoped or optional Site dimension; inspect nullable links and any paired Association target. Group: changes. RLS: true. Contract: ChangeItem. Access: Mock server operational arrays; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/operations.ts#L29) |
| change_request_id | uuid | false | — | changeRequestId: string | [contract](../../src/persistence/types/operations.ts#L29) |
| site_id | uuid | true | — | siteId: string \| null | [contract](../../src/persistence/types/operations.ts#L29) |
| entity_type | text | false | — | entityType: string | [contract](../../src/persistence/types/operations.ts#L29) |
| entity_id | text | true | — | entityId: string \| null | [contract](../../src/persistence/types/operations.ts#L29) |
| field_key | text | false | — | fieldKey: string | [contract](../../src/persistence/types/operations.ts#L30) |
| current_value_json | jsonb | false | 'null'::jsonb | currentValueJson: Json | [contract](../../src/persistence/types/operations.ts#L30) |
| proposed_value_json | jsonb | false | 'null'::jsonb | proposedValueJson: Json | [contract](../../src/persistence/types/operations.ts#L30) |
| change_type | change_type | false | — | changeType: ChangeType | [contract](../../src/persistence/types/operations.ts#L30) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| updated_at | timestamp with time zone | false | now() | updatedAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| entity_reference_id | uuid | false | — | entityReferenceId?: string \| undefined | [contract](../../src/persistence/types/operations.ts#L31) |

Installed constraints:

```sql
change_items_change_request_id_fkey: FOREIGN KEY (change_request_id) REFERENCES change_requests(id) ON DELETE CASCADE
change_items_entity_reference_id_fkey: FOREIGN KEY (entity_reference_id) REFERENCES portal_entity_references(id)
change_items_pkey: PRIMARY KEY (id)
change_items_site_id_fkey: FOREIGN KEY (site_id) REFERENCES sites(id)
```

Migration sources mentioning this table: [supabase/migrations/202609240001_initial_portal_schema.sql](../../supabase/migrations/202609240001_initial_portal_schema.sql), [supabase/migrations/202610120008_reference_validation.sql](../../supabase/migrations/202610120008_reference_validation.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [change_items_change_request_id_idx](../../supabase/migrations/202609240001_initial_portal_schema.sql#L88): `create index change_items_change_request_id_idx on public.change_items(change_request_id);`
- [change_items_reference_idx](../../supabase/migrations/202610120008_reference_validation.sql#L216): `create index change_items_reference_idx on public.change_items(entity_reference_id);`
- [change_item_entity_reference](../../supabase/migrations/202610120008_reference_validation.sql#L109): `create trigger change_item_entity_reference before insert on public.change_items for each row execute function public.fill_history_entity_reference();`

## change requests

`change_requests`: Change request tracking, owner and target release.

Owner: Portal operations; entity/Site ownership only through declared references. Group: changes. RLS: true. Contract: ChangeRequest. Access: Mock server operational arrays; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/operations.ts#L24) |
| change_number | text | false | — | changeNumber: string | [contract](../../src/persistence/types/operations.ts#L24) |
| title | text | false | — | title: string | [contract](../../src/persistence/types/operations.ts#L24) |
| description | text | false | ''::text | description: string | [contract](../../src/persistence/types/operations.ts#L24) |
| status | text | false | — | status: "Draft" \| "Requested" \| "Review" \| "Development" \| "QA" \| "Approved" \| "Scheduled" \| "Released" | [contract](../../src/persistence/types/operations.ts#L24) |
| requested_by | text | false | — | requestedBy: string | [contract](../../src/persistence/types/operations.ts#L25) |
| owner_id | text | true | — | ownerId: string \| null | [contract](../../src/persistence/types/operations.ts#L25) |
| target_release_id | uuid | true | — | targetReleaseId: string \| null | [contract](../../src/persistence/types/operations.ts#L25) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| updated_at | timestamp with time zone | false | now() | updatedAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| deleted_at | timestamp with time zone | true | — | deletedAt: string \| null | [contract](../../src/persistence/types/common.ts#L14) |
| requested_by_actor_id | uuid | false | — | requestedByActorId?: string \| undefined | [contract](../../src/persistence/types/operations.ts#L26) |
| owner_actor_id | uuid | true | — | ownerActorId?: string \| null \| undefined | [contract](../../src/persistence/types/operations.ts#L26) |

Installed constraints:

```sql
change_requests_change_number_key: UNIQUE (change_number)
change_requests_owner_actor_id_fkey: FOREIGN KEY (owner_actor_id) REFERENCES portal_actors(id)
change_requests_pkey: PRIMARY KEY (id)
change_requests_requested_by_actor_id_fkey: FOREIGN KEY (requested_by_actor_id) REFERENCES portal_actors(id)
change_requests_target_release_id_fkey: FOREIGN KEY (target_release_id) REFERENCES releases(id)
```

Migration sources mentioning this table: [supabase/migrations/202609240001_initial_portal_schema.sql](../../supabase/migrations/202609240001_initial_portal_schema.sql), [supabase/migrations/202610120005_application_storage.sql](../../supabase/migrations/202610120005_application_storage.sql), [supabase/migrations/202610120008_reference_validation.sql](../../supabase/migrations/202610120008_reference_validation.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [change_requests_actors](../../supabase/migrations/202610120005_application_storage.sql#L59): `create trigger change_requests_actors before insert or update on public.change_requests for each row execute function public.fill_operational_actor_references();`

## client environment links

`client_environment_links`: Client environment URLs.

Owner: Hosting Association through compatibility reference; optional links do not establish mandatory ownership. Group: hierarchy. RLS: true. Contract: ClientEnvironmentLinks. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/urlsCanonical.ts#L20) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/urlsCanonical.ts#L21) |
| client_key | text | false | — | clientKey: string | [contract](../../src/persistence/types/urlsCanonical.ts#L22) |
| environment | text | false | — | environment: string | [contract](../../src/persistence/types/urlsCanonical.ts#L23) |
| url | text | false | — | url: string | [contract](../../src/persistence/types/urlsCanonical.ts#L24) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
client_environment_links_client_key_fkey: FOREIGN KEY (client_key) REFERENCES clients(key)
client_environment_links_display_id_check: CHECK ((display_id > 0))
client_environment_links_display_id_key: UNIQUE (display_id)
client_environment_links_environment_check: CHECK ((environment = ANY (ARRAY['production'::text, 'test'::text, 'pre-production'::text, 'automation'::text])))
client_environment_links_key_key: UNIQUE (key)
client_environment_links_pkey: PRIMARY KEY (id)
client_environment_links_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
client_environment_links_url_check: CHECK ((url ~ '^https?://'::text))
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql). Mentions include references and function bodies, not just table declarations.

## clients

`clients`: Legacy hosting Association record; not an additional business entity.

Owner: TPA via organization_id; clients is the hosting Association compatibility identity. Group: hierarchy. RLS: true. Contract: Client. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/organization.ts#L9) |
| organization_id | uuid | false | — | organizationId: string | [contract](../../src/persistence/types/organization.ts#L9) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/organization.ts#L9) |
| name | text | false | — | name: string | [contract](../../src/domain/organizations.ts#L12) |
| acronym | text | false | — | acronym: string | [contract](../../src/domain/organizations.ts#L13) |
| status | record_status | false | 'active'::record_status | status: RecordStatus | [contract](../../src/persistence/types/organization.ts#L9) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| updated_at | timestamp with time zone | false | now() | updatedAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
clients_canonical_identity: FOREIGN KEY (id, organization_id) REFERENCES association_entities(id, organization_id) DEFERRABLE INITIALLY DEFERRED
clients_display_id_key: UNIQUE (display_id)
clients_key_key: UNIQUE (key)
clients_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id)
clients_pkey: PRIMARY KEY (id)
clients_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
```

Migration sources mentioning this table: [supabase/migrations/202609240001_initial_portal_schema.sql](../../supabase/migrations/202609240001_initial_portal_schema.sql), [supabase/migrations/202609240002_analytics_domain.sql](../../supabase/migrations/202609240002_analytics_domain.sql), [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120002_application_relationships.sql](../../supabase/migrations/202610120002_application_relationships.sql), [supabase/migrations/202610120003_relationship_integrity.sql](../../supabase/migrations/202610120003_relationship_integrity.sql), [supabase/migrations/202610120004_association_identity.sql](../../supabase/migrations/202610120004_association_identity.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql), [supabase/migrations/202610120008_reference_validation.sql](../../supabase/migrations/202610120008_reference_validation.sql), [supabase/migrations/202610120009_application_context_history.sql](../../supabase/migrations/202610120009_application_context_history.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [clients_hosting_identity](../../supabase/migrations/202610120004_association_identity.sql#L131): `create trigger clients_hosting_identity before insert or update on public.clients for each row execute function public.sync_hosting_association_identity();`

## components

`components`: Portal component catalog and Storybook metadata.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-components. RLS: true. Contract: ComponentRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/catalog.ts#L4) |
| definition | jsonb | false | — | definition: { name: string; description: string; section: string; storyId: string; storybookPath: string; source: string; } | [contract](../../src/persistence/types/catalog.ts#L4) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
components_definition_check: CHECK ((jsonb_typeof(definition) = 'object'::text))
components_display_id_check: CHECK ((display_id > 0))
components_display_id_key: UNIQUE (display_id)
components_key_key: UNIQUE (key)
components_pkey: PRIMARY KEY (id)
components_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
```

Migration sources mentioning this table: [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## conditions

`conditions`: Condition definitions and expressions.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-rules. RLS: true. Contract: ConditionRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/catalog.ts#L4) |
| definition | jsonb | false | — | definition: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/rules").ConditionDefinition | [contract](../../src/persistence/types/catalog.ts#L4) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
conditions_definition_check: CHECK ((jsonb_typeof(definition) = 'object'::text))
conditions_display_id_key: UNIQUE (display_id)
conditions_key_key: UNIQUE (key)
conditions_pkey: PRIMARY KEY (id)
conditions_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql), [supabase/migrations/202610120008_reference_validation.sql](../../supabase/migrations/202610120008_reference_validation.sql). Mentions include references and function bodies, not just table declarations.

## configuration definitions

`configuration_definitions`: Configuration paths, targets and metadata.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-configurations. RLS: true. Contract: ConfigurationDefinitionRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/catalog.ts#L4) |
| definition | jsonb | false | — | definition: { path: string[] \| null; metadata: import("src/persistence/types/index").Json; target?: import("src/persistence/types/index").ConfigurationTarget \| null; } | [contract](../../src/persistence/types/catalog.ts#L4) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
configuration_definitions_definition_check: CHECK ((jsonb_typeof(definition) = 'object'::text))
configuration_definitions_display_id_key: UNIQUE (display_id)
configuration_definitions_key_key: UNIQUE (key)
configuration_definitions_pkey: PRIMARY KEY (id)
configuration_definitions_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
portal_json_reference: TRIGGER DEFERRABLE INITIALLY DEFERRED
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610090002_field_collections.sql](../../supabase/migrations/202610090002_field_collections.sql), [supabase/migrations/202610090003_field_surfaces.sql](../../supabase/migrations/202610090003_field_surfaces.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql), [supabase/migrations/202610120008_reference_validation.sql](../../supabase/migrations/202610120008_reference_validation.sql). Mentions include references and function bodies, not just table declarations.

## configuration values

`configuration_values`: Scoped configuration values.

Owner: Global, hosting Association (legacy client), or Site by declared scope; inspect CHECK/targets. Group: library-configurations. RLS: true. Contract: ConfigurationValueRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/siteConfiguration.ts#L17) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/siteConfiguration.ts#L17) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/siteConfiguration.ts#L17) |
| configuration_key | text | false | — | configurationKey: string | [contract](../../src/persistence/types/siteConfiguration.ts#L17) |
| value | jsonb | false | — | value: Json | [contract](../../src/persistence/types/siteConfiguration.ts#L17) |
| scope | text | false | — | scope: "global" \| "client" \| "site" | [contract](../../src/persistence/types/catalog.ts#L5) |
| client_key | text | true | — | clientKey: string \| null | [contract](../../src/persistence/types/catalog.ts#L5) |
| site_key | text | true | — | siteKey: string \| null | [contract](../../src/persistence/types/catalog.ts#L5) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
configuration_values_check: CHECK ((((scope = 'global'::text) AND (client_key IS NULL) AND (site_key IS NULL)) OR ((scope = 'client'::text) AND (client_key IS NOT NULL) AND (site_key IS NULL)) OR ((scope = 'site'::text) AND (site_key IS NOT NULL) AND (client_key IS NULL))))
configuration_values_client_key_fkey: FOREIGN KEY (client_key) REFERENCES clients(key)
configuration_values_configuration_key_fkey: FOREIGN KEY (configuration_key) REFERENCES configuration_definitions(key)
configuration_values_configuration_key_scope_client_key_sit_key: UNIQUE NULLS NOT DISTINCT (configuration_key, scope, client_key, site_key)
configuration_values_display_id_key: UNIQUE (display_id)
configuration_values_key_key: UNIQUE (key)
configuration_values_pkey: PRIMARY KEY (id)
configuration_values_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
configuration_values_scope_check: CHECK ((scope = ANY (ARRAY['global'::text, 'client'::text, 'site'::text])))
configuration_values_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
portal_json_reference: TRIGGER DEFERRABLE INITIALLY DEFERRED
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610090002_field_collections.sql](../../supabase/migrations/202610090002_field_collections.sql), [supabase/migrations/202610090003_field_surfaces.sql](../../supabase/migrations/202610090003_field_surfaces.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql), [supabase/migrations/202610120008_reference_validation.sql](../../supabase/migrations/202610120008_reference_validation.sql). Mentions include references and function bodies, not just table declarations.

## content entries

`content_entries`: Content slot definitions.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-content. RLS: true. Contract: ContentEntryRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/catalog.ts#L4) |
| definition | jsonb | false | — | definition: { path: string[] \| null; } | [contract](../../src/persistence/types/catalog.ts#L4) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
content_entries_definition_check: CHECK ((jsonb_typeof(definition) = 'object'::text))
content_entries_display_id_key: UNIQUE (display_id)
content_entries_key_key: UNIQUE (key)
content_entries_pkey: PRIMARY KEY (id)
content_entries_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## content values

`content_values`: Scoped content values.

Owner: Global, hosting Association (legacy client), or Site by declared scope; inspect CHECK/targets. Group: library-content. RLS: true. Contract: ContentValueRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/siteConfiguration.ts#L18) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/siteConfiguration.ts#L18) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/siteConfiguration.ts#L18) |
| content_key | text | false | — | contentKey: string | [contract](../../src/persistence/types/siteConfiguration.ts#L18) |
| value | jsonb | false | — | value: Json | [contract](../../src/persistence/types/siteConfiguration.ts#L18) |
| scope | text | false | — | scope: "global" \| "client" \| "site" | [contract](../../src/persistence/types/catalog.ts#L5) |
| client_key | text | true | — | clientKey: string \| null | [contract](../../src/persistence/types/catalog.ts#L5) |
| site_key | text | true | — | siteKey: string \| null | [contract](../../src/persistence/types/catalog.ts#L5) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
content_values_check: CHECK ((((scope = 'global'::text) AND (client_key IS NULL) AND (site_key IS NULL)) OR ((scope = 'client'::text) AND (client_key IS NOT NULL) AND (site_key IS NULL)) OR ((scope = 'site'::text) AND (site_key IS NOT NULL) AND (client_key IS NULL))))
content_values_client_key_fkey: FOREIGN KEY (client_key) REFERENCES clients(key)
content_values_content_key_fkey: FOREIGN KEY (content_key) REFERENCES content_entries(key)
content_values_content_key_scope_client_key_site_key_key: UNIQUE NULLS NOT DISTINCT (content_key, scope, client_key, site_key)
content_values_display_id_key: UNIQUE (display_id)
content_values_key_key: UNIQUE (key)
content_values_pkey: PRIMARY KEY (id)
content_values_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
content_values_scope_check: CHECK ((scope = ANY (ARRAY['global'::text, 'client'::text, 'site'::text])))
content_values_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## coverage amount patterns

`coverage_amount_patterns`: Amount calculation/selection strategy and optional base product/role.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-rules. RLS: true. Contract: CoverageAmountPatterns. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L55) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L56) |
| pattern_key | text | false | — | patternKey: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L57) |
| amount_type | text | false | — | amountType: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L58) |
| minimum | numeric | true | — | minimum: number \| null | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L59) |
| maximum | numeric | true | — | maximum: number \| null | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L60) |
| increment | numeric | true | — | increment: number \| null | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L61) |
| formula | text | true | — | formula: string \| null | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L62) |
| base_product_key | text | true | — | baseProductKey: string \| null | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L63) |
| base_applicant_key | text | true | — | baseApplicantKey: string \| null | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L64) |
| base_applicant_class | text | true | — | baseApplicantClass: string \| null | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L65) |
| multiplier | numeric | true | — | multiplier: number \| null | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L66) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
coverage_amount_patterns_amount_type_check: CHECK ((amount_type = ANY (ARRAY['fixed'::text, 'set'::text, 'range'::text, 'tiered-range'::text, 'range-plus-fixed'::text, 'conditional'::text, 'calculated'::text, 'named-option'::text, 'none'::text, 'attribute-mapped'::text, 'formula-capped'::text, 'base-reference'::text, 'multiplier'::text, 'election-only'::text, 'unspecified-increment'::text])))
coverage_amount_patterns_base_applicant_key_fkey: FOREIGN KEY (base_applicant_key) REFERENCES applicant_types(key)
coverage_amount_patterns_base_product_key_fkey: FOREIGN KEY (base_product_key) REFERENCES products(key)
coverage_amount_patterns_check: CHECK (((minimum IS NULL) OR (maximum IS NULL) OR (minimum <= maximum)))
coverage_amount_patterns_display_id_check: CHECK ((display_id > 0))
coverage_amount_patterns_display_id_key: UNIQUE (display_id)
coverage_amount_patterns_increment_check: CHECK (((increment IS NULL) OR (increment > (0)::numeric)))
coverage_amount_patterns_key_key: UNIQUE (key)
coverage_amount_patterns_pattern_key_fkey: FOREIGN KEY (pattern_key) REFERENCES patterns(key)
coverage_amount_patterns_pkey: PRIMARY KEY (id)
coverage_amount_patterns_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## coverage categories

`coverage_categories`: Coverage category catalog.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-products. RLS: true. Contract: CoverageCategoryRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/catalog.ts#L4) |
| definition | jsonb | false | — | definition: { label: string; shortLabel?: string; iconKey: string; } | [contract](../../src/persistence/types/catalog.ts#L4) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
coverage_categories_definition_check: CHECK ((jsonb_typeof(definition) = 'object'::text))
coverage_categories_display_id_key: UNIQUE (display_id)
coverage_categories_key_key: UNIQUE (key)
coverage_categories_pkey: PRIMARY KEY (id)
coverage_categories_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## coverage dependencies

`coverage_dependencies`: Required applicant-role/category relationships for coverage.

Owner: Site-scoped or optional Site dimension; inspect nullable links and any paired Association target. Group: library-rules. RLS: true. Contract: CoverageDependencies. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L61) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L62) |
| product_key | text | false | — | productKey: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L63) |
| site_key | text | true | — | siteKey: string \| null | [contract](../../src/persistence/types/underwritingCanonical.ts#L64) |
| applicant_type_key | text | false | — | applicantTypeKey: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L65) |
| requires_applicant_key | text | false | — | requiresApplicantKey: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L66) |
| category_key | text | false | — | categoryKey: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L67) |
| same_product | boolean | false | — | sameProduct: boolean | [contract](../../src/persistence/types/underwritingCanonical.ts#L68) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
coverage_dependencies_applicant_type_key_fkey: FOREIGN KEY (applicant_type_key) REFERENCES applicant_types(key)
coverage_dependencies_category_key_fkey: FOREIGN KEY (category_key) REFERENCES coverage_categories(key)
coverage_dependencies_display_id_check: CHECK ((display_id > 0))
coverage_dependencies_display_id_key: UNIQUE (display_id)
coverage_dependencies_key_key: UNIQUE (key)
coverage_dependencies_pkey: PRIMARY KEY (id)
coverage_dependencies_product_key_fkey: FOREIGN KEY (product_key) REFERENCES products(key)
coverage_dependencies_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
coverage_dependencies_requires_applicant_key_fkey: FOREIGN KEY (requires_applicant_key) REFERENCES applicant_types(key)
coverage_dependencies_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## coverage plan definitions

`coverage_plan_definitions`: Reusable coverage plan families.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-products. RLS: true. Contract: CoveragePlanDefinitions. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L18) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L19) |
| name | text | false | — | name: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L20) |
| coverage_type | text | false | — | coverageType: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L21) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
coverage_plan_definitions_coverage_type_check: CHECK ((coverage_type = ANY (ARRAY['disability'::text, 'overhead-expense'::text])))
coverage_plan_definitions_display_id_check: CHECK ((display_id > 0))
coverage_plan_definitions_display_id_key: UNIQUE (display_id)
coverage_plan_definitions_key_key: UNIQUE (key)
coverage_plan_definitions_pkey: PRIMARY KEY (id)
coverage_plan_definitions_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## coverage plan variants

`coverage_plan_variants`: Plan variants and applicant-role qualifiers.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-products. RLS: true. Contract: CoveragePlanVariants. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L24) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L25) |
| plan_key | text | false | — | planKey: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L26) |
| name | text | true | — | name: string \| null | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L27) |
| applicant_type_key | text | true | — | applicantTypeKey: string \| null | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L28) |
| position | integer | false | — | position: number | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L29) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
coverage_plan_variants_applicant_type_key_fkey: FOREIGN KEY (applicant_type_key) REFERENCES applicant_types(key)
coverage_plan_variants_display_id_check: CHECK ((display_id > 0))
coverage_plan_variants_display_id_key: UNIQUE (display_id)
coverage_plan_variants_key_key: UNIQUE (key)
coverage_plan_variants_pkey: PRIMARY KEY (id)
coverage_plan_variants_plan_key_fkey: FOREIGN KEY (plan_key) REFERENCES coverage_plan_definitions(key)
coverage_plan_variants_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## document definitions

`document_definitions`: Document catalog definitions.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-content. RLS: true. Contract: DocumentDefinitionRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/catalog.ts#L4) |
| definition | jsonb | false | — | definition: { contentKey: string \| null; productKey: string \| null; source: string; } | [contract](../../src/persistence/types/catalog.ts#L4) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
document_definitions_definition_check: CHECK ((jsonb_typeof(definition) = 'object'::text))
document_definitions_display_id_key: UNIQUE (display_id)
document_definitions_key_key: UNIQUE (key)
document_definitions_pkey: PRIMARY KEY (id)
document_definitions_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## eligibility constraints

`eligibility_constraints`: Product/site/applicant-role age and work eligibility.

Owner: Site-scoped or optional Site dimension; inspect nullable links and any paired Association target. Group: library-rules. RLS: true. Contract: EligibilityConstraints. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L48) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L49) |
| product_key | text | false | — | productKey: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L50) |
| site_key | text | true | — | siteKey: string \| null | [contract](../../src/persistence/types/underwritingCanonical.ts#L51) |
| applicant_type_key | text | false | — | applicantTypeKey: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L52) |
| minimum_age_days | numeric | true | — | minimumAgeDays: number \| null | [contract](../../src/persistence/types/underwritingCanonical.ts#L53) |
| minimum_age_years | numeric | true | — | minimumAgeYears: number \| null | [contract](../../src/persistence/types/underwritingCanonical.ts#L54) |
| maximum_age_years | numeric | true | — | maximumAgeYears: number \| null | [contract](../../src/persistence/types/underwritingCanonical.ts#L55) |
| student_maximum_age_years | numeric | true | — | studentMaximumAgeYears: number \| null | [contract](../../src/persistence/types/underwritingCanonical.ts#L56) |
| unmarried | boolean | true | — | unmarried: boolean \| null | [contract](../../src/persistence/types/underwritingCanonical.ts#L57) |
| minimum_work_hours | numeric | true | — | minimumWorkHours: number \| null | [contract](../../src/persistence/types/underwritingCanonical.ts#L58) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
eligibility_constraints_applicant_type_key_fkey: FOREIGN KEY (applicant_type_key) REFERENCES applicant_types(key)
eligibility_constraints_display_id_check: CHECK ((display_id > 0))
eligibility_constraints_display_id_key: UNIQUE (display_id)
eligibility_constraints_key_key: UNIQUE (key)
eligibility_constraints_pkey: PRIMARY KEY (id)
eligibility_constraints_product_key_fkey: FOREIGN KEY (product_key) REFERENCES products(key)
eligibility_constraints_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
eligibility_constraints_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## email templates

`email_templates`: Email template definitions.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-communications. RLS: true. Contract: EmailTemplateRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/catalog.ts#L4) |
| definition | jsonb | false | — | definition: { rendererKey: string; source: string; } | [contract](../../src/persistence/types/catalog.ts#L4) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
email_templates_definition_check: CHECK ((jsonb_typeof(definition) = 'object'::text))
email_templates_display_id_key: UNIQUE (display_id)
email_templates_key_key: UNIQUE (key)
email_templates_pkey: PRIMARY KEY (id)
email_templates_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## features

`features`: Feature catalog.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-features. RLS: true. Contract: FeatureRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/catalog.ts#L4) |
| definition | jsonb | false | — | definition: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/features").FeatureDefinition | [contract](../../src/persistence/types/catalog.ts#L4) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
features_definition_check: CHECK ((jsonb_typeof(definition) = 'object'::text))
features_display_id_key: UNIQUE (display_id)
features_key_key: UNIQUE (key)
features_pkey: PRIMARY KEY (id)
features_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610090001_page_catalog_contract.sql](../../supabase/migrations/202610090001_page_catalog_contract.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## fields

`fields`: Reusable field definitions.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-fields. RLS: true. Contract: FieldRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/catalog.ts#L4) |
| definition | jsonb | false | — | definition: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/fields").FieldDefinition | [contract](../../src/persistence/types/catalog.ts#L4) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
fields_definition_check: CHECK ((jsonb_typeof(definition) = 'object'::text))
fields_display_id_key: UNIQUE (display_id)
fields_key_key: UNIQUE (key)
fields_pkey: PRIMARY KEY (id)
fields_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
portal_json_reference: TRIGGER DEFERRABLE INITIALLY DEFERRED
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610090002_field_collections.sql](../../supabase/migrations/202610090002_field_collections.sql), [supabase/migrations/202610090003_field_surfaces.sql](../../supabase/migrations/202610090003_field_surfaces.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120005_application_storage.sql](../../supabase/migrations/202610120005_application_storage.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql), [supabase/migrations/202610120007_field_reference_bootstrap.sql](../../supabase/migrations/202610120007_field_reference_bootstrap.sql), [supabase/migrations/202610120008_reference_validation.sql](../../supabase/migrations/202610120008_reference_validation.sql). Mentions include references and function bodies, not just table declarations.

## flag assignments

`flag_assignments`: Flag values attached to zero or one catalog/tenant/application target.

Owner: Application child via application_id; Site/Association/person dimensions must agree where present. Group: library-shared. RLS: true. Contract: FlagAssignments. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/flagsCanonical.ts#L22) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/flagsCanonical.ts#L23) |
| flag_key | text | false | — | flagKey: string | [contract](../../src/persistence/types/flagsCanonical.ts#L24) |
| client_key | text | true | — | clientKey: string \| null | [contract](../../src/persistence/types/flagsCanonical.ts#L25) |
| site_key | text | true | — | siteKey: string \| null | [contract](../../src/persistence/types/flagsCanonical.ts#L26) |
| product_key | text | true | — | productKey: string \| null | [contract](../../src/persistence/types/flagsCanonical.ts#L27) |
| coverage_key | text | true | — | coverageKey: string \| null | [contract](../../src/persistence/types/flagsCanonical.ts#L28) |
| rider_key | text | true | — | riderKey: string \| null | [contract](../../src/persistence/types/flagsCanonical.ts#L29) |
| applicant_key | text | true | — | applicantKey: string \| null | [contract](../../src/persistence/types/flagsCanonical.ts#L30) |
| application_id | uuid | true | — | applicationId: string \| null | [contract](../../src/persistence/types/flagsCanonical.ts#L31) |
| value | jsonb | false | — | value: Json | [contract](../../src/persistence/types/flagsCanonical.ts#L32) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
flag_assignments_applicant_key_fkey: FOREIGN KEY (applicant_key) REFERENCES applicant_types(key)
flag_assignments_application_id_fkey: FOREIGN KEY (application_id) REFERENCES applications(id)
flag_assignments_check: CHECK ((num_nonnulls(client_key, site_key, product_key, coverage_key, rider_key, applicant_key, application_id) <= 1))
flag_assignments_client_key_fkey: FOREIGN KEY (client_key) REFERENCES clients(key)
flag_assignments_coverage_key_fkey: FOREIGN KEY (coverage_key) REFERENCES coverage_categories(key)
flag_assignments_display_id_check: CHECK ((display_id > 0))
flag_assignments_display_id_key: UNIQUE (display_id)
flag_assignments_flag_key_fkey: FOREIGN KEY (flag_key) REFERENCES flag_definitions(key)
flag_assignments_key_key: UNIQUE (key)
flag_assignments_pkey: PRIMARY KEY (id)
flag_assignments_product_key_fkey: FOREIGN KEY (product_key) REFERENCES products(key)
flag_assignments_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
flag_assignments_rider_key_fkey: FOREIGN KEY (rider_key) REFERENCES riders(key)
flag_assignments_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql), [supabase/migrations/202610120008_reference_validation.sql](../../supabase/migrations/202610120008_reference_validation.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [flag_assignment_target_identity](../../supabase/migrations/202610120008_reference_validation.sql#L202): `create unique index flag_assignment_target_identity on public.flag_assignments(flag_key,client_key,site_key,product_key,coverage_key,rider_key,applicant_key,application_id) nulls not distinct;`
- [flag_value_contract](../../supabase/migrations/202610120008_reference_validation.sql#L201): `create trigger flag_value_contract before insert or update on public.flag_assignments for each row execute function public.check_flag_value_contract();`

## flag definitions

`flag_definitions`: Flag vocabulary, value type and persistence intent.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-shared. RLS: true. Contract: FlagDefinitions. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/flagsCanonical.ts#L5) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/flagsCanonical.ts#L6) |
| name | text | false | — | name: string | [contract](../../src/persistence/types/flagsCanonical.ts#L7) |
| level | text | false | — | level: string | [contract](../../src/persistence/types/flagsCanonical.ts#L8) |
| value_type | text | false | — | valueType: string | [contract](../../src/persistence/types/flagsCanonical.ts#L9) |
| persistence | text | false | — | persistence: string | [contract](../../src/persistence/types/flagsCanonical.ts#L10) |
| description | text | false | — | description: string | [contract](../../src/persistence/types/flagsCanonical.ts#L11) |
| allowed_values | jsonb | true | — | allowedValues: Json | [contract](../../src/persistence/types/flagsCanonical.ts#L12) |
| derivation | text | true | — | derivation: string \| null | [contract](../../src/persistence/types/flagsCanonical.ts#L13) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
flag_definitions_display_id_check: CHECK ((display_id > 0))
flag_definitions_display_id_key: UNIQUE (display_id)
flag_definitions_key_key: UNIQUE (key)
flag_definitions_level_check: CHECK ((level = ANY (ARRAY['application'::text, 'site'::text, 'coverage'::text, 'product'::text, 'rider'::text, 'applicant'::text, 'client'::text])))
flag_definitions_persistence_check: CHECK ((persistence = ANY (ARRAY['configuration'::text, 'derived-runtime'::text, 'session'::text, 'application-record'::text])))
flag_definitions_pkey: PRIMARY KEY (id)
flag_definitions_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
flag_definitions_value_type_check: CHECK ((value_type = ANY (ARRAY['boolean'::text, 'enum'::text, 'string'::text, 'number'::text])))
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql), [supabase/migrations/202610120008_reference_validation.sql](../../supabase/migrations/202610120008_reference_validation.sql). Mentions include references and function bodies, not just table declarations.

## flag rules

`flag_rules`: Conditional flag derivation rules.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-shared. RLS: true. Contract: FlagRules. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/flagsCanonical.ts#L35) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/flagsCanonical.ts#L36) |
| flag_key | text | false | — | flagKey: string | [contract](../../src/persistence/types/flagsCanonical.ts#L37) |
| condition_key | text | false | — | conditionKey: string | [contract](../../src/persistence/types/flagsCanonical.ts#L38) |
| value | jsonb | false | — | value: Json | [contract](../../src/persistence/types/flagsCanonical.ts#L39) |
| priority | integer | false | — | priority: number | [contract](../../src/persistence/types/flagsCanonical.ts#L40) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
flag_rules_condition_key_fkey: FOREIGN KEY (condition_key) REFERENCES conditions(key)
flag_rules_display_id_check: CHECK ((display_id > 0))
flag_rules_display_id_key: UNIQUE (display_id)
flag_rules_flag_key_fkey: FOREIGN KEY (flag_key) REFERENCES flag_definitions(key)
flag_rules_key_key: UNIQUE (key)
flag_rules_pkey: PRIMARY KEY (id)
flag_rules_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## flag values

`flag_values`: Named values of flags.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-shared. RLS: true. Contract: FlagValues. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/flagsCanonical.ts#L16) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/flagsCanonical.ts#L17) |
| flag_key | text | false | — | flagKey: string | [contract](../../src/persistence/types/flagsCanonical.ts#L18) |
| value | text | false | — | value: string | [contract](../../src/persistence/types/flagsCanonical.ts#L19) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
flag_values_display_id_check: CHECK ((display_id > 0))
flag_values_display_id_key: UNIQUE (display_id)
flag_values_flag_key_fkey: FOREIGN KEY (flag_key) REFERENCES flag_definitions(key)
flag_values_flag_key_value_key: UNIQUE (flag_key, value)
flag_values_key_key: UNIQUE (key)
flag_values_pkey: PRIMARY KEY (id)
flag_values_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql), [supabase/migrations/202610120008_reference_validation.sql](../../supabase/migrations/202610120008_reference_validation.sql). Mentions include references and function bodies, not just table declarations.

## flow steps

`flow_steps`: Nodes within flows.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-flows. RLS: true. Contract: FlowStepRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/catalog.ts#L4) |
| flow_key | text | false | — | flowKey: string | [contract](../../src/persistence/types/flows.ts#L5) |
| definition | jsonb | false | — | definition: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/flows").FlowNodeDef | [contract](../../src/persistence/types/catalog.ts#L4) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
flow_steps_definition_check: CHECK ((jsonb_typeof(definition) = 'object'::text))
flow_steps_display_id_key: UNIQUE (display_id)
flow_steps_flow_key_fkey: FOREIGN KEY (flow_key) REFERENCES flows(key)
flow_steps_flow_key_key_key: UNIQUE (flow_key, key)
flow_steps_key_key: UNIQUE (key)
flow_steps_pkey: PRIMARY KEY (id)
flow_steps_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
portal_json_reference: TRIGGER DEFERRABLE INITIALLY DEFERRED
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql), [supabase/migrations/202610120008_reference_validation.sql](../../supabase/migrations/202610120008_reference_validation.sql). Mentions include references and function bodies, not just table declarations.

## flow transitions

`flow_transitions`: Edges with source and target nodes constrained to the same flow.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-flows. RLS: true. Contract: FlowTransitionRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/catalog.ts#L4) |
| flow_key | text | false | — | flowKey: string | [contract](../../src/persistence/types/flows.ts#L6) |
| source_step_key | text | false | — | sourceStepKey: string | [contract](../../src/persistence/types/flows.ts#L6) |
| target_step_key | text | false | — | targetStepKey: string | [contract](../../src/persistence/types/flows.ts#L6) |
| definition | jsonb | false | — | definition: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/flows").FlowEdgeDef | [contract](../../src/persistence/types/catalog.ts#L4) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
flow_transitions_definition_check: CHECK ((jsonb_typeof(definition) = 'object'::text))
flow_transitions_display_id_key: UNIQUE (display_id)
flow_transitions_flow_key_fkey: FOREIGN KEY (flow_key) REFERENCES flows(key)
flow_transitions_flow_key_source_step_key_fkey: FOREIGN KEY (flow_key, source_step_key) REFERENCES flow_steps(flow_key, key)
flow_transitions_flow_key_target_step_key_fkey: FOREIGN KEY (flow_key, target_step_key) REFERENCES flow_steps(flow_key, key)
flow_transitions_key_key: UNIQUE (key)
flow_transitions_pkey: PRIMARY KEY (id)
flow_transitions_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
flow_transitions_source_step_key_fkey: FOREIGN KEY (source_step_key) REFERENCES flow_steps(key)
flow_transitions_target_step_key_fkey: FOREIGN KEY (target_step_key) REFERENCES flow_steps(key)
portal_json_reference: TRIGGER DEFERRABLE INITIALLY DEFERRED
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql), [supabase/migrations/202610120008_reference_validation.sql](../../supabase/migrations/202610120008_reference_validation.sql). Mentions include references and function bodies, not just table declarations.

## flows

`flows`: Flow catalog.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-flows. RLS: true. Contract: FlowRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/catalog.ts#L4) |
| definition | jsonb | false | — | definition: Pick<import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/flows").FlowDefinition, "id" \| "title" \| "intro"> | [contract](../../src/persistence/types/catalog.ts#L4) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
flows_definition_check: CHECK ((jsonb_typeof(definition) = 'object'::text))
flows_display_id_key: UNIQUE (display_id)
flows_key_key: UNIQUE (key)
flows_pkey: PRIMARY KEY (id)
flows_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
portal_json_reference: TRIGGER DEFERRABLE INITIALLY DEFERRED
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql), [supabase/migrations/202610120008_reference_validation.sql](../../supabase/migrations/202610120008_reference_validation.sql). Mentions include references and function bodies, not just table declarations.

## identity resolutions

`identity_resolutions`: Source-row identity matches, candidates and explanations.

Owner: Source/evidence or reference registry; retention independent of runtime activation. Group: evidence. RLS: true. Contract: IdentityResolutions. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L59) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L60) |
| sheet_key | text | false | — | sheetKey: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L61) |
| source_row | integer | false | — | sourceRow: number | [contract](../../src/persistence/types/provenanceCanonical.ts#L62) |
| strategy | text | false | — | strategy: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L63) |
| candidate_keys | jsonb | false | — | candidateKeys: Json | [contract](../../src/persistence/types/provenanceCanonical.ts#L64) |
| product_key | text | true | — | productKey: string \| null | [contract](../../src/persistence/types/provenanceCanonical.ts#L65) |
| explanation | text | false | — | explanation: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L66) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
identity_resolutions_display_id_check: CHECK ((display_id > 0))
identity_resolutions_display_id_key: UNIQUE (display_id)
identity_resolutions_key_key: UNIQUE (key)
identity_resolutions_pkey: PRIMARY KEY (id)
identity_resolutions_product_key_fkey: FOREIGN KEY (product_key) REFERENCES products(key)
identity_resolutions_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
identity_resolutions_sheet_key_fkey: FOREIGN KEY (sheet_key) REFERENCES source_sheets(key)
identity_resolutions_strategy_check: CHECK ((strategy = ANY (ARRAY['exact'::text, 'semantic-key'::text, 'g-number'::text, 'plan-code'::text, 'g-number+plan-code'::text, 'multi-match'::text, 'no-match'::text])))
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql). Mentions include references and function bodies, not just table declarations.

## maximum plan rules

`maximum_plan_rules`: Limits on plan counts by product/site/applicant-role/category.

Owner: Site-scoped or optional Site dimension; inspect nullable links and any paired Association target. Group: library-rules. RLS: true. Contract: MaximumPlanRules. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L71) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L72) |
| product_key | text | false | — | productKey: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L73) |
| site_key | text | true | — | siteKey: string \| null | [contract](../../src/persistence/types/underwritingCanonical.ts#L74) |
| applicant_type_key | text | false | — | applicantTypeKey: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L75) |
| category_key | text | false | — | categoryKey: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L76) |
| count | integer | false | — | count: number | [contract](../../src/persistence/types/underwritingCanonical.ts#L77) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
maximum_plan_rules_applicant_type_key_fkey: FOREIGN KEY (applicant_type_key) REFERENCES applicant_types(key)
maximum_plan_rules_category_key_fkey: FOREIGN KEY (category_key) REFERENCES coverage_categories(key)
maximum_plan_rules_count_check: CHECK ((count > 0))
maximum_plan_rules_display_id_check: CHECK ((display_id > 0))
maximum_plan_rules_display_id_key: UNIQUE (display_id)
maximum_plan_rules_key_key: UNIQUE (key)
maximum_plan_rules_pkey: PRIMARY KEY (id)
maximum_plan_rules_product_key_fkey: FOREIGN KEY (product_key) REFERENCES products(key)
maximum_plan_rules_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
maximum_plan_rules_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## migration schedules

`migration_schedules`: Client migration milestones and expected dates.

Owner: Hosting Association through compatibility reference; optional links do not establish mandatory ownership. Group: changes. RLS: true. Contract: MigrationSchedule. Access: Mock server operational arrays; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/migrationSchedule.ts#L15) |
| client_key | text | false | — | clientKey: string | [contract](../../src/persistence/types/migrationSchedule.ts#L16) |
| migrating | boolean | false | false | migrating: boolean | [contract](../../src/persistence/types/migrationSchedule.ts#L17) |
| milestones | jsonb | false | — | milestones: Record<"requirements" \| "prototype" \| "uat" \| "preprod" \| "production", MigrationMilestone> | [contract](../../src/persistence/types/migrationSchedule.ts#L18) |
| expected_date | date | true | — | expectedDate: string \| null | [contract](../../src/persistence/types/migrationSchedule.ts#L19) |
| notes | text | false | ''::text | notes: string | [contract](../../src/persistence/types/migrationSchedule.ts#L20) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| updated_at | timestamp with time zone | false | now() | updatedAt: string | [contract](../../src/persistence/types/common.ts#L13) |

Installed constraints:

```sql
migration_schedules_association_context: FOREIGN KEY (client_key) REFERENCES clients(key)
migration_schedules_client_key_key: UNIQUE (client_key)
migration_schedules_milestones_check: CHECK ((jsonb_typeof(milestones) = 'object'::text))
migration_schedules_pkey: PRIMARY KEY (id)
```

Migration sources mentioning this table: [supabase/migrations/202610050001_migration_schedule.sql](../../supabase/migrations/202610050001_migration_schedule.sql), [supabase/migrations/202610120003_relationship_integrity.sql](../../supabase/migrations/202610120003_relationship_integrity.sql). Mentions include references and function bodies, not just table declarations.

## organization profiles

`organization_profiles`: Extended organization metadata.

Owner: TPA via organization_key. Group: hierarchy. RLS: true. Contract: LibraryRow<Omit<Tpa, "id">> & { organizationKey: string; }. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/catalog.ts#L4) |
| organization_key | text | false | — | organizationKey: string | [contract](../../src/persistence/types/library.ts#L21) |
| definition | jsonb | false | — | definition: Omit<import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/organizations").Tpa, "id"> | [contract](../../src/persistence/types/catalog.ts#L4) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
organization_profiles_definition_check: CHECK ((jsonb_typeof(definition) = 'object'::text))
organization_profiles_display_id_key: UNIQUE (display_id)
organization_profiles_key_key: UNIQUE (key)
organization_profiles_organization_key_fkey: FOREIGN KEY (organization_key) REFERENCES organizations(key)
organization_profiles_organization_key_key: UNIQUE (organization_key)
organization_profiles_pkey: PRIMARY KEY (id)
organization_profiles_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## organizations

`organizations`: TPA/organization root.

Owner: TPA/organization root; global portal identity. Group: hierarchy. RLS: true. Contract: Organization. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/organization.ts#L6) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/organization.ts#L6) |
| name | text | false | — | name: string | [contract](../../src/domain/organizations.ts#L20) |
| type | text | false | — | type: string | [contract](../../src/persistence/types/organization.ts#L6) |
| status | record_status | false | 'active'::record_status | status: RecordStatus | [contract](../../src/persistence/types/organization.ts#L6) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| updated_at | timestamp with time zone | false | now() | updatedAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
organizations_display_id_key: UNIQUE (display_id)
organizations_key_key: UNIQUE (key)
organizations_pkey: PRIMARY KEY (id)
organizations_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
```

Migration sources mentioning this table: [supabase/migrations/202609240001_initial_portal_schema.sql](../../supabase/migrations/202609240001_initial_portal_schema.sql), [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120004_association_identity.sql](../../supabase/migrations/202610120004_association_identity.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql), [supabase/migrations/202610120008_reference_validation.sql](../../supabase/migrations/202610120008_reference_validation.sql), [supabase/migrations/202610120009_application_context_history.sql](../../supabase/migrations/202610120009_application_context_history.sql). Mentions include references and function bodies, not just table declarations.

## page fields

`page_fields`: Ordered page-to-field composition.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-fields. RLS: true. Contract: PageFieldRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/template.ts#L10) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/template.ts#L10) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/template.ts#L10) |
| page_key | text | false | — | pageKey: string | [contract](../../src/persistence/types/template.ts#L10) |
| field_key | text | false | — | fieldKey: string | [contract](../../src/persistence/types/template.ts#L10) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
page_fields_display_id_key: UNIQUE (display_id)
page_fields_field_key_fkey: FOREIGN KEY (field_key) REFERENCES fields(key)
page_fields_key_key: UNIQUE (key)
page_fields_page_key_field_key_key: UNIQUE (page_key, field_key)
page_fields_page_key_fkey: FOREIGN KEY (page_key) REFERENCES pages(key)
page_fields_page_key_position_key: UNIQUE (page_key, "position")
page_fields_pkey: PRIMARY KEY (id)
page_fields_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## page section fields

`page_section_fields`: Field composition within page sections.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-fields. RLS: true. Contract: PageSectionFields. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/questionsCanonical.ts#L35) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/questionsCanonical.ts#L36) |
| section_key | text | false | — | sectionKey: string | [contract](../../src/persistence/types/questionsCanonical.ts#L37) |
| field_key | text | false | — | fieldKey: string | [contract](../../src/persistence/types/questionsCanonical.ts#L38) |
| position | integer | false | — | position: number | [contract](../../src/persistence/types/questionsCanonical.ts#L39) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
page_section_fields_display_id_check: CHECK ((display_id > 0))
page_section_fields_display_id_key: UNIQUE (display_id)
page_section_fields_field_key_fkey: FOREIGN KEY (field_key) REFERENCES fields(key)
page_section_fields_key_key: UNIQUE (key)
page_section_fields_pkey: PRIMARY KEY (id)
page_section_fields_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
page_section_fields_section_key_field_key_key: UNIQUE (section_key, field_key)
page_section_fields_section_key_fkey: FOREIGN KEY (section_key) REFERENCES page_sections(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610090002_field_collections.sql](../../supabase/migrations/202610090002_field_collections.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## page sections

`page_sections`: Sections of catalog pages.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-pages. RLS: true. Contract: PageSectionRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/catalog.ts#L4) |
| page_key | text | false | — | pageKey: string | [contract](../../src/persistence/types/template.ts#L8) |
| definition | jsonb | false | — | definition: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/config/pageSections/types").PageSectionConfig | [contract](../../src/persistence/types/catalog.ts#L4) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
page_sections_definition_check: CHECK ((jsonb_typeof(definition) = 'object'::text))
page_sections_display_id_key: UNIQUE (display_id)
page_sections_key_key: UNIQUE (key)
page_sections_page_key_fkey: FOREIGN KEY (page_key) REFERENCES pages(key)
page_sections_pkey: PRIMARY KEY (id)
page_sections_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## pages

`pages`: Page catalog and routing definitions.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-pages. RLS: true. Contract: PageRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/catalog.ts#L4) |
| definition | jsonb | false | — | definition: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/pages").Page & { healthGate: boolean; } | [contract](../../src/persistence/types/catalog.ts#L4) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
pages_definition_check: CHECK ((jsonb_typeof(definition) = 'object'::text))
pages_definition_contract: CHECK (COALESCE((((definition ->> 'id'::text) = key) AND ((definition ->> 'flow'::text) = ANY (ARRAY['application'::text, 'resume'::text, 'advisor'::text, 'internal'::text])) AND ((definition ->> 'type'::text) = ANY (ARRAY['home'::text, 'form'::text, 'receipt'::text, 'resume'::text, 'internal'::text])) AND ((definition ->> 'path'::text) ~ '^/([^/?#[:space:]][^?#[:space:]]*)?$'::text) AND ("position" >= 0)), false))
pages_display_id_key: UNIQUE (display_id)
pages_key_key: UNIQUE (key)
pages_pkey: PRIMARY KEY (id)
pages_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
portal_json_reference: TRIGGER DEFERRABLE INITIALLY DEFERRED
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610090001_page_catalog_contract.sql](../../supabase/migrations/202610090001_page_catalog_contract.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql), [supabase/migrations/202610120007_field_reference_bootstrap.sql](../../supabase/migrations/202610120007_field_reference_bootstrap.sql), [supabase/migrations/202610120008_reference_validation.sql](../../supabase/migrations/202610120008_reference_validation.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [pages_route_unique](../../supabase/migrations/202610090001_page_catalog_contract.sql#L63): `create unique index pages_route_unique on public.pages ((definition->>'path'));`

## pattern assignments

`pattern_assignments`: Pattern configuration for optional client, site, product or applicant-role targets.

Owner: Site-scoped or optional Site dimension; inspect nullable links and any paired Association target. Group: library-shared. RLS: true. Contract: PatternAssignments. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/patternsCanonical.ts#L31) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/patternsCanonical.ts#L32) |
| pattern_key | text | false | — | patternKey: string | [contract](../../src/persistence/types/patternsCanonical.ts#L33) |
| client_key | text | true | — | clientKey: string \| null | [contract](../../src/persistence/types/patternsCanonical.ts#L34) |
| site_key | text | true | — | siteKey: string \| null | [contract](../../src/persistence/types/patternsCanonical.ts#L35) |
| product_key | text | true | — | productKey: string \| null | [contract](../../src/persistence/types/patternsCanonical.ts#L36) |
| applicant_key | text | true | — | applicantKey: string \| null | [contract](../../src/persistence/types/patternsCanonical.ts#L37) |
| configuration | jsonb | false | — | configuration: Json | [contract](../../src/persistence/types/patternsCanonical.ts#L38) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
pattern_assignments_applicant_key_fkey: FOREIGN KEY (applicant_key) REFERENCES applicant_types(key)
pattern_assignments_client_key_fkey: FOREIGN KEY (client_key) REFERENCES clients(key)
pattern_assignments_display_id_check: CHECK ((display_id > 0))
pattern_assignments_display_id_key: UNIQUE (display_id)
pattern_assignments_key_key: UNIQUE (key)
pattern_assignments_pattern_key_fkey: FOREIGN KEY (pattern_key) REFERENCES patterns(key)
pattern_assignments_pkey: PRIMARY KEY (id)
pattern_assignments_product_key_fkey: FOREIGN KEY (product_key) REFERENCES products(key)
pattern_assignments_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
pattern_assignments_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120003_relationship_integrity.sql](../../supabase/migrations/202610120003_relationship_integrity.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [pattern_assignments_owner_guard](../../supabase/migrations/202610120003_relationship_integrity.sql#L92): `create trigger pattern_assignments_owner_guard before insert or update on public.pattern_assignments for each row execute function public.check_site_owner_pair();`

## pattern conditions

`pattern_conditions`: Pattern-to-conditions composition with relationship type.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-shared. RLS: true. Contract: PatternConditions. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/patternsCanonical.ts#L48) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/patternsCanonical.ts#L49) |
| pattern_key | text | false | — | patternKey: string | [contract](../../src/persistence/types/patternsCanonical.ts#L50) |
| related_key | text | false | — | relatedKey: string | [contract](../../src/persistence/types/patternsCanonical.ts#L51) |
| relationship_type | text | false | — | relationshipType: string | [contract](../../src/persistence/types/patternsCanonical.ts#L52) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
pattern_conditions_display_id_check: CHECK ((display_id > 0))
pattern_conditions_display_id_key: UNIQUE (display_id)
pattern_conditions_key_key: UNIQUE (key)
pattern_conditions_pattern_key_fkey: FOREIGN KEY (pattern_key) REFERENCES patterns(key)
pattern_conditions_pattern_key_related_key_key: UNIQUE (pattern_key, related_key)
pattern_conditions_pkey: PRIMARY KEY (id)
pattern_conditions_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
pattern_conditions_related_key_fkey: FOREIGN KEY (related_key) REFERENCES conditions(key)
pattern_conditions_relationship_type_check: CHECK ((relationship_type = ANY (ARRAY['implements'::text, 'uses'::text, 'constrains'::text, 'triggers'::text, 'documents'::text])))
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## pattern configuration definitions

`pattern_configuration_definitions`: Pattern-to-configuration definitions composition with relationship type.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-shared. RLS: true. Contract: PatternConfigurationDefinitions. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/patternsCanonical.ts#L83) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/patternsCanonical.ts#L84) |
| pattern_key | text | false | — | patternKey: string | [contract](../../src/persistence/types/patternsCanonical.ts#L85) |
| related_key | text | false | — | relatedKey: string | [contract](../../src/persistence/types/patternsCanonical.ts#L86) |
| relationship_type | text | false | — | relationshipType: string | [contract](../../src/persistence/types/patternsCanonical.ts#L87) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
pattern_configuration_definitions_display_id_check: CHECK ((display_id > 0))
pattern_configuration_definitions_display_id_key: UNIQUE (display_id)
pattern_configuration_definitions_key_key: UNIQUE (key)
pattern_configuration_definitions_pattern_key_fkey: FOREIGN KEY (pattern_key) REFERENCES patterns(key)
pattern_configuration_definitions_pattern_key_related_key_key: UNIQUE (pattern_key, related_key)
pattern_configuration_definitions_pkey: PRIMARY KEY (id)
pattern_configuration_definitions_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
pattern_configuration_definitions_related_key_fkey: FOREIGN KEY (related_key) REFERENCES configuration_definitions(key)
pattern_configuration_definitions_relationship_type_check: CHECK ((relationship_type = ANY (ARRAY['implements'::text, 'uses'::text, 'constrains'::text, 'triggers'::text, 'documents'::text])))
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## pattern coverage categories

`pattern_coverage_categories`: Pattern-to-coverage categories composition with relationship type.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-shared. RLS: true. Contract: PatternCoverageCategories. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/patternsCanonical.ts#L76) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/patternsCanonical.ts#L77) |
| pattern_key | text | false | — | patternKey: string | [contract](../../src/persistence/types/patternsCanonical.ts#L78) |
| related_key | text | false | — | relatedKey: string | [contract](../../src/persistence/types/patternsCanonical.ts#L79) |
| relationship_type | text | false | — | relationshipType: string | [contract](../../src/persistence/types/patternsCanonical.ts#L80) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
pattern_coverage_categories_display_id_check: CHECK ((display_id > 0))
pattern_coverage_categories_display_id_key: UNIQUE (display_id)
pattern_coverage_categories_key_key: UNIQUE (key)
pattern_coverage_categories_pattern_key_fkey: FOREIGN KEY (pattern_key) REFERENCES patterns(key)
pattern_coverage_categories_pattern_key_related_key_key: UNIQUE (pattern_key, related_key)
pattern_coverage_categories_pkey: PRIMARY KEY (id)
pattern_coverage_categories_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
pattern_coverage_categories_related_key_fkey: FOREIGN KEY (related_key) REFERENCES coverage_categories(key)
pattern_coverage_categories_relationship_type_check: CHECK ((relationship_type = ANY (ARRAY['implements'::text, 'uses'::text, 'constrains'::text, 'triggers'::text, 'documents'::text])))
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## pattern flag definitions

`pattern_flag_definitions`: Pattern-to-flag definitions composition with relationship type.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-shared. RLS: true. Contract: PatternFlagDefinitions. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/patternsCanonical.ts#L55) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/patternsCanonical.ts#L56) |
| pattern_key | text | false | — | patternKey: string | [contract](../../src/persistence/types/patternsCanonical.ts#L57) |
| related_key | text | false | — | relatedKey: string | [contract](../../src/persistence/types/patternsCanonical.ts#L58) |
| relationship_type | text | false | — | relationshipType: string | [contract](../../src/persistence/types/patternsCanonical.ts#L59) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
pattern_flag_definitions_display_id_check: CHECK ((display_id > 0))
pattern_flag_definitions_display_id_key: UNIQUE (display_id)
pattern_flag_definitions_key_key: UNIQUE (key)
pattern_flag_definitions_pattern_key_fkey: FOREIGN KEY (pattern_key) REFERENCES patterns(key)
pattern_flag_definitions_pattern_key_related_key_key: UNIQUE (pattern_key, related_key)
pattern_flag_definitions_pkey: PRIMARY KEY (id)
pattern_flag_definitions_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
pattern_flag_definitions_related_key_fkey: FOREIGN KEY (related_key) REFERENCES flag_definitions(key)
pattern_flag_definitions_relationship_type_check: CHECK ((relationship_type = ANY (ARRAY['implements'::text, 'uses'::text, 'constrains'::text, 'triggers'::text, 'documents'::text])))
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## pattern flows

`pattern_flows`: Pattern-to-flows composition with relationship type.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-shared. RLS: true. Contract: PatternFlows. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/patternsCanonical.ts#L62) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/patternsCanonical.ts#L63) |
| pattern_key | text | false | — | patternKey: string | [contract](../../src/persistence/types/patternsCanonical.ts#L64) |
| related_key | text | false | — | relatedKey: string | [contract](../../src/persistence/types/patternsCanonical.ts#L65) |
| relationship_type | text | false | — | relationshipType: string | [contract](../../src/persistence/types/patternsCanonical.ts#L66) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
pattern_flows_display_id_check: CHECK ((display_id > 0))
pattern_flows_display_id_key: UNIQUE (display_id)
pattern_flows_key_key: UNIQUE (key)
pattern_flows_pattern_key_fkey: FOREIGN KEY (pattern_key) REFERENCES patterns(key)
pattern_flows_pattern_key_related_key_key: UNIQUE (pattern_key, related_key)
pattern_flows_pkey: PRIMARY KEY (id)
pattern_flows_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
pattern_flows_related_key_fkey: FOREIGN KEY (related_key) REFERENCES flows(key)
pattern_flows_relationship_type_check: CHECK ((relationship_type = ANY (ARRAY['implements'::text, 'uses'::text, 'constrains'::text, 'triggers'::text, 'documents'::text])))
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## pattern products

`pattern_products`: Pattern-to-products composition with relationship type.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-shared. RLS: true. Contract: PatternProducts. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/patternsCanonical.ts#L69) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/patternsCanonical.ts#L70) |
| pattern_key | text | false | — | patternKey: string | [contract](../../src/persistence/types/patternsCanonical.ts#L71) |
| related_key | text | false | — | relatedKey: string | [contract](../../src/persistence/types/patternsCanonical.ts#L72) |
| relationship_type | text | false | — | relationshipType: string | [contract](../../src/persistence/types/patternsCanonical.ts#L73) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
pattern_products_display_id_check: CHECK ((display_id > 0))
pattern_products_display_id_key: UNIQUE (display_id)
pattern_products_key_key: UNIQUE (key)
pattern_products_pattern_key_fkey: FOREIGN KEY (pattern_key) REFERENCES patterns(key)
pattern_products_pattern_key_related_key_key: UNIQUE (pattern_key, related_key)
pattern_products_pkey: PRIMARY KEY (id)
pattern_products_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
pattern_products_related_key_fkey: FOREIGN KEY (related_key) REFERENCES products(key)
pattern_products_relationship_type_check: CHECK ((relationship_type = ANY (ARRAY['implements'::text, 'uses'::text, 'constrains'::text, 'triggers'::text, 'documents'::text])))
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## pattern question sets

`pattern_question_sets`: Pattern-to-question sets composition with relationship type.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: catalog. RLS: true. Contract: PatternQuestionSets. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/patternsCanonical.ts#L90) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/patternsCanonical.ts#L91) |
| pattern_key | text | false | — | patternKey: string | [contract](../../src/persistence/types/patternsCanonical.ts#L92) |
| related_key | text | false | — | relatedKey: string | [contract](../../src/persistence/types/patternsCanonical.ts#L93) |
| relationship_type | text | false | — | relationshipType: string | [contract](../../src/persistence/types/patternsCanonical.ts#L94) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
pattern_question_sets_display_id_check: CHECK ((display_id > 0))
pattern_question_sets_display_id_key: UNIQUE (display_id)
pattern_question_sets_key_key: UNIQUE (key)
pattern_question_sets_pattern_key_fkey: FOREIGN KEY (pattern_key) REFERENCES patterns(key)
pattern_question_sets_pattern_key_related_key_key: UNIQUE (pattern_key, related_key)
pattern_question_sets_pkey: PRIMARY KEY (id)
pattern_question_sets_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
pattern_question_sets_related_key_fkey: FOREIGN KEY (related_key) REFERENCES question_sets(key)
pattern_question_sets_relationship_type_check: CHECK ((relationship_type = ANY (ARRAY['implements'::text, 'uses'::text, 'constrains'::text, 'triggers'::text, 'documents'::text])))
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql). Mentions include references and function bodies, not just table declarations.

## pattern rules

`pattern_rules`: Pattern-to-rules composition with relationship type.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-shared. RLS: true. Contract: PatternRules. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/patternsCanonical.ts#L41) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/patternsCanonical.ts#L42) |
| pattern_key | text | false | — | patternKey: string | [contract](../../src/persistence/types/patternsCanonical.ts#L43) |
| related_key | text | false | — | relatedKey: string | [contract](../../src/persistence/types/patternsCanonical.ts#L44) |
| relationship_type | text | false | — | relationshipType: string | [contract](../../src/persistence/types/patternsCanonical.ts#L45) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
pattern_rules_display_id_check: CHECK ((display_id > 0))
pattern_rules_display_id_key: UNIQUE (display_id)
pattern_rules_key_key: UNIQUE (key)
pattern_rules_pattern_key_fkey: FOREIGN KEY (pattern_key) REFERENCES patterns(key)
pattern_rules_pattern_key_related_key_key: UNIQUE (pattern_key, related_key)
pattern_rules_pkey: PRIMARY KEY (id)
pattern_rules_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
pattern_rules_related_key_fkey: FOREIGN KEY (related_key) REFERENCES rules(key)
pattern_rules_relationship_type_check: CHECK ((relationship_type = ANY (ARRAY['implements'::text, 'uses'::text, 'constrains'::text, 'triggers'::text, 'documents'::text])))
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## patterns

`patterns`: Reusable behavior pattern catalog.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-shared. RLS: true. Contract: Patterns. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/patternsCanonical.ts#L5) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/patternsCanonical.ts#L6) |
| name | text | false | — | name: string | [contract](../../src/persistence/types/patternsCanonical.ts#L7) |
| category | text | false | — | category: string | [contract](../../src/persistence/types/patternsCanonical.ts#L8) |
| description | text | false | — | description: string | [contract](../../src/persistence/types/patternsCanonical.ts#L9) |
| version | text | true | — | version: string \| null | [contract](../../src/persistence/types/patternsCanonical.ts#L10) |
| status | text | false | — | status: string | [contract](../../src/persistence/types/patternsCanonical.ts#L11) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
patterns_display_id_check: CHECK ((display_id > 0))
patterns_display_id_key: UNIQUE (display_id)
patterns_key_key: UNIQUE (key)
patterns_pkey: PRIMARY KEY (id)
patterns_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
patterns_status_check: CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'deprecated'::text])))
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## plan amount rules

`plan_amount_rules`: Conditional amount strategies on plan variants.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-rules. RLS: true. Contract: PlanAmountRules. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L32) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L33) |
| variant_key | text | false | — | variantKey: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L34) |
| amount_pattern_key | text | false | — | amountPatternKey: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L35) |
| condition_key | text | true | — | conditionKey: string \| null | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L36) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
plan_amount_rules_amount_pattern_key_fkey: FOREIGN KEY (amount_pattern_key) REFERENCES coverage_amount_patterns(key)
plan_amount_rules_condition_key_fkey: FOREIGN KEY (condition_key) REFERENCES conditions(key)
plan_amount_rules_display_id_check: CHECK ((display_id > 0))
plan_amount_rules_display_id_key: UNIQUE (display_id)
plan_amount_rules_key_key: UNIQUE (key)
plan_amount_rules_pkey: PRIMARY KEY (id)
plan_amount_rules_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
plan_amount_rules_variant_key_fkey: FOREIGN KEY (variant_key) REFERENCES coverage_plan_variants(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## plan benefit periods

`plan_benefit_periods`: Waiting/benefit durations on plan variants.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-rules. RLS: true. Contract: PlanBenefitPeriods. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L46) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L47) |
| variant_key | text | false | — | variantKey: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L48) |
| kind | text | false | — | kind: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L49) |
| value | numeric | false | — | value: number | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L50) |
| unit | text | false | — | unit: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L51) |
| position | integer | false | — | position: number | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L52) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
plan_benefit_periods_display_id_check: CHECK ((display_id > 0))
plan_benefit_periods_display_id_key: UNIQUE (display_id)
plan_benefit_periods_key_key: UNIQUE (key)
plan_benefit_periods_kind_check: CHECK ((kind = ANY (ARRAY['waiting'::text, 'benefit'::text])))
plan_benefit_periods_pkey: PRIMARY KEY (id)
plan_benefit_periods_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
plan_benefit_periods_unit_check: CHECK ((unit = ANY (ARRAY['days'::text, 'months'::text, 'years'::text])))
plan_benefit_periods_variant_key_fkey: FOREIGN KEY (variant_key) REFERENCES coverage_plan_variants(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## portal actors

`portal_actors`: Human, service, system or unresolved historical actors.

Owner: Global identity/access catalog or child of user/actor; tenant applicability through typed scopes. Group: identity. RLS: true. Contract: PortalActor. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/structure.ts#L20) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/structure.ts#L20) |
| kind | text | false | — | kind: "human" \| "service" \| "system" \| "unresolved" | [contract](../../src/persistence/types/structure.ts#L20) |
| display_name | text | false | — | displayName: string | [contract](../../src/persistence/types/structure.ts#L20) |
| user_id | uuid | true | — | userId: string \| null | [contract](../../src/persistence/types/structure.ts#L21) |
| auth_user_id | uuid | true | — | authUserId: string \| null | [contract](../../src/persistence/types/structure.ts#L21) |
| applicant_id | uuid | true | — | applicantId: string \| null | [contract](../../src/persistence/types/structure.ts#L21) |
| original_identity | jsonb | false | '{}'::jsonb | originalIdentity: Json | [contract](../../src/persistence/types/structure.ts#L22) |
| archived_at | timestamp with time zone | true | — | archivedAt: string \| null | [contract](../../src/persistence/types/structure.ts#L22) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/structure.ts#L22) |

Installed constraints:

```sql
portal_actors_applicant_id_fkey: FOREIGN KEY (applicant_id) REFERENCES applicants(id)
portal_actors_applicant_id_key: UNIQUE (applicant_id)
portal_actors_auth_user_id_fkey: FOREIGN KEY (auth_user_id) REFERENCES auth.users(id)
portal_actors_auth_user_id_key: UNIQUE (auth_user_id)
portal_actors_check: CHECK (((kind = 'human'::text) OR (num_nonnulls(user_id, auth_user_id, applicant_id) = 0)))
portal_actors_check1: CHECK (((kind <> 'human'::text) OR (num_nonnulls(user_id, auth_user_id, applicant_id) > 0)))
portal_actors_key_key: UNIQUE (key)
portal_actors_kind_check: CHECK ((kind = ANY (ARRAY['human'::text, 'service'::text, 'system'::text, 'unresolved'::text])))
portal_actors_pkey: PRIMARY KEY (id)
portal_actors_user_id_fkey: FOREIGN KEY (user_id) REFERENCES users(id)
portal_actors_user_id_key: UNIQUE (user_id)
```

Migration sources mentioning this table: [supabase/migrations/202610120005_application_storage.sql](../../supabase/migrations/202610120005_application_storage.sql), [supabase/migrations/202610120009_application_context_history.sql](../../supabase/migrations/202610120009_application_context_history.sql). Mentions include references and function bodies, not just table declarations.

## portal admin accounts

`portal_admin_accounts`: Approved Supabase authentication identities for publication administration.

Owner: Global identity/access catalog or child of user/actor; tenant applicability through typed scopes. Group: identity. RLS: true. Contract: Dedicated RPC/service. Access: Dedicated SQL RPC/service boundary.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| user_id | uuid | false | — | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |
| username | text | false | — | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |
| active | boolean | false | true | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |

Installed constraints:

```sql
portal_admin_accounts_pkey: PRIMARY KEY (user_id)
portal_admin_accounts_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id)
portal_admin_accounts_username_check: CHECK ((username = 'caroline'::text))
portal_admin_accounts_username_key: UNIQUE (username)
```

Migration sources mentioning this table: [supabase/migrations/202610020001_library_publication.sql](../../supabase/migrations/202610020001_library_publication.sql). Mentions include references and function bodies, not just table declarations.

## portal entity references

`portal_entity_references`: Validated current primary-key references or original historical snapshots.

Owner: Source/evidence or reference registry; retention independent of runtime activation. Group: evidence. RLS: true. Contract: PortalEntityReference. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/structure.ts#L51) |
| reference_type_id | uuid | false | — | referenceTypeId: string | [contract](../../src/persistence/types/structure.ts#L51) |
| identity | jsonb | false | — | identity: Json | [contract](../../src/persistence/types/structure.ts#L51) |
| resolution_state | text | false | — | resolutionState: "current" \| "historical" | [contract](../../src/persistence/types/structure.ts#L51) |
| record_snapshot | jsonb | false | — | recordSnapshot: Json | [contract](../../src/persistence/types/structure.ts#L51) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/structure.ts#L51) |

Installed constraints:

```sql
portal_entity_references_identity_check: CHECK (((jsonb_typeof(identity) = 'object'::text) AND (identity <> '{}'::jsonb)))
portal_entity_references_pkey: PRIMARY KEY (id)
portal_entity_references_record_snapshot_check: CHECK ((jsonb_typeof(record_snapshot) = 'object'::text))
portal_entity_references_reference_type_id_fkey: FOREIGN KEY (reference_type_id) REFERENCES portal_reference_types(id)
portal_entity_references_reference_type_id_identity_key: UNIQUE (reference_type_id, identity)
portal_entity_references_resolution_state_check: CHECK ((resolution_state = ANY (ARRAY['current'::text, 'historical'::text])))
```

Migration sources mentioning this table: [supabase/migrations/202610120008_reference_validation.sql](../../supabase/migrations/202610120008_reference_validation.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [portal_entity_reference_type_idx](../../supabase/migrations/202610120008_reference_validation.sql#L214): `create index portal_entity_reference_type_idx on public.portal_entity_references(reference_type_id);`
- [portal_entity_reference_guard](../../supabase/migrations/202610120008_reference_validation.sql#L46): `create trigger portal_entity_reference_guard before insert on public.portal_entity_references for each row execute function public.check_registered_entity_reference();`
- [portal_entity_reference_immutable](../../supabase/migrations/202610120008_reference_validation.sql#L47): `create trigger portal_entity_reference_immutable before update or delete on public.portal_entity_references for each row execute function public.guard_published_configuration_history();`

## portal library drafts

`portal_library_drafts`: Versioned site configuration drafts owned by an auth identity.

Owner: Site-scoped or optional Site dimension; inspect nullable links and any paired Association target. Group: publication. RLS: true. Contract: Dedicated RPC/service. Access: Dedicated SQL RPC/service boundary.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |
| site_key | text | false | — | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |
| owner_id | uuid | false | — | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |
| edit_version | integer | false | 1 | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |
| base_release_id | uuid | true | — | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |
| payload | jsonb | false | — | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |
| payload_hash | text | false | — | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |
| updated_at | timestamp with time zone | false | now() | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |

Installed constraints:

```sql
portal_draft_base_release: FOREIGN KEY (base_release_id) REFERENCES portal_library_releases(id)
portal_draft_base_site: FOREIGN KEY (base_release_id, site_key) REFERENCES portal_library_releases(id, site_key)
portal_library_drafts_owner_id_fkey: FOREIGN KEY (owner_id) REFERENCES auth.users(id)
portal_library_drafts_payload_check: CHECK ((jsonb_typeof(payload) = 'object'::text))
portal_library_drafts_pkey: PRIMARY KEY (id)
portal_library_drafts_site_identity: UNIQUE (id, site_key)
portal_library_drafts_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
```

Migration sources mentioning this table: [supabase/migrations/202610020001_library_publication.sql](../../supabase/migrations/202610020001_library_publication.sql), [supabase/migrations/202610120003_relationship_integrity.sql](../../supabase/migrations/202610120003_relationship_integrity.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [portal_library_drafts_data_boundary](../../supabase/migrations/202610120003_relationship_integrity.sql#L175): `create trigger portal_library_drafts_data_boundary before insert or update of payload on public.portal_library_drafts   for each row execute function public.check_publication_data_boundary();`

## portal library heads

`portal_library_heads`: Current published release pointer and generation per site.

Owner: Site-scoped or optional Site dimension; inspect nullable links and any paired Association target. Group: publication. RLS: true. Contract: Dedicated RPC/service. Access: Dedicated SQL RPC/service boundary.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| site_key | text | false | — | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |
| release_id | uuid | true | — | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |
| generation | integer | false | 0 | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |

Installed constraints:

```sql
portal_head_release_site: FOREIGN KEY (release_id, site_key) REFERENCES portal_library_releases(id, site_key)
portal_library_heads_pkey: PRIMARY KEY (site_key)
portal_library_heads_release_id_fkey: FOREIGN KEY (release_id) REFERENCES portal_library_releases(id)
portal_library_heads_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
```

Migration sources mentioning this table: [supabase/migrations/202610020001_library_publication.sql](../../supabase/migrations/202610020001_library_publication.sql), [supabase/migrations/202610120003_relationship_integrity.sql](../../supabase/migrations/202610120003_relationship_integrity.sql). Mentions include references and function bodies, not just table declarations.

## portal library publication audit

`portal_library_publication_audit`: Auth actor and draft/release history of publication actions.

Owner: Site-scoped or optional Site dimension; inspect nullable links and any paired Association target. Group: publication. RLS: true. Contract: Dedicated RPC/service. Access: Dedicated SQL RPC/service boundary.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |
| site_key | text | false | — | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |
| action | text | false | — | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |
| actor_id | uuid | false | — | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |
| draft_id | uuid | true | — | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |
| previous_release_id | uuid | true | — | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |
| release_id | uuid | true | — | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |
| occurred_at | timestamp with time zone | false | now() | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |

Installed constraints:

```sql
portal_audit_draft_site: FOREIGN KEY (draft_id, site_key) REFERENCES portal_library_drafts(id, site_key)
portal_audit_previous_site: FOREIGN KEY (previous_release_id, site_key) REFERENCES portal_library_releases(id, site_key)
portal_audit_release_site: FOREIGN KEY (release_id, site_key) REFERENCES portal_library_releases(id, site_key)
portal_library_publication_audit_action_check: CHECK ((action = ANY (ARRAY['save-draft'::text, 'publish'::text, 'rollback'::text])))
portal_library_publication_audit_actor_id_fkey: FOREIGN KEY (actor_id) REFERENCES auth.users(id)
portal_library_publication_audit_draft_id_fkey: FOREIGN KEY (draft_id) REFERENCES portal_library_drafts(id)
portal_library_publication_audit_pkey: PRIMARY KEY (id)
portal_library_publication_audit_previous_release_id_fkey: FOREIGN KEY (previous_release_id) REFERENCES portal_library_releases(id)
portal_library_publication_audit_release_id_fkey: FOREIGN KEY (release_id) REFERENCES portal_library_releases(id)
portal_library_publication_audit_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
```

Migration sources mentioning this table: [supabase/migrations/202610020001_library_publication.sql](../../supabase/migrations/202610020001_library_publication.sql), [supabase/migrations/202610120003_relationship_integrity.sql](../../supabase/migrations/202610120003_relationship_integrity.sql). Mentions include references and function bodies, not just table declarations.

## portal library readiness

`portal_library_readiness`: Service-written readiness evidence bound to site and payload hash.

Owner: Site-scoped or optional Site dimension; inspect nullable links and any paired Association target. Group: publication. RLS: true. Contract: Dedicated RPC/service. Access: Dedicated SQL RPC/service boundary.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| site_key | text | false | — | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |
| payload_hash | text | false | — | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |
| domain | text | false | — | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |
| result | text | false | — | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |
| evidence_reference | text | false | — | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |
| verified_at | timestamp with time zone | false | now() | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |
| valid_until | timestamp with time zone | false | — | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |

Installed constraints:

```sql
portal_library_readiness_check: CHECK ((valid_until > verified_at))
portal_library_readiness_check1: CHECK (((result = 'passed'::text) OR (domain = 'rates'::text)))
portal_library_readiness_domain_check: CHECK ((domain = ANY (ARRAY['migration'::text, 'parity'::text, 'rates'::text, 'payments'::text, 'analytics'::text, 'submission'::text, 'admin-recovery'::text])))
portal_library_readiness_evidence_reference_check: CHECK ((length(TRIM(BOTH FROM evidence_reference)) > 0))
portal_library_readiness_pkey: PRIMARY KEY (site_key, payload_hash, domain)
portal_library_readiness_result_check: CHECK ((result = ANY (ARRAY['passed'::text, 'approved-unavailable'::text])))
portal_library_readiness_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
```

Migration sources mentioning this table: [supabase/migrations/202610020001_library_publication.sql](../../supabase/migrations/202610020001_library_publication.sql). Mentions include references and function bodies, not just table declarations.

## portal library releases

`portal_library_releases`: Published site configuration payloads and publisher identity.

Owner: Site-scoped or optional Site dimension; inspect nullable links and any paired Association target. Group: publication. RLS: true. Contract: Dedicated RPC/service. Access: Dedicated SQL RPC/service boundary.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |
| site_key | text | false | — | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |
| version | integer | false | — | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |
| draft_id | uuid | false | — | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |
| payload | jsonb | false | — | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |
| payload_hash | text | false | — | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |
| published_by | uuid | false | — | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |
| published_at | timestamp with time zone | false | now() | RPC/service | [captured SQL](../schema-validation/table-dictionary.json) |

Installed constraints:

```sql
portal_library_releases_draft_id_fkey: FOREIGN KEY (draft_id) REFERENCES portal_library_drafts(id)
portal_library_releases_pkey: PRIMARY KEY (id)
portal_library_releases_published_by_fkey: FOREIGN KEY (published_by) REFERENCES auth.users(id)
portal_library_releases_site_identity: UNIQUE (id, site_key)
portal_library_releases_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
portal_library_releases_site_key_version_key: UNIQUE (site_key, version)
portal_release_draft_site: FOREIGN KEY (draft_id, site_key) REFERENCES portal_library_drafts(id, site_key)
```

Migration sources mentioning this table: [supabase/migrations/202610020001_library_publication.sql](../../supabase/migrations/202610020001_library_publication.sql), [supabase/migrations/202610120003_relationship_integrity.sql](../../supabase/migrations/202610120003_relationship_integrity.sql), [supabase/migrations/202610120005_application_storage.sql](../../supabase/migrations/202610120005_application_storage.sql), [supabase/migrations/202610120009_application_context_history.sql](../../supabase/migrations/202610120009_application_context_history.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [portal_library_releases_immutable](../../supabase/migrations/202610120003_relationship_integrity.sql#L152): `create trigger portal_library_releases_immutable before update or delete on public.portal_library_releases   for each row execute function public.guard_published_configuration_history();`
- [portal_library_releases_data_boundary](../../supabase/migrations/202610120003_relationship_integrity.sql#L177): `create trigger portal_library_releases_data_boundary before insert on public.portal_library_releases   for each row execute function public.check_publication_data_boundary();`

## portal reference types

`portal_reference_types`: Registry of current-table or historical-external reference types.

Owner: Source/evidence or reference registry; retention independent of runtime activation. Group: evidence. RLS: true. Contract: PortalReferenceType. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/structure.ts#L48) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/structure.ts#L48) |
| table_name | text | true | — | tableName: string \| null | [contract](../../src/persistence/types/structure.ts#L48) |
| validation_kind | text | false | — | validationKind: "table" \| "historical-external" | [contract](../../src/persistence/types/structure.ts#L48) |

Installed constraints:

```sql
portal_reference_types_check: CHECK (((validation_kind = 'table'::text) = (table_name IS NOT NULL)))
portal_reference_types_key_key: UNIQUE (key)
portal_reference_types_pkey: PRIMARY KEY (id)
portal_reference_types_table_name_key: UNIQUE (table_name)
portal_reference_types_validation_kind_check: CHECK ((validation_kind = ANY (ARRAY['table'::text, 'historical-external'::text])))
```

Migration sources mentioning this table: [supabase/migrations/202610120008_reference_validation.sql](../../supabase/migrations/202610120008_reference_validation.sql). Mentions include references and function bodies, not just table declarations.

## product amount rules

`product_amount_rules`: Conditional amount strategy for product and optional role/tenant.

Owner: Site-scoped or optional Site dimension; inspect nullable links and any paired Association target. Group: library-rules. RLS: true. Contract: ProductAmountRules. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L87) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L88) |
| product_key | text | false | — | productKey: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L89) |
| applicant_type_key | text | true | — | applicantTypeKey: string \| null | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L90) |
| applicant_class | text | true | — | applicantClass: string \| null | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L91) |
| amount_pattern_key | text | false | — | amountPatternKey: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L92) |
| condition_key | text | true | — | conditionKey: string \| null | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L93) |
| client_key | text | true | — | clientKey: string \| null | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L94) |
| site_key | text | true | — | siteKey: string \| null | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L95) |
| position | integer | false | — | position: number | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L96) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
product_amount_rules_amount_pattern_key_fkey: FOREIGN KEY (amount_pattern_key) REFERENCES coverage_amount_patterns(key)
product_amount_rules_applicant_type_key_fkey: FOREIGN KEY (applicant_type_key) REFERENCES applicant_types(key)
product_amount_rules_client_key_fkey: FOREIGN KEY (client_key) REFERENCES clients(key)
product_amount_rules_condition_key_fkey: FOREIGN KEY (condition_key) REFERENCES conditions(key)
product_amount_rules_display_id_check: CHECK ((display_id > 0))
product_amount_rules_display_id_key: UNIQUE (display_id)
product_amount_rules_key_key: UNIQUE (key)
product_amount_rules_pkey: PRIMARY KEY (id)
product_amount_rules_product_key_fkey: FOREIGN KEY (product_key) REFERENCES products(key)
product_amount_rules_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
product_amount_rules_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120003_relationship_integrity.sql](../../supabase/migrations/202610120003_relationship_integrity.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [product_amount_rules_owner_guard](../../supabase/migrations/202610120003_relationship_integrity.sql#L93): `create trigger product_amount_rules_owner_guard before insert or update on public.product_amount_rules for each row execute function public.check_site_owner_pair();`

## product applicant eligibility

`product_applicant_eligibility`: Product applicant-role eligibility with optional site/condition.

Owner: Site-scoped or optional Site dimension; inspect nullable links and any paired Association target. Group: library-rules. RLS: true. Contract: ProductApplicantEligibility. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L99) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L100) |
| product_key | text | false | — | productKey: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L101) |
| applicant_type_key | text | false | — | applicantTypeKey: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L102) |
| site_key | text | true | — | siteKey: string \| null | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L103) |
| eligible | boolean | false | — | eligible: boolean | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L104) |
| condition_key | text | true | — | conditionKey: string \| null | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L105) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
product_applicant_eligibility_applicant_type_key_fkey: FOREIGN KEY (applicant_type_key) REFERENCES applicant_types(key)
product_applicant_eligibility_condition_key_fkey: FOREIGN KEY (condition_key) REFERENCES conditions(key)
product_applicant_eligibility_display_id_check: CHECK ((display_id > 0))
product_applicant_eligibility_display_id_key: UNIQUE (display_id)
product_applicant_eligibility_key_key: UNIQUE (key)
product_applicant_eligibility_pkey: PRIMARY KEY (id)
product_applicant_eligibility_product_key_fkey: FOREIGN KEY (product_key) REFERENCES products(key)
product_applicant_eligibility_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
product_applicant_eligibility_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## product clients

`product_clients`: Products available to clients.

Owner: Hosting Association through compatibility reference; optional links do not establish mandatory ownership. Group: compatibility. RLS: true. Contract: ProductClients. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L12) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L13) |
| product_key | text | false | — | productKey: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L14) |
| client_key | text | false | — | clientKey: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L15) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
product_clients_client_key_fkey: FOREIGN KEY (client_key) REFERENCES clients(key)
product_clients_display_id_check: CHECK ((display_id > 0))
product_clients_display_id_key: UNIQUE (display_id)
product_clients_key_key: UNIQUE (key)
product_clients_pkey: PRIMARY KEY (id)
product_clients_product_key_client_key_key: UNIQUE (product_key, client_key)
product_clients_product_key_fkey: FOREIGN KEY (product_key) REFERENCES products(key)
product_clients_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql). Mentions include references and function bodies, not just table declarations.

## product configuration values

`product_configuration_values`: Product-specific configuration values.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-products. RLS: true. Contract: ProductConfigurationValues. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L5) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L6) |
| product_key | text | false | — | productKey: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L7) |
| configuration_key | text | false | — | configurationKey: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L8) |
| value | jsonb | false | — | value: Json | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L9) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
product_configuration_values_configuration_key_fkey: FOREIGN KEY (configuration_key) REFERENCES configuration_definitions(key)
product_configuration_values_display_id_check: CHECK ((display_id > 0))
product_configuration_values_display_id_key: UNIQUE (display_id)
product_configuration_values_key_key: UNIQUE (key)
product_configuration_values_pkey: PRIMARY KEY (id)
product_configuration_values_product_key_fkey: FOREIGN KEY (product_key) REFERENCES products(key)
product_configuration_values_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## product coverage plans

`product_coverage_plans`: Product-to-plan and applicant-role assignments.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-products. RLS: true. Contract: ProductCoveragePlans. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L39) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L40) |
| product_key | text | false | — | productKey: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L41) |
| plan_key | text | false | — | planKey: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L42) |
| applicant_type_key | text | false | — | applicantTypeKey: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L43) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
product_coverage_plans_applicant_type_key_fkey: FOREIGN KEY (applicant_type_key) REFERENCES applicant_types(key)
product_coverage_plans_display_id_check: CHECK ((display_id > 0))
product_coverage_plans_display_id_key: UNIQUE (display_id)
product_coverage_plans_key_key: UNIQUE (key)
product_coverage_plans_pkey: PRIMARY KEY (id)
product_coverage_plans_plan_key_fkey: FOREIGN KEY (plan_key) REFERENCES coverage_plan_definitions(key)
product_coverage_plans_product_key_fkey: FOREIGN KEY (product_key) REFERENCES products(key)
product_coverage_plans_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql), [supabase/migrations/202610120008_reference_validation.sql](../../supabase/migrations/202610120008_reference_validation.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [product_coverage_plan_identity](../../supabase/migrations/202610120008_reference_validation.sql#L203): `create unique index product_coverage_plan_identity on public.product_coverage_plans(product_key,plan_key,applicant_type_key);`

## product identifiers

`product_identifiers`: Scoped product identifiers such as G number and plan code.

Owner: Global, hosting Association (legacy client), or Site by declared scope; inspect CHECK/targets. Group: library-products. RLS: true. Contract: ProductIdentifierRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/catalog.ts#L4) |
| product_key | text | false | — | productKey: string | [contract](../../src/persistence/types/coverage.ts#L12) |
| kind | text | false | — | kind: "gNumber" \| "planCode" | [contract](../../src/persistence/types/coverage.ts#L12) |
| definition | jsonb | false | — | definition: import("src/persistence/types/index").Json | [contract](../../src/persistence/types/catalog.ts#L4) |
| scope | text | false | — | scope: "global" \| "client" \| "site" | [contract](../../src/persistence/types/catalog.ts#L5) |
| client_key | text | true | — | clientKey: string \| null | [contract](../../src/persistence/types/catalog.ts#L5) |
| site_key | text | true | — | siteKey: string \| null | [contract](../../src/persistence/types/catalog.ts#L5) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
product_identifiers_check: CHECK ((((scope = 'global'::text) AND (client_key IS NULL) AND (site_key IS NULL)) OR ((scope = 'client'::text) AND (client_key IS NOT NULL) AND (site_key IS NULL)) OR ((scope = 'site'::text) AND (site_key IS NOT NULL) AND (client_key IS NULL))))
product_identifiers_client_key_fkey: FOREIGN KEY (client_key) REFERENCES clients(key)
product_identifiers_definition_check: CHECK ((jsonb_typeof(definition) = 'object'::text))
product_identifiers_display_id_key: UNIQUE (display_id)
product_identifiers_key_key: UNIQUE (key)
product_identifiers_kind_check: CHECK ((kind = ANY (ARRAY['gNumber'::text, 'planCode'::text])))
product_identifiers_pkey: PRIMARY KEY (id)
product_identifiers_product_key_fkey: FOREIGN KEY (product_key) REFERENCES products(key)
product_identifiers_product_key_kind_scope_client_key_site__key: UNIQUE NULLS NOT DISTINCT (product_key, kind, scope, client_key, site_key)
product_identifiers_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
product_identifiers_scope_check: CHECK ((scope = ANY (ARRAY['global'::text, 'client'::text, 'site'::text])))
product_identifiers_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## product question sets

`product_question_sets`: Product question-set assignments with optional applicant-role.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-fields. RLS: true. Contract: ProductQuestionSets. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/questionsCanonical.ts#L42) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/questionsCanonical.ts#L43) |
| product_key | text | false | — | productKey: string | [contract](../../src/persistence/types/questionsCanonical.ts#L44) |
| question_set_key | text | false | — | questionSetKey: string | [contract](../../src/persistence/types/questionsCanonical.ts#L45) |
| applicant_type_key | text | true | — | applicantTypeKey: string \| null | [contract](../../src/persistence/types/questionsCanonical.ts#L46) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
product_question_sets_applicant_type_key_fkey: FOREIGN KEY (applicant_type_key) REFERENCES applicant_types(key)
product_question_sets_display_id_check: CHECK ((display_id > 0))
product_question_sets_display_id_key: UNIQUE (display_id)
product_question_sets_key_key: UNIQUE (key)
product_question_sets_pkey: PRIMARY KEY (id)
product_question_sets_product_key_fkey: FOREIGN KEY (product_key) REFERENCES products(key)
product_question_sets_product_key_question_set_key_applican_key: UNIQUE NULLS NOT DISTINCT (product_key, question_set_key, applicant_type_key)
product_question_sets_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
product_question_sets_question_set_key_fkey: FOREIGN KEY (question_set_key) REFERENCES question_sets(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## product rate tables

`product_rate_tables`: Conditional product/site assignment of rate tables.

Owner: Site-scoped or optional Site dimension; inspect nullable links and any paired Association target. Group: library-rules. RLS: true. Contract: ProductRateTables. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/ratesCanonical.ts#L14) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/ratesCanonical.ts#L15) |
| product_key | text | false | — | productKey: string | [contract](../../src/persistence/types/ratesCanonical.ts#L16) |
| rate_table_key | text | false | — | rateTableKey: string | [contract](../../src/persistence/types/ratesCanonical.ts#L17) |
| site_key | text | true | — | siteKey: string \| null | [contract](../../src/persistence/types/ratesCanonical.ts#L18) |
| condition_key | text | true | — | conditionKey: string \| null | [contract](../../src/persistence/types/ratesCanonical.ts#L19) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
product_rate_tables_condition_key_fkey: FOREIGN KEY (condition_key) REFERENCES conditions(key)
product_rate_tables_display_id_check: CHECK ((display_id > 0))
product_rate_tables_display_id_key: UNIQUE (display_id)
product_rate_tables_key_key: UNIQUE (key)
product_rate_tables_pkey: PRIMARY KEY (id)
product_rate_tables_product_key_fkey: FOREIGN KEY (product_key) REFERENCES products(key)
product_rate_tables_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
product_rate_tables_rate_table_key_fkey: FOREIGN KEY (rate_table_key) REFERENCES rate_tables(key)
product_rate_tables_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## product riders

`product_riders`: Scoped product-to-rider assignments.

Owner: Global, hosting Association (legacy client), or Site by declared scope; inspect CHECK/targets. Group: library-products. RLS: true. Contract: ProductRiderRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/coverage.ts#L11) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/coverage.ts#L11) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/coverage.ts#L11) |
| product_key | text | false | — | productKey: string | [contract](../../src/persistence/types/coverage.ts#L11) |
| rider_key | text | false | — | riderKey: string | [contract](../../src/persistence/types/coverage.ts#L11) |
| scope | text | false | — | scope: "global" \| "client" \| "site" | [contract](../../src/persistence/types/catalog.ts#L5) |
| client_key | text | true | — | clientKey: string \| null | [contract](../../src/persistence/types/catalog.ts#L5) |
| site_key | text | true | — | siteKey: string \| null | [contract](../../src/persistence/types/catalog.ts#L5) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
product_rider_identity: UNIQUE (id, product_key, rider_key)
product_riders_check: CHECK ((((scope = 'global'::text) AND (client_key IS NULL) AND (site_key IS NULL)) OR ((scope = 'client'::text) AND (client_key IS NOT NULL) AND (site_key IS NULL)) OR ((scope = 'site'::text) AND (site_key IS NOT NULL) AND (client_key IS NULL))))
product_riders_client_key_fkey: FOREIGN KEY (client_key) REFERENCES clients(key)
product_riders_display_id_key: UNIQUE (display_id)
product_riders_key_key: UNIQUE (key)
product_riders_pkey: PRIMARY KEY (id)
product_riders_product_key_fkey: FOREIGN KEY (product_key) REFERENCES products(key)
product_riders_product_key_rider_key_scope_client_key_site__key: UNIQUE NULLS NOT DISTINCT (product_key, rider_key, scope, client_key, site_key)
product_riders_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
product_riders_rider_key_fkey: FOREIGN KEY (rider_key) REFERENCES riders(key)
product_riders_scope_check: CHECK ((scope = ANY (ARRAY['global'::text, 'client'::text, 'site'::text])))
product_riders_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120005_application_storage.sql](../../supabase/migrations/202610120005_application_storage.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql), [supabase/migrations/202610120009_application_context_history.sql](../../supabase/migrations/202610120009_application_context_history.sql). Mentions include references and function bodies, not just table declarations.

## products

`products`: Products classified by coverage category.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-products. RLS: true. Contract: ProductRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/catalog.ts#L4) |
| category_key | text | false | — | categoryKey: string | [contract](../../src/persistence/types/coverage.ts#L8) |
| definition | jsonb | false | — | definition: Omit<import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/coverage").CoverageDefinition, "riders" \| "gNumber" \| "planCode" \| "categoryId" \| "code"> & { categoryId: string; code: string \| null; } | [contract](../../src/persistence/types/catalog.ts#L4) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
products_category_key_fkey: FOREIGN KEY (category_key) REFERENCES coverage_categories(key)
products_definition_check: CHECK ((jsonb_typeof(definition) = 'object'::text))
products_display_id_key: UNIQUE (display_id)
products_key_key: UNIQUE (key)
products_pkey: PRIMARY KEY (id)
products_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610090003_field_surfaces.sql](../../supabase/migrations/202610090003_field_surfaces.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120003_relationship_integrity.sql](../../supabase/migrations/202610120003_relationship_integrity.sql), [supabase/migrations/202610120005_application_storage.sql](../../supabase/migrations/202610120005_application_storage.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql), [supabase/migrations/202610120007_field_reference_bootstrap.sql](../../supabase/migrations/202610120007_field_reference_bootstrap.sql), [supabase/migrations/202610120008_reference_validation.sql](../../supabase/migrations/202610120008_reference_validation.sql), [supabase/migrations/202610120009_application_context_history.sql](../../supabase/migrations/202610120009_application_context_history.sql). Mentions include references and function bodies, not just table declarations.

## provenance tags

`provenance_tags`: Controlled provider/evidence vocabulary.

Owner: Source/evidence or reference registry; retention independent of runtime activation. Group: evidence. RLS: true. Contract: ProvenanceTags. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L5) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L6) |
| name | text | false | — | name: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L7) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
provenance_tags_display_id_check: CHECK ((display_id > 0))
provenance_tags_display_id_key: UNIQUE (display_id)
provenance_tags_key_key: UNIQUE (key)
provenance_tags_pkey: PRIMARY KEY (id)
provenance_tags_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## question definitions

`question_definitions`: Individual questions, response type and status.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-fields. RLS: true. Contract: QuestionDefinitions. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/questionsCanonical.ts#L12) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/questionsCanonical.ts#L13) |
| text | text | false | — | text: string | [contract](../../src/persistence/types/questionsCanonical.ts#L14) |
| response_type | text | true | — | responseType: string \| null | [contract](../../src/persistence/types/questionsCanonical.ts#L15) |
| status | text | false | — | status: string | [contract](../../src/persistence/types/questionsCanonical.ts#L16) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
question_definitions_display_id_check: CHECK ((display_id > 0))
question_definitions_display_id_key: UNIQUE (display_id)
question_definitions_key_key: UNIQUE (key)
question_definitions_pkey: PRIMARY KEY (id)
question_definitions_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
question_definitions_status_check: CHECK ((status = ANY (ARRAY['documented'::text, 'unresolved'::text])))
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## question set fields

`question_set_fields`: Ordered conditional field membership in question sets.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-fields. RLS: true. Contract: QuestionSetFields. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/questionsCanonical.ts#L27) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/questionsCanonical.ts#L28) |
| question_set_key | text | false | — | questionSetKey: string | [contract](../../src/persistence/types/questionsCanonical.ts#L29) |
| field_key | text | false | — | fieldKey: string | [contract](../../src/persistence/types/questionsCanonical.ts#L30) |
| position | integer | false | — | position: number | [contract](../../src/persistence/types/questionsCanonical.ts#L31) |
| condition_key | text | true | — | conditionKey: string \| null | [contract](../../src/persistence/types/questionsCanonical.ts#L32) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
question_set_fields_condition_key_fkey: FOREIGN KEY (condition_key) REFERENCES conditions(key)
question_set_fields_display_id_check: CHECK ((display_id > 0))
question_set_fields_display_id_key: UNIQUE (display_id)
question_set_fields_field_key_fkey: FOREIGN KEY (field_key) REFERENCES fields(key)
question_set_fields_key_key: UNIQUE (key)
question_set_fields_pkey: PRIMARY KEY (id)
question_set_fields_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
question_set_fields_question_set_key_fkey: FOREIGN KEY (question_set_key) REFERENCES question_sets(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## question set questions

`question_set_questions`: Ordered conditional question membership in sets.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-fields. RLS: true. Contract: QuestionSetQuestions. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/questionsCanonical.ts#L19) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/questionsCanonical.ts#L20) |
| question_set_key | text | false | — | questionSetKey: string | [contract](../../src/persistence/types/questionsCanonical.ts#L21) |
| question_key | text | false | — | questionKey: string | [contract](../../src/persistence/types/questionsCanonical.ts#L22) |
| position | integer | false | — | position: number | [contract](../../src/persistence/types/questionsCanonical.ts#L23) |
| condition_key | text | true | — | conditionKey: string \| null | [contract](../../src/persistence/types/questionsCanonical.ts#L24) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
question_set_questions_condition_key_fkey: FOREIGN KEY (condition_key) REFERENCES conditions(key)
question_set_questions_display_id_check: CHECK ((display_id > 0))
question_set_questions_display_id_key: UNIQUE (display_id)
question_set_questions_key_key: UNIQUE (key)
question_set_questions_pkey: PRIMARY KEY (id)
question_set_questions_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
question_set_questions_question_key_fkey: FOREIGN KEY (question_key) REFERENCES question_definitions(key)
question_set_questions_question_set_key_fkey: FOREIGN KEY (question_set_key) REFERENCES question_sets(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## question sets

`question_sets`: Versioned question group definitions.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-fields. RLS: true. Contract: QuestionSets. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/questionsCanonical.ts#L4) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/questionsCanonical.ts#L5) |
| name | text | false | — | name: string | [contract](../../src/persistence/types/questionsCanonical.ts#L6) |
| question_type | text | false | — | questionType: string | [contract](../../src/persistence/types/questionsCanonical.ts#L7) |
| version | text | true | — | version: string \| null | [contract](../../src/persistence/types/questionsCanonical.ts#L8) |
| description | text | true | — | description: string \| null | [contract](../../src/persistence/types/questionsCanonical.ts#L9) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
question_sets_display_id_check: CHECK ((display_id > 0))
question_sets_display_id_key: UNIQUE (display_id)
question_sets_key_key: UNIQUE (key)
question_sets_pkey: PRIMARY KEY (id)
question_sets_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## rate table presentations

`rate_table_presentations`: Rate table placement/display mode by site/product/flag.

Owner: Site-scoped or optional Site dimension; inspect nullable links and any paired Association target. Group: library-rules. RLS: true. Contract: RateTablePresentations. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/ratesCanonical.ts#L22) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/ratesCanonical.ts#L23) |
| rate_table_key | text | false | — | rateTableKey: string | [contract](../../src/persistence/types/ratesCanonical.ts#L24) |
| site_key | text | true | — | siteKey: string \| null | [contract](../../src/persistence/types/ratesCanonical.ts#L25) |
| product_key | text | true | — | productKey: string \| null | [contract](../../src/persistence/types/ratesCanonical.ts#L26) |
| placement | text | false | — | placement: string | [contract](../../src/persistence/types/ratesCanonical.ts#L27) |
| mode | text | false | — | mode: string | [contract](../../src/persistence/types/ratesCanonical.ts#L28) |
| enabled | boolean | false | — | enabled: boolean | [contract](../../src/persistence/types/ratesCanonical.ts#L29) |
| flag_key | text | true | — | flagKey: string \| null | [contract](../../src/persistence/types/ratesCanonical.ts#L30) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
rate_table_presentations_display_id_check: CHECK ((display_id > 0))
rate_table_presentations_display_id_key: UNIQUE (display_id)
rate_table_presentations_flag_key_fkey: FOREIGN KEY (flag_key) REFERENCES flag_definitions(key)
rate_table_presentations_key_key: UNIQUE (key)
rate_table_presentations_mode_check: CHECK ((mode = ANY (ARRAY['inline'::text, 'link'::text])))
rate_table_presentations_pkey: PRIMARY KEY (id)
rate_table_presentations_placement_check: CHECK ((placement = ANY (ARRAY['estimated-cost'::text, 'product-card'::text])))
rate_table_presentations_product_key_fkey: FOREIGN KEY (product_key) REFERENCES products(key)
rate_table_presentations_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
rate_table_presentations_rate_table_key_fkey: FOREIGN KEY (rate_table_key) REFERENCES rate_tables(key)
rate_table_presentations_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## rate tables

`rate_tables`: Rate table content and external assets.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-rules. RLS: true. Contract: RateTables. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/ratesCanonical.ts#L4) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/ratesCanonical.ts#L5) |
| name | text | false | — | name: string | [contract](../../src/persistence/types/ratesCanonical.ts#L6) |
| format | text | false | — | format: string | [contract](../../src/persistence/types/ratesCanonical.ts#L7) |
| content | text | true | — | content: string \| null | [contract](../../src/persistence/types/ratesCanonical.ts#L8) |
| url | text | true | — | url: string \| null | [contract](../../src/persistence/types/ratesCanonical.ts#L9) |
| image_ref | text | true | — | imageRef: string \| null | [contract](../../src/persistence/types/ratesCanonical.ts#L10) |
| source_system | text | true | — | sourceSystem: string \| null | [contract](../../src/persistence/types/ratesCanonical.ts#L11) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
rate_tables_display_id_check: CHECK ((display_id > 0))
rate_tables_display_id_key: UNIQUE (display_id)
rate_tables_format_check: CHECK ((format = ANY (ARRAY['html'::text, 'url'::text, 'image'::text])))
rate_tables_key_key: UNIQUE (key)
rate_tables_pkey: PRIMARY KEY (id)
rate_tables_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## release changes

`release_changes`: Release-to-change request assignments.

Owner: Portal operations; entity/Site ownership only through declared references. Group: changes. RLS: true. Contract: ReleaseChange. Access: Mock server operational arrays; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/operations.ts#L36) |
| release_id | uuid | false | — | releaseId: string | [contract](../../src/persistence/types/operations.ts#L36) |
| change_request_id | uuid | false | — | changeRequestId: string | [contract](../../src/persistence/types/operations.ts#L36) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/operations.ts#L36) |

Installed constraints:

```sql
release_changes_change_request_id_fkey: FOREIGN KEY (change_request_id) REFERENCES change_requests(id) ON DELETE CASCADE
release_changes_pkey: PRIMARY KEY (id)
release_changes_release_id_change_request_id_key: UNIQUE (release_id, change_request_id)
release_changes_release_id_fkey: FOREIGN KEY (release_id) REFERENCES releases(id) ON DELETE CASCADE
```

Migration sources mentioning this table: [supabase/migrations/202609240001_initial_portal_schema.sql](../../supabase/migrations/202609240001_initial_portal_schema.sql). Mentions include references and function bodies, not just table declarations.

## releases

`releases`: Operational delivery release planning.

Owner: Portal operations; entity/Site ownership only through declared references. Group: changes. RLS: true. Contract: Release. Access: Mock server operational arrays; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/operations.ts#L34) |
| release_key | text | false | — | releaseKey: string | [contract](../../src/persistence/types/operations.ts#L34) |
| name | text | false | — | name: string | [contract](../../src/persistence/types/operations.ts#L34) |
| release_date | date | false | — | releaseDate: string | [contract](../../src/persistence/types/operations.ts#L34) |
| status | text | false | — | status: "In Progress" \| "QA" \| "Scheduled" \| "Released" \| "Planning" | [contract](../../src/persistence/types/operations.ts#L34) |
| notes | text | false | ''::text | notes: string | [contract](../../src/persistence/types/operations.ts#L34) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| updated_at | timestamp with time zone | false | now() | updatedAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| deleted_at | timestamp with time zone | true | — | deletedAt: string \| null | [contract](../../src/persistence/types/common.ts#L14) |

Installed constraints:

```sql
releases_pkey: PRIMARY KEY (id)
releases_release_key_key: UNIQUE (release_key)
```

Migration sources mentioning this table: [supabase/migrations/202609240001_initial_portal_schema.sql](../../supabase/migrations/202609240001_initial_portal_schema.sql), [supabase/migrations/202610120008_reference_validation.sql](../../supabase/migrations/202610120008_reference_validation.sql). Mentions include references and function bodies, not just table declarations.

## requirement targets

`requirement_targets`: Source evidence links to polymorphic table/key/column targets.

Owner: Source/evidence or reference registry; retention independent of runtime activation. Group: evidence. RLS: true. Contract: RequirementTargets. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L41) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L42) |
| requirement_key | text | false | — | requirementKey: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L43) |
| target_table | text | false | — | targetTable: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L44) |
| target_key | text | false | — | targetKey: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L45) |
| target_column | text | false | — | targetColumn: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L46) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
requirement_targets_display_id_check: CHECK ((display_id > 0))
requirement_targets_display_id_key: UNIQUE (display_id)
requirement_targets_key_key: UNIQUE (key)
requirement_targets_pkey: PRIMARY KEY (id)
requirement_targets_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
requirement_targets_requirement_key_fkey: FOREIGN KEY (requirement_key) REFERENCES source_requirements(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql). Mentions include references and function bodies, not just table declarations.

## residency jurisdictions

`residency_jurisdictions`: Jurisdictions under residency policies.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-rules. RLS: true. Contract: ResidencyJurisdictions. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L30) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L31) |
| residency_rule_key | text | false | — | residencyRuleKey: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L32) |
| jurisdiction | text | false | — | jurisdiction: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L33) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
residency_jurisdictions_display_id_check: CHECK ((display_id > 0))
residency_jurisdictions_display_id_key: UNIQUE (display_id)
residency_jurisdictions_key_key: UNIQUE (key)
residency_jurisdictions_pkey: PRIMARY KEY (id)
residency_jurisdictions_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
residency_jurisdictions_residency_rule_key_fkey: FOREIGN KEY (residency_rule_key) REFERENCES residency_rules(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## residency rules

`residency_rules`: Site/product/rider jurisdiction eligibility policy.

Owner: Site-scoped or optional Site dimension; inspect nullable links and any paired Association target. Group: library-rules. RLS: true. Contract: ResidencyRules. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L21) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L22) |
| site_key | text | true | — | siteKey: string \| null | [contract](../../src/persistence/types/underwritingCanonical.ts#L23) |
| product_key | text | true | — | productKey: string \| null | [contract](../../src/persistence/types/underwritingCanonical.ts#L24) |
| rider_key | text | true | — | riderKey: string \| null | [contract](../../src/persistence/types/underwritingCanonical.ts#L25) |
| mode | text | false | — | mode: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L26) |
| condition_key | text | true | — | conditionKey: string \| null | [contract](../../src/persistence/types/underwritingCanonical.ts#L27) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
residency_rules_condition_key_fkey: FOREIGN KEY (condition_key) REFERENCES conditions(key)
residency_rules_display_id_check: CHECK ((display_id > 0))
residency_rules_display_id_key: UNIQUE (display_id)
residency_rules_key_key: UNIQUE (key)
residency_rules_mode_check: CHECK ((mode = ANY (ARRAY['include'::text, 'exclude'::text])))
residency_rules_pkey: PRIMARY KEY (id)
residency_rules_product_key_fkey: FOREIGN KEY (product_key) REFERENCES products(key)
residency_rules_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
residency_rules_rider_key_fkey: FOREIGN KEY (rider_key) REFERENCES riders(key)
residency_rules_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## rider amount rules

`rider_amount_rules`: Rider amount strategy and optional base product/condition.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-rules. RLS: true. Contract: RiderAmountRules. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L108) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L109) |
| rider_key | text | false | — | riderKey: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L110) |
| applicant_type_key | text | true | — | applicantTypeKey: string \| null | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L111) |
| amount_pattern_key | text | false | — | amountPatternKey: string | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L112) |
| base_product_key | text | true | — | baseProductKey: string \| null | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L113) |
| condition_key | text | true | — | conditionKey: string \| null | [contract](../../src/persistence/types/coverageNormalizationCanonical.ts#L114) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
rider_amount_rules_amount_pattern_key_fkey: FOREIGN KEY (amount_pattern_key) REFERENCES coverage_amount_patterns(key)
rider_amount_rules_applicant_type_key_fkey: FOREIGN KEY (applicant_type_key) REFERENCES applicant_types(key)
rider_amount_rules_base_product_key_fkey: FOREIGN KEY (base_product_key) REFERENCES products(key)
rider_amount_rules_condition_key_fkey: FOREIGN KEY (condition_key) REFERENCES conditions(key)
rider_amount_rules_display_id_check: CHECK ((display_id > 0))
rider_amount_rules_display_id_key: UNIQUE (display_id)
rider_amount_rules_key_key: UNIQUE (key)
rider_amount_rules_pkey: PRIMARY KEY (id)
rider_amount_rules_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
rider_amount_rules_rider_key_fkey: FOREIGN KEY (rider_key) REFERENCES riders(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## riders

`riders`: Optional benefit/rider definitions.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-products. RLS: true. Contract: RiderRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/catalog.ts#L4) |
| definition | jsonb | false | — | definition: Omit<import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/coverage").RiderDefinition, "premiumFactor"> & { premiumFactor: number \| null; } | [contract](../../src/persistence/types/catalog.ts#L4) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
riders_definition_check: CHECK ((jsonb_typeof(definition) = 'object'::text))
riders_display_id_key: UNIQUE (display_id)
riders_key_key: UNIQUE (key)
riders_pkey: PRIMARY KEY (id)
riders_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120003_relationship_integrity.sql](../../supabase/migrations/202610120003_relationship_integrity.sql), [supabase/migrations/202610120005_application_storage.sql](../../supabase/migrations/202610120005_application_storage.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql), [supabase/migrations/202610120008_reference_validation.sql](../../supabase/migrations/202610120008_reference_validation.sql), [supabase/migrations/202610120009_application_context_history.sql](../../supabase/migrations/202610120009_application_context_history.sql), [supabase/migrations/202610130001_application_selection_integrity.sql](../../supabase/migrations/202610130001_application_selection_integrity.sql). Mentions include references and function bodies, not just table declarations.

## roles

`roles`: Role vocabulary.

Owner: Global identity/access catalog or child of user/actor; tenant applicability through typed scopes. Group: identity. RLS: true. Contract: Role. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/operations.ts#L44) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/operations.ts#L44) |
| name | text | false | — | name: string | [contract](../../src/persistence/types/operations.ts#L44) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| updated_at | timestamp with time zone | false | now() | updatedAt: string | [contract](../../src/persistence/types/common.ts#L13) |

Installed constraints:

```sql
roles_key_key: UNIQUE (key)
roles_pkey: PRIMARY KEY (id)
```

Migration sources mentioning this table: [supabase/migrations/202609240001_initial_portal_schema.sql](../../supabase/migrations/202609240001_initial_portal_schema.sql). Mentions include references and function bodies, not just table declarations.

## rule actions

`rule_actions`: Legacy JSON action definitions under rules.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-rules. RLS: true. Contract: RuleActionRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/catalog.ts#L4) |
| rule_key | text | false | — | ruleKey: string | [contract](../../src/persistence/types/rules.ts#L8) |
| definition | jsonb | false | — | definition: { kind: "documented-behavior"; description: string; source: string; } | [contract](../../src/persistence/types/catalog.ts#L4) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
rule_actions_definition_check: CHECK ((jsonb_typeof(definition) = 'object'::text))
rule_actions_display_id_key: UNIQUE (display_id)
rule_actions_key_key: UNIQUE (key)
rule_actions_pkey: PRIMARY KEY (id)
rule_actions_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
rule_actions_rule_key_fkey: FOREIGN KEY (rule_key) REFERENCES rules(key)
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## rule assignments

`rule_assignments`: Scoped rule activation/order.

Owner: Global, hosting Association (legacy client), or Site by declared scope; inspect CHECK/targets. Group: library-rules. RLS: true. Contract: RuleAssignmentRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/siteConfiguration.ts#L16) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/siteConfiguration.ts#L16) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/siteConfiguration.ts#L16) |
| rule_key | text | false | — | ruleKey: string | [contract](../../src/persistence/types/siteConfiguration.ts#L16) |
| scope | text | false | — | scope: "global" \| "client" \| "site" | [contract](../../src/persistence/types/catalog.ts#L5) |
| client_key | text | true | — | clientKey: string \| null | [contract](../../src/persistence/types/catalog.ts#L5) |
| site_key | text | true | — | siteKey: string \| null | [contract](../../src/persistence/types/catalog.ts#L5) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
rule_assignments_check: CHECK ((((scope = 'global'::text) AND (client_key IS NULL) AND (site_key IS NULL)) OR ((scope = 'client'::text) AND (client_key IS NOT NULL) AND (site_key IS NULL)) OR ((scope = 'site'::text) AND (site_key IS NOT NULL) AND (client_key IS NULL))))
rule_assignments_client_key_fkey: FOREIGN KEY (client_key) REFERENCES clients(key)
rule_assignments_display_id_key: UNIQUE (display_id)
rule_assignments_key_key: UNIQUE (key)
rule_assignments_pkey: PRIMARY KEY (id)
rule_assignments_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
rule_assignments_rule_key_fkey: FOREIGN KEY (rule_key) REFERENCES rules(key)
rule_assignments_rule_key_scope_client_key_site_key_key: UNIQUE NULLS NOT DISTINCT (rule_key, scope, client_key, site_key)
rule_assignments_scope_check: CHECK ((scope = ANY (ARRAY['global'::text, 'client'::text, 'site'::text])))
rule_assignments_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## rule conditions

`rule_conditions`: Rule-to-condition composition.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-rules. RLS: true. Contract: RuleConditionRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/rules.ts#L7) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/rules.ts#L7) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/rules.ts#L7) |
| rule_key | text | false | — | ruleKey: string | [contract](../../src/persistence/types/rules.ts#L7) |
| condition_key | text | false | — | conditionKey: string | [contract](../../src/persistence/types/rules.ts#L7) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
rule_conditions_condition_key_fkey: FOREIGN KEY (condition_key) REFERENCES conditions(key)
rule_conditions_display_id_key: UNIQUE (display_id)
rule_conditions_key_key: UNIQUE (key)
rule_conditions_pkey: PRIMARY KEY (id)
rule_conditions_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
rule_conditions_rule_key_condition_key_key: UNIQUE (rule_key, condition_key)
rule_conditions_rule_key_fkey: FOREIGN KEY (rule_key) REFERENCES rules(key)
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## rule flags

`rule_flags`: Flag predicates associated with rules.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-shared. RLS: true. Contract: RuleFlags. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/flagsCanonical.ts#L43) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/flagsCanonical.ts#L44) |
| rule_key | text | false | — | ruleKey: string | [contract](../../src/persistence/types/flagsCanonical.ts#L45) |
| flag_key | text | false | — | flagKey: string | [contract](../../src/persistence/types/flagsCanonical.ts#L46) |
| operator | text | false | — | operator: string | [contract](../../src/persistence/types/flagsCanonical.ts#L47) |
| value | jsonb | false | — | value: Json | [contract](../../src/persistence/types/flagsCanonical.ts#L48) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
rule_flags_display_id_check: CHECK ((display_id > 0))
rule_flags_display_id_key: UNIQUE (display_id)
rule_flags_flag_key_fkey: FOREIGN KEY (flag_key) REFERENCES flag_definitions(key)
rule_flags_key_key: UNIQUE (key)
rule_flags_operator_check: CHECK ((operator = ANY (ARRAY['equals'::text, 'not-equals'::text])))
rule_flags_pkey: PRIMARY KEY (id)
rule_flags_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
rule_flags_rule_key_fkey: FOREIGN KEY (rule_key) REFERENCES rules(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## rule predicates

`rule_predicates`: Normalized rule facts/operators/values.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-rules. RLS: true. Contract: RulePredicates. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/patternsCanonical.ts#L14) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/patternsCanonical.ts#L15) |
| rule_key | text | false | — | ruleKey: string | [contract](../../src/persistence/types/patternsCanonical.ts#L16) |
| fact | text | false | — | fact: string | [contract](../../src/persistence/types/patternsCanonical.ts#L17) |
| operator | text | false | — | operator: string | [contract](../../src/persistence/types/patternsCanonical.ts#L18) |
| value | jsonb | false | — | value: Json | [contract](../../src/persistence/types/patternsCanonical.ts#L19) |
| position | integer | false | — | position: number | [contract](../../src/persistence/types/patternsCanonical.ts#L20) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
rule_predicates_display_id_check: CHECK ((display_id > 0))
rule_predicates_display_id_key: UNIQUE (display_id)
rule_predicates_key_key: UNIQUE (key)
rule_predicates_operator_check: CHECK ((operator = ANY (ARRAY['equals'::text, 'not-equals'::text, 'greater-than'::text, 'less-than'::text, 'exists'::text])))
rule_predicates_pkey: PRIMARY KEY (id)
rule_predicates_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
rule_predicates_rule_key_fkey: FOREIGN KEY (rule_key) REFERENCES rules(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## rules

`rules`: Rule definitions.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-rules. RLS: true. Contract: RuleRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/catalog.ts#L4) |
| definition | jsonb | false | — | definition: Omit<import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/rules").RuleDefinition, "scope" \| "siteIds" \| "clientIds" \| "conditionIds"> | [contract](../../src/persistence/types/catalog.ts#L4) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
rules_definition_check: CHECK ((jsonb_typeof(definition) = 'object'::text))
rules_display_id_key: UNIQUE (display_id)
rules_key_key: UNIQUE (key)
rules_pkey: PRIMARY KEY (id)
rules_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql), [supabase/migrations/202610120008_reference_validation.sql](../../supabase/migrations/202610120008_reference_validation.sql). Mentions include references and function bodies, not just table declarations.

## schema reconciliation issues

`schema_reconciliation_issues`: Retained unresolved historical structural values.

Owner: Source/evidence or reference registry; retention independent of runtime activation. Group: evidence. RLS: true. Contract: SchemaReconciliationIssue. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/structure.ts#L44) |
| table_name | text | false | — | tableName: string | [contract](../../src/persistence/types/structure.ts#L44) |
| record_id | text | false | — | recordId: string | [contract](../../src/persistence/types/structure.ts#L44) |
| reference_name | text | false | — | referenceName: string | [contract](../../src/persistence/types/structure.ts#L44) |
| original_value | jsonb | false | — | originalValue: Json | [contract](../../src/persistence/types/structure.ts#L45) |
| reason | text | false | — | reason: string | [contract](../../src/persistence/types/structure.ts#L45) |
| resolved_at | timestamp with time zone | true | — | resolvedAt: string \| null | [contract](../../src/persistence/types/structure.ts#L45) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/structure.ts#L45) |

Installed constraints:

```sql
schema_reconciliation_issues_pkey: PRIMARY KEY (id)
schema_reconciliation_issues_table_name_record_id_reference_key: UNIQUE (table_name, record_id, reference_name)
```

Migration sources mentioning this table: [supabase/migrations/202610120003_relationship_integrity.sql](../../supabase/migrations/202610120003_relationship_integrity.sql), [supabase/migrations/202610120005_application_storage.sql](../../supabase/migrations/202610120005_application_storage.sql), [supabase/migrations/202610130001_application_selection_integrity.sql](../../supabase/migrations/202610130001_application_selection_integrity.sql). Mentions include references and function bodies, not just table declarations.

## semantic requirements

`semantic_requirements`: Documented semantic predicates for polymorphic subjects.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-evidence. RLS: true. Contract: SemanticRequirements. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L49) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L50) |
| domain | text | false | — | domain: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L51) |
| subject_table | text | false | — | subjectTable: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L52) |
| subject_key | text | false | — | subjectKey: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L53) |
| predicate | text | false | — | predicate: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L54) |
| value | jsonb | false | — | value: Json | [contract](../../src/persistence/types/provenanceCanonical.ts#L55) |
| status | text | false | — | status: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L56) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
semantic_requirements_display_id_check: CHECK ((display_id > 0))
semantic_requirements_display_id_key: UNIQUE (display_id)
semantic_requirements_key_key: UNIQUE (key)
semantic_requirements_pkey: PRIMARY KEY (id)
semantic_requirements_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
semantic_requirements_status_check: CHECK ((status = ANY (ARRAY['documented'::text, 'partial'::text])))
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## site association contexts

`site_association_contexts`: Automatic or membership/URL Association context on a Site.

Owner: Site-scoped or optional Site dimension; inspect nullable links and any paired Association target. Group: hierarchy. RLS: true. Contract: SiteAssociationContext. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/structure.ts#L16) |
| site_id | uuid | false | — | siteId: string | [contract](../../src/persistence/types/structure.ts#L16) |
| association_id | uuid | false | — | associationId: string | [contract](../../src/persistence/types/structure.ts#L16) |
| source_link_id | text | true | — | sourceLinkId: string \| null | [contract](../../src/persistence/types/structure.ts#L16) |
| context_mode | text | false | — | contextMode: "automatic" \| "membership" \| "url" | [contract](../../src/persistence/types/structure.ts#L17) |
| enabled | boolean | false | — | enabled: boolean | [contract](../../src/persistence/types/structure.ts#L17) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/structure.ts#L17) |

Installed constraints:

```sql
site_association_contexts_association_id_fkey: FOREIGN KEY (association_id) REFERENCES association_entities(id)
site_association_contexts_context_mode_check: CHECK ((context_mode = ANY (ARRAY['automatic'::text, 'membership'::text, 'url'::text])))
site_association_contexts_pkey: PRIMARY KEY (id)
site_association_contexts_site_id_association_id_key: UNIQUE (site_id, association_id)
site_association_contexts_site_id_fkey: FOREIGN KEY (site_id) REFERENCES sites(id)
site_association_contexts_source_link_id_fkey: FOREIGN KEY (source_link_id) REFERENCES site_associations(id)
site_association_contexts_source_link_id_key: UNIQUE (source_link_id)
```

Migration sources mentioning this table: [supabase/migrations/202610120004_association_identity.sql](../../supabase/migrations/202610120004_association_identity.sql), [supabase/migrations/202610120005_application_storage.sql](../../supabase/migrations/202610120005_application_storage.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql), [supabase/migrations/202610120009_application_context_history.sql](../../supabase/migrations/202610120009_application_context_history.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [site_association_contexts_association_idx](../../supabase/migrations/202610120004_association_identity.sql#L166): `create index site_association_contexts_association_idx on public.site_association_contexts(association_id);`
- [site_automatic_context](../../supabase/migrations/202610120009_application_context_history.sql#L49): `create unique index site_automatic_context on public.site_association_contexts(site_id) where context_mode='automatic' and enabled;`
- [site_association_context_guard](../../supabase/migrations/202610120004_association_identity.sql#L154): `create trigger site_association_context_guard before insert or update on public.site_association_contexts for each row execute function public.check_canonical_site_context();`

## site associations

`site_associations`: Associations assigned to sites.

Owner: Site-scoped or optional Site dimension; inspect nullable links and any paired Association target. Group: hierarchy. RLS: true. Contract: SiteAssociationRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/siteConfiguration.ts#L7) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/siteConfiguration.ts#L7) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/siteConfiguration.ts#L7) |
| site_key | text | false | — | siteKey: string | [contract](../../src/persistence/types/siteConfiguration.ts#L7) |
| association_key | text | false | — | associationKey: string | [contract](../../src/persistence/types/siteConfiguration.ts#L7) |
| enabled | boolean | false | — | enabled: boolean | [contract](../../src/persistence/types/siteConfiguration.ts#L7) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
site_associations_association_key_fkey: FOREIGN KEY (association_key) REFERENCES associations(key)
site_associations_display_id_key: UNIQUE (display_id)
site_associations_key_key: UNIQUE (key)
site_associations_pkey: PRIMARY KEY (id)
site_associations_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
site_associations_site_key_association_key_key: UNIQUE (site_key, association_key)
site_associations_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120002_application_relationships.sql](../../supabase/migrations/202610120002_application_relationships.sql), [supabase/migrations/202610120003_relationship_integrity.sql](../../supabase/migrations/202610120003_relationship_integrity.sql), [supabase/migrations/202610120004_association_identity.sql](../../supabase/migrations/202610120004_association_identity.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql), [supabase/migrations/202610120009_application_context_history.sql](../../supabase/migrations/202610120009_application_context_history.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [site_associations_association_idx](../../supabase/migrations/202610120003_relationship_integrity.sql#L183): `create index site_associations_association_idx on public.site_associations(association_key);`
- [site_association_client_guard](../../supabase/migrations/202609240003_portal_library.sql#L420): `create trigger site_association_client_guard before insert or update on public.site_associations for each row execute function public.check_site_association_client();`
- [site_associations_refresh_identity](../../supabase/migrations/202610120004_association_identity.sql#L159): `create trigger site_associations_refresh_identity after insert or update on public.site_associations for each statement execute function public.refresh_association_contexts_after_write();`

## site builder drafts

`site_builder_drafts`: Proposed site construction data before publication.

Owner: Site-scoped or optional Site dimension; inspect nullable links and any paired Association target. Group: changes. RLS: true. Contract: SiteBuilderDraft. Access: Mock server operational arrays; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/operations.ts#L38) |
| client_id | uuid | true | — | clientId: string \| null | [contract](../../src/persistence/types/operations.ts#L38) |
| site_key | text | false | — | siteKey: string | [contract](../../src/persistence/types/operations.ts#L38) |
| site_name | text | false | — | siteName: string | [contract](../../src/persistence/types/operations.ts#L38) |
| status | text | false | — | status: string | [contract](../../src/persistence/types/operations.ts#L38) |
| current_step | text | false | — | currentStep: string | [contract](../../src/persistence/types/operations.ts#L39) |
| draft_data_json | jsonb | false | '{}'::jsonb | draftDataJson: Json | [contract](../../src/persistence/types/operations.ts#L39) |
| owner_id | text | true | — | ownerId: string \| null | [contract](../../src/persistence/types/operations.ts#L39) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| updated_at | timestamp with time zone | false | now() | updatedAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| deleted_at | timestamp with time zone | true | — | deletedAt: string \| null | [contract](../../src/persistence/types/common.ts#L14) |
| owner_actor_id | uuid | true | — | ownerActorId?: string \| null \| undefined | [contract](../../src/persistence/types/operations.ts#L40) |

Installed constraints:

```sql
site_builder_drafts_client_id_fkey: FOREIGN KEY (client_id) REFERENCES clients(id)
site_builder_drafts_owner_actor_id_fkey: FOREIGN KEY (owner_actor_id) REFERENCES portal_actors(id)
site_builder_drafts_pkey: PRIMARY KEY (id)
```

Migration sources mentioning this table: [supabase/migrations/202609240001_initial_portal_schema.sql](../../supabase/migrations/202609240001_initial_portal_schema.sql), [supabase/migrations/202610120005_application_storage.sql](../../supabase/migrations/202610120005_application_storage.sql), [supabase/migrations/202610120008_reference_validation.sql](../../supabase/migrations/202610120008_reference_validation.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [site_builder_drafts_actor](../../supabase/migrations/202610120005_application_storage.sql#L60): `create trigger site_builder_drafts_actor before insert or update on public.site_builder_drafts for each row execute function public.fill_operational_actor_references();`

## site configurations

`site_configurations`: Legacy dated site configuration values.

Owner: Site-scoped or optional Site dimension; inspect nullable links and any paired Association target. Group: compatibility. RLS: true. Contract: SiteConfiguration. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/organization.ts#L21) |
| site_id | uuid | false | — | siteId: string | [contract](../../src/persistence/types/organization.ts#L21) |
| configuration_key | text | false | — | configurationKey: string | [contract](../../src/persistence/types/organization.ts#L21) |
| value_json | jsonb | false | 'null'::jsonb | valueJson: Json | [contract](../../src/persistence/types/organization.ts#L21) |
| source | text | false | 'site_override'::text | source: string | [contract](../../src/persistence/types/organization.ts#L21) |
| effective_date | date | true | — | effectiveDate: string \| null | [contract](../../src/persistence/types/organization.ts#L21) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| updated_at | timestamp with time zone | false | now() | updatedAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| deleted_at | timestamp with time zone | true | — | deletedAt: string \| null | [contract](../../src/persistence/types/common.ts#L14) |

Installed constraints:

```sql
site_configurations_pkey: PRIMARY KEY (id)
site_configurations_site_id_configuration_key_effective_dat_key: UNIQUE (site_id, configuration_key, effective_date)
site_configurations_site_id_fkey: FOREIGN KEY (site_id) REFERENCES sites(id)
```

Migration sources mentioning this table: [supabase/migrations/202609240001_initial_portal_schema.sql](../../supabase/migrations/202609240001_initial_portal_schema.sql). Mentions include references and function bodies, not just table declarations.

## site coverages

`site_coverages`: Legacy site-to-coverage assignment.

Owner: Site-scoped or optional Site dimension; inspect nullable links and any paired Association target. Group: compatibility. RLS: true. Contract: SiteCoverage. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/organization.ts#L17) |
| site_id | uuid | false | — | siteId: string | [contract](../../src/persistence/types/organization.ts#L17) |
| coverage_key | text | false | — | coverageKey: string | [contract](../../src/persistence/types/organization.ts#L17) |
| enabled | boolean | false | true | enabled: boolean | [contract](../../src/persistence/types/organization.ts#L17) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| updated_at | timestamp with time zone | false | now() | updatedAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| key | text | false | — | key?: string \| undefined | [contract](../../src/persistence/types/organization.ts#L17) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
site_coverages_display_id_key: UNIQUE (display_id)
site_coverages_key_key: UNIQUE (key)
site_coverages_pkey: PRIMARY KEY (id)
site_coverages_product_reference: FOREIGN KEY (coverage_key) REFERENCES products(key) DEFERRABLE INITIALLY DEFERRED
site_coverages_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
site_coverages_site_id_coverage_key_key: UNIQUE (site_id, coverage_key)
site_coverages_site_id_fkey: FOREIGN KEY (site_id) REFERENCES sites(id)
```

Migration sources mentioning this table: [supabase/migrations/202609240001_initial_portal_schema.sql](../../supabase/migrations/202609240001_initial_portal_schema.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610120003_relationship_integrity.sql](../../supabase/migrations/202610120003_relationship_integrity.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [site_coverages_product_idx](../../supabase/migrations/202610120003_relationship_integrity.sql#L180): `create index site_coverages_product_idx on public.site_coverages(coverage_key);`
- [site_coverages_semantic_key](../../supabase/migrations/202609280001_canonical_normalization.sql#L969): `create trigger site_coverages_semantic_key before insert on public.site_coverages for each row execute function public.fill_legacy_assignment_key('coverage_key');`

## site documents

`site_documents`: Document assignments on sites.

Owner: Site-scoped or optional Site dimension; inspect nullable links and any paired Association target. Group: library-content. RLS: true. Contract: SiteDocumentRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/siteConfiguration.ts#L22) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/siteConfiguration.ts#L22) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/siteConfiguration.ts#L22) |
| site_key | text | false | — | siteKey: string | [contract](../../src/persistence/types/siteConfiguration.ts#L22) |
| document_key | text | false | — | documentKey: string | [contract](../../src/persistence/types/siteConfiguration.ts#L22) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
site_documents_display_id_key: UNIQUE (display_id)
site_documents_document_key_fkey: FOREIGN KEY (document_key) REFERENCES document_definitions(key)
site_documents_key_key: UNIQUE (key)
site_documents_pkey: PRIMARY KEY (id)
site_documents_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
site_documents_site_key_document_key_key: UNIQUE (site_key, document_key)
site_documents_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## site email templates

`site_email_templates`: Email templates enabled on sites.

Owner: Site-scoped or optional Site dimension; inspect nullable links and any paired Association target. Group: library-communications. RLS: true. Contract: SiteEmailTemplateRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/siteConfiguration.ts#L21) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/siteConfiguration.ts#L21) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/siteConfiguration.ts#L21) |
| site_key | text | false | — | siteKey: string | [contract](../../src/persistence/types/siteConfiguration.ts#L21) |
| email_template_key | text | false | — | emailTemplateKey: string | [contract](../../src/persistence/types/siteConfiguration.ts#L21) |
| enabled | boolean | false | — | enabled: boolean | [contract](../../src/persistence/types/siteConfiguration.ts#L21) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
site_email_templates_display_id_key: UNIQUE (display_id)
site_email_templates_email_template_key_fkey: FOREIGN KEY (email_template_key) REFERENCES email_templates(key)
site_email_templates_key_key: UNIQUE (key)
site_email_templates_pkey: PRIMARY KEY (id)
site_email_templates_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
site_email_templates_site_key_email_template_key_key: UNIQUE (site_key, email_template_key)
site_email_templates_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## site environment links

`site_environment_links`: Site launch/reference links by environment.

Owner: Site-scoped or optional Site dimension; inspect nullable links and any paired Association target. Group: hierarchy. RLS: true. Contract: SiteEnvironmentLink & Partial<LibraryMetadata>. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/domain/sites.ts#L48) |
| key | text | false | — | key: string | [contract](../../src/domain/sites.ts#L49) |
| site_key | text | false | — | siteKey: string | [contract](../../src/domain/sites.ts#L50) |
| environment | text | false | — | environment: SiteEnvironment | [contract](../../src/domain/sites.ts#L51) |
| link_type | text | false | — | linkType: "launch" \| "campaign" \| "apply" \| "returning" \| "reference" | [contract](../../src/domain/sites.ts#L52) |
| label | text | false | — | label: string | [contract](../../src/domain/sites.ts#L53) |
| url | text | false | — | url: string | [contract](../../src/domain/sites.ts#L54) |
| active | boolean | false | — | active: boolean | [contract](../../src/domain/sites.ts#L55) |
| position | integer | false | 0 | position: number | [contract](../../src/domain/sites.ts#L56) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
site_environment_links_display_id_key: UNIQUE (display_id)
site_environment_links_environment_check: CHECK ((environment = ANY (ARRAY['prototype'::text, 'test'::text, 'pre-production'::text, 'production'::text, 'automation'::text])))
site_environment_links_key_key: UNIQUE (key)
site_environment_links_link_type_check: CHECK ((link_type = ANY (ARRAY['launch'::text, 'campaign'::text, 'apply'::text, 'returning'::text, 'reference'::text])))
site_environment_links_pkey: PRIMARY KEY (id)
site_environment_links_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
site_environment_links_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
site_environment_links_url_check: CHECK ((url ~ '^https?://'::text))
```

Migration sources mentioning this table: [supabase/migrations/202609250001_site_environment_links.sql](../../supabase/migrations/202609250001_site_environment_links.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## site features

`site_features`: Feature activation on sites.

Owner: Site-scoped or optional Site dimension; inspect nullable links and any paired Association target. Group: library-features. RLS: true. Contract: SiteFeatureRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/siteConfiguration.ts#L14) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/siteConfiguration.ts#L14) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/siteConfiguration.ts#L14) |
| site_key | text | false | — | siteKey: string | [contract](../../src/persistence/types/siteConfiguration.ts#L14) |
| feature_key | text | false | — | featureKey: string | [contract](../../src/persistence/types/siteConfiguration.ts#L14) |
| enabled | boolean | false | — | enabled: boolean | [contract](../../src/persistence/types/siteConfiguration.ts#L14) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
site_features_display_id_key: UNIQUE (display_id)
site_features_feature_key_fkey: FOREIGN KEY (feature_key) REFERENCES features(key)
site_features_key_key: UNIQUE (key)
site_features_pkey: PRIMARY KEY (id)
site_features_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
site_features_site_key_feature_key_key: UNIQUE (site_key, feature_key)
site_features_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## site field configurations

`site_field_configurations`: Scoped page-field inclusion and override values.

Owner: Global, hosting Association (legacy client), or Site by declared scope; inspect CHECK/targets. Group: library-fields. RLS: true. Contract: SiteFieldConfigurationRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/siteConfiguration.ts#L10) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/siteConfiguration.ts#L10) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/siteConfiguration.ts#L10) |
| page_key | text | false | — | pageKey: string | [contract](../../src/persistence/types/siteConfiguration.ts#L10) |
| field_key | text | false | — | fieldKey: string | [contract](../../src/persistence/types/siteConfiguration.ts#L10) |
| include | boolean | true | — | include: boolean \| null | [contract](../../src/persistence/types/siteConfiguration.ts#L11) |
| hidden | boolean | true | — | hidden: boolean \| null | [contract](../../src/persistence/types/siteConfiguration.ts#L11) |
| values | jsonb | false | — | values: Partial<Omit<import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/fields").FieldDefinition, "id">> | [contract](../../src/persistence/types/siteConfiguration.ts#L11) |
| scope | text | false | — | scope: "global" \| "client" \| "site" | [contract](../../src/persistence/types/catalog.ts#L5) |
| client_key | text | true | — | clientKey: string \| null | [contract](../../src/persistence/types/catalog.ts#L5) |
| site_key | text | true | — | siteKey: string \| null | [contract](../../src/persistence/types/catalog.ts#L5) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
site_field_configurations_check: CHECK ((((scope = 'global'::text) AND (client_key IS NULL) AND (site_key IS NULL)) OR ((scope = 'client'::text) AND (client_key IS NOT NULL) AND (site_key IS NULL)) OR ((scope = 'site'::text) AND (site_key IS NOT NULL) AND (client_key IS NULL))))
site_field_configurations_client_key_fkey: FOREIGN KEY (client_key) REFERENCES clients(key)
site_field_configurations_display_id_key: UNIQUE (display_id)
site_field_configurations_field_key_fkey: FOREIGN KEY (field_key) REFERENCES fields(key)
site_field_configurations_key_key: UNIQUE (key)
site_field_configurations_page_key_fkey: FOREIGN KEY (page_key) REFERENCES pages(key)
site_field_configurations_pkey: PRIMARY KEY (id)
site_field_configurations_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
site_field_configurations_scope_check: CHECK ((scope = ANY (ARRAY['global'::text, 'client'::text, 'site'::text])))
site_field_configurations_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
site_field_configurations_values_check: CHECK ((jsonb_typeof("values") = 'object'::text))
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## site flows

`site_flows`: Scoped flow selection and runtime alias.

Owner: Global, hosting Association (legacy client), or Site by declared scope; inspect CHECK/targets. Group: library-flows. RLS: true. Contract: SiteFlowRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/siteConfiguration.ts#L15) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/siteConfiguration.ts#L15) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/siteConfiguration.ts#L15) |
| flow_key | text | false | — | flowKey: string | [contract](../../src/persistence/types/siteConfiguration.ts#L15) |
| flow_id | text | false | — | flowId: string | [contract](../../src/persistence/types/siteConfiguration.ts#L15) |
| scope | text | false | — | scope: "global" \| "client" \| "site" | [contract](../../src/persistence/types/catalog.ts#L5) |
| client_key | text | true | — | clientKey: string \| null | [contract](../../src/persistence/types/catalog.ts#L5) |
| site_key | text | true | — | siteKey: string \| null | [contract](../../src/persistence/types/catalog.ts#L5) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
site_flows_check: CHECK ((((scope = 'global'::text) AND (client_key IS NULL) AND (site_key IS NULL)) OR ((scope = 'client'::text) AND (client_key IS NOT NULL) AND (site_key IS NULL)) OR ((scope = 'site'::text) AND (site_key IS NOT NULL) AND (client_key IS NULL))))
site_flows_client_key_fkey: FOREIGN KEY (client_key) REFERENCES clients(key)
site_flows_display_id_key: UNIQUE (display_id)
site_flows_flow_id_scope_client_key_site_key_key: UNIQUE NULLS NOT DISTINCT (flow_id, scope, client_key, site_key)
site_flows_flow_key_fkey: FOREIGN KEY (flow_key) REFERENCES flows(key)
site_flows_key_key: UNIQUE (key)
site_flows_pkey: PRIMARY KEY (id)
site_flows_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
site_flows_scope_check: CHECK ((scope = ANY (ARRAY['global'::text, 'client'::text, 'site'::text])))
site_flows_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## site pages

`site_pages`: Page participation and ordering on sites.

Owner: Site-scoped or optional Site dimension; inspect nullable links and any paired Association target. Group: library-pages. RLS: true. Contract: SitePageRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/siteConfiguration.ts#L8) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/siteConfiguration.ts#L8) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/siteConfiguration.ts#L8) |
| site_key | text | false | — | siteKey: string | [contract](../../src/persistence/types/siteConfiguration.ts#L8) |
| page_key | text | false | — | pageKey: string | [contract](../../src/persistence/types/siteConfiguration.ts#L8) |
| requirement | text | false | — | requirement: "required" \| "optional" \| "none" | [contract](../../src/persistence/types/siteConfiguration.ts#L8) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
site_pages_display_id_key: UNIQUE (display_id)
site_pages_key_key: UNIQUE (key)
site_pages_nonnegative_order: CHECK (("position" >= 0))
site_pages_page_key_fkey: FOREIGN KEY (page_key) REFERENCES pages(key)
site_pages_pkey: PRIMARY KEY (id)
site_pages_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
site_pages_requirement_check: CHECK ((requirement = ANY (ARRAY['required'::text, 'optional'::text, 'none'::text])))
site_pages_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
site_pages_site_key_page_key_key: UNIQUE (site_key, page_key)
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610090001_page_catalog_contract.sql](../../supabase/migrations/202610090001_page_catalog_contract.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## site policies

`site_policies`: Site association and payment policy definitions.

Owner: Site-scoped or optional Site dimension; inspect nullable links and any paired Association target. Group: library-rules. RLS: true. Contract: SitePolicyRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/catalog.ts#L4) |
| site_key | text | false | — | siteKey: string | [contract](../../src/persistence/types/siteConfiguration.ts#L23) |
| definition | jsonb | false | — | definition: { associationSelection?: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/associations").AssociationSelection; associationBranding?: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/associations").AssociationBranding; payment?: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/paymentPolicy").PaymentPolicy; } | [contract](../../src/persistence/types/catalog.ts#L4) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
portal_json_reference: TRIGGER DEFERRABLE INITIALLY DEFERRED
site_policies_definition_check: CHECK ((jsonb_typeof(definition) = 'object'::text))
site_policies_display_id_key: UNIQUE (display_id)
site_policies_key_key: UNIQUE (key)
site_policies_pkey: PRIMARY KEY (id)
site_policies_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
site_policies_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
site_policies_site_key_key: UNIQUE (site_key)
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120004_association_identity.sql](../../supabase/migrations/202610120004_association_identity.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql), [supabase/migrations/202610120008_reference_validation.sql](../../supabase/migrations/202610120008_reference_validation.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [site_policies_refresh_identity](../../supabase/migrations/202610120004_association_identity.sql#L160): `create trigger site_policies_refresh_identity after insert or update on public.site_policies for each statement execute function public.refresh_association_contexts_after_write();`

## site product applicants

`site_product_applicants`: Applicant-role types offered for products on sites.

Owner: Site-scoped or optional Site dimension; inspect nullable links and any paired Association target. Group: library-rules. RLS: true. Contract: SiteProductApplicantRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/siteConfiguration.ts#L13) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/siteConfiguration.ts#L13) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/siteConfiguration.ts#L13) |
| site_key | text | false | — | siteKey: string | [contract](../../src/persistence/types/siteConfiguration.ts#L13) |
| product_key | text | false | — | productKey: string | [contract](../../src/persistence/types/siteConfiguration.ts#L13) |
| applicant_key | text | false | — | applicantKey: string | [contract](../../src/persistence/types/siteConfiguration.ts#L13) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
site_product_applicants_applicant_key_fkey: FOREIGN KEY (applicant_key) REFERENCES applicant_types(key)
site_product_applicants_display_id_key: UNIQUE (display_id)
site_product_applicants_key_key: UNIQUE (key)
site_product_applicants_pkey: PRIMARY KEY (id)
site_product_applicants_product_key_fkey: FOREIGN KEY (product_key) REFERENCES products(key)
site_product_applicants_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
site_product_applicants_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
site_product_applicants_site_key_product_key_applicant_key_key: UNIQUE (site_key, product_key, applicant_key)
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120003_relationship_integrity.sql](../../supabase/migrations/202610120003_relationship_integrity.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [site_product_applicants_product_idx](../../supabase/migrations/202610120003_relationship_integrity.sql#L184): `create index site_product_applicants_product_idx on public.site_product_applicants(product_key);`
- [site_product_applicants_offering_guard](../../supabase/migrations/202610120003_relationship_integrity.sql#L120): `create trigger site_product_applicants_offering_guard before insert or update on public.site_product_applicants for each row execute function public.check_site_offered_product();`

## site products

`site_products`: Site-to-product assignment.

Owner: Site-scoped or optional Site dimension; inspect nullable links and any paired Association target. Group: library-rules. RLS: true. Contract: SiteProduct. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/organization.ts#L18) |
| site_id | uuid | false | — | siteId: string | [contract](../../src/persistence/types/organization.ts#L18) |
| product_key | text | false | — | productKey: string | [contract](../../src/persistence/types/organization.ts#L18) |
| enabled | boolean | false | true | enabled: boolean | [contract](../../src/persistence/types/organization.ts#L18) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| updated_at | timestamp with time zone | false | now() | updatedAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| key | text | false | — | key?: string \| undefined | [contract](../../src/persistence/types/organization.ts#L18) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
site_products_display_id_key: UNIQUE (display_id)
site_products_key_key: UNIQUE (key)
site_products_pkey: PRIMARY KEY (id)
site_products_product_reference: FOREIGN KEY (product_key) REFERENCES products(key) DEFERRABLE INITIALLY DEFERRED
site_products_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
site_products_site_id_fkey: FOREIGN KEY (site_id) REFERENCES sites(id)
site_products_site_id_product_key_key: UNIQUE (site_id, product_key)
```

Migration sources mentioning this table: [supabase/migrations/202609240001_initial_portal_schema.sql](../../supabase/migrations/202609240001_initial_portal_schema.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120003_relationship_integrity.sql](../../supabase/migrations/202610120003_relationship_integrity.sql), [supabase/migrations/202610120005_application_storage.sql](../../supabase/migrations/202610120005_application_storage.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql), [supabase/migrations/202610120009_application_context_history.sql](../../supabase/migrations/202610120009_application_context_history.sql), [supabase/migrations/202610130001_application_selection_integrity.sql](../../supabase/migrations/202610130001_application_selection_integrity.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [site_products_product_idx](../../supabase/migrations/202610120003_relationship_integrity.sql#L181): `create index site_products_product_idx on public.site_products(product_key);`
- [site_products_semantic_key](../../supabase/migrations/202609280001_canonical_normalization.sql#L974): `create trigger site_products_semantic_key before insert on public.site_products for each row execute function public.fill_legacy_assignment_key('product_key');`
- [site_products_role_delete_guard](../../supabase/migrations/202610120003_relationship_integrity.sql#L132): `create trigger site_products_role_delete_guard before delete or update of site_id,product_key on public.site_products for each row execute function public.guard_site_product_roles();`

## site riders

`site_riders`: Site-to-rider assignment.

Owner: Site-scoped or optional Site dimension; inspect nullable links and any paired Association target. Group: library-products. RLS: true. Contract: SiteRider. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/organization.ts#L19) |
| site_id | uuid | false | — | siteId: string | [contract](../../src/persistence/types/organization.ts#L19) |
| rider_key | text | false | — | riderKey: string | [contract](../../src/persistence/types/organization.ts#L19) |
| enabled | boolean | false | true | enabled: boolean | [contract](../../src/persistence/types/organization.ts#L19) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| updated_at | timestamp with time zone | false | now() | updatedAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| key | text | false | — | key?: string \| undefined | [contract](../../src/persistence/types/organization.ts#L19) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
site_riders_display_id_key: UNIQUE (display_id)
site_riders_key_key: UNIQUE (key)
site_riders_pkey: PRIMARY KEY (id)
site_riders_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
site_riders_rider_reference: FOREIGN KEY (rider_key) REFERENCES riders(key) DEFERRABLE INITIALLY DEFERRED
site_riders_site_id_fkey: FOREIGN KEY (site_id) REFERENCES sites(id)
site_riders_site_id_rider_key_key: UNIQUE (site_id, rider_key)
```

Migration sources mentioning this table: [supabase/migrations/202609240001_initial_portal_schema.sql](../../supabase/migrations/202609240001_initial_portal_schema.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120003_relationship_integrity.sql](../../supabase/migrations/202610120003_relationship_integrity.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [site_riders_rider_idx](../../supabase/migrations/202610120003_relationship_integrity.sql#L182): `create index site_riders_rider_idx on public.site_riders(rider_key);`
- [site_riders_semantic_key](../../supabase/migrations/202609280001_canonical_normalization.sql#L979): `create trigger site_riders_semantic_key before insert on public.site_riders for each row execute function public.fill_legacy_assignment_key('rider_key');`

## site url parameters

`site_url_parameters`: URL parameters enabled on sites.

Owner: Site-scoped or optional Site dimension; inspect nullable links and any paired Association target. Group: library-url-parameters. RLS: true. Contract: SiteUrlParameters. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/urlsCanonical.ts#L12) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/urlsCanonical.ts#L13) |
| site_key | text | false | — | siteKey: string | [contract](../../src/persistence/types/urlsCanonical.ts#L14) |
| url_parameter_key | text | false | — | urlParameterKey: string | [contract](../../src/persistence/types/urlsCanonical.ts#L15) |
| enabled | boolean | false | — | enabled: boolean | [contract](../../src/persistence/types/urlsCanonical.ts#L16) |
| default_value | text | true | — | defaultValue: string \| null | [contract](../../src/persistence/types/urlsCanonical.ts#L17) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
site_url_parameters_display_id_check: CHECK ((display_id > 0))
site_url_parameters_display_id_key: UNIQUE (display_id)
site_url_parameters_key_key: UNIQUE (key)
site_url_parameters_pkey: PRIMARY KEY (id)
site_url_parameters_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
site_url_parameters_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
site_url_parameters_url_parameter_key_fkey: FOREIGN KEY (url_parameter_key) REFERENCES url_parameters(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## sites

`sites`: Portal application experiences owned by a client.

Owner: Hosting Association via hosting_association_id/client_id; TPA derived. Group: hierarchy. RLS: true. Contract: Site. Access: Mock server operational arrays; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/organization.ts#L12) |
| client_id | uuid | false | — | clientId: string | [contract](../../src/persistence/types/organization.ts#L12) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/organization.ts#L12) |
| name | text | false | — | name: string | [contract](../../src/domain/sites.ts#L12) |
| display_name | text | false | — | displayName: string | [contract](../../src/persistence/types/organization.ts#L12) |
| status | record_status | false | 'active'::record_status | status: RecordStatus | [contract](../../src/persistence/types/organization.ts#L15) |
| environment | text | false | 'demo'::text | environment: string | [contract](../../src/persistence/types/organization.ts#L15) |
| template_type | text | false | — | templateType: "single" \| "multi" | [contract](../../src/domain/sites.ts#L13) |
| legacy_client_id | text | false | — | legacyClientId: string | [contract](../../src/persistence/types/organization.ts#L15) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| updated_at | timestamp with time zone | false | now() | updatedAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| deleted_at | timestamp with time zone | true | — | deletedAt: string \| null | [contract](../../src/persistence/types/common.ts#L14) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |
| hosting_association_id | uuid | false | — | hostingAssociationId?: string \| undefined | [contract](../../src/persistence/types/organization.ts#L14) |

Installed constraints:

```sql
sites_client_id_fkey: FOREIGN KEY (client_id) REFERENCES clients(id)
sites_display_id_key: UNIQUE (display_id)
sites_hosting_association_id_fkey: FOREIGN KEY (hosting_association_id) REFERENCES association_entities(id)
sites_hosting_compatibility: CHECK ((hosting_association_id = client_id))
sites_id_client_id_unique: UNIQUE (id, client_id)
sites_id_key_unique: UNIQUE (id, key)
sites_key_key: UNIQUE (key)
sites_pkey: PRIMARY KEY (id)
sites_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
sites_template_type_check: CHECK ((template_type = ANY (ARRAY['single'::text, 'multi'::text])))
```

Migration sources mentioning this table: [supabase/migrations/202609240001_initial_portal_schema.sql](../../supabase/migrations/202609240001_initial_portal_schema.sql), [supabase/migrations/202609240002_analytics_domain.sql](../../supabase/migrations/202609240002_analytics_domain.sql), [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609250001_site_environment_links.sql](../../supabase/migrations/202609250001_site_environment_links.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610020001_library_publication.sql](../../supabase/migrations/202610020001_library_publication.sql), [supabase/migrations/202610050002_analytics_tags.sql](../../supabase/migrations/202610050002_analytics_tags.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120002_application_relationships.sql](../../supabase/migrations/202610120002_application_relationships.sql), [supabase/migrations/202610120003_relationship_integrity.sql](../../supabase/migrations/202610120003_relationship_integrity.sql), [supabase/migrations/202610120004_association_identity.sql](../../supabase/migrations/202610120004_association_identity.sql), [supabase/migrations/202610120005_application_storage.sql](../../supabase/migrations/202610120005_application_storage.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql), [supabase/migrations/202610120008_reference_validation.sql](../../supabase/migrations/202610120008_reference_validation.sql), [supabase/migrations/202610120009_application_context_history.sql](../../supabase/migrations/202610120009_application_context_history.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [sites_client_id_idx](../../supabase/migrations/202609240001_initial_portal_schema.sql#L85): `create index sites_client_id_idx on public.sites(client_id) where deleted_at is null;`
- [sites_association_parent_guard](../../supabase/migrations/202610120003_relationship_integrity.sql#L72): `create trigger sites_association_parent_guard before update of client_id on public.sites   for each row execute function public.guard_association_parent_change();`
- [sites_paired_context_guard](../../supabase/migrations/202610120003_relationship_integrity.sql#L109): `create trigger sites_paired_context_guard before update of client_id on public.sites for each row execute function public.guard_site_paired_contexts();`
- [sites_hosting_identity](../../supabase/migrations/202610120004_association_identity.sql#L138): `create trigger sites_hosting_identity before insert or update on public.sites for each row execute function public.fill_site_hosting_identity();`
- [sites_refresh_identity](../../supabase/migrations/202610120004_association_identity.sql#L157): `create trigger sites_refresh_identity after insert on public.sites for each statement execute function public.refresh_association_contexts_after_write();`
- [sites_operational_tenant](../../supabase/migrations/202610120009_application_context_history.sql#L121): `create trigger sites_operational_tenant before update of client_id on public.sites for each row execute function public.guard_site_operational_tenancy();`

## source requirements

`source_requirements`: Cell-level source evidence and adoption state.

Owner: Source/evidence or reference registry; retention independent of runtime activation. Group: evidence. RLS: true. Contract: SourceRequirements. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L25) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L26) |
| sheet_key | text | false | — | sheetKey: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L27) |
| cell | text | false | — | cell: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L28) |
| value | jsonb | true | — | value: Json | [contract](../../src/persistence/types/provenanceCanonical.ts#L29) |
| formula | text | true | — | formula: string \| null | [contract](../../src/persistence/types/provenanceCanonical.ts#L30) |
| comment | text | true | — | comment: string \| null | [contract](../../src/persistence/types/provenanceCanonical.ts#L31) |
| hyperlink | text | true | — | hyperlink: string \| null | [contract](../../src/persistence/types/provenanceCanonical.ts#L32) |
| classification | text | false | — | classification: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L36) |
| reason | text | false | — | reason: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L37) |
| checklist_notes | text | true | — | checklistNotes: string \| null | [contract](../../src/persistence/types/provenanceCanonical.ts#L38) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |
| promotion_state | text | false | 'SOURCE_ONLY'::text | promotionState: "SOURCE_ONLY" \| "PATTERN_CANDIDATE" \| "CANONICAL_LIBRARY" \| "SITE_CONFIGURATION" \| "UNRESOLVED" | [contract](../../src/persistence/types/provenanceCanonical.ts#L33) |
| promotion_reason | text | false | 'Archived evidence; no adoption decision.'::text | promotionReason: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L34) |
| active_site_keys | jsonb | false | '[]'::jsonb | activeSiteKeys: Json | [contract](../../src/persistence/types/provenanceCanonical.ts#L35) |

Installed constraints:

```sql
source_promotion_scope: CHECK (((promotion_state <> ALL (ARRAY['SOURCE_ONLY'::text, 'PATTERN_CANDIDATE'::text])) OR (active_site_keys = '[]'::jsonb)))
source_requirements_active_site_keys_check: CHECK ((jsonb_typeof(active_site_keys) = 'array'::text))
source_requirements_classification_check: CHECK ((classification = ANY (ARRAY['MAPPED'::text, 'INTENTIONALLY_EXCLUDED'::text, 'UNMAPPED_SEMANTIC'::text, 'PARSER_GAP'::text, 'MODEL_GAP'::text, 'IDENTITY_CONFLICT'::text, 'SOURCE_TBD'::text, 'SOURCE_CONFLICT'::text, 'REQUIRES_CLIENT_CONFIRMATION'::text, 'REQUIRES_AM_CONFIRMATION'::text, 'REQUIRES_UW_CONFIRMATION'::text, 'REQUIRES_CONTRACTS_CONFIRMATION'::text, 'REQUIRES_COMPLIANCE_CONFIRMATION'::text, 'IMAGE_REVIEW_REQUIRED'::text, 'NON_FUNCTIONAL_OR_REFERENCE'::text])))
source_requirements_display_id_check: CHECK ((display_id > 0))
source_requirements_display_id_key: UNIQUE (display_id)
source_requirements_key_key: UNIQUE (key)
source_requirements_pkey: PRIMARY KEY (id)
source_requirements_promotion_state_check: CHECK ((promotion_state = ANY (ARRAY['SOURCE_ONLY'::text, 'PATTERN_CANDIDATE'::text, 'CANONICAL_LIBRARY'::text, 'SITE_CONFIGURATION'::text, 'UNRESOLVED'::text])))
source_requirements_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
source_requirements_sheet_key_cell_key: UNIQUE (sheet_key, cell)
source_requirements_sheet_key_fkey: FOREIGN KEY (sheet_key) REFERENCES source_sheets(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202609280002_source_promotion.sql](../../supabase/migrations/202609280002_source_promotion.sql). Mentions include references and function bodies, not just table declarations.

## source sheets

`source_sheets`: Workbook sheets and extraction metadata.

Owner: Source/evidence or reference registry; retention independent of runtime activation. Group: evidence. RLS: true. Contract: SourceSheets. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L16) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L17) |
| workbook_key | text | false | — | workbookKey: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L18) |
| name | text | false | — | name: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L19) |
| cell_count | integer | false | — | cellCount: number | [contract](../../src/persistence/types/provenanceCanonical.ts#L20) |
| merged_ranges | jsonb | false | — | mergedRanges: Json | [contract](../../src/persistence/types/provenanceCanonical.ts#L21) |
| image_count | integer | false | — | imageCount: number | [contract](../../src/persistence/types/provenanceCanonical.ts#L22) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
source_sheets_display_id_check: CHECK ((display_id > 0))
source_sheets_display_id_key: UNIQUE (display_id)
source_sheets_key_key: UNIQUE (key)
source_sheets_pkey: PRIMARY KEY (id)
source_sheets_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
source_sheets_workbook_key_fkey: FOREIGN KEY (workbook_key) REFERENCES source_workbooks(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql). Mentions include references and function bodies, not just table declarations.

## source workbooks

`source_workbooks`: Imported workbook identity and content hash.

Owner: Source/evidence or reference registry; retention independent of runtime activation. Group: evidence. RLS: true. Contract: SourceWorkbooks. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L10) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L11) |
| name | text | false | — | name: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L12) |
| sha256 | text | false | — | sha256: string | [contract](../../src/persistence/types/provenanceCanonical.ts#L13) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
source_workbooks_display_id_check: CHECK ((display_id > 0))
source_workbooks_display_id_key: UNIQUE (display_id)
source_workbooks_key_key: UNIQUE (key)
source_workbooks_pkey: PRIMARY KEY (id)
source_workbooks_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
source_workbooks_sha256_key: UNIQUE (sha256)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql). Mentions include references and function bodies, not just table declarations.

## structured rule actions

`structured_rule_actions`: Normalized action type and value under rules.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-rules. RLS: true. Contract: StructuredRuleActions. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/patternsCanonical.ts#L23) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/patternsCanonical.ts#L24) |
| rule_key | text | false | — | ruleKey: string | [contract](../../src/persistence/types/patternsCanonical.ts#L25) |
| action_type | text | false | — | actionType: string | [contract](../../src/persistence/types/patternsCanonical.ts#L26) |
| value | jsonb | true | — | value: Json | [contract](../../src/persistence/types/patternsCanonical.ts#L27) |
| position | integer | false | — | position: number | [contract](../../src/persistence/types/patternsCanonical.ts#L28) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
structured_rule_actions_action_type_check: CHECK ((action_type = ANY (ARRAY['lookup-membership'::text, 'lookup-coverage'::text, 'verify-identity'::text, 'show-portfolio'::text, 'set-decision'::text, 'suppress-rates'::text, 'calculate-benefit'::text])))
structured_rule_actions_display_id_check: CHECK ((display_id > 0))
structured_rule_actions_display_id_key: UNIQUE (display_id)
structured_rule_actions_key_key: UNIQUE (key)
structured_rule_actions_pkey: PRIMARY KEY (id)
structured_rule_actions_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
structured_rule_actions_rule_key_fkey: FOREIGN KEY (rule_key) REFERENCES rules(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## support profiles

`support_profiles`: Scoped support contact/presentation definitions.

Owner: Global, hosting Association (legacy client), or Site by declared scope; inspect CHECK/targets. Group: hierarchy. RLS: true. Contract: SupportProfileRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/catalog.ts#L4) |
| definition | jsonb | false | — | definition: Partial<import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/configuration").ClientSupport> | [contract](../../src/persistence/types/catalog.ts#L4) |
| scope | text | false | — | scope: "global" \| "client" \| "site" | [contract](../../src/persistence/types/catalog.ts#L5) |
| client_key | text | true | — | clientKey: string \| null | [contract](../../src/persistence/types/catalog.ts#L5) |
| site_key | text | true | — | siteKey: string \| null | [contract](../../src/persistence/types/catalog.ts#L5) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
support_profiles_check: CHECK ((((scope = 'global'::text) AND (client_key IS NULL) AND (site_key IS NULL)) OR ((scope = 'client'::text) AND (client_key IS NOT NULL) AND (site_key IS NULL)) OR ((scope = 'site'::text) AND (site_key IS NOT NULL) AND (client_key IS NULL))))
support_profiles_client_key_fkey: FOREIGN KEY (client_key) REFERENCES clients(key)
support_profiles_definition_check: CHECK ((jsonb_typeof(definition) = 'object'::text))
support_profiles_display_id_key: UNIQUE (display_id)
support_profiles_key_key: UNIQUE (key)
support_profiles_pkey: PRIMARY KEY (id)
support_profiles_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
support_profiles_scope_check: CHECK ((scope = ANY (ARRAY['global'::text, 'client'::text, 'site'::text])))
support_profiles_scope_client_key_site_key_key: UNIQUE NULLS NOT DISTINCT (scope, client_key, site_key)
support_profiles_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## underwriting bands

`underwriting_bands`: Product underwriting pathways by age and amount band.

Owner: Site-scoped or optional Site dimension; inspect nullable links and any paired Association target. Group: library-rules. RLS: true. Contract: UnderwritingBands. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L4) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L5) |
| product_key | text | false | — | productKey: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L6) |
| applicant_type_key | text | true | — | applicantTypeKey: string \| null | [contract](../../src/persistence/types/underwritingCanonical.ts#L7) |
| site_key | text | true | — | siteKey: string \| null | [contract](../../src/persistence/types/underwritingCanonical.ts#L8) |
| pathway | text | true | — | pathway: string \| null | [contract](../../src/persistence/types/underwritingCanonical.ts#L9) |
| minimum_age | numeric | true | — | minimumAge: number \| null | [contract](../../src/persistence/types/underwritingCanonical.ts#L10) |
| maximum_age | numeric | true | — | maximumAge: number \| null | [contract](../../src/persistence/types/underwritingCanonical.ts#L11) |
| minimum_amount | numeric | true | — | minimumAmount: number \| null | [contract](../../src/persistence/types/underwritingCanonical.ts#L12) |
| maximum_amount | numeric | true | — | maximumAmount: number \| null | [contract](../../src/persistence/types/underwritingCanonical.ts#L13) |
| minimum_amount_exclusive | boolean | false | — | minimumAmountExclusive: boolean | [contract](../../src/persistence/types/underwritingCanonical.ts#L14) |
| applicant_class | text | true | — | applicantClass: string \| null | [contract](../../src/persistence/types/underwritingCanonical.ts#L15) |
| mortality_morbidity | text | true | — | mortalityMorbidity: string \| null | [contract](../../src/persistence/types/underwritingCanonical.ts#L16) |
| condition_key | text | true | — | conditionKey: string \| null | [contract](../../src/persistence/types/underwritingCanonical.ts#L17) |
| status | text | false | — | status: string | [contract](../../src/persistence/types/underwritingCanonical.ts#L18) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
underwriting_bands_applicant_type_key_fkey: FOREIGN KEY (applicant_type_key) REFERENCES applicant_types(key)
underwriting_bands_condition_key_fkey: FOREIGN KEY (condition_key) REFERENCES conditions(key)
underwriting_bands_display_id_check: CHECK ((display_id > 0))
underwriting_bands_display_id_key: UNIQUE (display_id)
underwriting_bands_key_key: UNIQUE (key)
underwriting_bands_pkey: PRIMARY KEY (id)
underwriting_bands_product_key_fkey: FOREIGN KEY (product_key) REFERENCES products(key)
underwriting_bands_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
underwriting_bands_site_key_fkey: FOREIGN KEY (site_key) REFERENCES sites(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## url definitions

`url_definitions`: Parsed URL identity, parts and parameters.

Owner: Source/evidence or reference registry; retention independent of runtime activation. Group: evidence. RLS: true. Contract: UrlDefinitions. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/urlsCanonical.ts#L33) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/urlsCanonical.ts#L34) |
| url | text | false | — | url: string | [contract](../../src/persistence/types/urlsCanonical.ts#L35) |
| protocol | text | false | — | protocol: string | [contract](../../src/persistence/types/urlsCanonical.ts#L36) |
| host | text | false | — | host: string | [contract](../../src/persistence/types/urlsCanonical.ts#L37) |
| pathname | text | false | — | pathname: string | [contract](../../src/persistence/types/urlsCanonical.ts#L38) |
| parameters | jsonb | false | — | parameters: Json | [contract](../../src/persistence/types/urlsCanonical.ts#L39) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
url_definitions_display_id_check: CHECK ((display_id > 0))
url_definitions_display_id_key: UNIQUE (display_id)
url_definitions_key_key: UNIQUE (key)
url_definitions_pkey: PRIMARY KEY (id)
url_definitions_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql). Mentions include references and function bodies, not just table declarations.

## url parameter values

`url_parameter_values`: Named values of URL parameters.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-url-parameters. RLS: true. Contract: UrlParameterValues. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/urlsCanonical.ts#L27) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/urlsCanonical.ts#L28) |
| url_parameter_key | text | false | — | urlParameterKey: string | [contract](../../src/persistence/types/urlsCanonical.ts#L29) |
| value | text | false | — | value: string | [contract](../../src/persistence/types/urlsCanonical.ts#L30) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
url_parameter_values_display_id_check: CHECK ((display_id > 0))
url_parameter_values_display_id_key: UNIQUE (display_id)
url_parameter_values_key_key: UNIQUE (key)
url_parameter_values_pkey: PRIMARY KEY (id)
url_parameter_values_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
url_parameter_values_url_parameter_key_fkey: FOREIGN KEY (url_parameter_key) REFERENCES url_parameters(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## url parameters

`url_parameters`: URL parameter vocabulary and behavior.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-url-parameters. RLS: true. Contract: UrlParameters. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/urlsCanonical.ts#L5) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/urlsCanonical.ts#L6) |
| parameter | text | false | — | parameter: string | [contract](../../src/persistence/types/urlsCanonical.ts#L7) |
| behavior | text | false | — | behavior: string | [contract](../../src/persistence/types/urlsCanonical.ts#L8) |
| status | text | false | — | status: string | [contract](../../src/persistence/types/urlsCanonical.ts#L9) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
url_parameters_display_id_check: CHECK ((display_id > 0))
url_parameters_display_id_key: UNIQUE (display_id)
url_parameters_key_key: UNIQUE (key)
url_parameters_pkey: PRIMARY KEY (id)
url_parameters_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## url usages

`url_usages`: Recorded URL usage and optional client.

Owner: Hosting Association through compatibility reference; optional links do not establish mandatory ownership. Group: evidence. RLS: true. Contract: UrlUsages. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/urlsCanonical.ts#L42) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/urlsCanonical.ts#L43) |
| url_key | text | false | — | urlKey: string | [contract](../../src/persistence/types/urlsCanonical.ts#L44) |
| client_key | text | true | — | clientKey: string \| null | [contract](../../src/persistence/types/urlsCanonical.ts#L45) |
| usage | text | false | — | usage: string | [contract](../../src/persistence/types/urlsCanonical.ts#L46) |
| source_owner | text | false | — | sourceOwner: string | [contract](../../src/persistence/types/urlsCanonical.ts#L47) |
| status | text | false | — | status: string | [contract](../../src/persistence/types/urlsCanonical.ts#L48) |
| display_id | bigint | false | — | displayId: number | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy: string \| null | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference: string \| null | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
url_usages_client_key_fkey: FOREIGN KEY (client_key) REFERENCES clients(key)
url_usages_display_id_check: CHECK ((display_id > 0))
url_usages_display_id_key: UNIQUE (display_id)
url_usages_key_key: UNIQUE (key)
url_usages_pkey: PRIMARY KEY (id)
url_usages_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
url_usages_status_check: CHECK ((status = ANY (ARRAY['documented'::text, 'unresolved'::text])))
url_usages_url_key_fkey: FOREIGN KEY (url_key) REFERENCES url_definitions(key)
```

Migration sources mentioning this table: [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql). Mentions include references and function bodies, not just table declarations.

## user roles

`user_roles`: User-to-role assignments.

Owner: Global identity/access catalog or child of user/actor; tenant applicability through typed scopes. Group: identity. RLS: true. Contract: UserRole. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/operations.ts#L45) |
| user_id | uuid | false | — | userId: string | [contract](../../src/persistence/types/operations.ts#L45) |
| role_id | uuid | false | — | roleId: string | [contract](../../src/persistence/types/operations.ts#L45) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/operations.ts#L45) |

Installed constraints:

```sql
user_roles_pkey: PRIMARY KEY (id)
user_roles_role_id_fkey: FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
user_roles_user_id_fkey: FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
user_roles_user_id_role_id_key: UNIQUE (user_id, role_id)
```

Migration sources mentioning this table: [supabase/migrations/202609240001_initial_portal_schema.sql](../../supabase/migrations/202609240001_initial_portal_schema.sql). Mentions include references and function bodies, not just table declarations.

## user scopes

`user_scopes`: User access scope assignments with polymorphic target.

Owner: Global identity/access catalog or child of user/actor; tenant applicability through typed scopes. Group: identity. RLS: true. Contract: UserScope. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/operations.ts#L47) |
| user_id | uuid | false | — | userId: string | [contract](../../src/persistence/types/operations.ts#L47) |
| scope_type | text | false | — | scopeType: UserScopeType | [contract](../../src/persistence/types/operations.ts#L47) |
| scope_id | uuid | true | — | scopeId: string \| null | [contract](../../src/persistence/types/operations.ts#L47) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/operations.ts#L47) |
| reference_state | text | false | 'legacy'::text | referenceState?: "legacy" \| "resolved" \| undefined | [contract](../../src/persistence/types/operations.ts#L47) |
| target_reference_id | uuid | true | — | targetReferenceId?: string \| null \| undefined | [contract](../../src/persistence/types/operations.ts#L47) |

Installed constraints:

```sql
user_scopes_pkey: PRIMARY KEY (id)
user_scopes_reference_state_check: CHECK ((reference_state = ANY (ARRAY['legacy'::text, 'resolved'::text])))
user_scopes_scope_type_check: CHECK ((scope_type = ANY (ARRAY['global'::text, 'organization'::text, 'client'::text, 'association'::text, 'site'::text, 'advisor'::text])))
user_scopes_target_reference_id_fkey: FOREIGN KEY (target_reference_id) REFERENCES portal_entity_references(id)
user_scopes_user_id_fkey: FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
```

Migration sources mentioning this table: [supabase/migrations/202609240001_initial_portal_schema.sql](../../supabase/migrations/202609240001_initial_portal_schema.sql), [supabase/migrations/202610120008_reference_validation.sql](../../supabase/migrations/202610120008_reference_validation.sql), [supabase/migrations/202610120009_application_context_history.sql](../../supabase/migrations/202610120009_application_context_history.sql). Mentions include references and function bodies, not just table declarations.

Static index/trigger declarations from the ordered migration sources:

- [user_scopes_resolved_identity](../../supabase/migrations/202610120008_reference_validation.sql#L138): `create unique index user_scopes_resolved_identity on public.user_scopes(user_id,scope_type,scope_id) nulls not distinct where reference_state='resolved';`
- [user_scope_target](../../supabase/migrations/202610120008_reference_validation.sql#L139): `create trigger user_scope_target before insert or update on public.user_scopes for each row execute function public.validate_user_scope_target();`

## users

`users`: Portal user profiles, separate from Supabase auth identities.

Owner: Global identity/access catalog or child of user/actor; tenant applicability through typed scopes. Group: identity. RLS: true. Contract: PortalUser. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | uuid | false | gen_random_uuid() | id: string | [contract](../../src/persistence/types/operations.ts#L43) |
| email | text | false | — | email: string | [contract](../../src/persistence/types/operations.ts#L43) |
| display_name | text | false | — | displayName: string | [contract](../../src/persistence/types/operations.ts#L43) |
| status | record_status | false | 'active'::record_status | status: RecordStatus | [contract](../../src/persistence/types/operations.ts#L43) |
| created_at | timestamp with time zone | false | now() | createdAt: string | [contract](../../src/persistence/types/common.ts#L13) |
| updated_at | timestamp with time zone | false | now() | updatedAt: string | [contract](../../src/persistence/types/common.ts#L13) |

Installed constraints:

```sql
users_email_key: UNIQUE (email)
users_pkey: PRIMARY KEY (id)
```

Migration sources mentioning this table: [supabase/migrations/202609240001_initial_portal_schema.sql](../../supabase/migrations/202609240001_initial_portal_schema.sql), [supabase/migrations/202610020001_library_publication.sql](../../supabase/migrations/202610020001_library_publication.sql), [supabase/migrations/202610120003_relationship_integrity.sql](../../supabase/migrations/202610120003_relationship_integrity.sql), [supabase/migrations/202610120005_application_storage.sql](../../supabase/migrations/202610120005_application_storage.sql), [supabase/migrations/202610120008_reference_validation.sql](../../supabase/migrations/202610120008_reference_validation.sql), [supabase/migrations/202610120009_application_context_history.sql](../../supabase/migrations/202610120009_application_context_history.sql). Mentions include references and function bodies, not just table declarations.

## validation rules

`validation_rules`: Field validation definitions.

Owner: Shared catalog or child of shared definitions; effective applicability through assignments. Group: library-validation. RLS: true. Contract: ValidationRuleRow. Access: Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode.

| Column | SQL type | Nullable | Default | Contract field/type | Source |
| --- | --- | --- | --- | --- | --- |
| id | text | false | — | id: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| key | text | false | — | key: string | [contract](../../src/persistence/types/catalog.ts#L4) |
| position | integer | false | 0 | position: number | [contract](../../src/persistence/types/catalog.ts#L4) |
| field_key | text | false | — | fieldKey: string | [contract](../../src/persistence/types/template.ts#L11) |
| definition | jsonb | false | — | definition: { required?: boolean; format?: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/fields").FieldDefinition["format"]; inputType: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/fields").FieldDefinition["inputType"]; } | [contract](../../src/persistence/types/catalog.ts#L4) |
| display_id | bigint | false | — | displayId?: number \| undefined | [contract](../../src/domain/provenance.ts#L4) |
| provided_by | text | true | — | providedBy?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L5) |
| source_reference | text | true | — | sourceReference?: string \| null \| undefined | [contract](../../src/domain/provenance.ts#L6) |

Installed constraints:

```sql
validation_rules_definition_check: CHECK ((jsonb_typeof(definition) = 'object'::text))
validation_rules_display_id_key: UNIQUE (display_id)
validation_rules_field_key_fkey: FOREIGN KEY (field_key) REFERENCES fields(key)
validation_rules_key_key: UNIQUE (key)
validation_rules_pkey: PRIMARY KEY (id)
validation_rules_provided_by_fkey: FOREIGN KEY (provided_by) REFERENCES provenance_tags(key)
```

Migration sources mentioning this table: [supabase/migrations/202609240003_portal_library.sql](../../supabase/migrations/202609240003_portal_library.sql), [supabase/migrations/202609280001_canonical_normalization.sql](../../supabase/migrations/202609280001_canonical_normalization.sql), [supabase/migrations/202610010001_normalized_snapshot.sql](../../supabase/migrations/202610010001_normalized_snapshot.sql), [supabase/migrations/202610120001_portal_components.sql](../../supabase/migrations/202610120001_portal_components.sql), [supabase/migrations/202610120006_configuration_boundary.sql](../../supabase/migrations/202610120006_configuration_boundary.sql). Mentions include references and function bodies, not just table declarations.

## Declaration inventory limits

Index/trigger declarations above are source-derived; the captured PostgreSQL dictionary did not include installed index/trigger rows. Dynamic triggers created inside DO/functions are not expanded by this scanner, including JSON/reference identity guards. Full bodies are in the linked source migrations. These declarations are not an exhaustive installed trigger inventory or a claim of lifecycle enforcement.
