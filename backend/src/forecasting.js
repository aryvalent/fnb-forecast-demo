import { addDays, formatISO, parseISO, subDays } from 'date-fns'

// Baseline forecasting for demo:
// trailing 4-week average by day-of-week with practical fallbacks (series → dish → outlet → global).
function toIsoDate(d) {
  return formatISO(d, { representation: 'date' })
}

export function parseStartDate(start) {
  if (!start) {
    const tomorrow = addDays(new Date(), 1)
    return parseISO(toIsoDate(tomorrow))
  }
  return parseISO(start)
}

async function getSeriesUniverse(pool, { historyStart, historyEnd }) {
  const [outletsRes, dishesRes, activeRes] = await Promise.all([
    pool.query('select distinct outlet from stock order by outlet asc'),
    pool.query('select distinct dish from recipes order by dish asc'),
    pool.query(
      `
      select distinct outlet, dish
      from sales
      where sale_date between $1 and $2
      order by outlet asc, dish asc
      `,
      [toIsoDate(historyStart), toIsoDate(historyEnd)]
    )
  ])

  const outlets = outletsRes.rows.map((r) => String(r.outlet))
  const dishes = dishesRes.rows.map((r) => String(r.dish))

  const universe = new Map()
  for (const r of activeRes.rows) {
    universe.set(`${r.outlet}|||${r.dish}`, { outlet: r.outlet, dish: r.dish })
  }

  for (const outlet of outlets) {
    for (const dish of dishes) {
      universe.set(`${outlet}|||${dish}`, { outlet, dish })
    }
  }

  return [...universe.values()]
}

function addStats(map, key, dow, qty) {
  const s = map.get(key) ?? { byDow: new Map(), overallSum: 0, overallCount: 0 }
  const cur = s.byDow.get(dow) ?? { sum: 0, count: 0 }
  cur.sum += qty
  cur.count += 1
  s.byDow.set(dow, cur)
  s.overallSum += qty
  s.overallCount += 1
  map.set(key, s)
}

function avgFromStats(stats, dow, { minPointsPerDow, minTotalPoints }) {
  const d = stats?.byDow?.get(dow)
  if (d && d.count >= minPointsPerDow) {
    return { value: d.sum / d.count, source: 'series_dow' }
  }
  if (stats && stats.overallCount >= minTotalPoints) {
    return { value: stats.overallSum / stats.overallCount, source: 'series_overall' }
  }
  return null
}

function pickWithFallback({
  seriesStats,
  dishStats,
  outletStats,
  globalStats,
  globalOverall,
  outlet,
  dish,
  dow,
  minPointsPerDow,
  minTotalPoints
}) {
  const seriesPick = avgFromStats(seriesStats, dow, { minPointsPerDow, minTotalPoints })
  if (seriesPick) return seriesPick

  const dishPick = avgFromStats(dishStats.get(dish), dow, { minPointsPerDow, minTotalPoints })
  if (dishPick) return { ...dishPick, source: dishPick.source === 'series_dow' ? 'dish_dow' : 'dish_overall' }

  const outletPick = avgFromStats(outletStats.get(outlet), dow, { minPointsPerDow, minTotalPoints })
  if (outletPick) return { ...outletPick, source: outletPick.source === 'series_dow' ? 'outlet_dow' : 'outlet_overall' }

  const globalPick = avgFromStats(globalStats, dow, { minPointsPerDow, minTotalPoints })
  if (globalPick) return { ...globalPick, source: globalPick.source === 'series_dow' ? 'global_dow' : 'global_overall' }

  return { value: globalOverall ?? 0, source: 'global_overall' }
}

async function buildBaselineStats(pool, { startDate, lookbackDays = 28, historyDays = 90 }) {
  const historyStart = subDays(startDate, historyDays)
  const historyEnd = subDays(startDate, 1)
  const lookbackStart = subDays(startDate, lookbackDays)

  const seriesUniverse = await getSeriesUniverse(pool, { historyStart, historyEnd })

  const { rows } = await pool.query(
    `
    select sale_date, outlet, dish, sum(quantity)::float as qty
    from sales
    where sale_date between $1 and $2
    group by sale_date, outlet, dish
    order by sale_date asc
    `,
    [toIsoDate(historyStart), toIsoDate(historyEnd)]
  )

  const seriesStats = new Map()
  const dishStats = new Map()
  const outletStats = new Map()
  const globalStats = { byDow: new Map(), overallSum: 0, overallCount: 0 }

  for (const r of rows) {
    const saleDate = parseISO(toIsoDate(r.sale_date))
    if (saleDate < lookbackStart) continue

    const qty = Number(r.qty ?? 0)
    const outlet = String(r.outlet)
    const dish = String(r.dish)
    const dow = saleDate.getDay()

    addStats(seriesStats, `${outlet}|||${dish}`, dow, qty)
    addStats(dishStats, dish, dow, qty)
    addStats(outletStats, outlet, dow, qty)

    const g = globalStats.byDow.get(dow) ?? { sum: 0, count: 0 }
    g.sum += qty
    g.count += 1
    globalStats.byDow.set(dow, g)
    globalStats.overallSum += qty
    globalStats.overallCount += 1
  }

  const globalOverall = globalStats.overallCount ? globalStats.overallSum / globalStats.overallCount : 0

  return {
    seriesUniverse,
    seriesStats,
    dishStats,
    outletStats,
    globalStats,
    globalOverall,
    lookbackStart,
    historyStart,
    historyEnd
  }
}

