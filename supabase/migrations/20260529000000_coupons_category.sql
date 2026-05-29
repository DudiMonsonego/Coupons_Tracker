alter table public.coupons
add column if not exists category text;

comment on column public.coupons.category is
  'Category id: food, shopping, entertainment, fashion, tech, travel, health, home, other';
