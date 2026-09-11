-- Reusable bakery catalog options for order fields (product type, filling,
-- shape, size). Options are deactivated rather than deleted so historical
-- order text is never orphaned. New orders should only be offered rows
-- where is_active is true.

create table public.catalog_options (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries (id) on delete cascade,
  kind text not null check (kind in ('product_type', 'filling', 'shape', 'size')),
  name text not null check (length(trim(name)) > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (bakery_id, id)
);

create index catalog_options_bakery_id_kind_idx
  on public.catalog_options (bakery_id, kind, created_at);

-- The same label may exist as an inactive row and a new active row, so
-- existing orders that stored the name as text stay valid after deactivate.
create unique index catalog_options_active_name_idx
  on public.catalog_options (bakery_id, kind, name)
  where is_active;

alter table public.catalog_options enable row level security;

create policy catalog_options_select_members on public.catalog_options
  for select to authenticated
  using ((select private.is_bakery_member(bakery_id)));

create policy catalog_options_insert_managers on public.catalog_options
  for insert to authenticated
  with check ((select private.has_bakery_role(bakery_id, array['owner', 'manager'])));

create policy catalog_options_update_managers on public.catalog_options
  for update to authenticated
  using ((select private.has_bakery_role(bakery_id, array['owner', 'manager'])))
  with check ((select private.has_bakery_role(bakery_id, array['owner', 'manager'])));

revoke all on public.catalog_options from anon;
grant select, insert, update on public.catalog_options to authenticated;
