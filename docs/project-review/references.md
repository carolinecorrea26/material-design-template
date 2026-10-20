# Reference disposition register

This register accounts for every declared FK, every detected scalar reference/vocabulary candidate without an FK, and all 70 JSON columns. Candidate detection is name/path based; arbitrary strings, dynamic JSON object keys and unseeded values can embed additional references. A candidate is not automatically an entity relationship. Counts are coverage, not proof of closure.

## Enforced SQL relationships

| Child table | Columns | Parent | Parent columns | Nullable component | Unique child FK | Delete / update | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| aggregate_limits | applicant_type_key | public.applicant_types | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| aggregate_limits | category_key | public.coverage_categories | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| aggregate_limits | condition_key | public.conditions | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| aggregate_limits | product_key | public.products | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| aggregate_limits | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| aggregate_limits | site_key | public.sites | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| amount_bands | amount_pattern_key | public.coverage_amount_patterns | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| amount_bands | condition_key | public.conditions | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| amount_bands | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| amount_options | amount_pattern_key | public.coverage_amount_patterns | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| amount_options | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| analytics_measurements | client_id | public.clients | id | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| analytics_measurements | metric_key | public.analytics_metrics | metric_key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| analytics_measurements | site_id | public.sites | id | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| applicant_types | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| applicants | client_id | public.clients | id | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_answers | application_applicant_id, application_id | public.application_applicants | id, application_id | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_answers | application_id | public.applications | id | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_answers | field_key | public.fields | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_applicants | applicant_id, client_id | public.applicants | id, client_id | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_applicants | applicant_type_key | public.applicant_types | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_applicants | application_id, site_id | public.applications | id, site_id | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_applicants | site_id, client_id | public.sites | id, client_id | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_associations | site_id, association_entity_id | public.site_association_contexts | site_id, association_id | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_associations | application_id, site_id | public.applications | id, site_id | false | true | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_associations | association_entity_id | public.association_entities | id | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_associations | site_id, site_key | public.sites | id, key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_associations | site_key, association_key | public.site_associations | site_key, association_key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_coverages | application_applicant_id, application_id, applicant_type_key | public.application_applicants | id, application_id, applicant_type_key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_coverages | applicant_type_key | public.applicant_types | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_coverages | application_applicant_id, application_id | public.application_applicants | id, application_id | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_coverages | application_id, association_entity_id | public.application_associations | application_id, association_entity_id | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_coverages | application_id, site_id | public.applications | id, site_id | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_coverages | site_id, product_key | public.site_products | site_id, product_key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_events | actor_id | public.portal_actors | id | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_events | application_id | public.applications | id | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_events | from_owner_actor_id | public.portal_actors | id | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_events | to_owner_actor_id | public.portal_actors | id | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_participants | actor_id | public.portal_actors | id | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_participants | application_id | public.applications | id | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_participants | user_id | public.users | id | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_participants | application_applicant_id, application_id | public.application_applicants | id, application_id | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_riders | application_coverage_id, application_id, product_key | public.application_coverages | id, application_id, product_key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_riders | product_rider_id, product_key, rider_key | public.product_riders | id, product_key, rider_key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_snapshots | application_id, association_entity_id | public.application_associations | application_id, association_entity_id | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_snapshots | application_id, site_id | public.applications | id, site_id | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_snapshots | association_entity_id | public.association_entities | id | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_snapshots | captured_by | public.portal_actors | id | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_snapshots | configuration_release_id | public.portal_library_releases | id | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_snapshots | configuration_release_id, site_key | public.portal_library_releases | id, site_key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| application_snapshots | site_id, site_key | public.sites | id, key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| applications | site_id, product_catalog_key | public.site_products | site_id, product_key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| applications | current_action_owner_id | public.portal_actors | id | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| applications | product_catalog_key | public.products | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| applications | site_id | public.sites | id | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| association_affiliations | hosting_association_id, organization_id | public.association_entities | id, organization_id | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| association_affiliations | member_association_id, organization_id | public.association_entities | id, organization_id | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| association_aliases | association_id | public.association_entities | id | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| association_entities | organization_id | public.organizations | id | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| associations | client_key | public.clients | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| associations | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| audit_events | actor_id | public.portal_actors | id | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| audit_events | change_request_id | public.change_requests | id | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| audit_events | entity_reference_id | public.portal_entity_references | id | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| benefit_caps | aggregate_limit_key | public.aggregate_limits | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| benefit_caps | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| benefit_period_options | applicant_type_key | public.applicant_types | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| benefit_period_options | product_key | public.products | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| benefit_period_options | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| benefit_period_options | site_key | public.sites | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| branding_profiles | client_key | public.clients | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| branding_profiles | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| branding_profiles | site_key | public.sites | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| change_items | change_request_id | public.change_requests | id | false | false | CASCADE / NO ACTION | enforced and validated in captured PostgreSQL review |
| change_items | entity_reference_id | public.portal_entity_references | id | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| change_items | site_id | public.sites | id | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| change_requests | owner_actor_id | public.portal_actors | id | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| change_requests | requested_by_actor_id | public.portal_actors | id | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| change_requests | target_release_id | public.releases | id | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| client_environment_links | client_key | public.clients | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| client_environment_links | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| clients | id, organization_id | public.association_entities | id, organization_id | false | true | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| clients | organization_id | public.organizations | id | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| clients | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| components | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| conditions | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| configuration_definitions | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| configuration_values | client_key | public.clients | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| configuration_values | configuration_key | public.configuration_definitions | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| configuration_values | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| configuration_values | site_key | public.sites | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| content_entries | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| content_values | client_key | public.clients | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| content_values | content_key | public.content_entries | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| content_values | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| content_values | site_key | public.sites | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| coverage_amount_patterns | base_applicant_key | public.applicant_types | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| coverage_amount_patterns | base_product_key | public.products | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| coverage_amount_patterns | pattern_key | public.patterns | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| coverage_amount_patterns | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| coverage_categories | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| coverage_dependencies | applicant_type_key | public.applicant_types | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| coverage_dependencies | category_key | public.coverage_categories | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| coverage_dependencies | product_key | public.products | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| coverage_dependencies | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| coverage_dependencies | requires_applicant_key | public.applicant_types | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| coverage_dependencies | site_key | public.sites | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| coverage_plan_definitions | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| coverage_plan_variants | applicant_type_key | public.applicant_types | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| coverage_plan_variants | plan_key | public.coverage_plan_definitions | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| coverage_plan_variants | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| document_definitions | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| eligibility_constraints | applicant_type_key | public.applicant_types | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| eligibility_constraints | product_key | public.products | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| eligibility_constraints | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| eligibility_constraints | site_key | public.sites | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| email_templates | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| features | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| fields | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| flag_assignments | applicant_key | public.applicant_types | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| flag_assignments | application_id | public.applications | id | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| flag_assignments | client_key | public.clients | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| flag_assignments | coverage_key | public.coverage_categories | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| flag_assignments | flag_key | public.flag_definitions | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| flag_assignments | product_key | public.products | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| flag_assignments | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| flag_assignments | rider_key | public.riders | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| flag_assignments | site_key | public.sites | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| flag_definitions | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| flag_rules | condition_key | public.conditions | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| flag_rules | flag_key | public.flag_definitions | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| flag_rules | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| flag_values | flag_key | public.flag_definitions | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| flag_values | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| flow_steps | flow_key | public.flows | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| flow_steps | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| flow_transitions | flow_key | public.flows | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| flow_transitions | flow_key, source_step_key | public.flow_steps | flow_key, key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| flow_transitions | flow_key, target_step_key | public.flow_steps | flow_key, key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| flow_transitions | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| flow_transitions | source_step_key | public.flow_steps | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| flow_transitions | target_step_key | public.flow_steps | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| flows | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| identity_resolutions | product_key | public.products | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| identity_resolutions | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| identity_resolutions | sheet_key | public.source_sheets | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| maximum_plan_rules | applicant_type_key | public.applicant_types | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| maximum_plan_rules | category_key | public.coverage_categories | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| maximum_plan_rules | product_key | public.products | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| maximum_plan_rules | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| maximum_plan_rules | site_key | public.sites | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| migration_schedules | client_key | public.clients | key | false | true | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| organization_profiles | organization_key | public.organizations | key | false | true | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| organization_profiles | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| organizations | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| page_fields | field_key | public.fields | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| page_fields | page_key | public.pages | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| page_fields | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| page_section_fields | field_key | public.fields | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| page_section_fields | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| page_section_fields | section_key | public.page_sections | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| page_sections | page_key | public.pages | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| page_sections | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| pages | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| pattern_assignments | applicant_key | public.applicant_types | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| pattern_assignments | client_key | public.clients | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| pattern_assignments | pattern_key | public.patterns | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| pattern_assignments | product_key | public.products | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| pattern_assignments | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| pattern_assignments | site_key | public.sites | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| pattern_conditions | pattern_key | public.patterns | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| pattern_conditions | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| pattern_conditions | related_key | public.conditions | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| pattern_configuration_definitions | pattern_key | public.patterns | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| pattern_configuration_definitions | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| pattern_configuration_definitions | related_key | public.configuration_definitions | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| pattern_coverage_categories | pattern_key | public.patterns | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| pattern_coverage_categories | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| pattern_coverage_categories | related_key | public.coverage_categories | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| pattern_flag_definitions | pattern_key | public.patterns | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| pattern_flag_definitions | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| pattern_flag_definitions | related_key | public.flag_definitions | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| pattern_flows | pattern_key | public.patterns | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| pattern_flows | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| pattern_flows | related_key | public.flows | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| pattern_products | pattern_key | public.patterns | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| pattern_products | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| pattern_products | related_key | public.products | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| pattern_question_sets | pattern_key | public.patterns | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| pattern_question_sets | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| pattern_question_sets | related_key | public.question_sets | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| pattern_rules | pattern_key | public.patterns | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| pattern_rules | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| pattern_rules | related_key | public.rules | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| patterns | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| plan_amount_rules | amount_pattern_key | public.coverage_amount_patterns | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| plan_amount_rules | condition_key | public.conditions | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| plan_amount_rules | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| plan_amount_rules | variant_key | public.coverage_plan_variants | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| plan_benefit_periods | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| plan_benefit_periods | variant_key | public.coverage_plan_variants | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| portal_actors | applicant_id | public.applicants | id | true | true | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| portal_actors | auth_user_id | auth.users | id | true | true | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| portal_actors | user_id | public.users | id | true | true | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| portal_admin_accounts | user_id | auth.users | id | false | true | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| portal_entity_references | reference_type_id | public.portal_reference_types | id | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| portal_library_drafts | base_release_id | public.portal_library_releases | id | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| portal_library_drafts | base_release_id, site_key | public.portal_library_releases | id, site_key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| portal_library_drafts | owner_id | auth.users | id | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| portal_library_drafts | site_key | public.sites | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| portal_library_heads | release_id, site_key | public.portal_library_releases | id, site_key | true | true | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| portal_library_heads | release_id | public.portal_library_releases | id | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| portal_library_heads | site_key | public.sites | key | false | true | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| portal_library_publication_audit | draft_id, site_key | public.portal_library_drafts | id, site_key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| portal_library_publication_audit | previous_release_id, site_key | public.portal_library_releases | id, site_key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| portal_library_publication_audit | release_id, site_key | public.portal_library_releases | id, site_key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| portal_library_publication_audit | actor_id | auth.users | id | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| portal_library_publication_audit | draft_id | public.portal_library_drafts | id | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| portal_library_publication_audit | previous_release_id | public.portal_library_releases | id | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| portal_library_publication_audit | release_id | public.portal_library_releases | id | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| portal_library_publication_audit | site_key | public.sites | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| portal_library_readiness | site_key | public.sites | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| portal_library_releases | draft_id | public.portal_library_drafts | id | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| portal_library_releases | published_by | auth.users | id | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| portal_library_releases | site_key | public.sites | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| portal_library_releases | draft_id, site_key | public.portal_library_drafts | id, site_key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_amount_rules | amount_pattern_key | public.coverage_amount_patterns | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_amount_rules | applicant_type_key | public.applicant_types | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_amount_rules | client_key | public.clients | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_amount_rules | condition_key | public.conditions | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_amount_rules | product_key | public.products | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_amount_rules | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_amount_rules | site_key | public.sites | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_applicant_eligibility | applicant_type_key | public.applicant_types | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_applicant_eligibility | condition_key | public.conditions | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_applicant_eligibility | product_key | public.products | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_applicant_eligibility | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_applicant_eligibility | site_key | public.sites | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_clients | client_key | public.clients | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_clients | product_key | public.products | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_clients | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_configuration_values | configuration_key | public.configuration_definitions | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_configuration_values | product_key | public.products | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_configuration_values | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_coverage_plans | applicant_type_key | public.applicant_types | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_coverage_plans | plan_key | public.coverage_plan_definitions | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_coverage_plans | product_key | public.products | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_coverage_plans | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_identifiers | client_key | public.clients | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_identifiers | product_key | public.products | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_identifiers | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_identifiers | site_key | public.sites | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_question_sets | applicant_type_key | public.applicant_types | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_question_sets | product_key | public.products | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_question_sets | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_question_sets | question_set_key | public.question_sets | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_rate_tables | condition_key | public.conditions | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_rate_tables | product_key | public.products | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_rate_tables | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_rate_tables | rate_table_key | public.rate_tables | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_rate_tables | site_key | public.sites | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_riders | client_key | public.clients | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_riders | product_key | public.products | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_riders | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_riders | rider_key | public.riders | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| product_riders | site_key | public.sites | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| products | category_key | public.coverage_categories | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| products | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| provenance_tags | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| question_definitions | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| question_set_fields | condition_key | public.conditions | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| question_set_fields | field_key | public.fields | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| question_set_fields | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| question_set_fields | question_set_key | public.question_sets | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| question_set_questions | condition_key | public.conditions | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| question_set_questions | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| question_set_questions | question_key | public.question_definitions | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| question_set_questions | question_set_key | public.question_sets | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| question_sets | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| rate_table_presentations | flag_key | public.flag_definitions | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| rate_table_presentations | product_key | public.products | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| rate_table_presentations | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| rate_table_presentations | rate_table_key | public.rate_tables | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| rate_table_presentations | site_key | public.sites | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| rate_tables | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| release_changes | change_request_id | public.change_requests | id | false | false | CASCADE / NO ACTION | enforced and validated in captured PostgreSQL review |
| release_changes | release_id | public.releases | id | false | false | CASCADE / NO ACTION | enforced and validated in captured PostgreSQL review |
| requirement_targets | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| requirement_targets | requirement_key | public.source_requirements | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| residency_jurisdictions | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| residency_jurisdictions | residency_rule_key | public.residency_rules | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| residency_rules | condition_key | public.conditions | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| residency_rules | product_key | public.products | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| residency_rules | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| residency_rules | rider_key | public.riders | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| residency_rules | site_key | public.sites | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| rider_amount_rules | amount_pattern_key | public.coverage_amount_patterns | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| rider_amount_rules | applicant_type_key | public.applicant_types | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| rider_amount_rules | base_product_key | public.products | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| rider_amount_rules | condition_key | public.conditions | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| rider_amount_rules | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| rider_amount_rules | rider_key | public.riders | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| riders | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| rule_actions | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| rule_actions | rule_key | public.rules | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| rule_assignments | client_key | public.clients | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| rule_assignments | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| rule_assignments | rule_key | public.rules | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| rule_assignments | site_key | public.sites | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| rule_conditions | condition_key | public.conditions | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| rule_conditions | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| rule_conditions | rule_key | public.rules | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| rule_flags | flag_key | public.flag_definitions | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| rule_flags | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| rule_flags | rule_key | public.rules | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| rule_predicates | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| rule_predicates | rule_key | public.rules | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| rules | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| semantic_requirements | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_association_contexts | association_id | public.association_entities | id | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_association_contexts | site_id | public.sites | id | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_association_contexts | source_link_id | public.site_associations | id | true | true | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_associations | association_key | public.associations | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_associations | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_associations | site_key | public.sites | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_builder_drafts | client_id | public.clients | id | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_builder_drafts | owner_actor_id | public.portal_actors | id | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_configurations | site_id | public.sites | id | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_coverages | coverage_key | public.products | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_coverages | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_coverages | site_id | public.sites | id | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_documents | document_key | public.document_definitions | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_documents | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_documents | site_key | public.sites | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_email_templates | email_template_key | public.email_templates | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_email_templates | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_email_templates | site_key | public.sites | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_environment_links | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_environment_links | site_key | public.sites | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_features | feature_key | public.features | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_features | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_features | site_key | public.sites | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_field_configurations | client_key | public.clients | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_field_configurations | field_key | public.fields | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_field_configurations | page_key | public.pages | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_field_configurations | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_field_configurations | site_key | public.sites | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_flows | client_key | public.clients | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_flows | flow_key | public.flows | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_flows | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_flows | site_key | public.sites | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_pages | page_key | public.pages | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_pages | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_pages | site_key | public.sites | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_policies | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_policies | site_key | public.sites | key | false | true | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_product_applicants | applicant_key | public.applicant_types | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_product_applicants | product_key | public.products | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_product_applicants | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_product_applicants | site_key | public.sites | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_products | product_key | public.products | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_products | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_products | site_id | public.sites | id | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_riders | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_riders | rider_key | public.riders | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_riders | site_id | public.sites | id | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_url_parameters | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_url_parameters | site_key | public.sites | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| site_url_parameters | url_parameter_key | public.url_parameters | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| sites | client_id | public.clients | id | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| sites | hosting_association_id | public.association_entities | id | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| sites | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| source_requirements | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| source_requirements | sheet_key | public.source_sheets | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| source_sheets | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| source_sheets | workbook_key | public.source_workbooks | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| source_workbooks | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| structured_rule_actions | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| structured_rule_actions | rule_key | public.rules | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| support_profiles | client_key | public.clients | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| support_profiles | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| support_profiles | site_key | public.sites | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| underwriting_bands | applicant_type_key | public.applicant_types | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| underwriting_bands | condition_key | public.conditions | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| underwriting_bands | product_key | public.products | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| underwriting_bands | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| underwriting_bands | site_key | public.sites | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| url_definitions | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| url_parameter_values | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| url_parameter_values | url_parameter_key | public.url_parameters | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| url_parameters | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| url_usages | client_key | public.clients | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| url_usages | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| url_usages | url_key | public.url_definitions | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| user_roles | role_id | public.roles | id | false | false | CASCADE / NO ACTION | enforced and validated in captured PostgreSQL review |
| user_roles | user_id | public.users | id | false | false | CASCADE / NO ACTION | enforced and validated in captured PostgreSQL review |
| user_scopes | target_reference_id | public.portal_entity_references | id | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| user_scopes | user_id | public.users | id | false | false | CASCADE / NO ACTION | enforced and validated in captured PostgreSQL review |
| validation_rules | field_key | public.fields | key | false | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |
| validation_rules | provided_by | public.provenance_tags | key | true | false | NO ACTION / NO ACTION | enforced and validated in captured PostgreSQL review |

