export const outlets = ['Downtown', 'Marina', 'Uptown', 'Airport']

export const ingredients = [
  { ingredient: 'chicken_breast', shelf_life_days: 3, unit: 'kg' },
  { ingredient: 'beef_patty', shelf_life_days: 3, unit: 'kg' },
  { ingredient: 'fish_fillet', shelf_life_days: 2, unit: 'kg' },
  { ingredient: 'rice', shelf_life_days: 180, unit: 'kg' },
  { ingredient: 'noodles', shelf_life_days: 120, unit: 'kg' },
  { ingredient: 'spaghetti', shelf_life_days: 180, unit: 'kg' },
  { ingredient: 'pizza_dough', shelf_life_days: 5, unit: 'kg' },
  { ingredient: 'lettuce', shelf_life_days: 4, unit: 'kg' },
  { ingredient: 'tomato', shelf_life_days: 5, unit: 'kg' },
  { ingredient: 'onion', shelf_life_days: 30, unit: 'kg' },
  { ingredient: 'garlic', shelf_life_days: 60, unit: 'kg' },
  { ingredient: 'cheese', shelf_life_days: 14, unit: 'kg' },
  { ingredient: 'eggs', shelf_life_days: 21, unit: 'pcs' },
  { ingredient: 'flour', shelf_life_days: 180, unit: 'kg' },
  { ingredient: 'tortilla', shelf_life_days: 10, unit: 'pcs' },
  { ingredient: 'burger_bun', shelf_life_days: 5, unit: 'pcs' },
  { ingredient: 'wrap', shelf_life_days: 10, unit: 'pcs' },
  { ingredient: 'cooking_oil', shelf_life_days: 365, unit: 'l' },
  { ingredient: 'soy_sauce', shelf_life_days: 365, unit: 'l' },
  { ingredient: 'lime', shelf_life_days: 14, unit: 'kg' },
  { ingredient: 'basil', shelf_life_days: 7, unit: 'kg' },
  { ingredient: 'mushroom', shelf_life_days: 7, unit: 'kg' }
]

export const recipes = [
  { dish: 'Chicken Rice Bowl', ingredient: 'chicken_breast', qty_per_dish: 0.18 },
  { dish: 'Chicken Rice Bowl', ingredient: 'rice', qty_per_dish: 0.12 },
  { dish: 'Chicken Rice Bowl', ingredient: 'soy_sauce', qty_per_dish: 0.01 },
  { dish: 'Beef Burger', ingredient: 'beef_patty', qty_per_dish: 0.16 },
  { dish: 'Beef Burger', ingredient: 'burger_bun', qty_per_dish: 1 },
  { dish: 'Beef Burger', ingredient: 'cheese', qty_per_dish: 0.03 },
  { dish: 'Beef Burger', ingredient: 'tomato', qty_per_dish: 0.04 },
  { dish: 'Beef Burger', ingredient: 'onion', qty_per_dish: 0.02 },
  { dish: 'Veggie Salad', ingredient: 'lettuce', qty_per_dish: 0.12 },
  { dish: 'Veggie Salad', ingredient: 'tomato', qty_per_dish: 0.06 },
  { dish: 'Veggie Salad', ingredient: 'onion', qty_per_dish: 0.02 },
  { dish: 'Veggie Salad', ingredient: 'cooking_oil', qty_per_dish: 0.01 },
  { dish: 'Spaghetti Bolognese', ingredient: 'spaghetti', qty_per_dish: 0.12 },
  { dish: 'Spaghetti Bolognese', ingredient: 'beef_patty', qty_per_dish: 0.1 },
  { dish: 'Spaghetti Bolognese', ingredient: 'tomato', qty_per_dish: 0.08 },
  { dish: 'Spaghetti Bolognese', ingredient: 'garlic', qty_per_dish: 0.005 },
  { dish: 'Fish Tacos', ingredient: 'fish_fillet', qty_per_dish: 0.14 },
  { dish: 'Fish Tacos', ingredient: 'tortilla', qty_per_dish: 2 },
  { dish: 'Fish Tacos', ingredient: 'lime', qty_per_dish: 0.02 },
  { dish: 'Fried Rice', ingredient: 'rice', qty_per_dish: 0.14 },
  { dish: 'Fried Rice', ingredient: 'eggs', qty_per_dish: 1 },
  { dish: 'Fried Rice', ingredient: 'soy_sauce', qty_per_dish: 0.01 },
  { dish: 'Ramen', ingredient: 'noodles', qty_per_dish: 0.13 },
  { dish: 'Ramen', ingredient: 'chicken_breast', qty_per_dish: 0.12 },
  { dish: 'Ramen', ingredient: 'garlic', qty_per_dish: 0.004 },
  { dish: 'Grilled Chicken Plate', ingredient: 'chicken_breast', qty_per_dish: 0.22 },
  { dish: 'Grilled Chicken Plate', ingredient: 'lettuce', qty_per_dish: 0.05 },
  { dish: 'Grilled Chicken Plate', ingredient: 'lime', qty_per_dish: 0.02 },
  { dish: 'Caesar Wrap', ingredient: 'wrap', qty_per_dish: 1 },
  { dish: 'Caesar Wrap', ingredient: 'chicken_breast', qty_per_dish: 0.14 },
  { dish: 'Caesar Wrap', ingredient: 'lettuce', qty_per_dish: 0.07 },
  { dish: 'Margherita Pizza', ingredient: 'pizza_dough', qty_per_dish: 0.18 },
  { dish: 'Margherita Pizza', ingredient: 'cheese', qty_per_dish: 0.12 },
  { dish: 'Margherita Pizza', ingredient: 'tomato', qty_per_dish: 0.1 },
  { dish: 'Margherita Pizza', ingredient: 'basil', qty_per_dish: 0.005 },
  { dish: 'Pad Thai', ingredient: 'noodles', qty_per_dish: 0.14 },
  { dish: 'Pad Thai', ingredient: 'eggs', qty_per_dish: 1 },
  { dish: 'Pad Thai', ingredient: 'soy_sauce', qty_per_dish: 0.01 },
  { dish: 'Beef Rice Bowl', ingredient: 'beef_patty', qty_per_dish: 0.16 },
  { dish: 'Beef Rice Bowl', ingredient: 'rice', qty_per_dish: 0.12 },
  { dish: 'Beef Rice Bowl', ingredient: 'onion', qty_per_dish: 0.02 },
  { dish: 'Mushroom Pizza', ingredient: 'pizza_dough', qty_per_dish: 0.18 },
  { dish: 'Mushroom Pizza', ingredient: 'cheese', qty_per_dish: 0.1 },
  { dish: 'Mushroom Pizza', ingredient: 'mushroom', qty_per_dish: 0.12 }
]

export function seededStockValue(ingredient, outlet) {
  const raw = [...`${ingredient}:${outlet}`].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  const base = (raw % 17) + 8
  return base
}

