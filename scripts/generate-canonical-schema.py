"""Generate additive storage contracts from explicit relational specifications."""
import json
import pathlib
import re

root = pathlib.Path('.')
specs = {}
groups = {}
def table(group, name, fields, constraints=()):
    specs[name] = {'columns': {'id': 'text primary key', 'key': 'text not null unique', **fields}, 'constraints': list(constraints)}
    groups.setdefault(group, []).append(name)
def fk(table, nullable=False):
    return 'text ' + ('' if nullable else 'not null ') + f'references public.{table}(key)'
def enum(*values):
    return 'text not null'  # column-specific checks are added below

table('provenance', 'provenance_tags', {'name':'text not null'})
table('provenance', 'source_workbooks', {'name':'text not null','sha256':'text not null unique'})
table('provenance', 'source_sheets', {'workbook_key':fk('source_workbooks'),'name':'text not null','cell_count':'integer not null','merged_ranges':'jsonb not null','image_count':'integer not null'})
table('provenance', 'source_requirements', {'sheet_key':fk('source_sheets'),'cell':'text not null','value':'jsonb','formula':'text','comment':'text','hyperlink':'text','classification':"text not null check (classification in ('MAPPED','INTENTIONALLY_EXCLUDED','UNMAPPED_SEMANTIC','PARSER_GAP','MODEL_GAP','IDENTITY_CONFLICT','SOURCE_TBD','SOURCE_CONFLICT','REQUIRES_CLIENT_CONFIRMATION','REQUIRES_AM_CONFIRMATION','REQUIRES_UW_CONFIRMATION','REQUIRES_CONTRACTS_CONFIRMATION','REQUIRES_COMPLIANCE_CONFIRMATION','IMAGE_REVIEW_REQUIRED','NON_FUNCTIONAL_OR_REFERENCE'))",'reason':'text not null','checklist_notes':'text'}, ['unique(sheet_key, cell)'])
table('patterns', 'patterns', {'name':'text not null','category':'text not null','description':'text not null','version':'text','status':"text not null check (status in ('draft','active','deprecated'))"})
table('flags', 'flag_definitions', {'name':'text not null','level':"text not null check (level in ('application','site','coverage','product','rider','applicant','client'))",'value_type':"text not null check (value_type in ('boolean','enum','string','number'))",'persistence':"text not null check (persistence in ('configuration','derived-runtime','session','application-record'))",'description':'text not null','allowed_values':'jsonb','derivation':'text'})
table('flags', 'flag_values', {'flag_key':fk('flag_definitions'),'value':'text not null'}, ['unique(flag_key,value)'])
table('flags', 'flag_assignments', {'flag_key':fk('flag_definitions'),'client_key':fk('clients',True),'site_key':fk('sites',True),'product_key':fk('products',True),'coverage_key':fk('coverage_categories',True),'rider_key':fk('riders',True),'applicant_key':fk('applicant_types',True),'application_id':'uuid references public.applications(id)','value':'jsonb not null'}, ['check (num_nonnulls(client_key,site_key,product_key,coverage_key,rider_key,applicant_key,application_id) <= 1)'])
table('flags', 'flag_rules', {'flag_key':fk('flag_definitions'),'condition_key':fk('conditions'),'value':'jsonb not null','priority':'integer not null'})
table('flags', 'rule_flags', {'rule_key':fk('rules'),'flag_key':fk('flag_definitions'),'operator':"text not null check (operator in ('equals','not-equals'))",'value':'jsonb not null'})
table('patterns', 'rule_predicates', {'rule_key':fk('rules'),'fact':'text not null','operator':"text not null check (operator in ('equals','not-equals','greater-than','less-than','exists'))",'value':'jsonb not null','position':'integer not null'})
table('patterns', 'structured_rule_actions', {'rule_key':fk('rules'),'action_type':"text not null check (action_type in ('lookup-membership','lookup-coverage','verify-identity','show-portfolio','set-decision','suppress-rates','calculate-benefit'))",'value':'jsonb','position':'integer not null'})
table('coverageNormalization', 'product_configuration_values', {'product_key':fk('products'),'configuration_key':fk('configuration_definitions'),'value':'jsonb not null'})
table('coverageNormalization', 'product_clients', {'product_key':fk('products'),'client_key':fk('clients')}, ['unique(product_key,client_key)'])
table('coverageNormalization', 'coverage_plan_definitions', {'name':'text not null','coverage_type':"text not null check (coverage_type in ('disability','overhead-expense'))"})
table('coverageNormalization', 'coverage_plan_variants', {'plan_key':fk('coverage_plan_definitions'),'name':'text','applicant_type_key':fk('applicant_types',True),'position':'integer not null'})
table('coverageNormalization', 'plan_amount_rules', {'variant_key':fk('coverage_plan_variants'),'amount_pattern_key':fk('coverage_amount_patterns'),'condition_key':fk('conditions',True)})
table('coverageNormalization', 'product_coverage_plans', {'product_key':fk('products'),'plan_key':fk('coverage_plan_definitions'),'applicant_type_key':fk('applicant_types')})
table('coverageNormalization', 'plan_benefit_periods', {'variant_key':fk('coverage_plan_variants'),'kind':"text not null check (kind in ('waiting','benefit'))",'value':'numeric not null','unit':"text not null check (unit in ('days','months','years'))",'position':'integer not null'})
table('patterns', 'pattern_assignments', {'pattern_key':fk('patterns'),'client_key':fk('clients',True),'site_key':fk('sites',True),'product_key':fk('products',True),'applicant_key':fk('applicant_types',True),'configuration':'jsonb not null'})
for target in ['rules','conditions','flag_definitions','flows','products','coverage_categories','configuration_definitions','question_sets']:
    # Question sets are created before links in the final dependency order.
    table('patterns', 'pattern_'+target, {'pattern_key':fk('patterns'),'related_key':fk(target),'relationship_type':"text not null check (relationship_type in ('implements','uses','constrains','triggers','documents'))"}, ['unique(pattern_key,related_key)'])