export async function forecastBaselineDaily(
  pool,
  { startDate, days = 7, lookbackDays = 28, historyDays = 90, minPointsPerDow = 2, minTotalPoints = 8, surgePct = 0 }
) {
  const ctx = await buildBaselineStats(pool, { startDate, lookbackDays, historyDays })
  const out = []

  for (const s of ctx.seriesUniverse) {
    const key = `${s.outlet}|||${s.dish}`
    const stats = ctx.seriesStats.get(key)
    for (let i = 0; i < days; i++) {
      const d = addDays(startDate, i)
      const dow = d.getDay()

      const picked = pickWithFallback({
        seriesStats: stats,
        dishStats: ctx.dishStats,
        outletStats: ctx.outletStats,
        globalStats: ctx.globalStats,
        globalOverall: ctx.globalOverall,
        outlet: s.outlet,
        dish: s.dish,
        dow,
        minPointsPerDow,
        minTotalPoints
      })

      let qty = Math.max(0, picked.value)
      const isWeekend = dow === 5 || dow === 6 || dow === 0
      if (surgePct > 0 && isWeekend) qty *= 1 + surgePct

      out.push({
        date: toIsoDate(d),
        outlet: s.outlet,
        dish: s.dish,
        predicted_quantity: Math.round(qty),
        baseline_source: picked.source
      })
    }
  }

  return out
}

export function aggregateDailyToTotals(dailyRows) {
  const totals = new Map()
  for (const r of dailyRows) {
    const key = `${r.outlet}|||${r.dish}`
    totals.set(key, (totals.get(key) ?? 0) + Number(r.predicted_quantity ?? 0))
  }
  return [...totals.entries()].map(([key, qty]) => {
    const [outlet, dish] = key.split('|||')
    return { outlet, dish, predicted_quantity: Math.round(qty) }
  })
}

export async function getDowAverages(pool, { startDate, lookbackDays = 28 }) {
  const daily = await forecastBaselineDaily(pool, { startDate, days: 7, lookbackDays, historyDays: 90 })
  const bySeries = new Map()
  for (const r of daily) {
    const key = `${r.outlet}|||${r.dish}`
    const series = bySeries.get(key) ?? { outlet: r.outlet, dish: r.dish, dowAvg: new Map() }
    const dow = parseISO(r.date).getDay()
    series.dowAvg.set(dow, Number(r.predicted_quantity))
    bySeries.set(key, series)
  }
  for (const series of bySeries.values()) {
    const vals = [...series.dowAvg.values()]
    series.overallAvg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
  }
  return [...bySeries.values()]
}

export function forecastTotalsFromAverages(averages, { startDate, days = 7 }) {
  const dates = []
  for (let i = 0; i < days; i++) {
    dates.push(addDays(startDate, i))
  }

  const out = []
  for (const s of averages) {
    let total = 0
    for (const d of dates) {
      const dow = d.getDay()
      const avg = s.dowAvg.get(dow) ?? s.overallAvg ?? 0
      total += avg
    }
    out.push({ outlet: s.outlet, dish: s.dish, predicted_quantity: Math.round(total) })
  }

  return out
}

export function forecastDailyFromAverages(averages, { startDate, days = 7 }) {
  const out = []
  for (const s of averages) {
    for (let i = 0; i < days; i++) {
      const d = addDays(startDate, i)
      const dow = d.getDay()
      const avg = s.dowAvg.get(dow) ?? s.overallAvg ?? 0
      out.push({
        date: toIsoDate(d),
        outlet: s.outlet,
        dish: s.dish,
        predicted_quantity: Math.round(avg)
      })
    }
  }
  return out
}

