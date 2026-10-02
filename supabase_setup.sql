-- ACCESTECH PRO: run once in Supabase SQL Editor.
-- Then create the admin account in Supabase Authentication > Users.
create table if not exists public.products (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 category text not null default 'ACCESSOIRES',
 badge text default '',
 image_url text default '',
 description text default '',
 price numeric(10,2) not null default 0,
 active boolean not null default true,
 sort_order integer not null default 100,
 created_at timestamptz not null default now(),
 unique(name)
);

alter table public.products enable row level security;
drop policy if exists "products_public_read" on public.products;
drop policy if exists "products_admin_all" on public.products;
create policy "products_public_read" on public.products for select using (active = true);
create policy "products_admin_all" on public.products for all to authenticated using (true) with check (true);

-- Seed the catalog selected for ACCESTECH PRO. Prices are intentionally 0 until you edit them in Admin.
insert into public.products (name,category,badge,price,sort_order) values
('Câble Type-C','ACCESSOIRES','TYPE-C',0,10),('Câble Type-C → Lightning','ACCESSOIRES','LIGHTNING',0,20),('Câble 3-en-1','ACCESSOIRES','3-IN-1',0,30),
('Chargeur rapide 20W','POWER','20W',0,40),('Chargeur rapide 25W','POWER','25W',0,50),('Chargeur voiture USB','CAR','CAR',0,60),('Support téléphone voiture','CAR','HOLDER',0,70),
('Écouteurs filaires','AUDIO','AUDIO',0,80),('Écouteurs Bluetooth','AUDIO','BT',0,90),('Mini enceinte Bluetooth','AUDIO','SPEAKER',0,100),('Power Bank 10 000 mAh','POWER','10K',0,110),
('Hub USB','ACCESSOIRES','USB HUB',0,120),('Clé USB','ACCESSOIRES','USB',0,130),('Ruban LED RGB 5 m','RGB','RGB 5M',0,140),('Ruban LED RGB 10 m','RGB','RGB 10M',0,150),
('Ruban LED RGBIC','RGB','RGBIC',0,160),('Éclairage RGB voiture','RGB','RGB CAR',0,170),('Lampe RGB gaming / bureau','RGB','RGB DESK',0,180),('Contrôleur RGB','RGB','RGB CTRL',0,190),('Gadget électronique','GADGETS','GADGET',0,200),('Accessoire gaming','GAMING','GAMING',0,210)
on conflict (name) do nothing;

-- IMPORTANT: your existing orders table must allow the authenticated admin to read/update it.
alter table public.orders enable row level security;
drop policy if exists "orders_admin_read" on public.orders;
drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_read" on public.orders for select to authenticated using (true);
create policy "orders_admin_update" on public.orders for update to authenticated using (true) with check (true);