## Scalar candidates without declared FKs

| Table | Column | Status | Rationale or required decision |
| --- | --- | --- | --- |
| aggregate_limits | formula | expression-review-open | Expression/fact vocabulary; complete typed expression and precedence validation not established |
| aggregate_limits | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| aggregate_limits | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| amount_bands | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| amount_bands | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| amount_options | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| amount_options | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| analytics_measurements | period_type | vocabulary-review | Discriminator/vocabulary; CHECK/enum may constrain spelling; identity pairing is a separate invariant |
| analytics_metrics | metric_key | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| analytics_tags | page_id | interaction-target-review | Tracking target can be a page, virtual app-shell or interaction element; define namespace-specific validation rather than a blanket page/field FK. |
| analytics_tags | element_key | interaction-target-review | Tracking target can be a page, virtual app-shell or interaction element; define namespace-specific validation rather than a blanket page/field FK. |
| applicant_types | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| applicant_types | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| application_answers | occurrence_key | local-occurrence-identity | Local occurrence/selection discriminator within composite uniqueness, not an outgoing entity FK; stable repeat-instance interpretation needs a domain contract. |
| application_coverages | selection_key | local-occurrence-identity | Local occurrence/selection discriminator within composite uniqueness, not an outgoing entity FK; stable repeat-instance interpretation needs a domain contract. |
| application_events | event_type | vocabulary-review | Discriminator/vocabulary; CHECK/enum may constrain spelling; identity pairing is a separate invariant |
| application_events | from_owner_type | vocabulary-review | Discriminator/vocabulary; CHECK/enum may constrain spelling; identity pairing is a separate invariant |
| application_events | to_owner_type | vocabulary-review | Discriminator/vocabulary; CHECK/enum may constrain spelling; identity pairing is a separate invariant |
| application_events | performed_by | compatibility-pair-review-open | Legacy label/polymorphic identity paired with actor/entity/scope validator where implemented; every supplied pair needs consistency review |
| application_participants | participant_type | vocabulary-review | Discriminator/vocabulary; CHECK/enum may constrain spelling; identity pairing is a separate invariant |
| applications | product_key | compatibility-product-label | Original presentation/import label retained; product_catalog_key and application_coverages carry enforced identities. Native insert/update product resolution is trigger-based. |
| applications | current_action_owner_type | vocabulary-review | Discriminator/vocabulary; CHECK/enum may constrain spelling; identity pairing is a separate invariant |
| applications | legacy_action_owner_id | historical-copy | Retained original identity; current_action_owner_id references portal_actors |
| applications | import_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| association_aliases | source_table | historical-source-crosswalk | Source identity preserved in original_record; explicit alias identity, not an inferred merge |
| association_aliases | source_id | historical-source-crosswalk | Source identity preserved in original_record; explicit alias identity, not an inferred merge |
| association_aliases | source_key | historical-source-crosswalk | Source identity preserved in original_record; explicit alias identity, not an inferred merge |
| associations | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| associations | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| audit_events | entity_type | vocabulary-review | Discriminator/vocabulary; CHECK/enum may constrain spelling; identity pairing is a separate invariant |
| audit_events | entity_id | compatibility-pair-review-open | Legacy label/polymorphic identity paired with actor/entity/scope validator where implemented; every supplied pair needs consistency review |
| audit_events | field_key | reference-review-open | No declared FK for this candidate; validator, intentional vocabulary or historical alternative must be justified |
| audit_events | performed_by | compatibility-pair-review-open | Legacy label/polymorphic identity paired with actor/entity/scope validator where implemented; every supplied pair needs consistency review |
| benefit_caps | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| benefit_caps | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| benefit_period_options | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| benefit_period_options | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| branding_profiles | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| branding_profiles | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| change_items | entity_type | vocabulary-review | Discriminator/vocabulary; CHECK/enum may constrain spelling; identity pairing is a separate invariant |
| change_items | entity_id | compatibility-pair-review-open | Legacy label/polymorphic identity paired with actor/entity/scope validator where implemented; every supplied pair needs consistency review |
| change_items | field_key | reference-review-open | No declared FK for this candidate; validator, intentional vocabulary or historical alternative must be justified |
| change_items | change_type | vocabulary-review | Discriminator/vocabulary; CHECK/enum may constrain spelling; identity pairing is a separate invariant |
| change_requests | requested_by | compatibility-pair-review-open | Legacy label/polymorphic identity paired with actor/entity/scope validator where implemented; every supplied pair needs consistency review |
| change_requests | owner_id | compatibility-pair-review-open | Legacy label/polymorphic identity paired with actor/entity/scope validator where implemented; every supplied pair needs consistency review |
| client_environment_links | url | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| client_environment_links | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| client_environment_links | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| clients | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| clients | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| components | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| components | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| conditions | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| conditions | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| configuration_definitions | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| configuration_definitions | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| configuration_values | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| configuration_values | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| content_entries | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| content_entries | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| content_values | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| content_values | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| coverage_amount_patterns | amount_type | vocabulary-review | Discriminator/vocabulary; CHECK/enum may constrain spelling; identity pairing is a separate invariant |
| coverage_amount_patterns | formula | expression-review-open | Expression/fact vocabulary; complete typed expression and precedence validation not established |
| coverage_amount_patterns | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| coverage_amount_patterns | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| coverage_categories | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| coverage_categories | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| coverage_dependencies | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| coverage_dependencies | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| coverage_plan_definitions | coverage_type | vocabulary-review | Discriminator/vocabulary; CHECK/enum may constrain spelling; identity pairing is a separate invariant |
| coverage_plan_definitions | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| coverage_plan_definitions | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| coverage_plan_variants | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| coverage_plan_variants | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| document_definitions | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| document_definitions | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| eligibility_constraints | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| eligibility_constraints | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| email_templates | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| email_templates | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| features | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| features | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| fields | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| fields | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| flag_assignments | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| flag_assignments | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| flag_definitions | value_type | vocabulary-review | Discriminator/vocabulary; CHECK/enum may constrain spelling; identity pairing is a separate invariant |
| flag_definitions | derivation | expression-review-open | Expression/fact vocabulary; complete typed expression and precedence validation not established |
| flag_definitions | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| flag_definitions | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| flag_rules | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| flag_rules | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| flag_values | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| flag_values | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| flow_steps | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| flow_steps | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| flow_transitions | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| flow_transitions | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| flows | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| flows | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| identity_resolutions | candidate_keys | reference-review-open | No declared FK for this candidate; validator, intentional vocabulary or historical alternative must be justified |
| identity_resolutions | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| identity_resolutions | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| maximum_plan_rules | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| maximum_plan_rules | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| organization_profiles | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| organization_profiles | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| organizations | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| organizations | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| page_fields | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| page_fields | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| page_section_fields | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| page_section_fields | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| page_sections | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| page_sections | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| pages | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| pages | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| pattern_assignments | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| pattern_assignments | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| pattern_conditions | relationship_type | vocabulary-review | Discriminator/vocabulary; CHECK/enum may constrain spelling; identity pairing is a separate invariant |
| pattern_conditions | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| pattern_conditions | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| pattern_configuration_definitions | relationship_type | vocabulary-review | Discriminator/vocabulary; CHECK/enum may constrain spelling; identity pairing is a separate invariant |
| pattern_configuration_definitions | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| pattern_configuration_definitions | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| pattern_coverage_categories | relationship_type | vocabulary-review | Discriminator/vocabulary; CHECK/enum may constrain spelling; identity pairing is a separate invariant |
| pattern_coverage_categories | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| pattern_coverage_categories | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| pattern_flag_definitions | relationship_type | vocabulary-review | Discriminator/vocabulary; CHECK/enum may constrain spelling; identity pairing is a separate invariant |
| pattern_flag_definitions | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| pattern_flag_definitions | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| pattern_flows | relationship_type | vocabulary-review | Discriminator/vocabulary; CHECK/enum may constrain spelling; identity pairing is a separate invariant |
| pattern_flows | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| pattern_flows | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| pattern_products | relationship_type | vocabulary-review | Discriminator/vocabulary; CHECK/enum may constrain spelling; identity pairing is a separate invariant |
| pattern_products | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| pattern_products | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| pattern_question_sets | relationship_type | vocabulary-review | Discriminator/vocabulary; CHECK/enum may constrain spelling; identity pairing is a separate invariant |
| pattern_question_sets | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| pattern_question_sets | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| pattern_rules | relationship_type | vocabulary-review | Discriminator/vocabulary; CHECK/enum may constrain spelling; identity pairing is a separate invariant |
| pattern_rules | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| pattern_rules | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| patterns | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| patterns | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| plan_amount_rules | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| plan_amount_rules | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| plan_benefit_periods | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| plan_benefit_periods | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| portal_library_readiness | evidence_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| product_amount_rules | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| product_amount_rules | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| product_applicant_eligibility | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| product_applicant_eligibility | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| product_clients | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| product_clients | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| product_configuration_values | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| product_configuration_values | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| product_coverage_plans | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| product_coverage_plans | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| product_identifiers | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| product_identifiers | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| product_question_sets | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| product_question_sets | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| product_rate_tables | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| product_rate_tables | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| product_riders | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| product_riders | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| products | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| products | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| provenance_tags | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| provenance_tags | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| question_definitions | response_type | vocabulary-review | Discriminator/vocabulary; CHECK/enum may constrain spelling; identity pairing is a separate invariant |
| question_definitions | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| question_definitions | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| question_set_fields | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| question_set_fields | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| question_set_questions | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| question_set_questions | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| question_sets | question_type | vocabulary-review | Discriminator/vocabulary; CHECK/enum may constrain spelling; identity pairing is a separate invariant |
| question_sets | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| question_sets | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| rate_table_presentations | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| rate_table_presentations | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| rate_tables | url | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| rate_tables | image_ref | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| rate_tables | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| rate_tables | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| releases | release_key | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| requirement_targets | target_table | polymorphic-review-open | Source/semantic target lacks enforced typed target relationship; justify evidence-only use or validate target |
| requirement_targets | target_key | polymorphic-review-open | Source/semantic target lacks enforced typed target relationship; justify evidence-only use or validate target |
| requirement_targets | target_column | polymorphic-review-open | Source/semantic target lacks enforced typed target relationship; justify evidence-only use or validate target |
| requirement_targets | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| requirement_targets | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| residency_jurisdictions | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| residency_jurisdictions | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| residency_rules | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| residency_rules | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| rider_amount_rules | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| rider_amount_rules | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| riders | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| riders | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| rule_actions | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| rule_actions | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| rule_assignments | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| rule_assignments | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| rule_conditions | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| rule_conditions | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| rule_flags | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| rule_flags | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| rule_predicates | fact | expression-review-open | Expression/fact vocabulary; complete typed expression and precedence validation not established |
| rule_predicates | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| rule_predicates | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| rules | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| rules | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| schema_reconciliation_issues | record_id | historical-reconciliation-identity | Original unresolved record identity retained with table_name/original_value; a compulsory current-row FK would erase the purpose of this ledger. |
| semantic_requirements | subject_table | polymorphic-review-open | Source/semantic target lacks enforced typed target relationship; justify evidence-only use or validate target |
| semantic_requirements | subject_key | polymorphic-review-open | Source/semantic target lacks enforced typed target relationship; justify evidence-only use or validate target |
| semantic_requirements | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| semantic_requirements | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| site_associations | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| site_associations | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| site_builder_drafts | site_key | proposed-identity | Pre-creation Site identity; reservation and uniqueness need explicit lifecycle contract |
| site_builder_drafts | current_step | vocabulary-review | Discriminator/vocabulary; CHECK/enum may constrain spelling; identity pairing is a separate invariant |
| site_builder_drafts | owner_id | compatibility-pair-review-open | Legacy label/polymorphic identity paired with actor/entity/scope validator where implemented; every supplied pair needs consistency review |
| site_configurations | configuration_key | reference-review-open | No declared FK for this candidate; validator, intentional vocabulary or historical alternative must be justified |
| site_coverages | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| site_coverages | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| site_documents | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| site_documents | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| site_email_templates | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| site_email_templates | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| site_environment_links | link_type | vocabulary-review | Discriminator/vocabulary; CHECK/enum may constrain spelling; identity pairing is a separate invariant |
| site_environment_links | url | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| site_environment_links | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| site_environment_links | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| site_features | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| site_features | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| site_field_configurations | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| site_field_configurations | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| site_flows | flow_id | compatibility-flow-alias-review | Runtime flow alias differs from enforced flow_key; reconcile alias consistency and retain compatibility deliberately. |
| site_flows | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| site_flows | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| site_pages | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| site_pages | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| site_policies | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| site_policies | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| site_product_applicants | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| site_product_applicants | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| site_products | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| site_products | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| site_riders | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| site_riders | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| site_url_parameters | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| site_url_parameters | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| sites | template_type | vocabulary-review | Discriminator/vocabulary; CHECK/enum may constrain spelling; identity pairing is a separate invariant |
| sites | legacy_client_id | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| sites | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| sites | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| source_requirements | formula | expression-review-open | Expression/fact vocabulary; complete typed expression and precedence validation not established |
| source_requirements | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| source_requirements | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| source_requirements | active_site_keys | reference-review-open | No declared FK for this candidate; validator, intentional vocabulary or historical alternative must be justified |
| source_sheets | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| source_sheets | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| source_workbooks | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| source_workbooks | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| structured_rule_actions | action_type | vocabulary-review | Discriminator/vocabulary; CHECK/enum may constrain spelling; identity pairing is a separate invariant |
| structured_rule_actions | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| structured_rule_actions | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| support_profiles | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| support_profiles | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| underwriting_bands | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| underwriting_bands | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| url_definitions | url | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| url_definitions | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| url_definitions | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| url_parameter_values | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| url_parameter_values | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| url_parameters | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| url_parameters | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| url_usages | source_owner | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| url_usages | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| url_usages | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |
| user_scopes | scope_type | vocabulary-review | Discriminator/vocabulary; CHECK/enum may constrain spelling; identity pairing is a separate invariant |
| user_scopes | scope_id | compatibility-pair-review-open | Legacy label/polymorphic identity paired with actor/entity/scope validator where implemented; every supplied pair needs consistency review |
| validation_rules | display_id | own-identity | Primary/natural identity of this row; outgoing FK unnecessary |
| validation_rules | source_reference | locator-or-evidence | Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK |

