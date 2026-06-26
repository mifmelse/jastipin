-- Public 'media' bucket for uploads (receipts, moment photos/videos).
-- Public read (direct URL); authenticated may upload/update/delete.

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media authenticated insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media');

create policy "media authenticated update"
  on storage.objects for update to authenticated
  using (bucket_id = 'media');

create policy "media authenticated delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media');

create policy "media public read"
  on storage.objects for select to public
  using (bucket_id = 'media');
