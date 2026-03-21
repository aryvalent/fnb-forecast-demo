create table if not exists sales (
  id bigserial primary key,
  sale_date date not null,
  outlet text not null,
  dish text not null,
  quantity integer not null check (quantity >= 0),
  channel text not null,
  created_at timestamptz not null default now(),
  unique (sale_date, outlet, dish, channel)
);

create index if not exists idx_sales_date on sales (sale_date);
create index if not exists idx_sales_outlet_dish on sales (outlet, dish);

create table if not exists ingredients (
  ingredient text primary key,
  shelf_life_days integer not null,
  unit text not null
);

create table if not exists recipes (
  dish text not null,
  ingredient text not null references ingredients(ingredient) on delete cascade,
  qty_per_dish numeric not null check (qty_per_dish >= 0),
  primary key (dish, ingredient)
);

create table if not exists stock (
  outlet text not null,
  ingredient text not null references ingredients(ingredient) on delete cascade,
  current_stock numeric not null check (current_stock >= 0),
  updated_at timestamptz not null default now(),
  primary key (outlet, ingredient)
);