families='fixed set range tiered-range range-plus-fixed conditional calculated named-option none attribute-mapped formula-capped base-reference multiplier election-only unspecified-increment'.split()
table('coverageNormalization', 'coverage_amount_patterns', {'pattern_key':fk('patterns'),'amount_type':"text not null check (amount_type in ("+','.join("'"+x+"'" for x in families)+"))",'minimum':'numeric','maximum':'numeric','increment':'numeric','formula':'text','base_product_key':fk('products',True),'base_applicant_key':fk('applicant_types',True),'base_applicant_class':'text','multiplier':'numeric'}, ['check (minimum is null or maximum is null or minimum <= maximum)', 'check (increment is null or increment > 0)'])
table('coverageNormalization', 'amount_options', {'amount_pattern_key':fk('coverage_amount_patterns'),'value':'text not null','label':'text not null','position':'integer not null'})
table('coverageNormalization', 'amount_bands', {'amount_pattern_key':fk('coverage_amount_patterns'),'minimum':'numeric','maximum':'numeric','increment':'numeric','condition_key':fk('conditions',True),'position':'integer not null'})
table('coverageNormalization', 'product_amount_rules', {'product_key':fk('products'),'applicant_type_key':fk('applicant_types',True),'applicant_class':'text','amount_pattern_key':fk('coverage_amount_patterns'),'condition_key':fk('conditions',True),'client_key':fk('clients',True),'site_key':fk('sites',True),'position':'integer not null'})
table('coverageNormalization', 'product_applicant_eligibility', {'product_key':fk('products'),'applicant_type_key':fk('applicant_types'),'site_key':fk('sites',True),'eligible':'boolean not null','condition_key':fk('conditions',True)})
table('coverageNormalization', 'rider_amount_rules', {'rider_key':fk('riders'),'applicant_type_key':fk('applicant_types',True),'amount_pattern_key':fk('coverage_amount_patterns'),'base_product_key':fk('products',True),'condition_key':fk('conditions',True)})
table('coverageNormalization', 'aggregate_limits', {'category_key':fk('coverage_categories',True),'product_key':fk('products',True),'applicant_type_key':fk('applicant_types',True),'maximum':'numeric','formula':'text','condition_key':fk('conditions',True),'site_key':fk('sites',True)})
table('underwriting', 'underwriting_bands', {'product_key':fk('products'),'applicant_type_key':fk('applicant_types',True),'site_key':fk('sites',True),'pathway':'text','minimum_age':'numeric','maximum_age':'numeric','minimum_amount':'numeric','maximum_amount':'numeric','minimum_amount_exclusive':'boolean not null','applicant_class':'text','mortality_morbidity':'text','condition_key':fk('conditions',True),'status':'text not null'})
table('underwriting', 'residency_rules', {'site_key':fk('sites',True),'product_key':fk('products',True),'rider_key':fk('riders',True),'mode':"text not null check (mode in ('include','exclude'))",'condition_key':fk('conditions',True)})
table('underwriting', 'residency_jurisdictions', {'residency_rule_key':fk('residency_rules'),'jurisdiction':'text not null'})
table('underwriting', 'benefit_period_options', {'product_key':fk('products'),'site_key':fk('sites',True),'applicant_type_key':fk('applicant_types',True),'kind':"text not null check (kind in ('waiting','benefit'))",'value':'text not null','label':'text not null','days':'integer','position':'integer not null'})
table('underwriting', 'eligibility_constraints', {'product_key':fk('products'),'site_key':fk('sites',True),'applicant_type_key':fk('applicant_types'),'minimum_age_days':'numeric','minimum_age_years':'numeric','maximum_age_years':'numeric','student_maximum_age_years':'numeric','unmarried':'boolean','minimum_work_hours':'numeric'})
table('underwriting', 'coverage_dependencies', {'product_key':fk('products'),'site_key':fk('sites',True),'applicant_type_key':fk('applicant_types'),'requires_applicant_key':fk('applicant_types'),'category_key':fk('coverage_categories'),'same_product':'boolean not null'})
table('underwriting', 'maximum_plan_rules', {'product_key':fk('products'),'site_key':fk('sites',True),'applicant_type_key':fk('applicant_types'),'category_key':fk('coverage_categories'),'count':'integer not null check (count > 0)'})
table('underwriting', 'benefit_caps', {'aggregate_limit_key':fk('aggregate_limits'),'minimum_age_years':'numeric','maximum_age_years':'numeric','self_employed_less_than_years':'numeric','maximum':'numeric not null','required_waiting_period':'text','required_benefit_period':'text','position':'integer not null'})
table('questions', 'question_sets', {'name':'text not null','question_type':'text not null','version':'text','description':'text'})
table('questions', 'question_definitions', {'text':'text not null','response_type':'text','status':"text not null check (status in ('documented','unresolved'))"})
table('questions', 'question_set_questions', {'question_set_key':fk('question_sets'),'question_key':fk('question_definitions'),'position':'integer not null','condition_key':fk('conditions',True)})
table('questions', 'question_set_fields', {'question_set_key':fk('question_sets'),'field_key':fk('fields'),'position':'integer not null','condition_key':fk('conditions',True)})
table('rates', 'rate_tables', {'name':'text not null','format':"text not null check (format in ('html','url','image'))",'content':'text','url':'text','image_ref':'text','source_system':'text'})
table('rates', 'product_rate_tables', {'product_key':fk('products'),'rate_table_key':fk('rate_tables'),'site_key':fk('sites',True),'condition_key':fk('conditions',True)})
table('rates', 'rate_table_presentations', {'rate_table_key':fk('rate_tables'),'site_key':fk('sites',True),'product_key':fk('products',True),'placement':"text not null check (placement in ('estimated-cost','product-card'))",'mode':"text not null check (mode in ('inline','link'))",'enabled':'boolean not null','flag_key':fk('flag_definitions',True)})
table('urls', 'url_parameters', {'parameter':'text not null','behavior':'text not null','status':'text not null'})
table('urls', 'site_url_parameters', {'site_key':fk('sites'),'url_parameter_key':fk('url_parameters'),'enabled':'boolean not null','default_value':'text'})
table('urls', 'client_environment_links', {'client_key':fk('clients'),'environment':"text not null check (environment in ('production','test','pre-production','automation'))",'url':"text not null check (url ~ '^https?://')"})
table('urls', 'url_parameter_values', {'url_parameter_key':fk('url_parameters'),'value':'text not null'})
table('questions', 'page_section_fields', {'section_key':fk('page_sections'),'field_key':fk('fields'),'position':'integer not null'}, ['unique(section_key,field_key)'])
table('provenance', 'requirement_targets', {'requirement_key':fk('source_requirements'),'target_table':'text not null','target_key':'text not null','target_column':'text not null'})

