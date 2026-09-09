-- FindJos MVP schema. Run this once in Supabase SQL Editor.
-- The public client key is safe in the browser; RLS is what protects the data.

create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'seller', 'viewer');
create type public.listing_status as enum ('draft', 'published', 'hidden', 'archived', 'closed');
create type public.claim_status as enum ('pending', 'approved', 'rejected');
create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.app_role not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  icon text,
  created_at timestamptz not null default now()
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text not null default '',
  phone text,
  whatsapp text,
  address text,
  landmark text,
  area text not null default 'Terminus',
  latitude double precision,
  longitude double precision,
  hours jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}',
  accent text not null default 'green',
  status public.listing_status not null default 'draft',
  verified boolean not null default false,
  featured boolean not null default false,
  cover_image_url text,
  source text not null default 'admin',
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text not null default '',
  price text,
  image_url text,
  available boolean not null default true,
  status text not null default 'pending' check (status in ('pending', 'published', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  claimant_id uuid not null references public.profiles(id) on delete cascade,
  message text not null default '',
  status public.claim_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.listing_edits (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  changes jsonb not null,
  status public.claim_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  status public.report_status not null default 'open',
  created_at timestamptz not null default now()
);

create index businesses_status_area_idx on public.businesses(status, area);
create index businesses_owner_idx on public.businesses(owner_id);
create index products_business_idx on public.products(business_id);

-- The helper is security definer so policies can safely check roles without
-- recursively querying profiles through the profile table's own RLS policy.
create or replace function public.has_role(required_role public.app_role)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = required_role);
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data ->> 'full_name',
    case when requested_role = 'seller' then 'seller'::public.app_role else 'viewer'::public.app_role end);
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.businesses enable row level security;
alter table public.products enable row level security;
alter table public.claims enable row level security;
alter table public.listing_edits enable row level security;
alter table public.reports enable row level security;

create policy "Published businesses are public" on public.businesses for select using (status = 'published');
create policy "Categories are public" on public.categories for select using (true);
create policy "Admins manage businesses" on public.businesses for all using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "Sellers read their businesses" on public.businesses for select using (owner_id = auth.uid());
create policy "Sellers create draft businesses" on public.businesses for insert with check (owner_id = auth.uid() and public.has_role('seller') and status = 'draft');

create policy "Users read their profile" on public.profiles for select using (id = auth.uid() or public.has_role('admin'));
-- Profile roles are administrator-controlled. Do not allow a user to update their
-- own row because that would allow a seller to promote itself to admin.

create policy "Public products belong to published businesses" on public.products for select using (exists (select 1 from public.businesses where businesses.id = products.business_id and businesses.status = 'published'));
create policy "Admins manage products" on public.products for all using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "Sellers manage their products" on public.products for all using (exists (select 1 from public.businesses where businesses.id = products.business_id and businesses.owner_id = auth.uid()) and public.has_role('seller')) with check (exists (select 1 from public.businesses where businesses.id = products.business_id and businesses.owner_id = auth.uid()) and public.has_role('seller'));

create policy "Sellers create claims" on public.claims for insert with check (claimant_id = auth.uid() and public.has_role('seller'));
create policy "Users read own claims" on public.claims for select using (claimant_id = auth.uid() or public.has_role('admin'));
create policy "Admins manage claims" on public.claims for all using (public.has_role('admin')) with check (public.has_role('admin'));

create policy "Sellers create listing edits" on public.listing_edits for insert with check (seller_id = auth.uid() and public.has_role('seller') and exists (select 1 from public.businesses where businesses.id = listing_edits.business_id and businesses.owner_id = auth.uid()));
create policy "Sellers read own listing edits" on public.listing_edits for select using (seller_id = auth.uid());
create policy "Admins manage listing edits" on public.listing_edits for all using (public.has_role('admin')) with check (public.has_role('admin'));

create policy "Anyone can report a business" on public.reports for insert with check (reporter_id is null or reporter_id = auth.uid());
create policy "Admins manage reports" on public.reports for all using (public.has_role('admin')) with check (public.has_role('admin'));

insert into public.categories (name, slug, icon) values
  ('Food & Dining', 'food-dining', '◒'),
  ('Phones & Tech', 'phones-tech', '▣'),
  ('Services', 'services', '◈'),
  ('Home & Living', 'home-living', '⌂'),
  ('Health & Fitness', 'health-fitness', '✳')
on conflict (slug) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('business-images', 'business-images', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Business images are public" on storage.objects for select using (bucket_id = 'business-images');
create policy "Sellers upload business images" on storage.objects for insert to authenticated with check (bucket_id = 'business-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Owners update business images" on storage.objects for update to authenticated using (bucket_id = 'business-images' and owner_id = auth.uid()::text);
create policy "Owners delete business images" on storage.objects for delete to authenticated using (bucket_id = 'business-images' and owner_id = auth.uid()::text);

-- After creating your first account, find its UUID in Authentication -> Users,
-- then run: update public.profiles set role = 'admin' where id = 'USER_UUID';
