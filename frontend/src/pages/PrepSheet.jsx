import { useEffect, useMemo, useState } from 'react'
import { apiGet } from '../api'
import { useDemo } from '../demoContext.js'

function isoTomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

export default function PrepSheet() {
  const [start, setStart] = useState(isoTomorrow())
  const [days, setDays] = useState(7)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { surgePct, isWeekendSurge, toggleWeekendSurge, safetyStockPct, setSafetyStockPct } = useDemo()

  const url = useMemo(
    () =>
      `/api/prep-sheet?start=${encodeURIComponent(start)}&days=${days}&surgePct=${surgePct}&safetyStockPct=${safetyStockPct}`,
    [start, days, surgePct, safetyStockPct]
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

  async function downloadCsv() {
    try {
      const csvUrl = `${url}&format=csv`
      const res = await fetch(csvUrl)
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Request failed: ${res.status}`)
      }
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `prep_sheet_${start}_${days}d.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(a.href)
    } catch (e) {
      setError(e?.message ?? String(e))
    }
  }

  return (
    <div className="grid">
      <div className="card" style={{ gridColumn: 'span 12' }}>
        <div className="card-title">Kitchen Prep Sheet</div>
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
          <button className="button primary" onClick={downloadCsv} disabled={loading}>
            Download CSV
          </button>
          {loading ? <span className="muted">Loading…</span> : null}
          {error ? <span className="error">{error}</span> : null}
        </div>
      </div>

      <div className="card" style={{ gridColumn: 'span 12' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Priority</th>
              <th>Outlet</th>
              <th>Ingredient</th>
              <th>Unit</th>
              <th>Required (buffered)</th>
              <th>Stock</th>
              <th>Days of coverage</th>
              <th>Recommended order</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((r) => (
                <tr key={`${r.outlet}-${r.ingredient}`} className={r.stockout_risk ? `risk-row ${r.stockout_risk}` : undefined}>
                  <td>{r.stockout_risk}</td>
                  <td>{r.outlet}</td>
                  <td>{r.ingredient}</td>
                  <td>{r.unit ?? '-'}</td>
                  <td>{r.buffered_required_qty}</td>
                  <td>{r.current_stock}</td>
                  <td>{r.days_of_coverage ?? '-'}</td>
                  <td>{r.recommended_order}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="muted">{loading ? 'Loading…' : 'No rows'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