## JSON surfaces

SQL recursive key validation is in [supabase/migrations/202610120008_reference_validation.sql](../../supabase/migrations/202610120008_reference_validation.sql). It recognizes exact key names in eight selected tables; it is not a universal schema/type/ownership validator. Archived evidence and expression names need separate treatment. Paths below include vocabulary as well as reference candidates; occurrence counts combine reviewed and operational exports. No values from saved applicant stores were inspected.

### analytics_tags.events

Contract: `AnalyticsEvent[]`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### analytics_tags.sites

Contract: `string[]`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### analytics_tags.permitted_properties

Contract: `readonly string[]`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### analytics_tags.adobe

Contract: `{ mapping: string | null; status: "not-configured"; }`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### analytics_tags.contentsquare

Contract: `{ mapping: string | null; status: "not-configured"; }`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### applicant_types.definition

Contract: `{ label: string; applicantType: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/coverage").CoverageApplicantId; }`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

| Observed candidate path | Occurrences |
| --- | --- |
| applicantType | 3 |

### application_answers.value_json

Contract: `Json`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### application_coverages.selections

Contract: `Json`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### application_riders.selections

Contract: `Json`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### application_snapshots.configuration_snapshot

Contract: `Json`. Boundary: Historical/reference capture or source evidence; preserve original values. Snapshot/reference functions validate selected identities; do not rewrite archived keys. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### application_snapshots.answers_snapshot

