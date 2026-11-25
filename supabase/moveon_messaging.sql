-- Run after moveon_setup.sql and moveon_booking_workflow.sql.
-- Adds private passenger/driver chat for an assigned booking.

create table if not exists public.booking_messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists booking_messages_booking_created_idx
  on public.booking_messages (booking_id, created_at asc);

alter table public.booking_messages enable row level security;
grant select, insert on public.booking_messages to authenticated;

drop policy if exists "Booking participants read messages" on public.booking_messages;
create policy "Booking participants read messages"
on public.booking_messages for select to authenticated
using (
  exists (
    select 1 from public.bookings b
    where b.id = booking_messages.booking_id
      and (
        b.passenger_id = (select auth.uid())
        or b.driver_id = (select auth.uid())
      )
  )
);

drop policy if exists "Assigned booking participants send messages" on public.booking_messages;
create policy "Assigned booking participants send messages"
on public.booking_messages for insert to authenticated
with check (
  sender_id = (select auth.uid())
  and exists (
    select 1 from public.bookings b
    where b.id = booking_messages.booking_id
      and b.status in ('accepted', 'arrived', 'in_progress', 'completed')
      and (
        b.passenger_id = (select auth.uid())
        or b.driver_id = (select auth.uid())
      )
  )
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'booking_messages'
  ) then
    alter publication supabase_realtime add table public.booking_messages;
  end if;
end $$;
