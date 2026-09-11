-- CakeFlow MVP core schema.
--
-- Every business record is scoped to a bakery (the tenant). Child rows of an
-- order carry their own bakery_id and reference the composite key
-- (id, bakery_id) on orders so a row can never be attached to an order
-- belonging to a different tenant.

create schema if not exists private;

-- Profiles ------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

-- Bakeries ------------------------------------------------------------------

create table public.bakeries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  owner_id uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);

create index bakeries_owner_id_idx on public.bakeries (owner_id);

-- Bakery members ------------------------------------------------------------

create table public.bakery_members (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'baker')),
  created_at timestamptz not null default now(),
  unique (bakery_id, user_id)
);

create index bakery_members_user_id_idx on public.bakery_members (user_id);
create index bakery_members_bakery_id_role_idx on public.bakery_members (bakery_id, role);

-- Catalog items -------------------------------------------------------------

create table public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  product_type text not null,
  base_price numeric(10, 2) check (base_price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (bakery_id, id)
);

create index catalog_items_bakery_id_idx on public.catalog_items (bakery_id);

-- Orders --------------------------------------------------------------------

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries (id) on delete cascade,
  catalog_item_id uuid,

  customer_name text,
  customer_contact text,

  product_type text not null,
  weight_kg numeric(6, 3) check (weight_kg > 0),
  size_note text,
  shape text,
  filling text,
  decoration_notes text,
  inscription text,

  deadline_at timestamptz not null,

  price numeric(10, 2) check (price >= 0),
  prepayment numeric(10, 2) not null default 0 check (prepayment >= 0),

  manager_notes text,
  assignee_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,

  status text not null default 'draft' check (
    status in (
      'draft',
      'submitted',
      'accepted',
      'in_production',
      'ready',
      'completed',
      'cancelled'
    )
  ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Referenced by child tables to keep them inside the same tenant.
  unique (id, bakery_id),
  -- Prepayment can never exceed the agreed price.
  constraint orders_prepayment_within_price check (price is null or prepayment <= price)
);

create index orders_bakery_id_status_idx on public.orders (bakery_id, status);
create index orders_bakery_id_deadline_at_idx on public.orders (bakery_id, deadline_at);
create index orders_assignee_id_idx on public.orders (assignee_id);
create index orders_catalog_item_id_idx on public.orders (catalog_item_id);
create index orders_created_by_idx on public.orders (created_by);

-- A catalog item may only be attached to an order of the same bakery. The
-- constraint is only checked when catalog_item_id is set (MATCH SIMPLE), and
-- in-use catalog items cannot be deleted -- deactivate them with is_active
-- instead, which keeps historical orders intact.
alter table public.orders
  add constraint orders_catalog_item_same_bakery
  foreign key (bakery_id, catalog_item_id)
  references public.catalog_items (bakery_id, id)
  on delete restrict;

-- Order references (inspiration links and uploaded images) ------------------

create table public.order_references (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  bakery_id uuid not null,
  kind text not null default 'image' check (kind in ('image', 'link')),
  storage_path text,
  url text,
  created_at timestamptz not null default now(),

  foreign key (order_id, bakery_id)
    references public.orders (id, bakery_id)
    on delete cascade,
  constraint order_references_target_present check (
    (kind = 'image' and storage_path is not null)
    or (kind = 'link' and url is not null)
  )
);

create index order_references_order_id_idx on public.order_references (order_id);
create index order_references_bakery_id_idx on public.order_references (bakery_id);

-- Production checklist ------------------------------------------------------

create table public.production_checklist_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  bakery_id uuid not null,
  title text not null check (length(trim(title)) > 0),
  position integer not null default 0,
  is_done boolean not null default false,
  created_at timestamptz not null default now(),

  foreign key (order_id, bakery_id)
    references public.orders (id, bakery_id)
    on delete cascade
);

create index production_checklist_items_order_id_idx
  on public.production_checklist_items (order_id);
create index production_checklist_items_bakery_id_idx
  on public.production_checklist_items (bakery_id);

-- Keep orders.updated_at current --------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_set_updated_at
  before update on public.orders
  for each row
  execute function public.set_updated_at();

-- Create a profile row for every new auth user ------------------------------
-- Runs as the function owner because the auth trigger fires outside any
-- end-user session. It only ever inserts the row for the user being created.

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function private.handle_new_user();
