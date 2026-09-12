-- Many-to-many: which fillings a product type may use. IDs only — never names.
-- Composite FKs keep both sides inside the same bakery.

create table public.product_type_fillings (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries (id) on delete cascade,
  product_type_id uuid not null,
  filling_id uuid not null,
  created_at timestamptz not null default now(),
  unique (bakery_id, product_type_id, filling_id),
  unique (id, bakery_id),
  foreign key (bakery_id, product_type_id)
    references public.catalog_options (bakery_id, id)
    on delete cascade,
  foreign key (bakery_id, filling_id)
    references public.catalog_options (bakery_id, id)
    on delete cascade
);

create index product_type_fillings_bakery_id_idx
  on public.product_type_fillings (bakery_id);

create index product_type_fillings_product_type_id_idx
  on public.product_type_fillings (product_type_id);

create index product_type_fillings_filling_id_idx
  on public.product_type_fillings (filling_id);

create or replace function private.product_type_fillings_must_match_kinds()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.catalog_options
    where id = new.product_type_id
      and bakery_id = new.bakery_id
      and kind = 'product_type'
  ) then
    raise exception 'product_type_fillings.product_type_id must be a product type'
      using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.catalog_options
    where id = new.filling_id
      and bakery_id = new.bakery_id
      and kind = 'filling'
  ) then
    raise exception 'product_type_fillings.filling_id must be a filling'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger product_type_fillings_must_match_kinds
  before insert or update on public.product_type_fillings
  for each row
  execute function private.product_type_fillings_must_match_kinds();

-- Previous MVP treated every filling as available for every product type.
insert into public.product_type_fillings (bakery_id, product_type_id, filling_id)
select product_types.bakery_id, product_types.id, fillings.id
from public.catalog_options as product_types
join public.catalog_options as fillings
  on fillings.bakery_id = product_types.bakery_id
  and fillings.kind = 'filling'
where product_types.kind = 'product_type'
on conflict (bakery_id, product_type_id, filling_id) do nothing;

create or replace function private.order_fillings_must_match_product_type()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.orders
    join public.catalog_options as product_type
      on product_type.bakery_id = orders.bakery_id
      and product_type.kind = 'product_type'
      and product_type.name = orders.product_type
      and product_type.is_active
    join public.product_type_fillings as allowed
      on allowed.bakery_id = orders.bakery_id
      and allowed.product_type_id = product_type.id
      and allowed.filling_id = new.catalog_option_id
    where orders.id = new.order_id
      and orders.bakery_id = new.bakery_id
  ) then
    raise exception 'order filling is not available for this product type'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger order_fillings_must_match_product_type
  before insert or update on public.order_fillings
  for each row
  execute function private.order_fillings_must_match_product_type();

alter table public.product_type_fillings enable row level security;

create policy product_type_fillings_select_members on public.product_type_fillings
  for select to authenticated
  using ((select private.is_bakery_member(bakery_id)));

create policy product_type_fillings_insert_managers on public.product_type_fillings
  for insert to authenticated
  with check ((select private.has_bakery_role(bakery_id, array['owner', 'manager'])));

create policy product_type_fillings_delete_managers on public.product_type_fillings
  for delete to authenticated
  using ((select private.has_bakery_role(bakery_id, array['owner', 'manager'])));

revoke all on public.product_type_fillings from anon;
grant select, insert, delete on public.product_type_fillings to authenticated;