Contract: `Json`. Boundary: Historical/reference capture or source evidence; preserve original values. Snapshot/reference functions validate selected identities; do not rewrite archived keys. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### application_snapshots.coverages_snapshot

Contract: `Json`. Boundary: Historical/reference capture or source evidence; preserve original values. Snapshot/reference functions validate selected identities; do not rewrite archived keys. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### application_snapshots.participants_snapshot

Contract: `Json`. Boundary: Historical/reference capture or source evidence; preserve original values. Snapshot/reference functions validate selected identities; do not rewrite archived keys. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### application_snapshots.association_snapshot

Contract: `Json`. Boundary: Historical/reference capture or source evidence; preserve original values. Snapshot/reference functions validate selected identities; do not rewrite archived keys. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### association_aliases.original_record

Contract: `Json`. Boundary: Historical/reference capture or source evidence; preserve original values. Snapshot/reference functions validate selected identities; do not rewrite archived keys. Status: documented boundary; reference disposition review remains open.

| Observed candidate path | Occurrences |
| --- | --- |
| clientKey | 156 |
| displayId | 222 |
| id | 260 |
| key | 260 |
| organizationId | 104 |
| providedBy | 222 |
| sourceReference | 222 |

### associations.definition

Contract: `{ name: string; acronym?: string; logo?: string; logoAlt?: string; }`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### audit_events.old_value_json

