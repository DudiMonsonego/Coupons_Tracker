alter table public.coupons
add column if not exists coupon_value numeric(10, 2),
add column if not exists coupon_cost numeric(10, 2),
add column if not exists brand_name text,
add column if not exists logo_url text;

comment on column public.coupons.coupon_value is 'Benefit / face value in ILS';
comment on column public.coupons.coupon_cost is 'Price paid to obtain or use the coupon in ILS';
comment on column public.coupons.logo_url is 'Optional external brand logo URL (e.g. Clearbit)';
