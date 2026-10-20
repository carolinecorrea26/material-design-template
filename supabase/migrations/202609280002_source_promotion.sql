-- Source evidence is not automatically approved canonical data.
alter table public.source_requirements
  add column promotion_state text not null default 'SOURCE_ONLY'
    check (promotion_state in ('SOURCE_ONLY','PATTERN_CANDIDATE','CANONICAL_LIBRARY','SITE_CONFIGURATION','UNRESOLVED')),
  add column promotion_reason text not null default 'Archived evidence; no adoption decision.',
  add column active_site_keys jsonb not null default '[]'::jsonb
    check (jsonb_typeof(active_site_keys) = 'array'),
  add constraint source_promotion_scope check (
    promotion_state not in ('SOURCE_ONLY','PATTERN_CANDIDATE') or active_site_keys = '[]'::jsonb
  );
