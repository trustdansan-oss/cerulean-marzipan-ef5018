-- National Way cross-device sync setup (TEST ONLY)
-- This matches the current frontend's storage model: one row (id=1) containing a JSONB shipments array.
-- WARNING: the browser app uses a publishable key without user authentication. These policies let any
-- visitor who knows the project URL/key read or replace the shipment array. Use only with fake test data.
-- Do NOT use these policies for real customer shipment data. Production needs authenticated access and
-- row-level policies, ideally with one database row per shipment.

create table if not exists public.fast_demo_store (
  id integer primary key,
  shipments jsonb not null default '[]'::jsonb
);

alter table public.fast_demo_store enable row level security;

grant select, insert, update on public.fast_demo_store to anon, authenticated;

drop policy if exists "National Way test read shared shipments" on public.fast_demo_store;
drop policy if exists "National Way test insert shared shipments" on public.fast_demo_store;
drop policy if exists "National Way test update shared shipments" on public.fast_demo_store;

create policy "National Way test read shared shipments"
  on public.fast_demo_store for select to anon, authenticated
  using (id = 1);

create policy "National Way test insert shared shipments"
  on public.fast_demo_store for insert to anon, authenticated
  with check (id = 1);

create policy "National Way test update shared shipments"
  on public.fast_demo_store for update to anon, authenticated
  using (id = 1) with check (id = 1);

insert into public.fast_demo_store (id, shipments)
values (1, '[]'::jsonb)
on conflict (id) do nothing;

-- Read-only verification query. It returns any test shipment with this tracking number.
select item->>'tracking' as tracking,
       item->>'tracking_number' as tracking_number,
       item->>'trackingCode' as tracking_code,
       item->>'status' as status,
       item as full_record
from public.fast_demo_store s
cross join lateral jsonb_array_elements(s.shipments) as item
where s.id = 1
  and upper(coalesce(item->>'tracking', item->>'tracking_number', item->>'trackingCode', '')) = 'NW-TEST-001';
