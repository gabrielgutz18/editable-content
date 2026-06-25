create table if not exists public.site_content (
  id text primary key,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

create policy "Anyone can read site content"
on public.site_content
for select
using (true);

create policy "Authenticated users can manage site content"
on public.site_content
for all
to authenticated
using (true)
with check (true);

insert into public.site_content (id, content)
values ('homepage', '{}'::jsonb)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do nothing;

create policy "Anyone can read site images"
on storage.objects
for select
using (bucket_id = 'site-images');

create policy "Authenticated users can upload site images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'site-images');
