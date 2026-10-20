-- Phase 2, Slice 2: immutable, private customer evidence on a verification case.
-- This migration intentionally excludes evidence review/authentication, staff uploads,
-- malware scanning, reports, GIS, OCR/AI and notifications.

create table public.case_evidence (
  id uuid primary key,
  verification_case_id uuid not null references public.verification_cases(id) on delete cascade,
  uploaded_by_user_id uuid not null references auth.users(id) on delete restrict,
  evidence_type text not null check (evidence_type in ('title_deed_copy', 'survey_plan_copy', 'receipt', 'seller_id', 'other')),
  description text not null check (char_length(btrim(description)) between 2 and 500),
  source text not null default 'customer_supplied' check (source = 'customer_supplied'),
  storage_path text not null unique,
  original_filename text not null check (char_length(btrim(original_filename)) between 1 and 255),
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  version integer not null default 1 check (version > 0),
  supersedes_evidence_id uuid references public.case_evidence(id) on delete restrict,
  review_state text not null default 'received_unreviewed' check (review_state = 'received_unreviewed'),
  is_demo_data boolean not null default true check (is_demo_data),
  created_at timestamptz not null default now(),
  check (supersedes_evidence_id is null or supersedes_evidence_id <> id)
);

create index case_evidence_case_created_idx
  on public.case_evidence (verification_case_id, created_at desc);
create index case_evidence_uploader_idx
  on public.case_evidence (uploaded_by_user_id);
create index case_evidence_supersedes_idx
  on public.case_evidence (supersedes_evidence_id)
  where supersedes_evidence_id is not null;

alter table public.case_evidence enable row level security;

drop policy if exists "Customers and scoped staff can read case evidence" on public.case_evidence;
create policy "Customers and scoped staff can read case evidence"
  on public.case_evidence for select
  to authenticated
  using (
    exists (
      select 1
      from public.verification_cases vc
      where vc.id = verification_case_id
        and vc.customer_user_id = (select auth.uid())
    )
    or (select public.staff_can_access_verification_case(verification_case_id))
  );

-- Parse only the exact object convention used by this slice. Invalid UUIDs or
-- malformed paths return null, so Storage policies deny rather than error.
create or replace function public.document_case_id_from_path(object_name text)
returns uuid
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  path_parts text[] := string_to_array(object_name, '/');
  parsed_case_id uuid;
  parsed_evidence_id uuid;
begin
  if coalesce(array_length(path_parts, 1), 0) <> 5
    or path_parts[1] <> 'documents'
    or path_parts[2] <> 'cases'
    or path_parts[5] = '' then
    return null;
  end if;

  begin
    parsed_case_id := path_parts[3]::uuid;
    parsed_evidence_id := path_parts[4]::uuid;
  exception when invalid_text_representation then
    return null;
  end;

  if parsed_evidence_id is null then
    return null;
  end if;
  return parsed_case_id;
end;
$$;

create or replace function public.document_evidence_id_from_path(object_name text)
returns uuid
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  path_parts text[] := string_to_array(object_name, '/');
  parsed_evidence_id uuid;
begin
  if public.document_case_id_from_path(object_name) is null then
    return null;
  end if;
  begin
    parsed_evidence_id := path_parts[4]::uuid;
  exception when invalid_text_representation then
    return null;
  end;
  return parsed_evidence_id;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read their private documents" on storage.objects;
drop policy if exists "Users can upload their private documents" on storage.objects;
drop policy if exists "Users can update their private documents" on storage.objects;
drop policy if exists "Users can delete their private documents" on storage.objects;

drop policy if exists "Customers can upload evidence for their cases" on storage.objects;
create policy "Customers can upload evidence for their cases"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'documents'
    and public.document_case_id_from_path(name) is not null
    and exists (
      select 1
      from public.verification_cases vc
      where vc.id = public.document_case_id_from_path(name)
        and vc.customer_user_id = (select auth.uid())
        and vc.workflow_status in ('submitted', 'assigned', 'in_review', 'needs_customer_info')
        and (
          select count(*)
          from public.case_evidence ce
          where ce.verification_case_id = vc.id
        ) < 10
    )
  );

