-- Run this migration if schema.sql was already run before persistence was added.
alter table public.businesses add column if not exists cover_image_url text;

create table if not exists public.listing_edits (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  changes jsonb not null,
  status public.claim_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.listing_edits enable row level security;
drop policy if exists "Sellers create businesses" on public.businesses;
drop policy if exists "Sellers update their businesses" on public.businesses;
drop policy if exists "Sellers create draft businesses" on public.businesses;
create policy "Sellers create draft businesses" on public.businesses for insert with check (owner_id = auth.uid() and public.has_role('seller') and status = 'draft');

drop policy if exists "Sellers create listing edits" on public.listing_edits;
drop policy if exists "Sellers read own listing edits" on public.listing_edits;
drop policy if exists "Admins manage listing edits" on public.listing_edits;
create policy "Sellers create listing edits" on public.listing_edits for insert with check (seller_id = auth.uid() and public.has_role('seller') and exists (select 1 from public.businesses where businesses.id = listing_edits.business_id and businesses.owner_id = auth.uid()));
create policy "Sellers read own listing edits" on public.listing_edits for select using (seller_id = auth.uid());
create policy "Admins manage listing edits" on public.listing_edits for all using (public.has_role('admin')) with check (public.has_role('admin'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('business-images', 'business-images', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "Business images are public" on storage.objects;
drop policy if exists "Sellers upload business images" on storage.objects;
drop policy if exists "Owners update business images" on storage.objects;
drop policy if exists "Owners delete business images" on storage.objects;
create policy "Business images are public" on storage.objects for select using (bucket_id = 'business-images');
create policy "Sellers upload business images" on storage.objects for insert to authenticated with check (bucket_id = 'business-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Owners update business images" on storage.objects for update to authenticated using (bucket_id = 'business-images' and owner_id = auth.uid()::text);
create policy "Owners delete business images" on storage.objects for delete to authenticated using (bucket_id = 'business-images' and owner_id = auth.uid()::text);