Contract: `Json`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### audit_events.new_value_json

Contract: `Json`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### branding_profiles.definition

Contract: `Partial<import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/configuration").ClientBranding>`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### change_items.current_value_json

Contract: `Json`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### change_items.proposed_value_json

Contract: `Json`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### components.definition

Contract: `{ name: string; description: string; section: string; storyId: string; storybookPath: string; source: string; }`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

| Observed candidate path | Occurrences |
| --- | --- |
| source | 67 |
| storybookPath | 67 |
| storyId | 67 |

### conditions.definition

Contract: `import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/rules").ConditionDefinition`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

| Observed candidate path | Occurrences |
| --- | --- |
| conditions[].fieldId | 25 |
| id | 18 |

### configuration_definitions.definition

Contract: `{ path: string[] | null; metadata: import("src/persistence/types/index").Json; target?: import("src/persistence/types/index").ConfigurationTarget | null; }`. Boundary: SQL key-name validator on selected catalog JSON; exact recognized keys only. Shape, type, applicability and expressions still require per-surface review. Status: documented boundary; reference disposition review remains open.

| Observed candidate path | Occurrences |
| --- | --- |
| metadata.id | 34 |
| metadata.key | 3 |
| metadata.requiresInterpretation | 19 |
| metadata.scope | 34 |
| metadata.source | 1 |
| metadata.sourcePath | 34 |
| path | 544 |
| path[] | 867 |
| target | 140 |
| target.applicantKey | 1 |
| target.productKey | 551 |

### configuration_values.value

Contract: `Json`. Boundary: SQL key-name validator on selected catalog JSON; exact recognized keys only. Shape, type, applicability and expressions still require per-surface review. Status: documented boundary; reference disposition review remains open.

