-- Add flow identity to authored page values and align untouched legacy seed order
-- with the applicant sequence. Existing routes, requirements and custom positions survive.
create temporary table legacy_page_order (key text, old_position integer, new_position integer);
insert into legacy_page_order values
  ('home', 0, 0),
  ('membership', 1, 1),
  ('eligibility', 2, 2),
  ('coverage', 3, 3),
  ('beneficiary', 4, 4),
  ('contact', 5, 5),
  ('profile', 29, 6),
  ('review', 6, 7),
  ('health-si', 8, 8),
  ('health-li', 9, 9),
  ('health-qd', 10, 10),
  ('health-di', 11, 11),
  ('health-cir', 12, 12),
  ('payment', 13, 13),
  ('docusign', 7, 14),
  ('receipt', 14, 15),
  ('resume', 15, 16),
  ('resume-method', 16, 17),
  ('resume-code', 17, 18),
  ('advisor-login', 18, 19),
  ('advisor-send-confirmation', 19, 20),
  ('application-edit-confirmation', 20, 21),
  ('mock-email-preview', 21, 22),
  ('site-features', 22, 23),
  ('site-details', 23, 24),
  ('design-system', 24, 25),
  ('portal-admin', 25, 26),
  ('cms', 26, 27),
  ('portal-template-project', 27, 28),
  ('portal-requirements-project', 28, 29);

update public.site_pages assignment set position = ordering.new_position
from legacy_page_order ordering join public.pages page on page.key = ordering.key
where assignment.page_key = ordering.key and assignment.position = ordering.old_position
  and not (page.definition ? 'flow')
  and not exists (
    select 1 from public.site_pages other join legacy_page_order legacy on legacy.key = other.page_key
    where other.site_key = assignment.site_key and other.position <> legacy.old_position
  );
update public.pages page set position = ordering.new_position
from legacy_page_order ordering
where page.key = ordering.key and page.position = ordering.old_position and not (page.definition ? 'flow')
  and not exists (
    select 1 from public.pages other join legacy_page_order legacy on legacy.key = other.key
    where other.position <> legacy.old_position
  );
update public.pages set definition = definition || jsonb_build_object('flow',
  case when definition->>'type' = 'internal' then 'internal'
       when definition->>'type' = 'resume' then 'resume'
       when key in ('advisor-login','advisor-send-confirmation','application-edit-confirmation') then 'advisor'
       else 'application' end)
where not (definition ? 'flow');

alter table public.pages add constraint pages_definition_contract check (
  coalesce(definition->>'id' = key and definition->>'flow' in ('application','resume','advisor','internal')
    and definition->>'type' in ('home','form','receipt','resume','internal')
    and definition->>'path' ~ '^/([^/?#[:space:]][^?#[:space:]]*)?$' and position >= 0, false)
);
create unique index pages_route_unique on public.pages ((definition->>'path'));
alter table public.site_pages add constraint site_pages_nonnegative_order check (position >= 0);

drop table legacy_page_order;
