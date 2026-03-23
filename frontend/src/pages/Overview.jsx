import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { apiGet } from '../api'
import { useDemo } from '../demoContext.js'
import InfoTip from '../components/InfoTip'

function isoTomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

export default function Overview() {
  const navigate = useNavigate()
  const [start, setStart] = useState(isoTomorrow())
  const [days, setDays] = useState(7)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { surgePct, isWeekendSurge, toggleWeekendSurge, safetyStockPct } = useDemo()

  const query = useMemo(
    () =>
      `/api/dashboard/summary?start=${encodeURIComponent(start)}&days=${days}&surgePct=${surgePct}&safetyStockPct=${safetyStockPct}`,
    [start, days, surgePct, safetyStockPct]
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const json = await apiGet(query)
      setData(json)
    } catch (e) {
      setError(e?.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    load()
  }, [load])

  const kpis = data?.kpis
  const charts = data?.charts
  const risks = data?.high_risk_ingredients ?? []
  const insights = data?.insights ?? []

  const riskCounts = kpis?.stockout_risk ?? { high: 0, medium: 0, low: 0 }
  const riskLabel = loading ? '…' : `${riskCounts.high ?? 0} high / ${riskCounts.medium ?? 0} medium`

  const pieColors = ['#d4e4ff', '#b2d1ff', '#8bbcff', '#6aa6ff', '#4b8fff', '#3775da', '#285bb0', '#1c447f', '#16345f']

  return (
    <div className="grid">
      <div className="card" style={{ gridColumn: 'span 12' }}>
        <div className="card-title">Controls</div>
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
          <button className="button primary" onClick={load} disabled={loading}>
            Refresh
          </button>
          <button className={isWeekendSurge ? 'button primary' : 'button'} onClick={toggleWeekendSurge}>
            {isWeekendSurge ? 'Simulating Weekend Surge (+20%)' : 'Simulate Weekend Surge'}
          </button>
          <button className="button" onClick={() => navigate('/prep')}>
            Generate Kitchen Prep Sheet
          </button>
        </div>
        {error ? <div className="error" style={{ marginTop: 10 }}>{error}</div> : null}
      </div>

      <div className="card" style={{ gridColumn: 'span 3' }}>
        <div className="card-title">
          Total Forecast <InfoTip text="Total predicted dish portions for the selected time window." />
        </div>
        <div className="kpi">{kpis?.total_forecast_demand ?? (loading ? '…' : '-')}</div>
        <div className="kpi-sub">Total predicted dish units ({days} days)</div>
      </div>

      <div className="card" style={{ gridColumn: 'span 3' }}>
        <div className="card-title">
          Forecast Accuracy <InfoTip text="How close predictions are compared to actual demand (higher is better)." />
        </div>
        <div className="kpi">
          {kpis?.forecast_accuracy_pct == null ? (loading ? '…' : '-') : `${kpis.forecast_accuracy_pct}%`}
        </div>
        <div className="kpi-sub">
          MAPE: {kpis?.model_mape_pct == null ? '-' : `${kpis.model_mape_pct}%`} (naive: {kpis?.naive_mape_pct == null ? '-' : `${kpis.naive_mape_pct}%`})
        </div>
      </div>

      <div className="card" style={{ gridColumn: 'span 3' }}>
        <div className="card-title">
          Stockout Risk <InfoTip text="Likelihood of running out of key ingredients based on forecast + current stock." />
        </div>
        <div className="kpi">{kpis?.stockout_reduction_pct == null ? (loading ? '…' : '-') : `${kpis.stockout_reduction_pct}%`}</div>
        <div className="kpi-sub">Estimated stockout reduction (high/medium: {riskLabel})</div>
      </div>

      <div className="card" style={{ gridColumn: 'span 3' }}>
        <div className="card-title">
          Waste Reduction <InfoTip text="Estimated reduction compared to manual forecasting (naive baseline)." />
        </div>
        <div className="kpi">{kpis?.waste_reduction_pct == null ? (loading ? '…' : '-') : `${kpis.waste_reduction_pct}%`}</div>
        <div className="kpi-sub">Estimated improvement vs naive planning</div>
      </div>

      <div className="card" style={{ gridColumn: 'span 7' }}>
        <div className="card-title">Forecast vs Actual (Backtest)</div>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <LineChart data={charts?.forecast_vs_actual_daily ?? []} margin={{ left: 10, right: 10 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'rgba(230,238,252,0.75)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'rgba(230,238,252,0.75)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0b1220', border: '1px solid rgba(255,255,255,0.12)' }} />
              <Line type="monotone" dataKey="actual" stroke="rgba(230,238,252,0.9)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="forecast" stroke="#d4e4ff" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="naive" stroke="rgba(255, 196, 114, 0.9)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ gridColumn: 'span 5' }}>
        <div className="card-title">Ingredient Usage Breakdown</div>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <PieChart>
              <Tooltip
                contentStyle={{ background: '#0b1220', border: '1px solid rgba(255,255,255,0.12)', color: '#e6eefc' }}
                itemStyle={{ color: '#e6eefc' }}
                labelStyle={{ color: '#e6eefc' }}
              />
              <Pie data={charts?.ingredient_usage_breakdown ?? []} dataKey="quantity" nameKey="ingredient" innerRadius={55} outerRadius={95}>
                {(charts?.ingredient_usage_breakdown ?? []).map((_, i) => (
                  <Cell key={i} fill={pieColors[i % pieColors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="muted" style={{ fontSize: 12 }}>Buffered required quantity across outlets</div>
      </div>

      <div className="card" style={{ gridColumn: 'span 7' }}>
        <div className="card-title">Demand per Dish (Top)</div>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={charts?.demand_by_dish ?? []} margin={{ left: 10, right: 10 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="dish" tick={{ fill: 'rgba(230,238,252,0.75)', fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={70} />
              <YAxis tick={{ fill: 'rgba(230,238,252,0.75)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0b1220', border: '1px solid rgba(255,255,255,0.12)' }} />
              <Bar dataKey="quantity" fill="#d4e4ff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ gridColumn: 'span 5' }}>
        <div className="card-title">Demand per Outlet</div>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={charts?.demand_by_outlet ?? []} margin={{ left: 10, right: 10 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="outlet" tick={{ fill: 'rgba(230,238,252,0.75)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'rgba(230,238,252,0.75)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0b1220', border: '1px solid rgba(255,255,255,0.12)' }} />
              <Bar dataKey="quantity" fill="rgba(212, 228, 255, 0.7)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ gridColumn: 'span 12' }}>
        <div className="card-title">Before vs After</div>
        <div className="grid">
          <div className="card" style={{ gridColumn: 'span 6' }}>
            <div className="card-title">Without AI (Manual)</div>
            <table className="table">
              <tbody>
                <tr>
                  <td className="muted">Forecast accuracy</td>
                  <td>{data?.before_after?.manual?.accuracy_pct == null ? '-' : `${data.before_after.manual.accuracy_pct}%`}</td>
                </tr>
                <tr>
                  <td className="muted">Waste reduction</td>
                  <td>{data?.before_after?.manual?.waste_reduction_pct == null ? '-' : `${data.before_after.manual.waste_reduction_pct}%`}</td>
                </tr>
                <tr>
                  <td className="muted">Stockout reduction</td>
                  <td>{data?.before_after?.manual?.stockout_reduction_pct == null ? '-' : `${data.before_after.manual.stockout_reduction_pct}%`}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="card" style={{ gridColumn: 'span 6' }}>
            <div className="card-title">With AI (This System)</div>
            <table className="table">
              <tbody>
                <tr>
                  <td className="muted">Forecast accuracy</td>
                  <td>{kpis?.forecast_accuracy_pct == null ? '-' : `${kpis.forecast_accuracy_pct}%`}</td>
                </tr>
                <tr>
                  <td className="muted">Waste reduction</td>
                  <td>{kpis?.waste_reduction_pct == null ? '-' : `${kpis.waste_reduction_pct}%`}</td>
                </tr>
                <tr>
                  <td className="muted">Stockout reduction</td>
                  <td>{kpis?.stockout_reduction_pct == null ? '-' : `${kpis.stockout_reduction_pct}%`}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card" style={{ gridColumn: 'span 12' }}>
        <div className="card-title">Top 5 Dishes</div>
        <table className="table">
          <thead>
            <tr>
              <th>Dish</th>
              <th>Forecasted units</th>
            </tr>
          </thead>
          <tbody>
            {(charts?.top_5_dishes ?? []).length ? (
              (charts.top_5_dishes ?? []).map((r) => (
                <tr key={r.dish}>
                  <td>{r.dish}</td>
                  <td>{r.quantity}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="muted">{loading ? 'Loading…' : 'No data'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ gridColumn: 'span 12' }}>
        <div className="card-title">AI Insights</div>
        {insights.length ? (
          <ul className="insights">
            {insights.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        ) : (
          <div className="muted">{loading ? 'Loading…' : 'No insights available'}</div>
        )}
      </div>

      <div className="card" style={{ gridColumn: 'span 12' }}>
        <div className="card-title">At-Risk Ingredients</div>
        <table className="table">
          <thead>
            <tr>
              <th>Outlet</th>
              <th>Ingredient</th>
              <th>Unit</th>
              <th>Shelf life (days)</th>
              <th>Required (buffered)</th>
              <th>Stock</th>
              <th>Days of coverage</th>
              <th>Recommended order</th>
            </tr>
          </thead>
          <tbody>
            {risks.length ? (
              risks.map((r) => (
                <tr key={`${r.outlet}-${r.ingredient}`} className={r.stockout_risk ? `risk-row ${r.stockout_risk}` : undefined}>
                  <td>{r.outlet}</td>
                  <td>{r.ingredient}</td>
                  <td>{r.unit ?? '-'}</td>
                  <td>{r.shelf_life_days ?? '-'}</td>
                  <td>{r.buffered_required_qty}</td>
                  <td>{r.current_stock}</td>
                  <td>{r.days_of_coverage ?? '-'}</td>
                  <td>{r.recommended_order}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="muted">{loading ? 'Loading…' : 'No at-risk ingredients'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
