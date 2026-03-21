import { formatISO, subDays } from 'date-fns'

function toIsoDate(d) {
  return formatISO(d, { representation: 'date' })
}

export async function fetchMlDailyForecast(pool, { startDate, days, mlServiceUrl }) {
  const historyStart = subDays(startDate, 90)
  const historyEnd = subDays(startDate, 1)

  const { rows } = await pool.query(
    `
    select sale_date as date, outlet, dish, sum(quantity)::float as quantity
    from sales
    where sale_date between $1 and $2
    group by sale_date, outlet, dish
    order by sale_date asc
    `,
    [toIsoDate(historyStart), toIsoDate(historyEnd)]
  )

  const history = rows.map((r) => ({
    date: toIsoDate(r.date),
    outlet: r.outlet,
    dish: r.dish,
    quantity: Number(r.quantity)
  }))

  const url = `${mlServiceUrl.replace(/\/+$/, '')}/predict`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ history, start_date: toIsoDate(startDate), horizon_days: days })
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `ML service error: ${res.status}`)
  }

  const json = await res.json()
  return json.rows ?? []
}

