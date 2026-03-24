export async function getRecipes(pool) {
  const { rows } = await pool.query(
    'select dish, ingredient, qty_per_dish::float as qty_per_dish from recipes'
  );
  const map = new Map();
  for (const r of rows) {
    const arr = map.get(r.dish) ?? [];
    arr.push({
      ingredient: r.ingredient,
      qty_per_dish: Number(r.qty_per_dish),
    });
    map.set(r.dish, arr);
  }
  return map;
}

export async function getIngredientMeta(pool) {
  const { rows } = await pool.query('select ingredient, shelf_life_days, unit from ingredients');
  const map = new Map();
  for (const r of rows) {
    map.set(r.ingredient, {
      shelf_life_days: Number(r.shelf_life_days),
      unit: r.unit,
    });
  }
  return map;
}

export async function getStockByOutlet(pool) {
  const { rows } = await pool.query(
    'select outlet, ingredient, current_stock::float as current_stock from stock'
  );
  const map = new Map();
  for (const r of rows) {
    const key = `${r.outlet}|||${r.ingredient}`;
    map.set(key, Number(r.current_stock));
  }
  return map;
}

// Ingredient plan = dish forecast × recipe ratios, aggregated per outlet.
// Adds safety stock and a simple shelf-life cap to avoid over-ordering perishables.
export function computeIngredientPlan({
  dishForecastTotals,
  recipeByDish,
  ingredientMeta,
  stockByOutlet,
  safetyStockPct,
  horizonDays,
}) {
  const acc = new Map();

  for (const f of dishForecastTotals) {
    const recipes = recipeByDish.get(f.dish) ?? [];
    for (const r of recipes) {
      const key = `${f.outlet}|||${r.ingredient}`;
      const prev = acc.get(key) ?? {
        outlet: f.outlet,
        ingredient: r.ingredient,
        required_qty: 0,
      };
      prev.required_qty += Number(f.predicted_quantity) * Number(r.qty_per_dish);
      acc.set(key, prev);
    }
  }

  const out = [];
  for (const v of acc.values()) {
    const meta = ingredientMeta.get(v.ingredient) ?? {
      shelf_life_days: null,
      unit: null,
    };
    const stockKey = `${v.outlet}|||${v.ingredient}`;
    const stock = stockByOutlet.get(stockKey) ?? 0;
    const bufferedRequired = v.required_qty * (1 + safetyStockPct);

    const safeHorizonDays = Math.max(1, Number(horizonDays ?? 7));
    const dailyUsage = bufferedRequired / safeHorizonDays;
    const daysOfCoverage = dailyUsage > 0 ? stock / dailyUsage : null;

    const maxStockByShelfLife =
      meta.shelf_life_days != null && Number.isFinite(meta.shelf_life_days)
        ? dailyUsage * Number(meta.shelf_life_days)
        : null;
    const targetStock =
      maxStockByShelfLife == null
        ? bufferedRequired
        : Math.min(bufferedRequired, maxStockByShelfLife);
    const recommended_order_raw = Math.max(0, bufferedRequired - stock);
    const recommended_order = Math.max(0, targetStock - stock);

    let risk = 'low';
    if (recommended_order_raw > 0) {
      risk = 'high';
    } else if (daysOfCoverage != null && daysOfCoverage < 3) {
      risk = 'medium';
    }

    out.push({
      outlet: v.outlet,
      ingredient: v.ingredient,
      unit: meta.unit,
      shelf_life_days: meta.shelf_life_days,
      required_qty: Number(v.required_qty.toFixed(2)),
      safety_stock_pct: safetyStockPct,
      buffered_required_qty: Number(bufferedRequired.toFixed(2)),
      current_stock: Number(stock.toFixed(2)),
      daily_usage: Number(dailyUsage.toFixed(3)),
      days_of_coverage: daysOfCoverage == null ? null : Number(daysOfCoverage.toFixed(1)),
      recommended_order_raw: Math.ceil(recommended_order_raw),
      recommended_order: Math.ceil(recommended_order),
      stockout_risk: risk,
      shelf_life_capped: maxStockByShelfLife != null && bufferedRequired > maxStockByShelfLife,
    });
  }

  out.sort((a, b) => b.recommended_order - a.recommended_order);
  return out;
}