# Semantic facts are typed, review-only requirements. Evidence uses requirement_targets.
table('provenance', 'semantic_requirements', {'domain':'text not null','subject_table':'text not null','subject_key':'text not null','predicate':'text not null','value':'jsonb not null','status':"text not null check (status in ('documented','partial'))"})
table('provenance', 'identity_resolutions', {'sheet_key':fk('source_sheets'),'source_row':'integer not null','strategy':"text not null check (strategy in ('exact','semantic-key','g-number','plan-code','g-number+plan-code','multi-match','no-match'))",'candidate_keys':'jsonb not null','product_key':fk('products',True),'explanation':'text not null'})

table('urls', 'url_definitions', {'url':'text not null','protocol':'text not null','host':'text not null','pathname':'text not null','parameters':'jsonb not null'})
table('urls', 'url_usages', {'url_key':fk('url_definitions'),'client_key':fk('clients',True),'usage':'text not null','source_owner':'text not null','status':"text not null check (status in ('documented','unresolved'))"})

table('questions', 'product_question_sets', {'product_key':fk('products'),'question_set_key':fk('question_sets'),'applicant_type_key':fk('applicant_types',True)}, ['unique nulls not distinct(product_key,question_set_key,applicant_type_key)'])

# Topological ordering permits immediate foreign keys on fresh databases.
ordered = {}
while len(ordered) < len(specs):
    for name, spec in specs.items():
        refs = re.findall(r'references public\.(\w+)', str(spec))
        if name not in ordered and all(r not in specs or r in ordered for r in refs):
            ordered[name] = spec
