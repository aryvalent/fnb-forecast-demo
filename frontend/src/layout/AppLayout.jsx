import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import './layout.css'
import { useDemo } from '../demoContext.js'

export default function AppLayout() {
  const { demoMode, isWeekendSurge, safetyStockPct } = useDemo()
  const location = useLocation()

  const step = useMemo(() => {
    const p = location.pathname
    if (p === '/') return 1
    if (p.startsWith('/forecast')) return 2
    if (p.startsWith('/ingredients')) return 3
    if (p.startsWith('/override')) return 4
    if (p.startsWith('/prep')) return 5
    if (p.startsWith('/assistant')) return 6
    return 1
  }, [location.pathname])

  return (
    <div className="app-shell">
      <div className="demo-banner">
        <div className="demo-left">
          <span className="pill strong">{demoMode ? 'Demo Mode: ON' : 'Demo Mode: OFF'}</span>
          <span className="pill">
            Scenario: {isWeekendSurge ? 'Weekend Surge (+20%)' : 'Normal'}
          </span>
          <span className="pill">Safety Stock: {Math.round(safetyStockPct * 100)}%</span>
        </div>
        <div className="demo-steps" role="navigation" aria-label="Guided demo flow">
          <span className={step === 1 ? 'step active' : 'step'}>1. Overview</span>
          <span className={step === 2 ? 'step active' : 'step'}>2. View Forecast</span>
          <span className={step === 3 ? 'step active' : 'step'}>3. Review Ingredients</span>
          <span className={step === 4 ? 'step active' : 'step'}>4. Adjust Stock</span>
          <span className={step === 5 ? 'step active' : 'step'}>5. Generate Prep Plan</span>
          <span className={step === 6 ? 'step active' : 'step'}>6. Ask AI</span>
        </div>
      </div>
      <header className="topbar">
        <div className="brand">
          <div className="brand-title">FnB Forecasting Demo</div>
          <div className="brand-subtitle">Reduce waste • Prevent stockouts • Faster prep planning</div>
        </div>
        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Overview
          </NavLink>
          <NavLink to="/forecast" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Forecast
          </NavLink>
          <NavLink to="/ingredients" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Ingredient Planning
          </NavLink>
          <NavLink to="/override" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Manual Override
          </NavLink>
          <NavLink to="/prep" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Prep Sheet
          </NavLink>
          <NavLink to="/assistant" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Ask AI
          </NavLink>
        </nav>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
