-- Allow authenticated users to edit only the fields collected at registration.
-- Run after moveon_setup.sql and moveon_booking_workflow.sql.

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
grant update (license_id, plate_number, vehicle_type) on public.driver_profiles to authenticated;