camel=lambda s: re.sub(r'_([a-z])',lambda m:m[1].upper(),s)
pascal=lambda s: camel(s)[0].upper()+camel(s)[1:]
metadata={'display_id':'bigint not null unique check (display_id > 0)','provided_by':'text references public.provenance_tags(key)','source_reference':'text'}
for s in ordered.values(): s['columns'].update(metadata)
out=root/'src/migration/canonicalSchema.ts'
out.write_text('/** Generated by scripts/generate-canonical-schema.py. Additive; no runtime switch. */\nexport const canonicalTableSpecs = '+json.dumps(ordered,indent=2)+' as const;\n')
for group, names in groups.items():
    lines=['// Generated storage contracts; business relationships use stable semantic keys.', 'import type { Json } from "./common";', 'import type { LibraryMetadata } from "../../domain/provenance";']
    for name in names:
        lines.append('export interface '+pascal(name)+' extends LibraryMetadata {')
        for col, sql in specs[name]['columns'].items():
            if col in metadata: continue
            typ='Json' if sql.startswith('jsonb') else 'number' if sql.startswith(('numeric','integer','bigint')) else 'boolean' if sql.startswith('boolean') else 'string'
            if 'not null' not in sql and 'primary key' not in sql: typ+=' | null'
            lines.append('  '+camel(col)+': '+typ+';')
        lines.append('}')
    # Avoid unused imports in domains without JSON.
    if not any('jsonb' in str(specs[n]) for n in names): lines.remove('import type { Json } from "./common";')
    (root/f'src/persistence/types/{group}Canonical.ts').write_text('\n'.join(lines)+'\n')
lines=[]
for group in groups: lines.append(f'import type * as {group} from "./{group}Canonical";')
lines.append('export interface CanonicalSchema {')
for group,names in groups.items():
    for name in names: lines.append(f'  {camel(name)}: {group}.{pascal(name)}[];')
lines.append('}')
(root/'src/persistence/types/canonical.ts').write_text('\n'.join(lines)+'\n')
p=root/'src/persistence/types/index.ts'; s=p.read_text(); s=s.replace('import type { CanonicalSchema } from "./canonical";\n',''); s='import type { CanonicalSchema } from "./canonical";\n'+s; s=s.replace(', CanonicalSchema',''); s=s.replace('extends LibrarySchema, SiteConfigurationSchema','extends LibrarySchema, SiteConfigurationSchema, CanonicalSchema'); p.write_text(s)
p=root/'src/persistence/emptyLibrary.ts'; s=p.read_text(); s=s.replace('import type { CanonicalSchema } from "./types/canonical";\n',''); s='import type { CanonicalSchema } from "./types/canonical";\n'+s; s=s.replace('LibrarySchema & SiteConfigurationSchema {','LibrarySchema & SiteConfigurationSchema & CanonicalSchema {');
for n in ordered: s=s.replace(f'    {camel(n)}: [],\n','')
s=s.replace('  return {','  return {\n'+''.join(f'    {camel(n)}: [],\n' for n in ordered)); p.write_text(s)
p=root/'src/persistence/supabaseAdapter.ts'; s=p.read_text();
for n in ordered: s=s.replace(f'  {camel(n)}: "{n}",\n','')
s=s.replace('Record<TableName, string> = {','Record<TableName, string> = {\n'+''.join(f'  {camel(n)}: "{n}",\n' for n in ordered)); p.write_text(s)
print(len(ordered),'additive tables')
