import { useMemo, useState } from 'react'
import { apiPostJson } from '../api'
import { useDemo } from '../demoContext.js'

function isoTomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

export default function Assistant() {
  const [start, setStart] = useState(isoTomorrow())
  const [days, setDays] = useState(7)
  const [question, setQuestion] = useState('What are the top risks for the next week, and what should we order first?')
  const [loading, setLoading] = useState(false)
  const [answer, setAnswer] = useState(null)
  const [error, setError] = useState(null)
  const { surgePct, safetyStockPct } = useDemo()

  const payload = useMemo(
    () => ({ question, start, days, surgePct, safetyStockPct }),
    [question, start, days, surgePct, safetyStockPct]
  )

  async function onAsk() {
    setLoading(true)
    setError(null)
    setAnswer(null)
    try {
      const res = await apiPostJson('/api/llm/ask', payload)
      setAnswer(res?.answer ?? '')
    } catch (e) {
      setError(e?.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid">
      <div className="card" style={{ gridColumn: 'span 12' }}>
        <div className="card-title">Ask the Data (Local LLM)</div>
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
          <button className="button primary" onClick={onAsk} disabled={loading || !question.trim()}>
            {loading ? 'Asking…' : 'Ask'}
          </button>
        </div>
        <div style={{ marginTop: 10 }}>
          <textarea
            className="input"
            rows={4}
            style={{ width: '100%' }}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about demand, stockouts, ordering priorities, outlets, dishes…"
          />
        </div>
        {error ? <div className="error" style={{ marginTop: 10 }}>{error}</div> : null}
      </div>

      <div className="card" style={{ gridColumn: 'span 12' }}>
        <div className="card-title">Answer</div>
        {answer ? (
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0, color: 'rgba(230,238,252,0.9)' }}>{answer}</pre>
        ) : (
          <div className="muted">{loading ? 'Waiting for the model…' : 'Ask a question to generate insights.'}</div>
        )}
      </div>
    </div>
  )
}

