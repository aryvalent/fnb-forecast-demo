import { useEffect, useMemo, useState } from 'react'
import { apiGet } from '../api'
import { useDemo } from '../demoContext.js'

function isoTomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

export default function Ingredients() {
  const [start, setStart] = useState(isoTomorrow())
  const [days, setDays] = useState(7)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { surgePct, isWeekendSurge, toggleWeekendSurge, safetyStockPct, setSafetyStockPct } = useDemo()

  const url = useMemo(
    () =>
      `/api/forecast/ingredient?start=${encodeURIComponent(start)}&days=${days}&safetyStockPct=${safetyStockPct}&surgePct=${surgePct}`,
    [start, days, safetyStockPct, surgePct]
  )

  useEffect(() => {
    async function run() {
      setLoading(true)
      setError(null)
      try {
        const json = await apiGet(url)
        setRows(json.rows ?? [])
      } catch (e) {
        setError(e?.message ?? String(e))
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [url])

  const sorted = [...rows].sort((a, b) => b.recommended_order - a.recommended_order)

  return (
    <div className="grid">
      <div className="card" style={{ gridColumn: 'span 12' }}>
        <div className="card-title">Ingredient Planning</div>
        <div className="controls">
          <label className="muted">
            Start date{' '}
            <input className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label className="muted">
            Horizon{' '}
            <select className="select" value={days} onChange={(e) => setDays(Number(e.target.value))}>
              <option value={7}>7 days (weekly)</option>
              <option value={30}>30 days (monthly)</option>
            </select>
          </label>
          <label className="muted">
            Safety stock{' '}
            <select className="select" value={safetyStockPct} onChange={(e) => setSafetyStockPct(Number(e.target.value))}>
              <option value={0.1}>10%</option>
              <option value={0.15}>15%</option>
              <option value={0.2}>20%</option>
            </select>
          </label>
          <button className={isWeekendSurge ? 'button primary' : 'button'} onClick={toggleWeekendSurge}>
            {isWeekendSurge ? 'Weekend Surge (+20%)' : 'Simulate Weekend Surge'}
          </button>
          {loading ? <span className="muted">Loading…</span> : null}
          {error ? <span className="error">{error}</span> : null}
        </div>
      </div>

      <div className="card" style={{ gridColumn: 'span 12' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Outlet</th>
              <th>Ingredient</th>
              <th>Unit</th>
              <th>Required</th>
              <th>Safety buffer</th>
              <th>Stock</th>
              <th>Days of coverage</th>
              <th>Risk</th>
              <th>Recommended order</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length ? (
              sorted.map((r) => (
                <tr key={`${r.outlet}-${r.ingredient}`} className={r.stockout_risk ? `risk-row ${r.stockout_risk}` : undefined}>
                  <td>{r.outlet}</td>
                  <td>{r.ingredient}</td>
                  <td>{r.unit ?? '-'}</td>
                  <td>{r.required_qty}</td>
                  <td>{Math.round(r.safety_stock_pct * 100)}%</td>
                  <td>{r.current_stock}</td>
                  <td>{r.days_of_coverage ?? '-'}</td>
                  <td>{r.stockout_risk ?? '-'}</td>
                  <td>{r.recommended_order}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="muted">{loading ? 'Loading…' : 'No ingredient rows'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
