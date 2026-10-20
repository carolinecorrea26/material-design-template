# Portal scalar reference register

All detected identity, key, actor, discriminator, evidence, URL and expression columns without an FK are listed. The classifications distinguish justified storage alternatives from unresolved entity relationships. References already enforced appear in the table dictionary and diagrams. Free text expressions may embed further names; this register does not treat vocabulary as an invented relationship.

| Table | Column | Current classification | SQL source |
| --- | --- | --- | --- |
| organizations | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:952 |
| organizations | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:952 |
| clients | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:954 |
| clients | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:954 |
| sites | template_type | Discriminator or vocabulary; SQL enum/CHECK where present; entity pairing still requires validation | supabase/migrations/202609240001_initial_portal_schema.sql:18 |
| sites | legacy_client_id | External asset/URL or compatibility alias; separate validation and alias resolution, not necessarily a portal entity FK | supabase/migrations/202609240001_initial_portal_schema.sql:18 |
| sites | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:956 |
| sites | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:956 |
| site_coverages | coverage_key | Entity/catalog key candidate without FK; unresolved relationship (see findings) | supabase/migrations/202609240001_initial_portal_schema.sql:24 |
| site_coverages | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:966 |
| site_coverages | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:966 |
| site_products | product_key | Entity/catalog key candidate without FK; unresolved relationship (see findings) | supabase/migrations/202609240001_initial_portal_schema.sql:25 |
| site_products | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:971 |
| site_products | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:971 |
| site_riders | rider_key | Entity/catalog key candidate without FK; unresolved relationship (see findings) | supabase/migrations/202609240001_initial_portal_schema.sql:26 |
| site_riders | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:976 |
| site_riders | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:976 |
| site_configurations | configuration_key | Entity/catalog key candidate without FK; unresolved relationship (see findings) | supabase/migrations/202609240001_initial_portal_schema.sql:27 |
| applications | product_key | Entity/catalog key candidate without FK; unresolved relationship (see findings) | supabase/migrations/202609240001_initial_portal_schema.sql:34 |
| applications | current_action_owner_type | Discriminator or vocabulary; SQL enum/CHECK where present; entity pairing still requires validation | supabase/migrations/202609240001_initial_portal_schema.sql:34 |
| applications | current_action_owner_id | Actor/entity/scope target; unenforced relationship and unresolved historical identity semantics | supabase/migrations/202609240001_initial_portal_schema.sql:34 |
| application_participants | participant_type | Discriminator or vocabulary; SQL enum/CHECK where present; entity pairing still requires validation | supabase/migrations/202609240001_initial_portal_schema.sql:41 |
| application_events | event_type | Discriminator or vocabulary; SQL enum/CHECK where present; entity pairing still requires validation | supabase/migrations/202609240001_initial_portal_schema.sql:45 |
| application_events | from_owner_type | Discriminator or vocabulary; SQL enum/CHECK where present; entity pairing still requires validation | supabase/migrations/202609240001_initial_portal_schema.sql:45 |
| application_events | to_owner_type | Discriminator or vocabulary; SQL enum/CHECK where present; entity pairing still requires validation | supabase/migrations/202609240001_initial_portal_schema.sql:45 |
| application_events | performed_by | Actor/entity/scope target; unenforced relationship and unresolved historical identity semantics | supabase/migrations/202609240001_initial_portal_schema.sql:45 |
| releases | release_key | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609240001_initial_portal_schema.sql:51 |
| change_requests | requested_by | Actor/entity/scope target; unenforced relationship and unresolved historical identity semantics | supabase/migrations/202609240001_initial_portal_schema.sql:55 |
| change_requests | owner_id | Actor/entity/scope target; unenforced relationship and unresolved historical identity semantics | supabase/migrations/202609240001_initial_portal_schema.sql:55 |
| change_items | entity_type | Discriminator or vocabulary; SQL enum/CHECK where present; entity pairing still requires validation | supabase/migrations/202609240001_initial_portal_schema.sql:60 |
| change_items | entity_id | Actor/entity/scope target; unenforced relationship and unresolved historical identity semantics | supabase/migrations/202609240001_initial_portal_schema.sql:60 |
| change_items | field_key | Logical runtime or audit target; may be catalog or interaction identity; validation alternative must be documented | supabase/migrations/202609240001_initial_portal_schema.sql:60 |
| change_items | change_type | Discriminator or vocabulary; SQL enum/CHECK where present; entity pairing still requires validation | supabase/migrations/202609240001_initial_portal_schema.sql:60 |
| site_builder_drafts | site_key | Proposed site key before creation; need uniqueness/reservation semantics, not necessarily an existing-site FK | supabase/migrations/202609240001_initial_portal_schema.sql:70 |
| site_builder_drafts | current_step | Discriminator or vocabulary; SQL enum/CHECK where present; entity pairing still requires validation | supabase/migrations/202609240001_initial_portal_schema.sql:70 |
| site_builder_drafts | owner_id | Actor/entity/scope target; unenforced relationship and unresolved historical identity semantics | supabase/migrations/202609240001_initial_portal_schema.sql:70 |
| user_scopes | scope_type | Discriminator or vocabulary; SQL enum/CHECK where present; entity pairing still requires validation | supabase/migrations/202609240001_initial_portal_schema.sql:78 |
| user_scopes | scope_id | Actor/entity/scope target; unenforced relationship and unresolved historical identity semantics | supabase/migrations/202609240001_initial_portal_schema.sql:78 |
| audit_events | entity_type | Discriminator or vocabulary; SQL enum/CHECK where present; entity pairing still requires validation | supabase/migrations/202609240001_initial_portal_schema.sql:79 |
| audit_events | entity_id | Actor/entity/scope target; unenforced relationship and unresolved historical identity semantics | supabase/migrations/202609240001_initial_portal_schema.sql:79 |
| audit_events | field_key | Logical runtime or audit target; may be catalog or interaction identity; validation alternative must be documented | supabase/migrations/202609240001_initial_portal_schema.sql:79 |
| audit_events | performed_by | Actor/entity/scope target; unenforced relationship and unresolved historical identity semantics | supabase/migrations/202609240001_initial_portal_schema.sql:79 |
| analytics_metrics | metric_key | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609240002_analytics_domain.sql:1 |
| analytics_measurements | period_type | Discriminator or vocabulary; SQL enum/CHECK where present; entity pairing still requires validation | supabase/migrations/202609240002_analytics_domain.sql:12 |
| organization_profiles | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:874 |
| organization_profiles | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:874 |
| associations | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:876 |
| associations | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:876 |
| pages | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:878 |
| pages | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:878 |
| page_sections | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:880 |
| page_sections | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:880 |
| fields | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:882 |
| fields | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:882 |
| page_fields | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:884 |
| page_fields | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:884 |
| coverage_categories | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:886 |
| coverage_categories | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:886 |
| products | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:888 |
| products | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:888 |
| riders | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:890 |
| riders | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:890 |
| product_riders | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:892 |
| product_riders | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:892 |
| product_identifiers | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:894 |
| product_identifiers | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:894 |
| applicant_types | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:896 |
| applicant_types | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:896 |
| conditions | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:898 |
| conditions | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:898 |
| rules | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:900 |
| rules | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:900 |
| rule_conditions | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:902 |
| rule_conditions | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:902 |
| rule_actions | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:904 |
| rule_actions | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:904 |
| flows | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:906 |
| flows | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:906 |
| flow_steps | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:908 |
| flow_steps | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:908 |
| flow_transitions | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:910 |
| flow_transitions | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:910 |
| features | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:912 |
| features | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:912 |
| configuration_definitions | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:914 |
| configuration_definitions | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:914 |
| content_entries | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:916 |
| content_entries | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:916 |
| email_templates | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:918 |
| email_templates | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:918 |
| document_definitions | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:920 |
| document_definitions | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:920 |
| validation_rules | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:922 |
| validation_rules | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:922 |
| site_associations | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:924 |
| site_associations | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:924 |
| site_pages | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:926 |
| site_pages | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:926 |
| site_field_configurations | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:928 |
| site_field_configurations | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:928 |
| site_product_applicants | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:930 |
| site_product_applicants | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:930 |
| site_features | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:932 |
| site_features | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:932 |
| site_flows | flow_id | Runtime flow alias distinct from catalog flow_key; alias consistency is code-only | supabase/migrations/202609240003_portal_library.sql:297 |
| site_flows | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:934 |
| site_flows | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:934 |
| rule_assignments | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:936 |
| rule_assignments | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:936 |
| configuration_values | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:938 |
| configuration_values | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:938 |
| content_values | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:940 |
| content_values | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:940 |
| branding_profiles | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:942 |
| branding_profiles | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:942 |
| support_profiles | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:944 |
| support_profiles | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:944 |
| site_email_templates | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:946 |
| site_email_templates | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:946 |
| site_documents | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:948 |
| site_documents | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:948 |
| site_policies | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:950 |
| site_policies | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:950 |
| site_environment_links | link_type | Discriminator or vocabulary; SQL enum/CHECK where present; entity pairing still requires validation | supabase/migrations/202609250001_site_environment_links.sql:2 |
| site_environment_links | url | External asset/URL or compatibility alias; separate validation and alias resolution, not necessarily a portal entity FK | supabase/migrations/202609250001_site_environment_links.sql:2 |
| site_environment_links | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:872 |
| site_environment_links | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:872 |
| provenance_tags | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:3 |
| provenance_tags | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:3 |
| source_workbooks | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:13 |
| source_workbooks | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:13 |
| source_sheets | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:24 |
| source_sheets | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:24 |
| source_requirements | formula | Executable expression or fact name; references require DSL/resolver validation, not a simple FK | supabase/migrations/202609280001_canonical_normalization.sql:38 |
| source_requirements | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:38 |
| source_requirements | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:38 |
| source_requirements | active_site_keys | Embedded JSON entity candidates; source-evidence alternatives require explicit reconciliation | supabase/migrations/202609280002_source_promotion.sql:2 |
| patterns | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:57 |
| patterns | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:57 |
| flag_definitions | value_type | Discriminator or vocabulary; SQL enum/CHECK where present; entity pairing still requires validation | supabase/migrations/202609280001_canonical_normalization.sql:71 |
| flag_definitions | derivation | Executable expression or fact name; references require DSL/resolver validation, not a simple FK | supabase/migrations/202609280001_canonical_normalization.sql:71 |
| flag_definitions | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:71 |
| flag_definitions | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:71 |
| flag_values | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:87 |
| flag_values | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:87 |
| flag_assignments | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:99 |
| flag_assignments | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:99 |
| flag_rules | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:118 |
| flag_rules | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:118 |
| rule_flags | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:131 |
| rule_flags | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:131 |
| rule_predicates | fact | Executable expression or fact name; references require DSL/resolver validation, not a simple FK | supabase/migrations/202609280001_canonical_normalization.sql:144 |
| rule_predicates | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:144 |
| rule_predicates | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:144 |
| structured_rule_actions | action_type | Discriminator or vocabulary; SQL enum/CHECK where present; entity pairing still requires validation | supabase/migrations/202609280001_canonical_normalization.sql:158 |
| structured_rule_actions | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:158 |
| structured_rule_actions | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:158 |
| product_configuration_values | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:171 |
| product_configuration_values | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:171 |
| product_clients | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:183 |
| product_clients | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:183 |
| coverage_plan_definitions | coverage_type | Discriminator or vocabulary; SQL enum/CHECK where present; entity pairing still requires validation | supabase/migrations/202609280001_canonical_normalization.sql:195 |
| coverage_plan_definitions | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:195 |
| coverage_plan_definitions | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:195 |
| coverage_plan_variants | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:206 |
| coverage_plan_variants | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:206 |
| product_coverage_plans | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:219 |
| product_coverage_plans | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:219 |
| plan_benefit_periods | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:231 |
| plan_benefit_periods | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:231 |
| pattern_assignments | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:245 |
| pattern_assignments | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:245 |
| pattern_rules | relationship_type | Discriminator or vocabulary; SQL enum/CHECK where present; entity pairing still requires validation | supabase/migrations/202609280001_canonical_normalization.sql:260 |
| pattern_rules | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:260 |
| pattern_rules | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:260 |
| pattern_conditions | relationship_type | Discriminator or vocabulary; SQL enum/CHECK where present; entity pairing still requires validation | supabase/migrations/202609280001_canonical_normalization.sql:273 |
| pattern_conditions | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:273 |
| pattern_conditions | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:273 |
| pattern_flag_definitions | relationship_type | Discriminator or vocabulary; SQL enum/CHECK where present; entity pairing still requires validation | supabase/migrations/202609280001_canonical_normalization.sql:286 |
| pattern_flag_definitions | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:286 |
| pattern_flag_definitions | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:286 |
| pattern_flows | relationship_type | Discriminator or vocabulary; SQL enum/CHECK where present; entity pairing still requires validation | supabase/migrations/202609280001_canonical_normalization.sql:299 |
| pattern_flows | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:299 |
| pattern_flows | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:299 |
| pattern_products | relationship_type | Discriminator or vocabulary; SQL enum/CHECK where present; entity pairing still requires validation | supabase/migrations/202609280001_canonical_normalization.sql:312 |
| pattern_products | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:312 |
| pattern_products | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:312 |
| pattern_coverage_categories | relationship_type | Discriminator or vocabulary; SQL enum/CHECK where present; entity pairing still requires validation | supabase/migrations/202609280001_canonical_normalization.sql:325 |
| pattern_coverage_categories | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:325 |
| pattern_coverage_categories | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:325 |
| pattern_configuration_definitions | relationship_type | Discriminator or vocabulary; SQL enum/CHECK where present; entity pairing still requires validation | supabase/migrations/202609280001_canonical_normalization.sql:338 |
| pattern_configuration_definitions | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:338 |
| pattern_configuration_definitions | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:338 |
| coverage_amount_patterns | amount_type | Discriminator or vocabulary; SQL enum/CHECK where present; entity pairing still requires validation | supabase/migrations/202609280001_canonical_normalization.sql:351 |
| coverage_amount_patterns | formula | Executable expression or fact name; references require DSL/resolver validation, not a simple FK | supabase/migrations/202609280001_canonical_normalization.sql:351 |
| coverage_amount_patterns | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:351 |
| coverage_amount_patterns | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:351 |
| amount_options | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:372 |
| amount_options | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:372 |
| amount_bands | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:385 |
| amount_bands | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:385 |
| product_amount_rules | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:400 |
| product_amount_rules | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:400 |
| product_applicant_eligibility | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:417 |
| product_applicant_eligibility | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:417 |
| rider_amount_rules | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:431 |
| rider_amount_rules | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:431 |
| aggregate_limits | formula | Executable expression or fact name; references require DSL/resolver validation, not a simple FK | supabase/migrations/202609280001_canonical_normalization.sql:445 |
| aggregate_limits | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:445 |
| aggregate_limits | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:445 |
| underwriting_bands | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:461 |
| underwriting_bands | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:461 |
| residency_rules | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:483 |
| residency_rules | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:483 |
| residency_jurisdictions | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:497 |
| residency_jurisdictions | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:497 |
| benefit_period_options | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:508 |
| benefit_period_options | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:508 |
| eligibility_constraints | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:525 |
| eligibility_constraints | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:525 |
| coverage_dependencies | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:543 |
| coverage_dependencies | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:543 |
| maximum_plan_rules | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:558 |
| maximum_plan_rules | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:558 |
| benefit_caps | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:572 |
| benefit_caps | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:572 |
| question_sets | question_type | Discriminator or vocabulary; SQL enum/CHECK where present; entity pairing still requires validation | supabase/migrations/202609280001_canonical_normalization.sql:589 |
| question_sets | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:589 |
| question_sets | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:589 |
| question_definitions | response_type | Discriminator or vocabulary; SQL enum/CHECK where present; entity pairing still requires validation | supabase/migrations/202609280001_canonical_normalization.sql:602 |
| question_definitions | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:602 |
| question_definitions | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:602 |
| question_set_questions | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:614 |
| question_set_questions | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:614 |
| question_set_fields | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:627 |
| question_set_fields | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:627 |
| rate_tables | url | External asset/URL or compatibility alias; separate validation and alias resolution, not necessarily a portal entity FK | supabase/migrations/202609280001_canonical_normalization.sql:640 |
| rate_tables | image_ref | External asset/URL or compatibility alias; separate validation and alias resolution, not necessarily a portal entity FK | supabase/migrations/202609280001_canonical_normalization.sql:640 |
| rate_tables | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:640 |
| rate_tables | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:640 |
| product_rate_tables | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:655 |
| product_rate_tables | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:655 |
| rate_table_presentations | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:668 |
| rate_table_presentations | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:668 |
| url_parameters | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:684 |
| url_parameters | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:684 |
| site_url_parameters | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:696 |
| site_url_parameters | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:696 |
| client_environment_links | url | External asset/URL or compatibility alias; separate validation and alias resolution, not necessarily a portal entity FK | supabase/migrations/202609280001_canonical_normalization.sql:709 |
| client_environment_links | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:709 |
| client_environment_links | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:709 |
| url_parameter_values | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:721 |
| url_parameter_values | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:721 |
| page_section_fields | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:732 |
| page_section_fields | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:732 |
| requirement_targets | target_table | Polymorphic evidence target; target existence/column validity not enforced by SQL | supabase/migrations/202609280001_canonical_normalization.sql:745 |
| requirement_targets | target_key | Polymorphic evidence target; target existence/column validity not enforced by SQL | supabase/migrations/202609280001_canonical_normalization.sql:745 |
| requirement_targets | target_column | Polymorphic evidence target; target existence/column validity not enforced by SQL | supabase/migrations/202609280001_canonical_normalization.sql:745 |
| requirement_targets | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:745 |
| requirement_targets | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:745 |
| semantic_requirements | subject_table | Polymorphic evidence target; target existence/column validity not enforced by SQL | supabase/migrations/202609280001_canonical_normalization.sql:758 |
| semantic_requirements | subject_key | Polymorphic evidence target; target existence/column validity not enforced by SQL | supabase/migrations/202609280001_canonical_normalization.sql:758 |
| semantic_requirements | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:758 |
| semantic_requirements | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:758 |
| identity_resolutions | candidate_keys | Embedded JSON entity candidates; source-evidence alternatives require explicit reconciliation | supabase/migrations/202609280001_canonical_normalization.sql:773 |
| identity_resolutions | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:773 |
| identity_resolutions | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:773 |
| url_definitions | url | External asset/URL or compatibility alias; separate validation and alias resolution, not necessarily a portal entity FK | supabase/migrations/202609280001_canonical_normalization.sql:788 |
| url_definitions | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:788 |
| url_definitions | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:788 |
| url_usages | source_owner | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:802 |
| url_usages | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:802 |
| url_usages | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:802 |
| product_question_sets | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:816 |
| product_question_sets | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:816 |
| plan_amount_rules | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:829 |
| plan_amount_rules | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:829 |
| pattern_question_sets | relationship_type | Discriminator or vocabulary; SQL enum/CHECK where present; entity pairing still requires validation | supabase/migrations/202609280001_canonical_normalization.sql:841 |
| pattern_question_sets | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202609280001_canonical_normalization.sql:841 |
| pattern_question_sets | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202609280001_canonical_normalization.sql:841 |
| portal_library_readiness | evidence_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202610020001_library_publication.sql:35 |
| migration_schedules | client_key | Entity/catalog key candidate without FK; unresolved relationship (see findings) | supabase/migrations/202610050001_migration_schedule.sql:2 |
| analytics_tags | page_id | Logical runtime or audit target; may be catalog or interaction identity; validation alternative must be documented | supabase/migrations/202610050002_analytics_tags.sql:2 |
| analytics_tags | element_key | Logical runtime or audit target; may be catalog or interaction identity; validation alternative must be documented | supabase/migrations/202610050002_analytics_tags.sql:2 |
| components | display_id | Identity of this row or catalog vocabulary; no outgoing FK required | supabase/migrations/202610120001_portal_components.sql:2 |
| components | source_reference | Evidence label or locator; intentional free text, not a validated portal actor | supabase/migrations/202610120001_portal_components.sql:2 |
