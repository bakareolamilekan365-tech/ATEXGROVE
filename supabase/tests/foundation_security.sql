-- Run with `supabase db test` against a local/CI database.
-- These checks intentionally cover application-owned foundation tables only;
-- Supabase-managed auth/storage internals are excluded from the application RLS inventory.
begin;
select plan(13);

select ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'profiles has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.organizations'::regclass), 'organizations has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.organization_members'::regclass), 'organization_members has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.audit_logs'::regclass), 'audit_logs has RLS enabled');
select is((select public from storage.buckets where id = 'documents'), false, 'documents bucket is private');
select ok(exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Users can update their own profile'), 'profile update policy exists');
select ok(exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'organizations' and policyname = 'Authenticated users can create unverified organizations'), 'organization creation is constrained');
select ok(exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'organizations' and policyname = 'Administrators can update organization security fields'), 'administrator organization workflow exists');
select ok(exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'organization_members' and policyname = 'Organization owners and admins can insert memberships'), 'membership insert policy exists');
select ok(exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'organization_members' and policyname = 'Organization owners and admins can delete memberships'), 'membership delete policy exists');
select ok(exists(select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Scoped staff can read case evidence objects'), 'scoped staff case-evidence read policy exists');
select ok(exists(select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Customers can upload evidence for their cases'), 'customer case-evidence upload policy exists');
select ok(not exists(select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and (qual = 'true' or with_check = 'true')), 'storage has no unconditional true policy');

select * from finish();
rollback;
