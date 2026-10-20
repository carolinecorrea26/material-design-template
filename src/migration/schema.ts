/** Additive schema manifest used by SQL generation, seed export and integrity checks. */
export const migrationTableSpecs = {
  site_environment_links: {
    columns: {
      id: "text primary key", key: "text not null unique",
      site_key: "text not null references public.sites(key)",
      environment: "text not null check (environment in ('prototype','test','pre-production','production','automation'))",
      link_type: "text not null check (link_type in ('launch','campaign','apply','returning','reference'))",
      label: "text not null", url: "text not null check (url ~ '^https?://')",
      active: "boolean not null", position: "integer not null default 0",
    }, constraints: [],
  },
  "organization_profiles": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "organization_key": "text not null references public.organizations(key)",
      "definition": "jsonb not null check (jsonb_typeof(definition) = 'object')"
    },
    "constraints": [
      "unique(organization_key)"
    ]
  },
  "associations": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "client_key": "text not null references public.clients(key)",
      "definition": "jsonb not null check (jsonb_typeof(definition) = 'object')"
    },
    "constraints": []
  },
  "pages": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "definition": "jsonb not null check (jsonb_typeof(definition) = 'object')"
    },
    "constraints": []
  },
  "page_sections": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "page_key": "text not null references public.pages(key)",
      "definition": "jsonb not null check (jsonb_typeof(definition) = 'object')"
    },
    "constraints": []
  },
  "fields": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "definition": "jsonb not null check (jsonb_typeof(definition) = 'object')"
    },
    "constraints": []
  },
  "page_fields": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "page_key": "text not null references public.pages(key)",
      "field_key": "text not null references public.fields(key)"
    },
    "constraints": [
      "unique(page_key, field_key)",
      "unique(page_key, position)"
    ]
  },
  "coverage_categories": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "definition": "jsonb not null check (jsonb_typeof(definition) = 'object')"
    },
    "constraints": []
  },
  "products": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "category_key": "text not null references public.coverage_categories(key)",
      "definition": "jsonb not null check (jsonb_typeof(definition) = 'object')"
    },
    "constraints": []
  },
  "riders": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "definition": "jsonb not null check (jsonb_typeof(definition) = 'object')"
    },
    "constraints": []
  },
  "product_riders": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "product_key": "text not null references public.products(key)",
      "rider_key": "text not null references public.riders(key)",
      "scope": "text not null check (scope in ('global','client','site'))",
      "client_key": "text references public.clients(key)",
      "site_key": "text references public.sites(key)"
    },
    "constraints": [
      "unique nulls not distinct(product_key, rider_key, scope, client_key, site_key)",
      "check ((scope = 'global' and client_key is null and site_key is null) or (scope = 'client' and client_key is not null and site_key is null) or (scope = 'site' and site_key is not null and client_key is null))"
    ]
  },
  "product_identifiers": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "product_key": "text not null references public.products(key)",
      "kind": "text not null check (kind in ('gNumber','planCode'))",
      "definition": "jsonb not null check (jsonb_typeof(definition) = 'object')",
      "scope": "text not null check (scope in ('global','client','site'))",
      "client_key": "text references public.clients(key)",
      "site_key": "text references public.sites(key)"
    },
    "constraints": [
      "unique nulls not distinct(product_key, kind, scope, client_key, site_key)",
      "check ((scope = 'global' and client_key is null and site_key is null) or (scope = 'client' and client_key is not null and site_key is null) or (scope = 'site' and site_key is not null and client_key is null))"
    ]
  },
  "applicant_types": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "definition": "jsonb not null check (jsonb_typeof(definition) = 'object')"
    },
    "constraints": []
  },
  "conditions": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "definition": "jsonb not null check (jsonb_typeof(definition) = 'object')"
    },
    "constraints": []
  },
  "rules": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "definition": "jsonb not null check (jsonb_typeof(definition) = 'object')"
    },
    "constraints": []
  },
  "rule_conditions": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "rule_key": "text not null references public.rules(key)",
      "condition_key": "text not null references public.conditions(key)"
    },
    "constraints": [
      "unique(rule_key, condition_key)"
    ]
  },
  "rule_actions": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "rule_key": "text not null references public.rules(key)",
      "definition": "jsonb not null check (jsonb_typeof(definition) = 'object')"
    },
    "constraints": []
  },
  "flows": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "definition": "jsonb not null check (jsonb_typeof(definition) = 'object')"
    },
    "constraints": []
  },
  "flow_steps": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "flow_key": "text not null references public.flows(key)",
      "definition": "jsonb not null check (jsonb_typeof(definition) = 'object')"
    },
    "constraints": [
      "unique(flow_key, key)"
    ]
  },
  "flow_transitions": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "flow_key": "text not null references public.flows(key)",
      "source_step_key": "text not null references public.flow_steps(key)",
      "target_step_key": "text not null references public.flow_steps(key)",
      "definition": "jsonb not null check (jsonb_typeof(definition) = 'object')"
    },
    "constraints": [
      "foreign key (flow_key, source_step_key) references public.flow_steps(flow_key, key)",
      "foreign key (flow_key, target_step_key) references public.flow_steps(flow_key, key)"
    ]
  },
  "features": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "definition": "jsonb not null check (jsonb_typeof(definition) = 'object')"
    },
    "constraints": []
  },
  "configuration_definitions": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "definition": "jsonb not null check (jsonb_typeof(definition) = 'object')"
    },
    "constraints": []
  },
  "content_entries": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "definition": "jsonb not null check (jsonb_typeof(definition) = 'object')"
    },
    "constraints": []
  },
  "email_templates": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "definition": "jsonb not null check (jsonb_typeof(definition) = 'object')"
    },
    "constraints": []
  },
  "document_definitions": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "definition": "jsonb not null check (jsonb_typeof(definition) = 'object')"
    },
    "constraints": []
  },
  "validation_rules": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "field_key": "text not null references public.fields(key)",
      "definition": "jsonb not null check (jsonb_typeof(definition) = 'object')"
    },
    "constraints": []
  },
  "site_associations": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "site_key": "text not null references public.sites(key)",
      "association_key": "text not null references public.associations(key)",
      "enabled": "boolean not null"
    },
    "constraints": [
      "unique(site_key, association_key)"
    ]
  },
  "site_pages": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "site_key": "text not null references public.sites(key)",
      "page_key": "text not null references public.pages(key)",
      "requirement": "text not null check (requirement in ('required','optional','none'))"
    },
    "constraints": [
      "unique(site_key, page_key)"
    ]
  },
  "site_field_configurations": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "page_key": "text not null references public.pages(key)",
      "field_key": "text not null references public.fields(key)",
      "include": "boolean",
      "hidden": "boolean",
      "values": "jsonb not null check (jsonb_typeof(\"values\") = 'object')",
      "scope": "text not null check (scope in ('global','client','site'))",
      "client_key": "text references public.clients(key)",
      "site_key": "text references public.sites(key)"
    },
    "constraints": [
      "check ((scope = 'global' and client_key is null and site_key is null) or (scope = 'client' and client_key is not null and site_key is null) or (scope = 'site' and site_key is not null and client_key is null))"
    ]
  },
  "site_product_applicants": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "site_key": "text not null references public.sites(key)",
      "product_key": "text not null references public.products(key)",
      "applicant_key": "text not null references public.applicant_types(key)"
    },
    "constraints": [
      "unique(site_key, product_key, applicant_key)"
    ]
  },
  "site_features": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "site_key": "text not null references public.sites(key)",
      "feature_key": "text not null references public.features(key)",
      "enabled": "boolean not null"
    },
    "constraints": [
      "unique(site_key, feature_key)"
    ]
  },
  "site_flows": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "flow_key": "text not null references public.flows(key)",
      "flow_id": "text not null",
      "scope": "text not null check (scope in ('global','client','site'))",
      "client_key": "text references public.clients(key)",
      "site_key": "text references public.sites(key)"
    },
    "constraints": [
      "unique nulls not distinct(flow_id, scope, client_key, site_key)",
      "check ((scope = 'global' and client_key is null and site_key is null) or (scope = 'client' and client_key is not null and site_key is null) or (scope = 'site' and site_key is not null and client_key is null))"
    ]
  },
  "rule_assignments": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "rule_key": "text not null references public.rules(key)",
      "scope": "text not null check (scope in ('global','client','site'))",
      "client_key": "text references public.clients(key)",
      "site_key": "text references public.sites(key)"
    },
    "constraints": [
      "unique nulls not distinct(rule_key, scope, client_key, site_key)",
      "check ((scope = 'global' and client_key is null and site_key is null) or (scope = 'client' and client_key is not null and site_key is null) or (scope = 'site' and site_key is not null and client_key is null))"
    ]
  },
  "configuration_values": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "configuration_key": "text not null references public.configuration_definitions(key)",
      "value": "jsonb not null",
      "scope": "text not null check (scope in ('global','client','site'))",
      "client_key": "text references public.clients(key)",
      "site_key": "text references public.sites(key)"
    },
    "constraints": [
      "unique nulls not distinct(configuration_key, scope, client_key, site_key)",
      "check ((scope = 'global' and client_key is null and site_key is null) or (scope = 'client' and client_key is not null and site_key is null) or (scope = 'site' and site_key is not null and client_key is null))"
    ]
  },
  "content_values": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "content_key": "text not null references public.content_entries(key)",
      "value": "jsonb not null",
      "scope": "text not null check (scope in ('global','client','site'))",
      "client_key": "text references public.clients(key)",
      "site_key": "text references public.sites(key)"
    },
    "constraints": [
      "unique nulls not distinct(content_key, scope, client_key, site_key)",
      "check ((scope = 'global' and client_key is null and site_key is null) or (scope = 'client' and client_key is not null and site_key is null) or (scope = 'site' and site_key is not null and client_key is null))"
    ]
  },
  "branding_profiles": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "definition": "jsonb not null check (jsonb_typeof(definition) = 'object')",
      "scope": "text not null check (scope in ('global','client','site'))",
      "client_key": "text references public.clients(key)",
      "site_key": "text references public.sites(key)"
    },
    "constraints": [
      "unique nulls not distinct(scope, client_key, site_key)",
      "check ((scope = 'global' and client_key is null and site_key is null) or (scope = 'client' and client_key is not null and site_key is null) or (scope = 'site' and site_key is not null and client_key is null))"
    ]
  },
  "support_profiles": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "definition": "jsonb not null check (jsonb_typeof(definition) = 'object')",
      "scope": "text not null check (scope in ('global','client','site'))",
      "client_key": "text references public.clients(key)",
      "site_key": "text references public.sites(key)"
    },
    "constraints": [
      "unique nulls not distinct(scope, client_key, site_key)",
      "check ((scope = 'global' and client_key is null and site_key is null) or (scope = 'client' and client_key is not null and site_key is null) or (scope = 'site' and site_key is not null and client_key is null))"
    ]
  },
  "site_email_templates": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "site_key": "text not null references public.sites(key)",
      "email_template_key": "text not null references public.email_templates(key)",
      "enabled": "boolean not null"
    },
    "constraints": [
      "unique(site_key, email_template_key)"
    ]
  },
  "site_documents": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "site_key": "text not null references public.sites(key)",
      "document_key": "text not null references public.document_definitions(key)"
    },
    "constraints": [
      "unique(site_key, document_key)"
    ]
  },
  "site_policies": {
    "columns": {
      "id": "text primary key",
      "key": "text not null unique",
      "position": "integer not null default 0",
      "site_key": "text not null references public.sites(key)",
      "definition": "jsonb not null check (jsonb_typeof(definition) = 'object')"
    },
    "constraints": [
      "unique(site_key)"
    ]
  }
} as const;

