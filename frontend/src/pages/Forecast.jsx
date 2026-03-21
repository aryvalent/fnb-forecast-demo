import { useEffect, useMemo, useState } from 'react'
import { apiGet } from '../api'
import { useDemo } from '../demoContext.js'

function isoTomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

export default function Forecast() {
  const [start, setStart] = useState(isoTomorrow())
  const [days, setDays] = useState(7)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { surgePct, isWeekendSurge, toggleWeekendSurge } = useDemo()

  const url = useMemo(
    () => `/api/forecast/dish?start=${encodeURIComponent(start)}&days=${days}&surgePct=${surgePct}`,
    [start, days, surgePct]
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

  const sorted = [...rows].sort((a, b) => b.predicted_quantity - a.predicted_quantity)

  return (
    <div className="grid">
      <div className="card" style={{ gridColumn: 'span 12' }}>
        <div className="card-title">Dish Forecast</div>
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
              <th>Dish</th>
              <th>Predicted quantity</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length ? (
              sorted.map((r) => (
                <tr key={`${r.outlet}-${r.dish}`}>
                  <td>{r.outlet}</td>
                  <td>{r.dish}</td>
                  <td>{r.predicted_quantity}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="muted">{loading ? 'Loading…' : 'No forecast rows'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
