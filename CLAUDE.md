# FnB Forecasting Demo - Quick Reference

**Last Updated:** 2026-03-22
**Status:** MVP Phase - Client Demo Ready

---

## 🚨 Priority Reading Order

1. **README.md** (root) - Project overview, quickstart, demo script
2. **CLAUDE.md** (this file) - Business reqs, tech stack, quick reference
3. **`.claude/docs/`** - Detailed technical documentation

**Start with README.md** for the complete project picture and setup instructions.

---

## Problem Statement

Multi-outlet F&B operators face inefficient inventory planning due to volatile demand patterns across locations and days. Manual forecasting causes:

- **Over-prep** → Food waste from unsold ingredients
- **Under-prep** → Stockouts of popular dishes → lost revenue
- **Reactive decisions** → Kitchen team estimates based on WhatsApp orders

**Target Client:** 5 outlets + central kitchen, orders via POS + delivery apps (Grab/Foodpanda).

---

## Business Requirements

### **Functional Requirements**

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-1** | Ingest historical POS sales data (CSV: date, outlet, dish, quantity, channel) | P0 |
| **FR-2** | Forecast dish demand by outlet (daily, weekly, monthly) | P0 |
| **FR-3** | Convert dish forecasts → ingredient requirements using recipes | P0 |
| **FR-4** | Recommend ingredient orders with safety stock buffers | P0 |
| **FR-5** | Highlight stockout risks (red/yellow/green) | P0 |
| **FR-6** | Manual override for current stock adjustments | P1 |
| **FR-7** | Dashboard with KPIs, charts, insights | P0 |
| **FR-8** | Scenario simulation (e.g., +20% weekend surge) | P1 |
| **FR-9** | AI assistant for natural language Q&A | P2 |
| **FR-10** | Export kitchen prep sheets (PDF/CSV) | P1 |

### **Non-Functional Requirements**

| ID | Requirement | Target |
|----|-------------|--------|
| **NFR-1** | **Forecast accuracy** | ≥85% (MAPE ≤15%) |
| **NFR-2** | **Waste reduction** | 30% improvement vs baseline |
| **NFR-3** | **Stockout reduction** | 50% improvement vs baseline |
| **NFR-4** | **Response time** | Dashboard loads in <2s |
| **NFR-5** | **Usability** | Kitchen staff can use without training |
| **NFR-6** | **Availability** | 99% uptime (demo environment) |
| **NFR-7** | **Deployment** | Runs on Hostinger VPS (1GB RAM with Groq/OpenAI) |
| **NFR-8** | **Security** | No hardcoded credentials, CORS protected |
| **NFR-9** | **Scalability** | Support 10+ outlets, 6+ months data |
| **NFR-10** | **Human-in-the-loop** | AI recommends, human executes final order |

### **Constraints**

- **Budget:** Minimize cloud costs (prefer free/low-cost LLM options)
- **Timeline:** MVP ready for client demo in [X] weeks
- **Tech:** Node.js stack (no heavy ML infrastructure for MVP)
- **Data:** Client provides CSV exports (no real-time POS integration yet)
- **LLM Strategy:**
  - **Development:** Groq SDK (free tier, same as demo/prod)
  - **Demo/Production:** Groq (free tier) or OpenAI (~$0.01/month)
  - **Privacy:** Send calculated insights (not raw sales data) to external LLMs
- **Database:** Raw SQL with pg (no ORM), validated via Zod schemas
- **Caching:** Phase 2 - Upstash Redis (free tier, SG region available)

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Forecast accuracy** | ≥85% | MAPE on holdout test set |
| **Food waste reduction** | 30% | Simulated vs manual planning |
| **Stockout reduction** | 50% | Risk category improvement |
| **User satisfaction** | 4/5 stars | Client feedback post-demo |

---

## Tech Stack (Locked Versions)

```
Backend:  Node.js 22.x + Express + PostgreSQL 16/17
Frontend: React 18.3 + Vite 5 + Tailwind 3.4 + Recharts 2
Optional: Groq SDK (LLM), Python 3.11+ (ML service), Upstash Redis (caching)
```

**Database:** Raw SQL with pg (no ORM - better for analytics queries)

**Version Philosophy:** Pin major versions, allow minor/patch updates. Revisit Tailwind v4, PG 18 in late 2026.

---

## Quick Commands

```bash
# Backend
cd backend && npm install && npm run dev          # http://localhost:3001

# Frontend
cd frontend && npm install && npm run dev         # http://localhost:5173

# Database (Docker)
docker compose up -d                              # PostgreSQL + auto-seed
docker compose down -v                            # Reset + re-seed

# Manual DB (local PostgreSQL)
createdb fnb_forecasting                          # Create DB
# Update backend/.env with credentials
```

---

## Critical Paths

| Purpose | Location |
|---------|----------|
| **Forecasting logic** | `backend/src/forecasting.js` |
| **Ingredient planning** | `backend/src/ingredientPlanning.js` |
| **KPI calculation** | `backend/src/insights.js` |
| **LLM integration** | `backend/src/llm.js` (TODO: replace Ollama with Groq) |
| **API endpoints** | `backend/src/index.js` |
| **Frontend pages** | `frontend/src/pages/` |
| **Database schema** | `backend/src/schema.sql` |
| **Validation schemas** | Throughout backend (Zod) |

---

## Key Architectural Decisions

