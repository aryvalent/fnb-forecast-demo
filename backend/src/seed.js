import 'dotenv/config'
import { createPool, withClient } from './db.js'
import { initDb } from './initDb.js'
import { ingredients, outlets, recipes, seededStockValue } from './demoData.js'

async function main() {
  const pool = createPool()
  await initDb(pool)

  await withClient(pool, async (client) => {
    await client.query('begin')
    try {
      for (const ing of ingredients) {
        await client.query(
          'insert into ingredients (ingredient, shelf_life_days, unit) values ($1, $2, $3) on conflict (ingredient) do nothing',
          [ing.ingredient, ing.shelf_life_days, ing.unit]
        )
      }

      for (const r of recipes) {
        await client.query(
          'insert into recipes (dish, ingredient, qty_per_dish) values ($1, $2, $3) on conflict (dish, ingredient) do update set qty_per_dish = excluded.qty_per_dish',
          [r.dish, r.ingredient, r.qty_per_dish]
        )
      }

      for (const outlet of outlets) {
        for (const ing of ingredients) {
          const currentStock = seededStockValue(ing.ingredient, outlet)
          await client.query(
            'insert into stock (outlet, ingredient, current_stock) values ($1, $2, $3) on conflict (outlet, ingredient) do update set current_stock = excluded.current_stock, updated_at = now()',
            [outlet, ing.ingredient, currentStock]
          )
        }
      }

      await client.query('commit')
    } catch (e) {
      await client.query('rollback')
      throw e
    }
  })

  await pool.end()
}

main().catch((e) => {
  process.stderr.write(`${e?.stack ?? e}\n`)
  process.exit(1)
})
