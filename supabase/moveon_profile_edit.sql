-- Allow authenticated users to edit only the fields collected at registration.
-- Run after moveon_setup.sql and moveon_booking_workflow.sql.

-- Availability settings are stored on each driver's own profile.
alter table public.driver_profiles
  add column if not exists is_online boolean not null default false,
  add column if not exists auto_accept boolean not null default false;

drop policy if exists "Users update own profile details" on public.profiles;
create policy "Users update own profile details"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check (
  (select auth.uid()) = id
  and role in ('passenger', 'driver')
);

drop policy if exists "Drivers update own registration details" on public.driver_profiles;
create policy "Drivers update own registration details"
on public.driver_profiles for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

revoke update on public.driver_profiles from authenticated;
grant update (license_id, plate_number, vehicle_type, is_online, auto_accept)
on public.driver_profiles to authenticated;