### **Forecasting Approach**
- **Baseline:** Statistical (4-week trailing average by day-of-week)
- **ML:** Optional (Phase 2) - Python FastAPI service
- **Why:** Simplicity for demo, easier deployment, explainable to clients

### **AI/LLM Strategy**

**Two-Layer Architecture:**
1. **Layer 1 (Statistical):** Forecasting math (no LLM needed)
   - Raw sales → 4-week trailing averages → Numerical forecasts
2. **Layer 2 (AI Reasoning):** LLM explains insights (natural language)
   - Calculated numbers → LLM → Business recommendations

**LLM Provider Strategy:**
| Environment | Provider | Cost | RAM Impact |
|-------------|----------|------|------------|
| **Development** | Groq SDK | FREE (tier) | Zero (API call) |
| **Demo** | Groq SDK | FREE (tier) | Zero (API call) |
| **Production** | Groq or OpenAI | $0-0.01/mo | Zero (API call) |

**Note:** Skip Ollama entirely - Groq/OpenAI use similar SDK patterns, easier to maintain.

**Privacy:** Send calculated metrics (forecasts, risks, trends), NOT raw sales data

### **Modularity**
- Backend services separated by concern (forecasting, planning, insights)
- Frontend pages are self-contained components
- Database seeded separately from schema
- Raw SQL for analytics (no ORM overhead)
- Zod validation for type safety without TypeScript

---

## Security Checklist

- [x] Env vars in `.env` (NEVER commit)
- [x] SQL injection prevention (parameterized queries in `db.js`)
- [x] Input validation (Zod schemas on all endpoints)
- [ ] Rate limiting on API endpoints (todo: add express-rate-limit)
- [x] CORS configured (whitelist frontend domain only)
- [x] CSV upload validation (file type, size limits)
- [x] No hardcoded credentials (use `process.env`)
- [ ] LLM API keys secured (Groq/OpenAI in .env only)

---

## Deployment Notes

**Target:** Hostinger VPS (1GB RAM sufficient with Groq/OpenAI)

```
VPS Stack (1GB):
├── PostgreSQL 16/17: ~400MB
├── Node.js Backend: ~200MB
├── Nginx: ~50MB
├── System overhead: ~200MB
└── Buffer: ~150MB
```

**LLM in Production:** Use Groq (free) or OpenAI (~$0.01/month) - zero RAM impact.

**Self-hosted Ollama:** Requires 8GB+ VPS ($15-30/month) - only if client insists on 100% local.

---

## Development Workflow

1. **Feature work:** Create feature branch from `main`
2. **Testing:** Manual API testing via curl/Postman
3. **Frontend:** Storybook for components (future: add)
4. **Deployment:** CI/CD via GitHub Actions (future: add)

---

## Extension Points

| Feature | How to Add |
|---------|------------|
| **New forecast algorithm** | Implement in `backend/src/forecasting.js`, add `mode=algorithm` param |
| **New chart type** | Add Recharts component to relevant page in `frontend/src/pages/` |
| **New API endpoint** | Add route in `backend/src/index.js` |
| **New insight rule** | Add logic to `backend/src/insights.js` |

---

## Documentation Structure

```
Project Root/
├── README.md              ← START HERE: Overview, quickstart, demo script
├── CLAUDE.md              ← This file: Business reqs, tech stack (auto-loaded by Claude)
│
└── .claude/
    ├── INITIAL_BRIEF.md   ← Original project brief from manager
    ├── docs/
    │   ├── 01-context.md      ← Problem statement, goals
    │   ├── 02-architecture.md ← System design, data flow
    │   ├── 03-forecasting.md  ← Algorithm details
    │   ├── 04-api-reference.md← Endpoints catalog
    │   ├── 05-ui-pages.md     ← Frontend pages & components
    │   ├── 06-development.md  ← Dev setup, testing, deployment
    │   └── 07-implementation-status.md ← What's built vs TODO
    └── plans/             ← Implementation plans (future)
```

---

## Current Status

✅ Baseline forecasting implemented
✅ Dashboard with KPIs, charts, insights
✅ Manual override for stock adjustments
✅ CSV upload for POS data
✅ Rule-based insights (no LLM required)
⏳ LLM integration (Groq SDK - replace Ollama)
⏳ Caching layer (Upstash Redis - Phase 2)
⏳ ML service (optional, Phase 2)
⏳ E2E tests (todo)
⏳ CI/CD (todo)

**See:** `.claude/docs/07-implementation-status.md` for detailed breakdown

---

## Gotchas

- **Demo data auto-loads** on first backend start if DB empty
- **PostgreSQL required** - SQLite not supported (analytics need complex queries)
- **LLM (dev/demo/prod):** Use Groq SDK (not Ollama) for consistency
- **No ORM:** Raw SQL with pg - better for analytics queries
- **Validation:** Zod schemas provide type safety without TypeScript
- **Timezone:** All dates in UTC, convert to local in frontend
- **Fallbacks:** Forecasting has 5-tier fallback for sparse data
- **AI data privacy:** Send calculated metrics, not raw sales data
- **Accuracy calculation:** Backtesting against historical data (no ML needed)

---

## Next Actions

1. ✅ Review brief & architecture
2. ✅ Set up documentation
3. ⏳ UI design (Orchids AI integration)
4. ⏳ Feature development
5. ⏳ Testing & deployment

---

**Documentation:**
- **README.md** - Project overview & quickstart
- **CLAUDE.md** (this file) - Business reqs & quick reference
- **`.claude/docs/*.md`** - Detailed technical docs