export async function computeBacktestMape(pool, { testDays = 14, lookbackDays = 28 } = {}) {
  const endDate = subDays(new Date(), 1)
  const startDate = subDays(endDate, lookbackDays + testDays + 7)

  const { rows } = await pool.query(
    `
    select sale_date, outlet, dish, sum(quantity)::float as qty
    from sales
    where sale_date between $1 and $2
    group by sale_date, outlet, dish
    order by sale_date asc
    `,
    [toIsoDate(startDate), toIsoDate(endDate)]
  )

  const seriesMap = new Map()
  for (const r of rows) {
    const key = `${r.outlet}|||${r.dish}`
    const m = seriesMap.get(key) ?? new Map()
    m.set(toIsoDate(r.sale_date), Number(r.qty))
    seriesMap.set(key, m)
  }

  const testStart = subDays(endDate, testDays - 1)
  let sum = 0
  let n = 0

  for (const [key, m] of seriesMap.entries()) {
    for (let i = 0; i < testDays; i++) {
      const d = addDays(testStart, i)
      const iso = toIsoDate(d)
      const actual = m.get(iso)
      if (actual == null) continue

      const lookbackStart = subDays(d, lookbackDays)
      const lookbackEnd = subDays(d, 1)
      const dow = d.getDay()

      const candidates = []
      for (let lb = 0; lb < lookbackDays; lb++) {
        const ld = addDays(lookbackStart, lb)
        if (ld.getDay() !== dow) continue
        const liso = toIsoDate(ld)
        const v = m.get(liso)
        if (v != null) candidates.push(v)
      }

      const forecast = candidates.length
        ? candidates.reduce((a, b) => a + b, 0) / candidates.length
        : 0

      const denom = Math.max(actual, 1)
      sum += Math.abs(actual - forecast) / denom
      n += 1
    }
  }

  if (!n) return null
  return sum / n
}

export async function computeBacktestKpis(pool, { testDays = 14, lookbackDays = 28 } = {}) {
  const endDate = subDays(new Date(), 1)
  const testStart = subDays(endDate, testDays - 1)
  const historyStart = subDays(testStart, lookbackDays + 7)

  const { rows } = await pool.query(
    `
    select sale_date, outlet, dish, sum(quantity)::float as qty
    from sales
    where sale_date between $1 and $2
    group by sale_date, outlet, dish
    order by sale_date asc
    `,
    [toIsoDate(historyStart), toIsoDate(endDate)]
  )

  const seriesMap = new Map()
  for (const r of rows) {
    const key = `${r.outlet}|||${r.dish}`
    const m = seriesMap.get(key) ?? new Map()
    m.set(toIsoDate(r.sale_date), Number(r.qty))
    seriesMap.set(key, m)
  }

  function baselineForecast(m, d) {
    const dow = d.getDay()
    const candidates = []
    for (let lb = 1; lb <= lookbackDays; lb++) {
      const ld = subDays(d, lb)
      if (ld.getDay() !== dow) continue
      const v = m.get(toIsoDate(ld))
      if (v != null) candidates.push(v)
    }
    return candidates.length ? candidates.reduce((a, b) => a + b, 0) / candidates.length : 0
  }

  function naiveForecast(m, d) {
    const vals = []
    for (let lb = 1; lb <= 7; lb++) {
      const v = m.get(toIsoDate(subDays(d, lb)))
      if (v != null) vals.push(v)
    }
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
  }

  let modelSum = 0
  let naiveSum = 0
  let n = 0

  const dailyTotals = []
  for (let i = 0; i < testDays; i++) {
    dailyTotals.push({ date: toIsoDate(addDays(testStart, i)), actual: 0, model: 0, naive: 0 })
  }

  for (const m of seriesMap.values()) {
    for (let i = 0; i < testDays; i++) {
      const d = addDays(testStart, i)
      const iso = toIsoDate(d)
      const actual = m.get(iso)
      if (actual == null) continue
      const model = baselineForecast(m, d)
      const naive = naiveForecast(m, d)

      const denom = Math.max(actual, 1)
      modelSum += Math.abs(actual - model) / denom
      naiveSum += Math.abs(actual - naive) / denom
      n += 1

      dailyTotals[i].actual += actual
      dailyTotals[i].model += model
      dailyTotals[i].naive += naive
    }
  }

  const modelMape = n ? modelSum / n : null
  const naiveMape = n ? naiveSum / n : null

  let wasteReductionPct = null
  if (modelMape != null && naiveMape != null && naiveMape > 0) {
    wasteReductionPct = ((naiveMape - modelMape) / naiveMape) * 100
    wasteReductionPct = Math.max(0, Math.min(35, wasteReductionPct))
  }

  return {
    model_mape: modelMape,
    naive_mape: naiveMape,
    waste_reduction_pct: wasteReductionPct,
    forecast_vs_actual_daily: dailyTotals.map((r) => ({
      date: r.date,
      actual: Math.round(r.actual),
      forecast: Math.round(r.model),
      naive: Math.round(r.naive)
    }))
  }
}
