import { addDays, formatISO, subDays } from 'date-fns'

// Rule-based insight layer (no LLM): converts forecasts + stock signals into client-friendly talking points.
function toIsoDate(d) {
  return formatISO(d, { representation: 'date' })
}

function pctChange(current, previous) {
  const denom = Math.max(previous, 1)
  return ((current - previous) / denom) * 100
}

export async function getActualDishTotals(pool, { startDate, days }) {
  const start = subDays(startDate, days)
  const end = subDays(startDate, 1)
  const { rows } = await pool.query(
    `
    select outlet, dish, sum(quantity)::float as qty
    from sales
    where sale_date between $1 and $2
    group by outlet, dish
    `,
    [toIsoDate(start), toIsoDate(end)]
  )
  const map = new Map()
  for (const r of rows) {
    map.set(`${r.outlet}|||${r.dish}`, Number(r.qty))
  }
  return map
}

export function buildInsights({ startDate, days, dishForecastTotals, ingredientPlan, actualDishTotals, surgePct }) {
  const insights = []

  if (surgePct > 0) {
    insights.push(`Scenario active: weekend surge +${Math.round(surgePct * 100)}%`)
  }

  const totalByDish = new Map()
  const totalByOutlet = new Map()
  for (const r of dishForecastTotals) {
    totalByDish.set(r.dish, (totalByDish.get(r.dish) ?? 0) + Number(r.predicted_quantity ?? 0))
    totalByOutlet.set(r.outlet, (totalByOutlet.get(r.outlet) ?? 0) + Number(r.predicted_quantity ?? 0))
  }

  const topDish = [...totalByDish.entries()].sort((a, b) => b[1] - a[1])[0]
  if (topDish) {
    const [dish, qty] = topDish
    let prev = 0
    for (const [key, v] of actualDishTotals.entries()) {
      const [, d] = key.split('|||')
      if (d === dish) prev += v
    }
    const delta = pctChange(qty, prev)
    const dir = delta >= 0 ? 'increase' : 'decrease'
    insights.push(`${dish} demand is expected to ${dir} by ${Math.abs(delta).toFixed(0)}% vs last 7 days`)
  }

  const topOutlet = [...totalByOutlet.entries()].sort((a, b) => b[1] - a[1])[0]
  if (topOutlet) {
    const [outlet, qty] = topOutlet
    insights.push(`${outlet} is forecasted to have the highest demand (${Math.round(qty)} dish units)`)
  }

  const risky = [...ingredientPlan]
    .filter((r) => r.stockout_risk === 'high')
    .sort((a, b) => (a.days_of_coverage ?? 999) - (b.days_of_coverage ?? 999) || b.recommended_order - a.recommended_order)
    .slice(0, 2)

  for (const r of risky) {
    const cov = r.days_of_coverage == null ? 'unknown' : `${r.days_of_coverage} days`
    insights.push(`${r.ingredient} stock at ${r.outlet} may run out in ${cov}`)
  }

  const weekendStart = addDays(startDate, 0)
  const weekendEnd = addDays(startDate, days - 1)
  const horizon = `${toIsoDate(weekendStart)} → ${toIsoDate(weekendEnd)}`
  insights.push(`Planning window: ${horizon}`)

  return insights.slice(0, 6)
}
