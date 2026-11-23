-- Keep the driver's availability and editable registration fields under one RLS UPDATE policy.
-- Column-level UPDATE grants still restrict which fields the authenticated driver can change.

drop policy if exists "Drivers update own availability settings" on public.driver_profiles;
drop policy if exists "Drivers update own registration details" on public.driver_profiles;

create policy "Drivers update own profile settings and registration"
on public.driver_profiles
for update
to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'driver'
  )
)
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'driver'
  )
);
