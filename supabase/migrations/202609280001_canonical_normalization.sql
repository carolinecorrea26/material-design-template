-- Phases 1–4 only: normalized review schema. No consumer switch or legacy removal.

create table public.provenance_tags (
  "id" text primary key,
  "key" text not null unique,
  "name" text not null,
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.provenance_tags enable row level security;

create table public.source_workbooks (
  "id" text primary key,
  "key" text not null unique,
  "name" text not null,
  "sha256" text not null unique,
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.source_workbooks enable row level security;

create table public.source_sheets (
  "id" text primary key,
  "key" text not null unique,
  "workbook_key" text not null references public.source_workbooks(key),
  "name" text not null,
  "cell_count" integer not null,
  "merged_ranges" jsonb not null,
  "image_count" integer not null,
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.source_sheets enable row level security;

create table public.source_requirements (
  "id" text primary key,
  "key" text not null unique,
  "sheet_key" text not null references public.source_sheets(key),
  "cell" text not null,
  "value" jsonb,
  "formula" text,
  "comment" text,
  "hyperlink" text,
  "classification" text not null check (classification in ('MAPPED','INTENTIONALLY_EXCLUDED','UNMAPPED_SEMANTIC','PARSER_GAP','MODEL_GAP','IDENTITY_CONFLICT','SOURCE_TBD','SOURCE_CONFLICT','REQUIRES_CLIENT_CONFIRMATION','REQUIRES_AM_CONFIRMATION','REQUIRES_UW_CONFIRMATION','REQUIRES_CONTRACTS_CONFIRMATION','REQUIRES_COMPLIANCE_CONFIRMATION','IMAGE_REVIEW_REQUIRED','NON_FUNCTIONAL_OR_REFERENCE')),
  "reason" text not null,
  "checklist_notes" text,
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text,
  unique(sheet_key, cell)
);
alter table public.source_requirements enable row level security;

create table public.patterns (
  "id" text primary key,
  "key" text not null unique,
  "name" text not null,
  "category" text not null,
  "description" text not null,
  "version" text,
  "status" text not null check (status in ('draft','active','deprecated')),
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.patterns enable row level security;

create table public.flag_definitions (
  "id" text primary key,
  "key" text not null unique,
  "name" text not null,
  "level" text not null check (level in ('application','site','coverage','product','rider','applicant','client')),
  "value_type" text not null check (value_type in ('boolean','enum','string','number')),
  "persistence" text not null check (persistence in ('configuration','derived-runtime','session','application-record')),
  "description" text not null,
  "allowed_values" jsonb,
  "derivation" text,
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.flag_definitions enable row level security;

create table public.flag_values (
  "id" text primary key,
  "key" text not null unique,
  "flag_key" text not null references public.flag_definitions(key),
  "value" text not null,
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text,
  unique(flag_key,value)
);
alter table public.flag_values enable row level security;

create table public.flag_assignments (
  "id" text primary key,
  "key" text not null unique,
  "flag_key" text not null references public.flag_definitions(key),
  "client_key" text references public.clients(key),
  "site_key" text references public.sites(key),
  "product_key" text references public.products(key),
  "coverage_key" text references public.coverage_categories(key),
  "rider_key" text references public.riders(key),
  "applicant_key" text references public.applicant_types(key),
  "application_id" uuid references public.applications(id),
  "value" jsonb not null,
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text,
  check (num_nonnulls(client_key,site_key,product_key,coverage_key,rider_key,applicant_key,application_id) <= 1)
);
alter table public.flag_assignments enable row level security;

create table public.flag_rules (
  "id" text primary key,
  "key" text not null unique,
  "flag_key" text not null references public.flag_definitions(key),
  "condition_key" text not null references public.conditions(key),
  "value" jsonb not null,
  "priority" integer not null,
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.flag_rules enable row level security;

create table public.rule_flags (
  "id" text primary key,
  "key" text not null unique,
  "rule_key" text not null references public.rules(key),
  "flag_key" text not null references public.flag_definitions(key),
  "operator" text not null check (operator in ('equals','not-equals')),
  "value" jsonb not null,
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.rule_flags enable row level security;

create table public.rule_predicates (
  "id" text primary key,
  "key" text not null unique,
  "rule_key" text not null references public.rules(key),
  "fact" text not null,
  "operator" text not null check (operator in ('equals','not-equals','greater-than','less-than','exists')),
  "value" jsonb not null,
  "position" integer not null,
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.rule_predicates enable row level security;

create table public.structured_rule_actions (
  "id" text primary key,
  "key" text not null unique,
  "rule_key" text not null references public.rules(key),
  "action_type" text not null check (action_type in ('lookup-membership','lookup-coverage','verify-identity','show-portfolio','set-decision','suppress-rates','calculate-benefit')),
  "value" jsonb,
  "position" integer not null,
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.structured_rule_actions enable row level security;

create table public.product_configuration_values (
  "id" text primary key,
  "key" text not null unique,
  "product_key" text not null references public.products(key),
  "configuration_key" text not null references public.configuration_definitions(key),
  "value" jsonb not null,
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.product_configuration_values enable row level security;

create table public.product_clients (
  "id" text primary key,
  "key" text not null unique,
  "product_key" text not null references public.products(key),
  "client_key" text not null references public.clients(key),
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text,
  unique(product_key,client_key)
);
alter table public.product_clients enable row level security;

create table public.coverage_plan_definitions (
  "id" text primary key,
  "key" text not null unique,
  "name" text not null,
  "coverage_type" text not null check (coverage_type in ('disability','overhead-expense')),
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.coverage_plan_definitions enable row level security;

create table public.coverage_plan_variants (
  "id" text primary key,
  "key" text not null unique,
  "plan_key" text not null references public.coverage_plan_definitions(key),
  "name" text,
  "applicant_type_key" text references public.applicant_types(key),
  "position" integer not null,
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.coverage_plan_variants enable row level security;

create table public.product_coverage_plans (
  "id" text primary key,
  "key" text not null unique,
  "product_key" text not null references public.products(key),
  "plan_key" text not null references public.coverage_plan_definitions(key),
  "applicant_type_key" text not null references public.applicant_types(key),
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.product_coverage_plans enable row level security;

create table public.plan_benefit_periods (
  "id" text primary key,
  "key" text not null unique,
  "variant_key" text not null references public.coverage_plan_variants(key),
  "kind" text not null check (kind in ('waiting','benefit')),
  "value" numeric not null,
  "unit" text not null check (unit in ('days','months','years')),
  "position" integer not null,
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.plan_benefit_periods enable row level security;

create table public.pattern_assignments (
  "id" text primary key,
  "key" text not null unique,
  "pattern_key" text not null references public.patterns(key),
  "client_key" text references public.clients(key),
  "site_key" text references public.sites(key),
  "product_key" text references public.products(key),
  "applicant_key" text references public.applicant_types(key),
  "configuration" jsonb not null,
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.pattern_assignments enable row level security;

create table public.pattern_rules (
  "id" text primary key,
  "key" text not null unique,
  "pattern_key" text not null references public.patterns(key),
  "related_key" text not null references public.rules(key),
  "relationship_type" text not null check (relationship_type in ('implements','uses','constrains','triggers','documents')),
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text,
  unique(pattern_key,related_key)
);
alter table public.pattern_rules enable row level security;

create table public.pattern_conditions (
  "id" text primary key,
  "key" text not null unique,
  "pattern_key" text not null references public.patterns(key),
  "related_key" text not null references public.conditions(key),
  "relationship_type" text not null check (relationship_type in ('implements','uses','constrains','triggers','documents')),
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text,
  unique(pattern_key,related_key)
);
alter table public.pattern_conditions enable row level security;

create table public.pattern_flag_definitions (
  "id" text primary key,
  "key" text not null unique,
  "pattern_key" text not null references public.patterns(key),
  "related_key" text not null references public.flag_definitions(key),
  "relationship_type" text not null check (relationship_type in ('implements','uses','constrains','triggers','documents')),
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text,
  unique(pattern_key,related_key)
);
alter table public.pattern_flag_definitions enable row level security;

create table public.pattern_flows (
  "id" text primary key,
  "key" text not null unique,
  "pattern_key" text not null references public.patterns(key),
  "related_key" text not null references public.flows(key),
  "relationship_type" text not null check (relationship_type in ('implements','uses','constrains','triggers','documents')),
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text,
  unique(pattern_key,related_key)
);
alter table public.pattern_flows enable row level security;

create table public.pattern_products (
  "id" text primary key,
  "key" text not null unique,
  "pattern_key" text not null references public.patterns(key),
  "related_key" text not null references public.products(key),
  "relationship_type" text not null check (relationship_type in ('implements','uses','constrains','triggers','documents')),
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text,
  unique(pattern_key,related_key)
);
alter table public.pattern_products enable row level security;

create table public.pattern_coverage_categories (
  "id" text primary key,
  "key" text not null unique,
  "pattern_key" text not null references public.patterns(key),
  "related_key" text not null references public.coverage_categories(key),
  "relationship_type" text not null check (relationship_type in ('implements','uses','constrains','triggers','documents')),
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text,
  unique(pattern_key,related_key)
);
alter table public.pattern_coverage_categories enable row level security;

create table public.pattern_configuration_definitions (
  "id" text primary key,
  "key" text not null unique,
  "pattern_key" text not null references public.patterns(key),
  "related_key" text not null references public.configuration_definitions(key),
  "relationship_type" text not null check (relationship_type in ('implements','uses','constrains','triggers','documents')),
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text,
  unique(pattern_key,related_key)
);
alter table public.pattern_configuration_definitions enable row level security;

create table public.coverage_amount_patterns (
  "id" text primary key,
  "key" text not null unique,
  "pattern_key" text not null references public.patterns(key),
  "amount_type" text not null check (amount_type in ('fixed','set','range','tiered-range','range-plus-fixed','conditional','calculated','named-option','none','attribute-mapped','formula-capped','base-reference','multiplier','election-only','unspecified-increment')),
  "minimum" numeric,
  "maximum" numeric,
  "increment" numeric,
  "formula" text,
  "base_product_key" text references public.products(key),
  "base_applicant_key" text references public.applicant_types(key),
  "base_applicant_class" text,
  "multiplier" numeric,
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text,
  check (minimum is null or maximum is null or minimum <= maximum),
  check (increment is null or increment > 0)
);
alter table public.coverage_amount_patterns enable row level security;

create table public.amount_options (
  "id" text primary key,
  "key" text not null unique,
  "amount_pattern_key" text not null references public.coverage_amount_patterns(key),
  "value" text not null,
  "label" text not null,
  "position" integer not null,
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.amount_options enable row level security;

create table public.amount_bands (
  "id" text primary key,
  "key" text not null unique,
  "amount_pattern_key" text not null references public.coverage_amount_patterns(key),
  "minimum" numeric,
  "maximum" numeric,
  "increment" numeric,
  "condition_key" text references public.conditions(key),
  "position" integer not null,
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.amount_bands enable row level security;

create table public.product_amount_rules (
  "id" text primary key,
  "key" text not null unique,
  "product_key" text not null references public.products(key),
  "applicant_type_key" text references public.applicant_types(key),
  "applicant_class" text,
  "amount_pattern_key" text not null references public.coverage_amount_patterns(key),
  "condition_key" text references public.conditions(key),
  "client_key" text references public.clients(key),
  "site_key" text references public.sites(key),
  "position" integer not null,
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.product_amount_rules enable row level security;

create table public.product_applicant_eligibility (
  "id" text primary key,
  "key" text not null unique,
  "product_key" text not null references public.products(key),
  "applicant_type_key" text not null references public.applicant_types(key),
  "site_key" text references public.sites(key),
  "eligible" boolean not null,
  "condition_key" text references public.conditions(key),
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.product_applicant_eligibility enable row level security;

create table public.rider_amount_rules (
  "id" text primary key,
  "key" text not null unique,
  "rider_key" text not null references public.riders(key),
  "applicant_type_key" text references public.applicant_types(key),
  "amount_pattern_key" text not null references public.coverage_amount_patterns(key),
  "base_product_key" text references public.products(key),
  "condition_key" text references public.conditions(key),
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.rider_amount_rules enable row level security;

create table public.aggregate_limits (
  "id" text primary key,
  "key" text not null unique,
  "category_key" text references public.coverage_categories(key),
  "product_key" text references public.products(key),
  "applicant_type_key" text references public.applicant_types(key),
  "maximum" numeric,
  "formula" text,
  "condition_key" text references public.conditions(key),
  "site_key" text references public.sites(key),
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.aggregate_limits enable row level security;

create table public.underwriting_bands (
  "id" text primary key,
  "key" text not null unique,
  "product_key" text not null references public.products(key),
  "applicant_type_key" text references public.applicant_types(key),
  "site_key" text references public.sites(key),
  "pathway" text,
  "minimum_age" numeric,
  "maximum_age" numeric,
  "minimum_amount" numeric,
  "maximum_amount" numeric,
  "minimum_amount_exclusive" boolean not null,
  "applicant_class" text,
  "mortality_morbidity" text,
  "condition_key" text references public.conditions(key),
  "status" text not null,
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.underwriting_bands enable row level security;

create table public.residency_rules (
  "id" text primary key,
  "key" text not null unique,
  "site_key" text references public.sites(key),
  "product_key" text references public.products(key),
  "rider_key" text references public.riders(key),
  "mode" text not null check (mode in ('include','exclude')),
  "condition_key" text references public.conditions(key),
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.residency_rules enable row level security;

create table public.residency_jurisdictions (
  "id" text primary key,
  "key" text not null unique,
  "residency_rule_key" text not null references public.residency_rules(key),
  "jurisdiction" text not null,
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.residency_jurisdictions enable row level security;

create table public.benefit_period_options (
  "id" text primary key,
  "key" text not null unique,
  "product_key" text not null references public.products(key),
  "site_key" text references public.sites(key),
  "applicant_type_key" text references public.applicant_types(key),
  "kind" text not null check (kind in ('waiting','benefit')),
  "value" text not null,
  "label" text not null,
  "days" integer,
  "position" integer not null,
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.benefit_period_options enable row level security;

create table public.eligibility_constraints (
  "id" text primary key,
  "key" text not null unique,
  "product_key" text not null references public.products(key),
  "site_key" text references public.sites(key),
  "applicant_type_key" text not null references public.applicant_types(key),
  "minimum_age_days" numeric,
  "minimum_age_years" numeric,
  "maximum_age_years" numeric,
  "student_maximum_age_years" numeric,
  "unmarried" boolean,
  "minimum_work_hours" numeric,
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.eligibility_constraints enable row level security;

create table public.coverage_dependencies (
  "id" text primary key,
  "key" text not null unique,
  "product_key" text not null references public.products(key),
  "site_key" text references public.sites(key),
  "applicant_type_key" text not null references public.applicant_types(key),
  "requires_applicant_key" text not null references public.applicant_types(key),
  "category_key" text not null references public.coverage_categories(key),
  "same_product" boolean not null,
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.coverage_dependencies enable row level security;

create table public.maximum_plan_rules (
  "id" text primary key,
  "key" text not null unique,
  "product_key" text not null references public.products(key),
  "site_key" text references public.sites(key),
  "applicant_type_key" text not null references public.applicant_types(key),
  "category_key" text not null references public.coverage_categories(key),
  "count" integer not null check (count > 0),
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.maximum_plan_rules enable row level security;

create table public.benefit_caps (
  "id" text primary key,
  "key" text not null unique,
  "aggregate_limit_key" text not null references public.aggregate_limits(key),
  "minimum_age_years" numeric,
  "maximum_age_years" numeric,
  "self_employed_less_than_years" numeric,
  "maximum" numeric not null,
  "required_waiting_period" text,
  "required_benefit_period" text,
  "position" integer not null,
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.benefit_caps enable row level security;

create table public.question_sets (
  "id" text primary key,
  "key" text not null unique,
  "name" text not null,
  "question_type" text not null,
  "version" text,
  "description" text,
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.question_sets enable row level security;

create table public.question_definitions (
  "id" text primary key,
  "key" text not null unique,
  "text" text not null,
  "response_type" text,
  "status" text not null check (status in ('documented','unresolved')),
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.question_definitions enable row level security;

create table public.question_set_questions (
  "id" text primary key,
  "key" text not null unique,
  "question_set_key" text not null references public.question_sets(key),
  "question_key" text not null references public.question_definitions(key),
  "position" integer not null,
  "condition_key" text references public.conditions(key),
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.question_set_questions enable row level security;

create table public.question_set_fields (
  "id" text primary key,
  "key" text not null unique,
  "question_set_key" text not null references public.question_sets(key),
  "field_key" text not null references public.fields(key),
  "position" integer not null,
  "condition_key" text references public.conditions(key),
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.question_set_fields enable row level security;

create table public.rate_tables (
  "id" text primary key,
  "key" text not null unique,
  "name" text not null,
  "format" text not null check (format in ('html','url','image')),
  "content" text,
  "url" text,
  "image_ref" text,
  "source_system" text,
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.rate_tables enable row level security;

create table public.product_rate_tables (
  "id" text primary key,
  "key" text not null unique,
  "product_key" text not null references public.products(key),
  "rate_table_key" text not null references public.rate_tables(key),
  "site_key" text references public.sites(key),
  "condition_key" text references public.conditions(key),
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.product_rate_tables enable row level security;

create table public.rate_table_presentations (
  "id" text primary key,
  "key" text not null unique,
  "rate_table_key" text not null references public.rate_tables(key),
  "site_key" text references public.sites(key),
  "product_key" text references public.products(key),
  "placement" text not null check (placement in ('estimated-cost','product-card')),
  "mode" text not null check (mode in ('inline','link')),
  "enabled" boolean not null,
  "flag_key" text references public.flag_definitions(key),
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.rate_table_presentations enable row level security;

create table public.url_parameters (
  "id" text primary key,
  "key" text not null unique,
  "parameter" text not null,
  "behavior" text not null,
  "status" text not null,
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.url_parameters enable row level security;

create table public.site_url_parameters (
  "id" text primary key,
  "key" text not null unique,
  "site_key" text not null references public.sites(key),
  "url_parameter_key" text not null references public.url_parameters(key),
  "enabled" boolean not null,
  "default_value" text,
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.site_url_parameters enable row level security;

create table public.client_environment_links (
  "id" text primary key,
  "key" text not null unique,
  "client_key" text not null references public.clients(key),
  "environment" text not null check (environment in ('production','test','pre-production','automation')),
  "url" text not null check (url ~ '^https?://'),
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.client_environment_links enable row level security;

create table public.url_parameter_values (
  "id" text primary key,
  "key" text not null unique,
  "url_parameter_key" text not null references public.url_parameters(key),
  "value" text not null,
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.url_parameter_values enable row level security;

create table public.page_section_fields (
  "id" text primary key,
  "key" text not null unique,
  "section_key" text not null references public.page_sections(key),
  "field_key" text not null references public.fields(key),
  "position" integer not null,
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text,
  unique(section_key,field_key)
);
alter table public.page_section_fields enable row level security;

create table public.requirement_targets (
  "id" text primary key,
  "key" text not null unique,
  "requirement_key" text not null references public.source_requirements(key),
  "target_table" text not null,
  "target_key" text not null,
  "target_column" text not null,
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.requirement_targets enable row level security;

create table public.semantic_requirements (
  "id" text primary key,
  "key" text not null unique,
  "domain" text not null,
  "subject_table" text not null,
  "subject_key" text not null,
  "predicate" text not null,
  "value" jsonb not null,
  "status" text not null check (status in ('documented','partial')),
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.semantic_requirements enable row level security;

create table public.identity_resolutions (
  "id" text primary key,
  "key" text not null unique,
  "sheet_key" text not null references public.source_sheets(key),
  "source_row" integer not null,
  "strategy" text not null check (strategy in ('exact','semantic-key','g-number','plan-code','g-number+plan-code','multi-match','no-match')),
  "candidate_keys" jsonb not null,
  "product_key" text references public.products(key),
  "explanation" text not null,
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.identity_resolutions enable row level security;

create table public.url_definitions (
  "id" text primary key,
  "key" text not null unique,
  "url" text not null,
  "protocol" text not null,
  "host" text not null,
  "pathname" text not null,
  "parameters" jsonb not null,
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.url_definitions enable row level security;

create table public.url_usages (
  "id" text primary key,
  "key" text not null unique,
  "url_key" text not null references public.url_definitions(key),
  "client_key" text references public.clients(key),
  "usage" text not null,
  "source_owner" text not null,
  "status" text not null check (status in ('documented','unresolved')),
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.url_usages enable row level security;

create table public.product_question_sets (
  "id" text primary key,
  "key" text not null unique,
  "product_key" text not null references public.products(key),
  "question_set_key" text not null references public.question_sets(key),
  "applicant_type_key" text references public.applicant_types(key),
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text,
  unique nulls not distinct(product_key,question_set_key,applicant_type_key)
);
alter table public.product_question_sets enable row level security;

create table public.plan_amount_rules (
  "id" text primary key,
  "key" text not null unique,
  "variant_key" text not null references public.coverage_plan_variants(key),
  "amount_pattern_key" text not null references public.coverage_amount_patterns(key),
  "condition_key" text references public.conditions(key),
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text
);
alter table public.plan_amount_rules enable row level security;

create table public.pattern_question_sets (
  "id" text primary key,
  "key" text not null unique,
  "pattern_key" text not null references public.patterns(key),
  "related_key" text not null references public.question_sets(key),
  "relationship_type" text not null check (relationship_type in ('implements','uses','constrains','triggers','documents')),
  "display_id" bigint not null unique check (display_id > 0),
  "provided_by" text references public.provenance_tags(key),
  "source_reference" text,
  unique(pattern_key,related_key)
);
alter table public.pattern_question_sets enable row level security;

insert into public.provenance_tags(id,key,name,display_id,provided_by,source_reference) values ('Client/AM','Client/AM','Client/AM',127867804217335,null,'canonical controlled vocabulary') on conflict(key) do nothing;

insert into public.provenance_tags(id,key,name,display_id,provided_by,source_reference) values ('Dev/QA','Dev/QA','Dev/QA',192660861190761,null,'canonical controlled vocabulary') on conflict(key) do nothing;

insert into public.provenance_tags(id,key,name,display_id,provided_by,source_reference) values ('PRASE','PRASE','PRASE',48747093199076,null,'canonical controlled vocabulary') on conflict(key) do nothing;

insert into public.provenance_tags(id,key,name,display_id,provided_by,source_reference) values ('UW','UW','UW',271182582869423,null,'canonical controlled vocabulary') on conflict(key) do nothing;

insert into public.provenance_tags(id,key,name,display_id,provided_by,source_reference) values ('Contracts','Contracts','Contracts',134908612684794,null,'canonical controlled vocabulary') on conflict(key) do nothing;

insert into public.provenance_tags(id,key,name,display_id,provided_by,source_reference) values ('Compliance','Compliance','Compliance',54976530779392,null,'canonical controlled vocabulary') on conflict(key) do nothing;

insert into public.provenance_tags(id,key,name,display_id,provided_by,source_reference) values ('Portal','Portal','Portal',56375636063537,null,'canonical controlled vocabulary') on conflict(key) do nothing;

insert into public.provenance_tags(id,key,name,display_id,provided_by,source_reference) values ('TPA','TPA','TPA',16512777445882,null,'canonical controlled vocabulary') on conflict(key) do nothing;

insert into public.provenance_tags(id,key,name,display_id,provided_by,source_reference) values ('Legal','Legal','Legal',150406870073384,null,'canonical controlled vocabulary') on conflict(key) do nothing;

alter table public.site_environment_links add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.organization_profiles add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.associations add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.pages add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.page_sections add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.fields add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.page_fields add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.coverage_categories add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.products add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.riders add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.product_riders add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.product_identifiers add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.applicant_types add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.conditions add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.rules add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.rule_conditions add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.rule_actions add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.flows add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.flow_steps add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.flow_transitions add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.features add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.configuration_definitions add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.content_entries add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.email_templates add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.document_definitions add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.validation_rules add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.site_associations add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.site_pages add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.site_field_configurations add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.site_product_applicants add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.site_features add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.site_flows add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.rule_assignments add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.configuration_values add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.content_values add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.branding_profiles add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.support_profiles add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.site_email_templates add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.site_documents add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.site_policies add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.organizations add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.clients add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

alter table public.sites add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;

create function public.fill_legacy_assignment_key() returns trigger language plpgsql as $$
begin
  if new.key is null then
    select s.key || '.' || (to_jsonb(new)->>TG_ARGV[0]) into new.key from public.sites s where s.id = new.site_id;
  end if;
  return new;
end $$;

alter table public.site_coverages add column key text unique, add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;
update public.site_coverages a set key = s.key || '.' || a.coverage_key from public.sites s where a.site_id = s.id;
alter table public.site_coverages alter column key set not null;
create trigger site_coverages_semantic_key before insert on public.site_coverages for each row execute function public.fill_legacy_assignment_key('coverage_key');

alter table public.site_products add column key text unique, add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;
update public.site_products a set key = s.key || '.' || a.product_key from public.sites s where a.site_id = s.id;
alter table public.site_products alter column key set not null;
create trigger site_products_semantic_key before insert on public.site_products for each row execute function public.fill_legacy_assignment_key('product_key');

alter table public.site_riders add column key text unique, add column display_id bigint generated by default as identity unique, add column provided_by text references public.provenance_tags(key), add column source_reference text;
update public.site_riders a set key = s.key || '.' || a.rider_key from public.sites s where a.site_id = s.id;
alter table public.site_riders alter column key set not null;
create trigger site_riders_semantic_key before insert on public.site_riders for each row execute function public.fill_legacy_assignment_key('rider_key');
