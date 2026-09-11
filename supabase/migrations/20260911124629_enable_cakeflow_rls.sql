-- Row Level Security for CakeFlow tenant-owned data.
--
-- Membership is resolved through SECURITY DEFINER helpers in the private
-- schema. They are required because a policy on bakery_members that queried
-- bakery_members directly would recurse infinitely.
--
-- Postgres runs policy expressions with the privileges of the querying user,
-- so `authenticated` must be able to execute these helpers. That is safe here:
-- each helper filters on auth.uid() internally, so a caller can only ever
-- learn about their own membership. EXECUTE stays revoked from anon/public.

-- Helpers -------------------------------------------------------------------

create or replace function private.is_bakery_member(target_bakery_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.bakery_members m
    where m.bakery_id = target_bakery_id
      and m.user_id = (select auth.uid())
  );
$$;

create or replace function private.has_bakery_role(
  target_bakery_id uuid,
  allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.bakery_members m
    where m.bakery_id = target_bakery_id
      and m.user_id = (select auth.uid())
      and m.role = any (allowed_roles)
  );
$$;

-- Ownership straight off the bakeries row, needed while a newly created bakery
-- still has no membership rows. Reading bakeries from inside a policy would
-- otherwise be filtered by the bakeries policies themselves.
create or replace function private.owns_bakery_record(target_bakery_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.bakeries b
    where b.id = target_bakery_id
      and b.owner_id = (select auth.uid())
  );
$$;

-- True when the given user shares at least one bakery with the caller. Used so
-- teammates can resolve each other's names on orders.
create or replace function private.shares_bakery_with_caller(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.bakery_members mine
    join public.bakery_members theirs on theirs.bakery_id = mine.bakery_id
    where mine.user_id = (select auth.uid())
      and theirs.user_id = target_user_id
  );
$$;

revoke all on schema private from anon, authenticated;
grant usage on schema private to authenticated;

revoke execute on function private.is_bakery_member(uuid) from public, anon;
revoke execute on function private.has_bakery_role(uuid, text[]) from public, anon;
revoke execute on function private.owns_bakery_record(uuid) from public, anon;
revoke execute on function private.shares_bakery_with_caller(uuid) from public, anon;

grant execute on function private.is_bakery_member(uuid) to authenticated;
grant execute on function private.has_bakery_role(uuid, text[]) to authenticated;
grant execute on function private.owns_bakery_record(uuid) to authenticated;
grant execute on function private.shares_bakery_with_caller(uuid) to authenticated;

-- Enable RLS ----------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.bakeries enable row level security;
alter table public.bakery_members enable row level security;
alter table public.catalog_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_references enable row level security;
alter table public.production_checklist_items enable row level security;

-- Profiles ------------------------------------------------------------------

create policy profiles_select_self_or_teammate on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or (select private.shares_bakery_with_caller(id))
  );

create policy profiles_insert_self on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Bakeries ------------------------------------------------------------------

-- owner_id is checked directly so the owner can still read the row in the
-- window between creating a bakery and inserting their membership row.
create policy bakeries_select_members on public.bakeries
  for select to authenticated
  using (
    owner_id = (select auth.uid())
    or (select private.is_bakery_member(id))
  );

-- A user may only create a bakery they own themselves. The owner membership
-- row is inserted by the application straight after.
create policy bakeries_insert_own on public.bakeries
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy bakeries_update_owner on public.bakeries
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy bakeries_delete_owner on public.bakeries
  for delete to authenticated
  using (owner_id = (select auth.uid()));

-- Bakery members ------------------------------------------------------------

create policy bakery_members_select_members on public.bakery_members
  for select to authenticated
  using ((select private.is_bakery_member(bakery_id)));

-- Owners manage every membership row, including the 'owner' role itself. This
-- also covers the bootstrap case, where the owner of a freshly created bakery
-- inserts their own membership row before any membership exists.
create policy bakery_members_insert_owner on public.bakery_members
  for insert to authenticated
  with check (
    (select private.owns_bakery_record(bakery_id))
    or (select private.has_bakery_role(bakery_id, array['owner']))
  );

create policy bakery_members_update_owner on public.bakery_members
  for update to authenticated
  using (
    (select private.owns_bakery_record(bakery_id))
    or (select private.has_bakery_role(bakery_id, array['owner']))
  )
  with check (
    (select private.owns_bakery_record(bakery_id))
    or (select private.has_bakery_role(bakery_id, array['owner']))
  );

create policy bakery_members_delete_owner on public.bakery_members
  for delete to authenticated
  using (
    (select private.owns_bakery_record(bakery_id))
    or (select private.has_bakery_role(bakery_id, array['owner']))
  );

-- Managers may only handle manager/baker rows. The role check appears in both
-- USING (the existing row) and WITH CHECK (the proposed row), so a manager can
-- neither edit an owner's membership nor promote anyone -- themselves included
-- -- to owner.
create policy bakery_members_insert_manager on public.bakery_members
  for insert to authenticated
  with check (
    role in ('manager', 'baker')
    and (select private.has_bakery_role(bakery_id, array['manager']))
  );

create policy bakery_members_update_manager on public.bakery_members
  for update to authenticated
  using (
    role in ('manager', 'baker')
    and (select private.has_bakery_role(bakery_id, array['manager']))
  )
  with check (
    role in ('manager', 'baker')
    and (select private.has_bakery_role(bakery_id, array['manager']))
  );

create policy bakery_members_delete_manager on public.bakery_members
  for delete to authenticated
  using (
    role in ('manager', 'baker')
    and (select private.has_bakery_role(bakery_id, array['manager']))
  );