| Observed candidate path | Occurrences |
| --- | --- |
| [].applicants[] | 2 |
| [].applicantType | 13 |
| [].categoryId | 6 |
| [].conditionId | 1 |
| [].coverageAmounts[].scope.applicantType | 2 |
| [].fact | 1 |
| [].facts.asce-member-id | 1 |
| [].fieldId | 1 |
| [].fields[] | 4 |
| [].gate.categoryId | 2 |
| [].gate.categoryIds[] | 2 |
| [].gate.riderId | 1 |
| [].id | 23 |
| [].key | 2 |
| [].pageId | 6 |
| [].premiumFactor | 18 |
| [].requiredBenefitPeriod | 1 |
| [].requiredWaitingPeriod | 1 |
| [].requiresApplicant | 3 |
| [].riderOnlyApplicants[] | 2 |
| [].sameProduct | 3 |
| [].scope.applicantType | 92 |
| [].source | 2 |
| [].sourceReferences[] | 6 |
| [].when.applicant | 2 |
| aggregate.productKeys[] | 10 |
| applicants[] | 153 |
| applicants[].applicantClass | 4 |
| applicants[].applicantKey | 24 |
| applicants[].periodPairs[].waitingKey | 2 |
| applicants[].requireMemberCoverage | 5 |
| applicants[].waitingPeriods[].accidentDays | 62 |
| applicants[].waitingPeriods[].key | 62 |
| associationChoices[].key | 250 |
| beneficiaryControls.fields[].fieldKey | 2 |
| beneficiaryControls.fields[].valueKey | 2 |
| beneficiaryControls.pageKey | 1 |
| beneficiaryIndividual.fields[].fieldKey | 4 |
| beneficiaryIndividual.fields[].grid | 2 |
| beneficiaryIndividual.fields[].valueKey | 4 |
| beneficiaryIndividual.pageKey | 1 |
| beneficiaryTrust.fields[].fieldKey | 2 |
| beneficiaryTrust.fields[].valueKey | 2 |
| beneficiaryTrust.pageKey | 1 |
| blocks[].fields[] | 4 |
| blocks[].key | 2 |
| blocks[].sourceReferences[] | 6 |
| blocks[].when.applicant | 2 |
| children.fields[].fieldKey | 6 |
| children.fields[].grid | 4 |
| children.fields[].valueKey | 6 |
| children.pageKey | 1 |
| children.sectionId | 1 |
| columns[] | 9 |
| defaultUnderwritingPathway | 69 |
| dependentElections[].applicantKey | 2 |
| dependentElections[].key | 2 |
| dependentElections[].signatureRequired | 2 |
| dimensions.applicant | 69 |
| exclusiveProducts[] | 2 |
| existingPolicyRequired | 69 |
| factMappings.applicantClass.field | 1 |
| fraud.nyAccidentLifeProducts[] | 4 |
| fraud.overrideText | 1 |
| fraud.sourceReferences[] | 11 |
| groups[].applicantKeys[] | 15 |
| groups[].key | 5 |
| groups[].productKeys[] | 19 |
| healthDiq1Details.fields[].fieldKey | 4 |
| healthDiq1Details.fields[].valueKey | 4 |
| healthDiq1Details.pageKey | 1 |
| healthDiq2Details.fields[].fieldKey | 4 |
| healthDiq2Details.fields[].valueKey | 4 |
| healthDiq2Details.pageKey | 1 |
| healthDiq3Details.fields[].fieldKey | 3 |
| healthDiq3Details.fields[].valueKey | 3 |
| healthDiq3Details.pageKey | 1 |
| healthDiq4Details.fields[].fieldKey | 3 |
| healthDiq4Details.fields[].valueKey | 3 |
| healthDiq4Details.pageKey | 1 |
| healthDiq5Details.fields[].fieldKey | 3 |
| healthDiq5Details.fields[].valueKey | 3 |
| healthDiq5Details.pageKey | 1 |
| healthDiq6Details.fields[].fieldKey | 3 |
| healthDiq6Details.fields[].valueKey | 3 |
| healthDiq6Details.pageKey | 1 |
| healthDiq7Details.fields[].fieldKey | 1 |
| healthDiq7Details.fields[].valueKey | 1 |
| healthDiq7Details.pageKey | 1 |
| healthForRiderOnly | 69 |
| healthLiDetails.fields[].fieldKey | 3 |
| healthLiDetails.fields[].valueKey | 3 |
| healthLiDetails.pageKey | 1 |
| healthSiDetails.fields[].fieldKey | 3 |
| healthSiDetails.fields[].valueKey | 3 |
| healthSiDetails.pageKey | 1 |
| mappings[].riderCodes.csea.spouse-accident | 6 |
| mappings[].when.applicantClass | 22 |
| mappings[].when.applicantKey | 1838 |
| mappings[].when.associationKey | 1500 |
| membershipRequired | 69 |
| needsCalculator.fields[].fieldKey | 4 |
| needsCalculator.fields[].valueKey | 4 |
| needsCalculator.pageKey | 1 |
| overrides[].sourceReferences[] | 6 |
| payment.synchronizeAcrossProducts | 69 |
| paymentBank.fields[].fieldKey | 5 |
| paymentBank.fields[].valueKey | 5 |
| paymentBank.pageKey | 1 |
| paymentControls.fields[].fieldKey | 5 |
| paymentControls.fields[].valueKey | 5 |
| paymentControls.pageKey | 1 |
| questions[].applicantKey | 315 |
| questions[].attestationKey | 315 |
| questions[].financialFields[] | 114 |
| questions[].healthPage | 315 |
| questions[].tobaccoFields[] | 486 |
| quoteInputs.fields[].fieldKey | 14 |
| quoteInputs.fields[].valueKey | 14 |
| quoteInputs.pageKey | 1 |
| rateClass.sourceReferences[] | 183 |
| rateClass.sourceText | 69 |
| riderOnlyApplicants[] | 6 |
| riders[].applicants[] | 35 |
| riders[].included | 20 |
| riders[].key | 20 |
| rules[].applicantKey | 35 |
| rules[].derived.baseApplicantKey | 8 |
| rules[].derived.siblingApplicantKey | 6 |
| rules[].key | 19 |
| rules[].maximumPlans.productKeys[] | 30 |
| rules[].requires.applicantKeys[] | 32 |
| rules[].sourceReferences[] | 19 |
| selfDisabilityCompanies.fields[].fieldKey | 4 |
| selfDisabilityCompanies.fields[].valueKey | 4 |
| selfDisabilityCompanies.pageKey | 1 |
| selfDisabilityCompanies.sectionId | 1 |
| sourceReferences[] | 181 |
| spouseDisabilityCompanies.fields[].fieldKey | 4 |
| spouseDisabilityCompanies.fields[].valueKey | 4 |
| spouseDisabilityCompanies.pageKey | 1 |
| spouseDisabilityCompanies.sectionId | 1 |
| verificationControls.fields[].fieldKey | 1 |
| verificationControls.fields[].valueKey | 1 |
| verificationControls.pageKey | 1 |
| verificationQuestions.fields[].fieldKey | 3 |
| verificationQuestions.fields[].valueKey | 3 |
| verificationQuestions.pageKey | 1 |

### content_entries.definition

Contract: `{ path: string[] | null; }`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

| Observed candidate path | Occurrences |
| --- | --- |
| path | 86 |
| path[] | 786 |

### content_values.value

Contract: `Json`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

| Observed candidate path | Occurrences |
| --- | --- |
| [].source | 8 |

### coverage_categories.definition

Contract: `{ label: string; shortLabel?: string; iconKey: string; }`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

| Observed candidate path | Occurrences |
| --- | --- |
| iconKey | 25 |

### document_definitions.definition

Contract: `{ contentKey: string | null; productKey: string | null; source: string; }`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

| Observed candidate path | Occurrences |
| --- | --- |
| contentKey | 8 |
| productKey | 8 |
| source | 8 |

### email_templates.definition

Contract: `{ rendererKey: string; source: string; }`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

| Observed candidate path | Occurrences |
| --- | --- |
| rendererKey | 10 |
| source | 10 |

### features.definition

Contract: `import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/features").FeatureDefinition`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### fields.definition

Contract: `import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/fields").FieldDefinition`. Boundary: SQL key-name validator on selected catalog JSON; exact recognized keys only. Shape, type, applicability and expressions still require per-surface review. Status: documented boundary; reference disposition review remains open.

| Observed candidate path | Occurrences |
| --- | --- |
| id | 321 |
| phoneTypeFieldId | 1 |
| required | 283 |

### flag_assignments.value

Contract: `Json`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### flag_definitions.allowed_values

Contract: `Json`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### flag_rules.value

Contract: `Json`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### flow_steps.definition

Contract: `import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/flows").FlowNodeDef`. Boundary: SQL key-name validator on selected catalog JSON; exact recognized keys only. Shape, type, applicability and expressions still require per-surface review. Status: documented boundary; reference disposition review remains open.