drop policy if exists "Customers and scoped staff can read case evidence objects" on storage.objects;
drop policy if exists "Scoped staff can read case evidence objects" on storage.objects;

-- The object must already exist. The case row lock serializes the per-case count,
-- predecessor version and transactionally related event/audit writes.
create or replace function public.register_case_evidence(
  p_evidence_id uuid,
  p_case_id uuid,
  p_evidence_type text,
  p_description text,
  p_storage_path text,
  p_original_filename text,
  p_mime_type text,
  p_size_bytes bigint,
  p_supersedes_evidence_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  case_row public.verification_cases%rowtype;
  predecessor public.case_evidence%rowtype;
  next_version integer := 1;
  evidence_label text;
begin
  if actor_id is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;

  select * into case_row
  from public.verification_cases
  where id = p_case_id
  for update;

  if not found then
    raise exception 'Verification case not found' using errcode = 'P0002';
  end if;
  if case_row.customer_user_id <> actor_id then
    raise exception 'Only the case customer can add evidence' using errcode = '42501';
  end if;
  if case_row.workflow_status not in ('submitted', 'assigned', 'in_review', 'needs_customer_info') then
    raise exception 'This case is not accepting evidence' using errcode = '22023';
  end if;
  if p_evidence_type not in ('title_deed_copy', 'survey_plan_copy', 'receipt', 'seller_id', 'other') then
    raise exception 'Unsupported evidence type' using errcode = '22023';
  end if;
  if char_length(btrim(coalesce(p_description, ''))) not between 2 and 500 then
    raise exception 'Description must be between 2 and 500 characters' using errcode = '22023';
  end if;
  if p_mime_type not in ('application/pdf', 'image/jpeg', 'image/png') then
    raise exception 'Unsupported file type' using errcode = '22023';
  end if;
  if p_size_bytes <= 0 or p_size_bytes > 10485760 then
    raise exception 'File must be no larger than 10 MB' using errcode = '22023';
  end if;
  if char_length(btrim(coalesce(p_original_filename, ''))) not between 1 and 255 then
    raise exception 'Invalid original filename' using errcode = '22023';
  end if;
  if public.document_case_id_from_path(p_storage_path) is distinct from p_case_id
    or public.document_evidence_id_from_path(p_storage_path) is distinct from p_evidence_id then
    raise exception 'Invalid evidence storage path' using errcode = '22023';
  end if;
  if not exists (
    select 1 from storage.objects
    where bucket_id = 'documents' and name = p_storage_path
  ) then
    raise exception 'Evidence object was not uploaded' using errcode = '22023';
  end if;
  if (select count(*) from public.case_evidence where verification_case_id = p_case_id) >= 10 then
    raise exception 'A case can have at most 10 files' using errcode = '22023';
  end if;

  if p_supersedes_evidence_id is not null then
    select * into predecessor
    from public.case_evidence
    where id = p_supersedes_evidence_id
      and verification_case_id = p_case_id;
    if not found then
      raise exception 'Superseded evidence must belong to this case' using errcode = '22023';
    end if;
    if predecessor.evidence_type <> p_evidence_type then
      raise exception 'A replacement must keep the same evidence type' using errcode = '22023';
    end if;
    next_version := predecessor.version + 1;
  end if;

  insert into public.case_evidence (
    id, verification_case_id, uploaded_by_user_id, evidence_type,
    description, storage_path, original_filename, mime_type, size_bytes,
    version, supersedes_evidence_id
  ) values (
    p_evidence_id, p_case_id, actor_id, p_evidence_type,
    btrim(p_description), p_storage_path, btrim(p_original_filename), p_mime_type,
    p_size_bytes, next_version, p_supersedes_evidence_id
  );

  evidence_label := case p_evidence_type
    when 'title_deed_copy' then 'Title deed copy'
    when 'survey_plan_copy' then 'Survey plan copy'
    when 'receipt' then 'Receipt'
    when 'seller_id' then 'ID of seller'
    else 'Other'
  end;

  insert into public.case_status_events (
    verification_case_id, actor_user_id, from_status, to_status, reason, customer_visible
  ) values (
    p_case_id, actor_id, case_row.workflow_status, case_row.workflow_status,
    'Document added: ' || evidence_label, true
  );

  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  values (
    actor_id,
    'case_evidence.created',
    'case_evidence',
    p_evidence_id,
    jsonb_build_object(
      'verification_case_id', p_case_id,
      'evidence_type', p_evidence_type,
      'version', next_version,
      'source', 'customer_supplied',
      'is_demo_data', true
    )
  );

  return p_evidence_id;
end;
$$;

create or replace function public.customer_respond_to_case(
  p_case_id uuid,
  p_message text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  case_row public.verification_cases%rowtype;
  event_id uuid;
begin
  if actor_id is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;
  if char_length(btrim(coalesce(p_message, ''))) not between 2 and 2000 then
    raise exception 'A response message is required' using errcode = '22023';
  end if;

  select * into case_row
  from public.verification_cases
  where id = p_case_id
  for update;

  if not found then
    raise exception 'Verification case not found' using errcode = 'P0002';
  end if;
  if case_row.customer_user_id <> actor_id then
    raise exception 'Only the case customer can respond' using errcode = '42501';
  end if;
  if case_row.workflow_status <> 'needs_customer_info' then
    raise exception 'The case is not waiting for customer information' using errcode = '22023';
  end if;

  update public.verification_cases
  set workflow_status = 'in_review'
  where id = p_case_id;

  insert into public.case_status_events (
    verification_case_id, actor_user_id, from_status, to_status, reason, customer_visible
  ) values (
    p_case_id, actor_id, 'needs_customer_info', 'in_review', btrim(p_message), true
  ) returning id into event_id;

  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  values (
    actor_id,
    'verification_case.customer_responded',
    'verification_case',
    p_case_id,
    jsonb_build_object('event_id', event_id)
  );

  return event_id;
end;
$$;

-- Staff use this function before a signed download is created. Authorization and
-- the access audit share one database transaction; no document contents are logged.
create or replace function public.authorize_case_evidence_download(p_evidence_id uuid)
returns table (storage_path text, original_filename text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  evidence_row public.case_evidence%rowtype;
begin
  if actor_id is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;

  select * into evidence_row
  from public.case_evidence
  where id = p_evidence_id;

  if not found then
    raise exception 'Evidence not found' using errcode = 'P0002';
  end if;
  if not public.staff_can_access_verification_case(evidence_row.verification_case_id) then
    raise exception 'Staff access to this case is required' using errcode = '42501';
  end if;

  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  values (
    actor_id,
    'document.accessed',
    'case_evidence',
    evidence_row.id,
    jsonb_build_object('verification_case_id', evidence_row.verification_case_id)
  );

  return query select evidence_row.storage_path, evidence_row.original_filename;
end;
$$;

revoke all on table public.case_evidence from anon, authenticated;
grant select on table public.case_evidence to authenticated;
grant all on table public.case_evidence to service_role;

revoke execute on function public.document_case_id_from_path(text) from public, anon;
revoke execute on function public.document_evidence_id_from_path(text) from public, anon;
revoke execute on function public.register_case_evidence(uuid, uuid, text, text, text, text, text, bigint, uuid) from public, anon;
revoke execute on function public.customer_respond_to_case(uuid, text) from public, anon;
revoke execute on function public.authorize_case_evidence_download(uuid) from public, anon;

grant execute on function public.document_case_id_from_path(text) to authenticated;
grant execute on function public.document_evidence_id_from_path(text) to authenticated;
grant execute on function public.register_case_evidence(uuid, uuid, text, text, text, text, text, bigint, uuid) to authenticated;
grant execute on function public.customer_respond_to_case(uuid, text) to authenticated;
grant execute on function public.authorize_case_evidence_download(uuid) to authenticated;

-- Authenticated clients receive no object SELECT, UPDATE or DELETE policy.
-- Audited staff downloads and failed-upload cleanup use narrowly scoped
-- server-only actions with service-role credentials.
