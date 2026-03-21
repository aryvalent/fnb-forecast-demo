import { useEffect, useMemo, useState } from 'react'
import DemoContext from './demoContext.js'

const STORAGE_SURGE = 'fnb_demo_surge_pct'
const STORAGE_SAFETY = 'fnb_demo_safety_stock_pct'

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function readNumber(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    const v = raw == null ? fallback : Number(raw)
    return Number.isFinite(v) ? v : fallback
  } catch {
    return fallback
  }
}

export default function DemoProvider({ children }) {
  const [surgePct, setSurgePct] = useState(() => clamp(readNumber(STORAGE_SURGE, 0), 0, 0.5))
  const [safetyStockPct, setSafetyStockPct] = useState(() => clamp(readNumber(STORAGE_SAFETY, 0.15), 0, 0.5))

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_SURGE, String(surgePct))
    } catch {
      return
    }
  }, [surgePct])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_SAFETY, String(safetyStockPct))
    } catch {
      return
    }
  }, [safetyStockPct])

  const value = useMemo(() => {
    const isWeekendSurge = surgePct > 0
    function toggleWeekendSurge() {
      setSurgePct((p) => (p > 0 ? 0 : 0.2))
    }
    return {
      demoMode: true,
      surgePct,
      setSurgePct,
      isWeekendSurge,
      toggleWeekendSurge,
      safetyStockPct,
      setSafetyStockPct
    }
  }, [surgePct, safetyStockPct])

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