| Observed candidate path | Occurrences |
| --- | --- |
| id | 74 |
| pageId | 34 |

### flow_transitions.definition

Contract: `import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/flows").FlowEdgeDef`. Boundary: SQL key-name validator on selected catalog JSON; exact recognized keys only. Shape, type, applicability and expressions still require per-surface review. Status: documented boundary; reference disposition review remains open.

| Observed candidate path | Occurrences |
| --- | --- |
| condition | 33 |
| id | 77 |
| source | 77 |
| target | 77 |

### flows.definition

Contract: `Pick<import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/flows").FlowDefinition, "id" | "title" | "intro">`. Boundary: SQL key-name validator on selected catalog JSON; exact recognized keys only. Shape, type, applicability and expressions still require per-surface review. Status: documented boundary; reference disposition review remains open.

| Observed candidate path | Occurrences |
| --- | --- |
| id | 8 |

### identity_resolutions.candidate_keys

Contract: `Json`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### migration_schedules.milestones

Contract: `Record<"requirements" | "prototype" | "uat" | "preprod" | "production", MigrationMilestone>`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### organization_profiles.definition

Contract: `Omit<import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/organizations").Tpa, "id">`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

| Observed candidate path | Occurrences |
| --- | --- |
| administrationContacts[].clientKey | 98 |
| administrationContacts[].source | 98 |

### page_sections.definition

Contract: `import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/config/pageSections/types").PageSectionConfig`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

| Observed candidate path | Occurrences |
| --- | --- |
| applicant | 25 |
| fieldIds[] | 133 |
| id | 30 |
| pageId | 30 |
| visibilityConditionId | 18 |

### pages.definition

Contract: `import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/pages").Page & { healthGate: boolean; }`. Boundary: SQL key-name validator on selected catalog JSON; exact recognized keys only. Shape, type, applicability and expressions still require per-surface review. Status: documented boundary; reference disposition review remains open.

| Observed candidate path | Occurrences |
| --- | --- |
| flow | 30 |
| groupId | 14 |
| id | 30 |
| path | 30 |

### pattern_assignments.configuration

Contract: `Json`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

| Observed candidate path | Occurrences |
| --- | --- |
| lookupFields[] | 10 |
| requiresActiveCoverage | 2 |
| requiresExistingMember | 2 |

### portal_actors.original_identity

Contract: `Json`. Boundary: Historical/reference capture or source evidence; preserve original values. Snapshot/reference functions validate selected identities; do not rewrite archived keys. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### portal_entity_references.identity

Contract: `Json`. Boundary: Historical/reference capture or source evidence; preserve original values. Snapshot/reference functions validate selected identities; do not rewrite archived keys. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### portal_entity_references.record_snapshot

Contract: `Json`. Boundary: Historical/reference capture or source evidence; preserve original values. Snapshot/reference functions validate selected identities; do not rewrite archived keys. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### portal_library_drafts.payload

Contract: `Dedicated SQL/RPC`. Boundary: SQL publication envelope/allowlist boundary plus service readiness; full nested relationship and historical revision validation requires review. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### portal_library_releases.payload

Contract: `Dedicated SQL/RPC`. Boundary: SQL publication envelope/allowlist boundary plus service readiness; full nested relationship and historical revision validation requires review. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### product_configuration_values.value

Contract: `Json`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### product_identifiers.definition

Contract: `import("src/persistence/types/index").Json`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### products.definition

Contract: `Omit<import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/coverage").CoverageDefinition, "riders" | "gNumber" | "planCode" | "categoryId" | "code"> & { categoryId: string; code: string | null; }`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

| Observed candidate path | Occurrences |
| --- | --- |
| applicants[] | 42 |
| categoryId | 389 |
| coverageAmounts[].scope.applicantType | 34 |
| id | 389 |
| options[].id | 36 |
| requirements.eligibility[].applicantType | 8 |

### riders.definition

Contract: `Omit<import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/coverage").RiderDefinition, "premiumFactor"> & { premiumFactor: number | null; }`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

| Observed candidate path | Occurrences |
| --- | --- |
| applicants[] | 8 |
| coverageAmounts[].scope.applicantType | 3 |
| dependentApplicant | 2 |
| id | 93 |
| premiumFactor | 93 |
| riderOnlyApplicants[] | 2 |

### rule_actions.definition

Contract: `{ kind: "documented-behavior"; description: string; source: string; }`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

| Observed candidate path | Occurrences |
| --- | --- |
| source | 96 |

### rule_flags.value

Contract: `Json`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### rule_predicates.value

Contract: `Json`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### rules.definition

Contract: `Omit<import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/rules").RuleDefinition, "scope" | "siteIds" | "clientIds" | "conditionIds">`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

| Observed candidate path | Occurrences |
| --- | --- |
| dependsOn[] | 5 |
| id | 107 |
| ref | 107 |
| rule | 107 |

### schema_reconciliation_issues.original_value

Contract: `Json`. Boundary: Historical/reference capture or source evidence; preserve original values. Snapshot/reference functions validate selected identities; do not rewrite archived keys. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### semantic_requirements.value

Contract: `Json`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

| Observed candidate path | Occurrences |
| --- | --- |
| applicants[] | 15 |
| approvalReference | 6 |
| clauses[].applicants[] | 6 |
| destinations[].column | 441 |
| destinations[].key | 441 |
| destinations[].table | 441 |
| enabledProducts[] | 1 |
| existingLifeAmountRequired | 1 |
| fact | 1 |
| fields[] | 14 |
| flagKey | 15 |
| followUp.explanation.include | 1 |
| followUp.when | 1 |
| followUpWhen | 6 |
| otherActiveBusinessClientsPraseConfigured | 1 |
| payment.synchronizeAcrossProducts | 2 |
| predicate.left.fact | 12 |
| productKey | 89 |
| products[] | 4 |
| readinessKey | 6 |
| reference | 26 |
| referenceTableAsset | 1 |
| required | 7 |
| ruleKey | 2 |
| selected.aggregate.productKeys[] | 9 |
| selected.applicants[] | 131 |
| selected.applicants[].applicantClass | 2 |
| selected.applicants[].applicantKey | 14 |
| selected.applicants[].requireMemberCoverage | 4 |
| selected.applicants[].waitingPeriods[].accidentDays | 40 |
| selected.applicants[].waitingPeriods[].key | 40 |
| selected.associationChoices[].key | 250 |
| selected.columns[] | 7 |
| selected.defaultUnderwritingPathway | 58 |
| selected.dependentElections[].applicantKey | 2 |
| selected.dependentElections[].key | 2 |
| selected.dependentElections[].signatureRequired | 2 |
| selected.dimensions.applicant | 58 |
| selected.exclusiveProducts[] | 2 |
| selected.existingPolicyRequired | 58 |
| selected.fullTimeStudentRequired | 1 |
| selected.healthForRiderOnly | 58 |
| selected.identifiers | 1 |
| selected.mappings[].riderCodes.csea.spouse-accident | 6 |
| selected.mappings[].when.applicantClass | 22 |
| selected.mappings[].when.applicantKey | 1790 |
| selected.mappings[].when.associationKey | 1500 |
| selected.membershipRequired | 58 |
| selected.overrides[].sourceReferences[] | 6 |
| selected.payment.synchronizeAcrossProducts | 58 |
| selected.productKey | 1 |
| selected.productScope | 1 |
| selected.questions[].applicantKey | 267 |
| selected.questions[].attestationKey | 267 |
| selected.questions[].financialFields[] | 96 |
| selected.questions[].healthPage | 267 |
| selected.questions[].tobaccoFields[] | 414 |
| selected.rateClass.sourceReferences[] | 172 |
| selected.rateClass.sourceText | 58 |
| selected.riderOnlyApplicants[] | 6 |
| selected.riders[].applicants[] | 35 |
| selected.riders[].included | 20 |
| selected.riders[].key | 20 |
| selected.rules[].applicantKey | 4 |
| selected.rules[].derived.baseApplicantKey | 4 |
| selected.rules[].derived.siblingApplicantKey | 4 |
| selected.rules[].requires.applicantKeys[] | 4 |
| selected.siteVariant | 1 |
| selected.sourceReferences[] | 170 |
| selected.sourceRow | 1 |
| sourceOwner | 15 |
| sourceReconciliation | 290 |
| sourceReferences[] | 2484 |
| sourceRow | 43 |
| targets[].key | 8 |
| targets[].table | 8 |
| targets[].values.applicantClass | 4 |
| targets[].values.applicantTypeKey | 8 |
| targets[].values.conditionKey | 4 |
| targets[].values.mortalityMorbidity | 4 |
| targets[].values.pathway | 4 |
| targets[].values.productKey | 8 |
| targets[].values.siteKey | 8 |
| visibleWhen | 5 |
| visibleWhen.fact | 4 |
| whenAnyOperandBlank | 1 |
| whenFalse.fact | 12 |
| whenFalse.hide[] | 3 |
| whenTrue | 12 |

