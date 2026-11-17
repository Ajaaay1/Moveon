-- Run this script in Supabase SQL Editor.
-- Creates Moveon profiles, driver profiles, and private license-photo storage.
-- Designed for the Moveon NINO branch.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  role text not null check (role in ('passenger', 'driver')),
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;

create table if not exists public.driver_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  license_id text,
  license_image_path text,
  plate_number text not null,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  constraint driver_license_required
    check (nullif(trim(license_id), '') is not null or license_image_path is not null),
  constraint driver_plate_required
    check (nullif(trim(plate_number), '') is not null)
);

alter table public.profiles enable row level security;
alter table public.driver_profiles enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Drivers read own driver profile" on public.driver_profiles;
create policy "Drivers read own driver profile"
on public.driver_profiles for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Drivers create own pending profile" on public.driver_profiles;
create policy "Drivers create own pending profile"
on public.driver_profiles for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and verification_status = 'pending'
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'driver'
  )
);

grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant select, insert on public.driver_profiles to authenticated;

create or replace function private.handle_new_moveon_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  user_role text;
begin
  user_role := case
    when new.raw_user_meta_data ->> 'role' = 'driver' then 'driver'
    else 'passenger'
  end;

  insert into public.profiles (id, full_name, email, phone, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), 'New User'),
    new.email,
    new.raw_user_meta_data ->> 'phone',
    user_role
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        email = excluded.email,
        phone = excluded.phone,
        role = excluded.role;

  return new;
end;
$$;

revoke all on function private.handle_new_moveon_user() from public, anon, authenticated;

drop trigger if exists on_moveon_auth_user_created on auth.users;
create trigger on_moveon_auth_user_created
after insert on auth.users
for each row execute procedure private.handle_new_moveon_user();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'driver-licenses',
  'driver-licenses',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists "Drivers upload own license" on storage.objects;
create policy "Drivers upload own license"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'driver-licenses'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Drivers view own license" on storage.objects;
create policy "Drivers view own license"
on storage.objects for select to authenticated
using (
  bucket_id = 'driver-licenses'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
