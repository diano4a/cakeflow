-- Product types carry a machine-readable measurement mode. Weight stays an
-- order-specific number. Fillings become a bakery-scoped junction so an
-- order can have zero, one, or many catalog fillings.

alter table public.catalog_options
  add column measurement_mode text;

alter table public.catalog_options
  add constraint catalog_options_measurement_mode_allowed
  check (
    measurement_mode is null
    or measurement_mode in ('size_and_weight', 'quantity')
  );

-- Existing product types used the previous implicit size+weight model.
update public.catalog_options
set measurement_mode = 'size_and_weight'
where kind = 'product_type'
  and measurement_mode is null;

alter table public.catalog_options
  add constraint catalog_options_measurement_mode_by_kind
  check (
    (kind = 'product_type' and measurement_mode is not null)
    or (kind <> 'product_type' and measurement_mode is null)
  );

alter table public.orders
  add column quantity integer;

alter table public.orders
  add constraint orders_quantity_positive
  check (quantity is null or quantity > 0);

create table public.order_fillings (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries (id) on delete cascade,
  order_id uuid not null,
  catalog_option_id uuid not null,
  created_at timestamptz not null default now(),
  unique (order_id, catalog_option_id),
  unique (id, bakery_id),
  foreign key (order_id, bakery_id)
    references public.orders (id, bakery_id)
    on delete cascade,
  foreign key (catalog_option_id, bakery_id)
    references public.catalog_options (id, bakery_id)
);

create index order_fillings_order_id_idx
  on public.order_fillings (order_id);

create index order_fillings_bakery_id_idx
  on public.order_fillings (bakery_id);

create or replace function private.order_fillings_must_be_filling()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.catalog_options
    where id = new.catalog_option_id
      and bakery_id = new.bakery_id
      and kind = 'filling'
  ) then
    raise exception 'order filling must reference a filling catalog option'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger order_fillings_must_be_filling
  before insert or update on public.order_fillings
  for each row
  execute function private.order_fillings_must_be_filling();

insert into public.order_fillings (bakery_id, order_id, catalog_option_id)
select orders.bakery_id, orders.id, options.id
from public.orders
join public.catalog_options as options
  on options.bakery_id = orders.bakery_id
  and options.kind = 'filling'
  and options.name = orders.filling
where orders.filling is not null
  and length(trim(orders.filling)) > 0
on conflict (order_id, catalog_option_id) do nothing;

alter table public.orders
  drop column filling;

alter table public.order_fillings enable row level security;

create policy order_fillings_select_members on public.order_fillings
  for select to authenticated
  using ((select private.is_bakery_member(bakery_id)));

create policy order_fillings_insert_managers on public.order_fillings
  for insert to authenticated
  with check ((select private.has_bakery_role(bakery_id, array['owner', 'manager'])));

create policy order_fillings_delete_managers on public.order_fillings
  for delete to authenticated
  using ((select private.has_bakery_role(bakery_id, array['owner', 'manager'])));

revoke all on public.order_fillings from anon;
grant select, insert, delete on public.order_fillings to authenticated;
