-- Complete application selection and submission-history guards.
begin;

alter table public.application_applicants add constraint application_person_role_identity
  unique(id,application_id,applicant_type_key);
alter table public.application_coverages add constraint application_coverage_person_role
  foreign key(application_applicant_id,application_id,applicant_type_key)
  references public.application_applicants(id,application_id,applicant_type_key) not valid;
insert into public.schema_reconciliation_issues(table_name,record_id,reference_name,original_value,reason)
  select 'application_coverages',c.id::text,'applicant_type_key',to_jsonb(c),'Coverage role differs from its linked person'
  from public.application_coverages c join public.application_applicants p on p.id=c.application_applicant_id
  where (p.application_id,p.applicant_type_key) is distinct from (c.application_id,c.applicant_type_key);
do $$ begin
  if not exists(select from public.schema_reconciliation_issues where table_name='application_coverages'
    and reference_name='applicant_type_key' and resolved_at is null) then
    alter table public.application_coverages validate constraint application_coverage_person_role;
  end if;
end $$;

create function public.check_application_coverage_availability() returns trigger language plpgsql as $$
begin
  if not exists(select from public.site_products where site_id=new.site_id and product_key=new.product_key and enabled) then
    raise exception 'Application coverage product is unavailable or disabled for its Site' using errcode='23514';
  end if;
  return new;
end $$;
create trigger application_coverage_availability before insert or update on public.application_coverages
  for each row execute function public.check_application_coverage_availability();

-- Lock both parents before reparenting; checking only NEW permits submitted
-- rows to escape into an editable draft. UUID order avoids opposite-move deadlocks.
create or replace function public.guard_operational_selection_write() returns trigger language plpgsql as $$
declare parent_ids uuid[]; app record;
begin
  if TG_OP='INSERT' then parent_ids:=array[new.application_id];
  elsif TG_OP='DELETE' then parent_ids:=array[old.application_id];
  else parent_ids:=array[old.application_id,new.application_id]; end if;
  for app in select id,submitted_at from public.applications where id=any(parent_ids) order by id for update loop
    if app.submitted_at is not null then
      raise exception 'Submitted selections and answers retain their original values' using errcode='23514';
    end if;
  end loop;
  if TG_OP='DELETE' then return old; else return new; end if;
end $$;

create or replace function public.check_application_submission_history() returns trigger language plpgsql as $$
declare captured public.application_snapshots; answers jsonb; coverages jsonb; participants jsonb; association_id uuid;
begin
  if TG_OP='UPDATE' and old.submitted_at is not null then
    if new.submitted_at is distinct from old.submitted_at or new.site_id is distinct from old.site_id
      or new.record_origin is distinct from old.record_origin or new.product_catalog_key is distinct from old.product_catalog_key then
      raise exception 'Submitted application identity and timestamp retain their original values' using errcode='23514';
    end if;
  end if;
  if new.submitted_at is not null and (TG_OP='INSERT' or old.submitted_at is null) and new.record_origin<>'legacy-import' then
    select * into captured from public.application_snapshots where application_id=new.id order by version desc limit 1;
    if not found then
      raise exception 'Capture the original configuration and answers before submission' using errcode='23514';
    end if;
    select coalesce(jsonb_agg(to_jsonb(a) order by a.id),'[]') into answers from public.application_answers a where a.application_id=new.id;
    select coalesce(jsonb_agg(to_jsonb(c)||jsonb_build_object('riders',(select coalesce(jsonb_agg(to_jsonb(r) order by r.id),'[]')
      from public.application_riders r where r.application_coverage_id=c.id)) order by c.id),'[]') into coverages
      from public.application_coverages c where c.application_id=new.id;
    select coalesce(jsonb_agg(to_jsonb(p) order by p.id),'[]') into participants from public.application_participants p where p.application_id=new.id;
    select association_entity_id into association_id from public.application_associations where application_id=new.id;
    if captured.answers_snapshot is distinct from answers or captured.coverages_snapshot is distinct from coverages
      or captured.participants_snapshot is distinct from participants or captured.association_entity_id is distinct from association_id then
      raise exception 'Application changed after capture; capture current values before submission' using errcode='23514';
    end if;
  end if;
  return new;
end $$;
drop trigger application_submission_snapshot on public.applications;
create trigger application_submission_snapshot before insert or update on public.applications
  for each row execute function public.check_application_submission_history();
create trigger application_association_history before insert or update or delete on public.application_associations
  for each row execute function public.guard_operational_selection_write();
create trigger application_person_history before insert or update or delete on public.application_applicants
  for each row execute function public.guard_operational_selection_write();
create trigger application_participant_history before insert or update or delete on public.application_participants
  for each row execute function public.guard_operational_selection_write();
commit;