### site_builder_drafts.draft_data_json

Contract: `Json`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

| Observed candidate path | Occurrences |
| --- | --- |
| clientLabel | 4 |

### site_configurations.value_json

Contract: `Json`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

| Observed candidate path | Occurrences |
| --- | --- |
| applicantExperience.factMappings.activeMilitary.field | 2 |
| applicantExperience.membershipDisqualifications[].fieldId | 2 |
| coverages.hideSmokerQuestion | 2 |
| coverages.overrides.li-group-term.riders[].id | 4 |
| coverages.overrides.li-group-term.riders[].premiumFactor | 4 |
| coverages.overrides.li-group-term.riders[].riderOnlyApplicants[] | 4 |
| features.homePageVariant | 2 |

### site_field_configurations.values

Contract: `Partial<Omit<import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/fields").FieldDefinition, "id">>`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

| Observed candidate path | Occurrences |
| --- | --- |
| optionExclusions[].conditionId | 1 |
| visibilityConditionId | 15 |

### site_policies.definition

Contract: `{ associationSelection?: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/associations").AssociationSelection; associationBranding?: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/associations").AssociationBranding; payment?: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/paymentPolicy").PaymentPolicy; }`. Boundary: SQL key-name validator on selected catalog JSON; exact recognized keys only. Shape, type, applicability and expressions still require per-surface review. Status: documented boundary; reference disposition review remains open.

| Observed candidate path | Occurrences |
| --- | --- |
| associationBranding.useAssociationLogo | 2 |
| associationSelection.fixedAssociationId | 10 |
| payment.synchronizeAcrossProducts | 2 |

### source_requirements.value

Contract: `Json`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### source_requirements.active_site_keys

Contract: `Json`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### source_sheets.merged_ranges

Contract: `Json`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### structured_rule_actions.value

Contract: `Json`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.

### support_profiles.definition

Contract: `Partial<import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/configuration").ClientSupport>`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

| Observed candidate path | Occurrences |
| --- | --- |
| website | 9 |

### url_definitions.parameters

Contract: `Json`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

| Observed candidate path | Occurrences |
| --- | --- |
| association | 429 |

### validation_rules.definition

Contract: `{ required?: boolean; format?: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/fields").FieldDefinition["format"]; inputType: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/fields").FieldDefinition["inputType"]; }`. Boundary: TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface. Status: documented boundary; reference disposition review remains open.

| Observed candidate path | Occurrences |
| --- | --- |
| required | 159 |

## Contract drift

Column presence and SQL-nullability comparisons only; not full semantic type, enum, default, trigger-output or adapter equivalence. JSON null is distinct from SQL NULL.

| Table | Column/field | Finding |
| --- | --- | --- |

## Seed compatibility findings

These are standalone exports; reviewed SQL export explicitly translates selected semantic identities and excludes operational application rows. A partial operational export lacking catalogs is not automatically a corrupt running database. Each discrepancy needs that distinction before reconciliation.

| Export | Table | Column(s) | Rows | Finding |
| --- | --- | --- | --- | --- |
| reviewed | analytics_measurements | id | 40 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | analytics_measurements | id | 40 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | analytics_metrics | id | 4 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | analytics_metrics | id | 4 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | applications | id | 4 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | applications | id | 4 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | applications | site_id | 4 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | applications | site_id | 4 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | association_affiliations | id | 25 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | association_affiliations | id | 25 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | association_affiliations | hosting_association_id | 25 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | association_affiliations | hosting_association_id | 25 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | association_affiliations | member_association_id | 25 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | association_affiliations | member_association_id | 25 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | association_affiliations | organization_id | 25 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | association_affiliations | organization_id | 25 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | association_aliases | id | 222 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | association_aliases | id | 38 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | association_aliases | association_id | 124 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | association_aliases | association_id | 38 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | association_entities | id | 120 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | association_entities | id | 34 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | association_entities | organization_id | 120 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | association_entities | organization_id | 34 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | change_items | id | 5 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | change_items | id | 5 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | change_items | change_request_id | 5 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | change_items | change_request_id | 5 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | change_items | site_id | 5 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | change_items | site_id | 5 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | change_requests | id | 5 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | change_requests | id | 5 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | change_requests | target_release_id | 5 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | change_requests | target_release_id | 5 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | clients | id | 95 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | clients | id | 9 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | clients | organization_id | 95 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | clients | organization_id | 9 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | organizations | id | 33 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | organizations | id | 9 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | release_changes | id | 5 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | release_changes | id | 5 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | release_changes | release_id | 5 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | release_changes | release_id | 5 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | release_changes | change_request_id | 5 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | release_changes | change_request_id | 5 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | releases | id | 2 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | releases | id | 2 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | roles | id | 1 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | roles | id | 1 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | site_association_contexts | id | 34 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | site_association_contexts | id | 34 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | site_association_contexts | site_id | 34 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | site_association_contexts | site_id | 34 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | site_association_contexts | association_id | 34 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | site_association_contexts | association_id | 34 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | site_builder_drafts | id | 2 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | site_builder_drafts | id | 2 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | site_configurations | id | 2 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | site_configurations | id | 2 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | site_configurations | site_id | 2 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | site_configurations | site_id | 2 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | site_coverages | id | 200 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | site_coverages | id | 69 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | site_coverages | site_id | 200 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | site_coverages | site_id | 69 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | site_products | id | 200 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | site_products | id | 69 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | site_products | site_id | 200 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | site_products | site_id | 69 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | site_riders | id | 18 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | site_riders | id | 2 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | site_riders | site_id | 18 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | site_riders | site_id | 2 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | sites | id | 10 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | sites | id | 10 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | sites | client_id | 10 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | sites | client_id | 10 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | sites | hosting_association_id | 10 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | sites | hosting_association_id | 10 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | user_roles | id | 1 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | user_roles | id | 1 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | user_roles | user_id | 1 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | user_roles | user_id | 1 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | user_roles | role_id | 1 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | user_roles | role_id | 1 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | user_scopes | id | 1 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | user_scopes | id | 1 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | user_scopes | user_id | 1 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | user_scopes | user_id | 1 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| reviewed | users | id | 1 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | users | id | 1 | Semantic export identity differs from SQL UUID; generic adapter does not translate it |
| operations | site_coverages | coverage_key | 69 | Reference unresolved within this standalone export; partial export versus actual orphan needs reconciliation; target public.products |
| operations | site_products | product_key | 69 | Reference unresolved within this standalone export; partial export versus actual orphan needs reconciliation; target public.products |
| operations | site_riders | rider_key | 2 | Reference unresolved within this standalone export; partial export versus actual orphan needs reconciliation; target public.riders |