export function migrationSchemaSql(): string {
  const statements = Object.entries(migrationTableSpecs).filter(([table]) => table !== "site_environment_links").map(([table, spec]) => {
    const columns = Object.entries(spec.columns).map(([name, type]) => `  "${name}" ${type}`);
    return `create table public.${table} (\n${[...columns, ...spec.constraints.map((c) => `  ${c}`)].join(",\n")}\n);\nalter table public.${table} enable row level security;`;
  });
  // New library tables have no permissive browser policy before the runtime switch.
  return "-- Phase 2: additive library schema. Existing tables and policies are unchanged.\n-- Keys are stable semantic identities; scope constraints prohibit ambiguous ownership.\n-- New tables have RLS enabled and no browser access policy until a later phase.\n\n" + statements.join("\n\n") + "\n" + associationGuardSql;
}

const associationGuardSql = `
-- A Site may only enable Associations belonging to its own Client.
create function public.check_site_association_client() returns trigger
language plpgsql as $$
declare site_client_key text;
begin
  select c.key into site_client_key from public.sites s join public.clients c on c.id = s.client_id where s.key = new.site_key;
  if site_client_key is distinct from (select client_key from public.associations where key = new.association_key) then
    raise exception 'Site Association crosses Client boundaries' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger site_association_client_guard before insert or update on public.site_associations
for each row execute function public.check_site_association_client();
`;

export function siteEnvironmentSchemaSql(): string {
  const spec = migrationTableSpecs.site_environment_links;
  return "-- Additive Site environment links; consumer runtime remains on source configuration.\ncreate table public.site_environment_links (\n" + Object.entries(spec.columns).map(([name, type]) => `  "${name}" ${type}`).join(",\n") + "\n);\nalter table public.site_environment_links enable row level security;\n-- Public URL metadata for the existing Admin Center prototype.\ncreate policy \"prototype environment read\" on public.site_environment_links for select to anon, authenticated using (true);\n";
}
