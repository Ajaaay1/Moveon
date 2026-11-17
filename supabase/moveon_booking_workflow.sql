-- Run after moveon_setup.sql in the Moveon Supabase project.
-- Adds shared passenger bookings, driver vehicle details, realtime delivery,
-- and persistent passenger-to-driver ratings.

alter table public.driver_profiles
  add column if not exists vehicle_type text;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  passenger_id uuid not null references public.profiles(id) on delete cascade,
  driver_id uuid references public.profiles(id) on delete set null,
  driver_name text,
  driver_phone text,
  driver_vehicle_type text,
  driver_plate_number text,
  passenger_name text not null,
  service text not null default 'Motorcycle',
  pickup text not null,
  destination text not null,
  pickup_coords jsonb,
  destination_coords jsonb,
  distance text,
  fare text not null,
  status text not null default 'searching'
    check (status in ('searching', 'accepted', 'arrived', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bookings
  add column if not exists driver_name text,
  add column if not exists driver_phone text,
  add column if not exists driver_vehicle_type text,
  add column if not exists driver_plate_number text;

drop policy if exists "Passengers read assigned driver profiles" on public.profiles;
drop policy if exists "Passengers read assigned driver details" on public.driver_profiles;

alter table public.bookings enable row level security;
grant select, insert on public.bookings to authenticated;

drop policy if exists "Passengers create own bookings" on public.bookings;
create policy "Passengers create own bookings"
on public.bookings for insert to authenticated
with check (
  passenger_id = (select auth.uid())
  and driver_id is null
  and status = 'searching'
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'passenger'
  )
);

drop policy if exists "Passengers and available drivers read bookings" on public.bookings;
create policy "Passengers and available drivers read bookings"
on public.bookings for select to authenticated
using (
  passenger_id = (select auth.uid())
  or (
    status = 'searching'
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'driver'
    )
  )
  or driver_id = (select auth.uid())
);

drop policy if exists "Passengers cancel own searching bookings" on public.bookings;
drop policy if exists "Drivers accept and update assigned bookings" on public.bookings;
drop policy if exists "Users update own or assigned bookings" on public.bookings;
create policy "Users update own or assigned bookings"
on public.bookings for update to authenticated
using (
  (passenger_id = (select auth.uid()) and status = 'searching')
  or (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'driver'
    )
    and (status = 'searching' or driver_id = (select auth.uid()))
  )
)
with check (
  (passenger_id = (select auth.uid()) and status = 'cancelled')
  or (
    driver_id = (select auth.uid())
    and status in ('accepted', 'arrived', 'in_progress', 'completed')
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'driver'
    )
  )
);

revoke update on public.bookings from authenticated;
grant update (
  status,
  updated_at,
  driver_id,
  driver_name,
  driver_phone,
  driver_vehicle_type,
  driver_plate_number
) on public.bookings to authenticated;

create index if not exists bookings_passenger_created_idx
  on public.bookings (passenger_id, created_at desc);
create index if not exists bookings_driver_status_created_idx
  on public.bookings (driver_id, status, created_at desc);
create index if not exists bookings_status_created_idx
  on public.bookings (status, created_at desc);
create table if not exists public.rider_ratings (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  passenger_id uuid not null references public.profiles(id) on delete cascade,
  driver_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

create index if not exists rider_ratings_driver_idx
  on public.rider_ratings (driver_id);
create index if not exists rider_ratings_passenger_idx
  on public.rider_ratings (passenger_id);

alter table public.rider_ratings enable row level security;
grant select, insert on public.rider_ratings to authenticated;

drop policy if exists "Users read related rider ratings" on public.rider_ratings;
create policy "Users read related rider ratings"
on public.rider_ratings for select to authenticated
using (
  passenger_id = (select auth.uid())
  or driver_id = (select auth.uid())
  or exists (
    select 1 from public.bookings b
    where b.passenger_id = (select auth.uid())
      and b.driver_id = rider_ratings.driver_id
  )
);

drop policy if exists "Passengers rate completed rides" on public.rider_ratings;
create policy "Passengers rate completed rides"
on public.rider_ratings for insert to authenticated
with check (
  passenger_id = (select auth.uid())
  and exists (
    select 1 from public.bookings b
    where b.id = booking_id
      and b.passenger_id = (select auth.uid())
      and b.driver_id = rider_ratings.driver_id
      and b.status = 'completed'
  )
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'bookings'
  ) then
    alter publication supabase_realtime add table public.bookings;
  end if;
end $$;
