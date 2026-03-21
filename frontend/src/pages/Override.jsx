import { useEffect, useMemo, useState } from 'react'
import { apiGet, apiPostJson } from '../api'
import { useDemo } from '../demoContext.js'

function isoTomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

export default function Override() {
  const [start, setStart] = useState(isoTomorrow())
  const [days, setDays] = useState(7)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [savingKey, setSavingKey] = useState(null)
  const [error, setError] = useState(null)
  const [outletFilter, setOutletFilter] = useState('All')
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
        setRows((json.rows ?? []).map((r) => ({ ...r, _edit_stock: String(r.current_stock ?? 0) })))
      } catch (e) {
        setError(e?.message ?? String(e))
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [url])

  const outlets = useMemo(() => {
    const s = new Set(rows.map((r) => r.outlet))
    return ['All', ...[...s].sort()]
  }, [rows])

  const filtered = rows
    .filter((r) => outletFilter === 'All' || r.outlet === outletFilter)
    .sort((a, b) => b.recommended_order - a.recommended_order)

  function updateEdit(outlet, ingredient, value) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.outlet === outlet && r.ingredient === ingredient) return { ...r, _edit_stock: value }
        return r
      })
    )
  }

  async function save(r) {
    const key = `${r.outlet}|||${r.ingredient}`
    setSavingKey(key)
    setError(null)
    try {
      const v = Number(r._edit_stock)
      if (!Number.isFinite(v) || v < 0) {
        throw new Error('Stock must be a non-negative number')
      }
      await apiPostJson('/api/override-stock', { outlet: r.outlet, ingredient: r.ingredient, current_stock: v })
      setRows((prev) =>
        prev.map((x) => (x.outlet === r.outlet && x.ingredient === r.ingredient ? { ...x, current_stock: v } : x))
      )
    } catch (e) {
      setError(e?.message ?? String(e))
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <div className="grid">
      <div className="card" style={{ gridColumn: 'span 12' }}>
        <div className="card-title">Manual Stock Override</div>
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
          <label className="muted">
            Outlet{' '}
            <select className="select" value={outletFilter} onChange={(e) => setOutletFilter(e.target.value)}>
              {outlets.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
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
              <th>Stock (edit)</th>
              <th>Days of coverage</th>
              <th>Risk</th>
              <th>Recommended order</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map((r) => {
                const key = `${r.outlet}|||${r.ingredient}`
                const saving = savingKey === key
                return (
                  <tr key={key} className={r.stockout_risk ? `risk-row ${r.stockout_risk}` : undefined}>
                    <td>{r.outlet}</td>
                    <td>{r.ingredient}</td>
                    <td>{r.unit ?? '-'}</td>
                    <td>
                      <input
                        className="input"
                        style={{ width: 140 }}
                        value={r._edit_stock}
                        onChange={(e) => updateEdit(r.outlet, r.ingredient, e.target.value)}
                        disabled={saving}
                      />
                    </td>
                    <td>{r.days_of_coverage ?? '-'}</td>
                    <td>{r.stockout_risk ?? '-'}</td>
                    <td>{r.recommended_order}</td>
                    <td>
                      <button className="button primary" onClick={() => save(r)} disabled={saving}>
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                    </td>
                  </tr>
                )
              })
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
