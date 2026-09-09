-- Fictional demo records for FindJos. Use only after running schema.sql.
-- These names, contacts, and locations are mock data for product testing.

insert into public.businesses (category_id, name, slug, description, area, landmark, hours, tags, accent, status, verified, featured, source)
select c.id, seed.name, seed.slug, seed.description, 'Terminus', seed.landmark, jsonb_build_object('closing', seed.closing), seed.tags, seed.accent, 'published', seed.verified, seed.featured, 'demo-seed'
from (values
  ('Terminus Mobile Hub', 'terminus-mobile-hub-demo', 'Phones, accessories and honest device advice.', 'Ahmadu Bello Way', '19:00', array['iphone','android','accessories','phone'], 'coral', true, true),
  ('Plateau Laptop Clinic', 'plateau-laptop-clinic-demo', 'Laptop repairs, upgrades and reliable diagnostics.', 'Terminus Roundabout', '18:00', array['laptop','repair','computer','macbook'], 'blue', true, false),
  ('Highland Grills', 'highland-grills-demo', 'Smoky grills, jollof and quick bites made fresh.', 'Terminus Market gate', '22:00', array['suya','food','jollof','restaurant'], 'yellow', false, true),
  ('CityPrint Jos', 'cityprint-jos-demo', 'Fast printing, branding and graphic design.', 'Ahmadu Bello Way', '17:30', array['printing','design','branding','services'], 'green', false, false),
  ('Northline Fitness', 'northline-fitness-demo', 'A focused gym for strength, movement and community.', 'Terminus commercial district', '21:00', array['gym','fitness','health','workout'], 'purple', false, false),
  ('Jos Home Studio', 'jos-home-studio-demo', 'Thoughtful furniture and decor for modern homes.', 'Terminus Market', '18:00', array['furniture','home','decor','chairs'], 'orange', false, false)
) as seed(name, slug, description, landmark, closing, tags, accent, verified, featured)
join public.categories c on c.name = case
  when seed.name in ('Terminus Mobile Hub', 'Plateau Laptop Clinic') then 'Phones & Tech'
  when seed.name = 'Highland Grills' then 'Food & Dining'
  when seed.name = 'CityPrint Jos' then 'Services'
  when seed.name = 'Northline Fitness' then 'Health & Fitness'
  else 'Home & Living'
end
on conflict (slug) do nothing;

insert into public.products (business_id, name, description, price, available, status)
select b.id, products.name, products.description, products.price, true, 'published'
from public.businesses b
join (values
  ('terminus-mobile-hub-demo', 'iPhone 13 128GB', 'Like new · Black', '₦650,000'),
  ('terminus-mobile-hub-demo', 'Samsung A55', 'Brand new · 256GB', '₦420,000'),
  ('plateau-laptop-clinic-demo', 'Laptop diagnostics', 'Reliable repair assessment', 'Price on request')
) as products(slug, name, description, price) on products.slug = b.slug
where not exists (
  select 1 from public.products existing
  where existing.business_id = b.id and existing.name = products.name
);
