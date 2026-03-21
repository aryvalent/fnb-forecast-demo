create or replace function seeded_stock_value(ingredient text, outlet text)
returns numeric
language plpgsql
as $$
declare
  raw int;
begin
  select coalesce(sum(ascii(ch)), 0)
  into raw
  from regexp_split_to_table(ingredient || ':' || outlet, '') as ch;

  return (raw % 17) + 8;
end;
$$;

insert into ingredients (ingredient, shelf_life_days, unit)
values
  ('chicken_breast', 3, 'kg'),
  ('beef_patty', 3, 'kg'),
  ('fish_fillet', 2, 'kg'),
  ('rice', 180, 'kg'),
  ('noodles', 120, 'kg'),
  ('spaghetti', 180, 'kg'),
  ('pizza_dough', 5, 'kg'),
  ('lettuce', 4, 'kg'),
  ('tomato', 5, 'kg'),
  ('onion', 30, 'kg'),
  ('garlic', 60, 'kg'),
  ('cheese', 14, 'kg'),
  ('eggs', 21, 'pcs'),
  ('flour', 180, 'kg'),
  ('tortilla', 10, 'pcs'),
  ('burger_bun', 5, 'pcs'),
  ('wrap', 10, 'pcs'),
  ('cooking_oil', 365, 'l'),
  ('soy_sauce', 365, 'l'),
  ('lime', 14, 'kg'),
  ('basil', 7, 'kg'),
  ('mushroom', 7, 'kg')
on conflict (ingredient) do update set
  shelf_life_days = excluded.shelf_life_days,
  unit = excluded.unit;

insert into recipes (dish, ingredient, qty_per_dish)
values
  ('Chicken Rice Bowl', 'chicken_breast', 0.18),
  ('Chicken Rice Bowl', 'rice', 0.12),
  ('Chicken Rice Bowl', 'soy_sauce', 0.01),
  ('Beef Burger', 'beef_patty', 0.16),
  ('Beef Burger', 'burger_bun', 1),
  ('Beef Burger', 'cheese', 0.03),
  ('Beef Burger', 'tomato', 0.04),
  ('Beef Burger', 'onion', 0.02),
  ('Veggie Salad', 'lettuce', 0.12),
  ('Veggie Salad', 'tomato', 0.06),
  ('Veggie Salad', 'onion', 0.02),
  ('Veggie Salad', 'cooking_oil', 0.01),
  ('Spaghetti Bolognese', 'spaghetti', 0.12),
  ('Spaghetti Bolognese', 'beef_patty', 0.1),
  ('Spaghetti Bolognese', 'tomato', 0.08),
  ('Spaghetti Bolognese', 'garlic', 0.005),
  ('Fish Tacos', 'fish_fillet', 0.14),
  ('Fish Tacos', 'tortilla', 2),
  ('Fish Tacos', 'lime', 0.02),
  ('Fried Rice', 'rice', 0.14),
  ('Fried Rice', 'eggs', 1),
  ('Fried Rice', 'soy_sauce', 0.01),
  ('Ramen', 'noodles', 0.13),
  ('Ramen', 'chicken_breast', 0.12),
  ('Ramen', 'garlic', 0.004),
  ('Grilled Chicken Plate', 'chicken_breast', 0.22),
  ('Grilled Chicken Plate', 'lettuce', 0.05),
  ('Grilled Chicken Plate', 'lime', 0.02),
  ('Caesar Wrap', 'wrap', 1),
  ('Caesar Wrap', 'chicken_breast', 0.14),
  ('Caesar Wrap', 'lettuce', 0.07),
  ('Margherita Pizza', 'pizza_dough', 0.18),
  ('Margherita Pizza', 'cheese', 0.12),
  ('Margherita Pizza', 'tomato', 0.1),
  ('Margherita Pizza', 'basil', 0.005),
  ('Pad Thai', 'noodles', 0.14),
  ('Pad Thai', 'eggs', 1),
  ('Pad Thai', 'soy_sauce', 0.01),
  ('Beef Rice Bowl', 'beef_patty', 0.16),
  ('Beef Rice Bowl', 'rice', 0.12),
  ('Beef Rice Bowl', 'onion', 0.02),
  ('Mushroom Pizza', 'pizza_dough', 0.18),
  ('Mushroom Pizza', 'cheese', 0.1),
  ('Mushroom Pizza', 'mushroom', 0.12)
on conflict (dish, ingredient) do update set qty_per_dish = excluded.qty_per_dish;

with outlets(outlet) as (
  values ('Downtown'), ('Marina'), ('Uptown'), ('Airport')
)
insert into stock (outlet, ingredient, current_stock)
select o.outlet, i.ingredient, seeded_stock_value(i.ingredient, o.outlet)
from outlets o
cross join ingredients i
on conflict (outlet, ingredient) do update set
  current_stock = excluded.current_stock,
  updated_at = now();

