-- Step 2: a single MVCC snapshot for normalized Library/Site reads.
-- STABLE uses the calling statement's snapshot for every SELECT.
-- SECURITY INVOKER preserves the caller's table privileges and RLS.
create function public.portal_read_snapshot(requested_tables text[])
returns jsonb language plpgsql stable security invoker
set search_path = pg_catalog
set row_security = on
as $$
declare
  allowed_tables constant text[] := array['aggregate_limits', 'amount_bands', 'amount_options', 'associations', 'benefit_caps', 'benefit_period_options', 'branding_profiles', 'clients', 'conditions', 'configuration_definitions', 'configuration_values', 'content_entries', 'content_values', 'coverage_amount_patterns', 'coverage_categories', 'coverage_dependencies', 'coverage_plan_definitions', 'coverage_plan_variants', 'document_definitions', 'eligibility_constraints', 'email_templates', 'features', 'fields', 'flag_assignments', 'flag_definitions', 'flag_rules', 'flag_values', 'flow_steps', 'flow_transitions', 'flows', 'maximum_plan_rules', 'organization_profiles', 'organizations', 'page_fields', 'page_section_fields', 'page_sections', 'pages', 'pattern_assignments', 'pattern_conditions', 'pattern_configuration_definitions', 'pattern_coverage_categories', 'pattern_flag_definitions', 'pattern_flows', 'pattern_products', 'pattern_rules', 'patterns', 'plan_amount_rules', 'plan_benefit_periods', 'product_amount_rules', 'product_applicant_eligibility', 'product_configuration_values', 'product_coverage_plans', 'product_identifiers', 'product_question_sets', 'product_rate_tables', 'product_riders', 'products', 'provenance_tags', 'question_definitions', 'question_set_fields', 'question_set_questions', 'question_sets', 'rate_table_presentations', 'rate_tables', 'residency_jurisdictions', 'residency_rules', 'rider_amount_rules', 'riders', 'rule_actions', 'rule_assignments', 'rule_conditions', 'rule_flags', 'rule_predicates', 'rules', 'semantic_requirements', 'site_associations', 'site_documents', 'site_email_templates', 'site_environment_links', 'site_features', 'site_field_configurations', 'site_flows', 'site_pages', 'site_policies', 'site_product_applicants', 'site_products', 'site_riders', 'site_url_parameters', 'sites', 'structured_rule_actions', 'support_profiles', 'underwriting_bands', 'url_parameter_values', 'url_parameters', 'validation_rules'];
  table_name text;
  table_rows jsonb;
  payload jsonb := '{}'::jsonb;
begin
  if requested_tables is null or cardinality(requested_tables) = 0
    or array_position(requested_tables, null) is not null
    or cardinality(requested_tables) <> (select count(distinct name) from unnest(requested_tables) name)
    or not requested_tables <@ allowed_tables then
    raise exception 'Invalid normalized snapshot table request' using errcode = '22023';
  end if;
  for table_name in select name from unnest(requested_tables) name order by name collate "C" loop
    execute format('select coalesce(jsonb_agg(to_jsonb(t) order by t.id::text collate "C"), ''[]''::jsonb) from public.%I t', table_name) into table_rows;
    payload := payload || jsonb_build_object(table_name, table_rows);
  end loop;
  return jsonb_build_object(
    'formatVersion', 1,
    'consistency', 'single-read',
    'revision', 'postgres:v1:sha256:' || encode(sha256(convert_to(payload::text, 'UTF8')), 'hex'),
    'data', payload
  );
end;
$$;
revoke all on function public.portal_read_snapshot(text[]) from public, anon;
grant execute on function public.portal_read_snapshot(text[]) to authenticated;
-- Hosted Supabase has service_role; the isolated PostgreSQL review database may not.
do $$ begin
  if exists (select from pg_roles where rolname = 'service_role') then
    grant execute on function public.portal_read_snapshot(text[]) to service_role;
  end if;
end $$;
