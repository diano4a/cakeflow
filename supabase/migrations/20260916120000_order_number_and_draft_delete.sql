-- Human-readable bakery-scoped order numbers, and restrict hard-delete
-- to draft orders. Non-draft lifecycle states must not be destroyed from
-- the Orders UI; cancellation is a separate status change.

alter table public.orders
  add column order_number integer;

with numbered as (
  select
    id,
    1000 + row_number() over (
      partition by bakery_id
      order by created_at, id
    ) as next_number
  from public.orders
)
update public.orders as orders
set order_number = numbered.next_number
from numbered
where orders.id = numbered.id;

alter table public.orders
  alter column order_number set not null;

alter table public.orders
  add constraint orders_bakery_id_order_number_key
  unique (bakery_id, order_number);

create or replace function private.next_order_number(p_bakery_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_n integer;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('orders.order_number'),
    pg_catalog.hashtext(p_bakery_id::text)
  );

  select coalesce(max(orders.order_number), 1000) + 1
    into next_n
  from public.orders as orders
  where orders.bakery_id = p_bakery_id;

  return next_n;
end;
$$;

create or replace function private.orders_assign_order_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.order_number is null then
    new.order_number := private.next_order_number(new.bakery_id);
  end if;
  return new;
end;
$$;

revoke execute on function private.next_order_number(uuid) from public, anon, authenticated;
revoke execute on function private.orders_assign_order_number() from public, anon, authenticated;

create trigger orders_assign_order_number
  before insert on public.orders
  for each row
  execute function private.orders_assign_order_number();

drop policy orders_delete_managers on public.orders;

create policy orders_delete_managers on public.orders
  for delete to authenticated
  using (
    status = 'draft'
    and (select private.has_bakery_role(bakery_id, array['owner', 'manager']))
  );
