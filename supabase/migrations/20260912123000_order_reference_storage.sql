-- Private bucket for order reference images. Object paths are
-- {bakery_id}/{order_id}/{file} so storage policies can isolate tenants
-- without reading public.order_references from storage.objects.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'order-references',
  'order-references',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create or replace function private.order_reference_bakery_id(object_name text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when split_part(object_name, '/', 1)
      ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then split_part(object_name, '/', 1)::uuid
    else null
  end;
$$;

revoke execute on function private.order_reference_bakery_id(text) from public, anon;
grant execute on function private.order_reference_bakery_id(text) to authenticated;

create policy order_references_storage_select_members
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'order-references'
    and (select private.is_bakery_member(private.order_reference_bakery_id(name)))
  );

create policy order_references_storage_insert_managers
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'order-references'
    and (
      select private.has_bakery_role(
        private.order_reference_bakery_id(name),
        array['owner', 'manager']
      )
    )
  );

create policy order_references_storage_update_managers
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'order-references'
    and (
      select private.has_bakery_role(
        private.order_reference_bakery_id(name),
        array['owner', 'manager']
      )
    )
  )
  with check (
    bucket_id = 'order-references'
    and (
      select private.has_bakery_role(
        private.order_reference_bakery_id(name),
        array['owner', 'manager']
      )
    )
  );

create policy order_references_storage_delete_managers
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'order-references'
    and (
      select private.has_bakery_role(
        private.order_reference_bakery_id(name),
        array['owner', 'manager']
      )
    )
  );