-- Catalog items -------------------------------------------------------------

create policy catalog_items_select_members on public.catalog_items
  for select to authenticated
  using ((select private.is_bakery_member(bakery_id)));

create policy catalog_items_insert_managers on public.catalog_items
  for insert to authenticated
  with check ((select private.has_bakery_role(bakery_id, array['owner', 'manager'])));

create policy catalog_items_update_managers on public.catalog_items
  for update to authenticated
  using ((select private.has_bakery_role(bakery_id, array['owner', 'manager'])))
  with check ((select private.has_bakery_role(bakery_id, array['owner', 'manager'])));

create policy catalog_items_delete_managers on public.catalog_items
  for delete to authenticated
  using ((select private.has_bakery_role(bakery_id, array['owner', 'manager'])));

-- Orders --------------------------------------------------------------------

create policy orders_select_members on public.orders
  for select to authenticated
  using ((select private.is_bakery_member(bakery_id)));

create policy orders_insert_managers on public.orders
  for insert to authenticated
  with check ((select private.has_bakery_role(bakery_id, array['owner', 'manager'])));

-- Owners and managers may edit any order; a baker may only advance the status
-- of an order assigned to them. RLS cannot express "only these columns
-- changed", so the column restriction is enforced by the trigger below.
create policy orders_update_managers on public.orders
  for update to authenticated
  using ((select private.has_bakery_role(bakery_id, array['owner', 'manager'])))
  with check ((select private.has_bakery_role(bakery_id, array['owner', 'manager'])));

create policy orders_update_assignee on public.orders
  for update to authenticated
  using (
    assignee_id = (select auth.uid())
    and (select private.is_bakery_member(bakery_id))
  )
  with check (
    assignee_id = (select auth.uid())
    and (select private.is_bakery_member(bakery_id))
  );

create policy orders_delete_managers on public.orders
  for delete to authenticated
  using ((select private.has_bakery_role(bakery_id, array['owner', 'manager'])));

-- A baker reaching an order through orders_update_assignee must not be able to
-- rewrite pricing, customer details or the assignment itself. Comparing the
-- whole row as jsonb means columns added later stay protected by default.
create or replace function private.enforce_order_update_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- No end-user session (service role, migrations, server-side jobs).
  if (select auth.uid()) is null then
    return new;
  end if;

  if private.has_bakery_role(old.bakery_id, array['owner', 'manager']) then
    return new;
  end if;

  if (to_jsonb(new) - 'status'::text - 'updated_at'::text)
     is distinct from (to_jsonb(old) - 'status'::text - 'updated_at'::text) then
    raise exception
      'assigned bakers may only change the status of an order'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

revoke execute on function private.enforce_order_update_scope() from public, anon, authenticated;

create trigger orders_enforce_update_scope
  before update on public.orders
  for each row
  execute function private.enforce_order_update_scope();

-- Order references ----------------------------------------------------------

create policy order_references_select_members on public.order_references
  for select to authenticated
  using ((select private.is_bakery_member(bakery_id)));

create policy order_references_insert_managers on public.order_references
  for insert to authenticated
  with check ((select private.has_bakery_role(bakery_id, array['owner', 'manager'])));

create policy order_references_update_managers on public.order_references
  for update to authenticated
  using ((select private.has_bakery_role(bakery_id, array['owner', 'manager'])))
  with check ((select private.has_bakery_role(bakery_id, array['owner', 'manager'])));

create policy order_references_delete_managers on public.order_references
  for delete to authenticated
  using ((select private.has_bakery_role(bakery_id, array['owner', 'manager'])));

-- Production checklist ------------------------------------------------------

create policy production_checklist_items_select_members on public.production_checklist_items
  for select to authenticated
  using ((select private.is_bakery_member(bakery_id)));

create policy production_checklist_items_insert_managers on public.production_checklist_items
  for insert to authenticated
  with check ((select private.has_bakery_role(bakery_id, array['owner', 'manager'])));

-- Any member of the bakery may tick checklist items off during production.
create policy production_checklist_items_update_members on public.production_checklist_items
  for update to authenticated
  using ((select private.is_bakery_member(bakery_id)))
  with check ((select private.is_bakery_member(bakery_id)));

create policy production_checklist_items_delete_managers on public.production_checklist_items
  for delete to authenticated
  using ((select private.has_bakery_role(bakery_id, array['owner', 'manager'])));

-- Data API grants -----------------------------------------------------------
-- New tables are no longer exposed to the Data API automatically, so the
-- authenticated role needs explicit privileges. anon is granted nothing:
-- CakeFlow has no public, unauthenticated data.

grant usage on schema public to authenticated;

-- Local stacks may still auto-expose new tables to the Data API roles, so the
-- anon grants are revoked explicitly. Without this, whether anon reaches these
-- tables depends on the environment rather than on this migration. RLS already
-- blocks anon (every policy is TO authenticated); this makes it deterministic.
revoke all on public.profiles from anon;
revoke all on public.bakeries from anon;
revoke all on public.bakery_members from anon;
revoke all on public.catalog_items from anon;
revoke all on public.orders from anon;
revoke all on public.order_references from anon;
revoke all on public.production_checklist_items from anon;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.bakeries to authenticated;
grant select, insert, update, delete on public.bakery_members to authenticated;
grant select, insert, update, delete on public.catalog_items to authenticated;
grant select, insert, update, delete on public.orders to authenticated;
grant select, insert, update, delete on public.order_references to authenticated;
grant select, insert, update, delete on public.production_checklist_items to authenticated;
