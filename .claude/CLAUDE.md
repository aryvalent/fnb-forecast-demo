# FnB Forecasting Demo - Quick Reference

**Last Updated:** 2026-03-22
**Status:** MVP Phase - Client Demo Ready

---

## 🚨 Priority Reading Order

1. **README.md** (root) - Project overview (from default, main reference), quickstart, demo script
2. **CLAUDE.md** (this file) - Business reqs, tech stack, quick reference for agent
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

| ID        | Requirement                                                                   | Priority |
| --------- | ----------------------------------------------------------------------------- | -------- |
| **FR-1**  | Ingest historical POS sales data (CSV: date, outlet, dish, quantity, channel) | P0       |
| **FR-2**  | Forecast dish demand by outlet (daily, weekly, monthly)                       | P0       |
| **FR-3**  | Convert dish forecasts → ingredient requirements using recipes                | P0       |
| **FR-4**  | Recommend ingredient orders with safety stock buffers                         | P0       |
| **FR-5**  | Highlight stockout risks (red/yellow/green)                                   | P0       |
| **FR-6**  | Manual override for current stock adjustments                                 | P1       |
| **FR-7**  | Dashboard with KPIs, charts, insights                                         | P0       |
| **FR-8**  | Scenario simulation (e.g., +20% weekend surge)                                | P1       |
| **FR-9**  | AI assistant for natural language Q&A                                         | P2       |
| **FR-10** | Export kitchen prep sheets (PDF/CSV)                                          | P1       |

### **Non-Functional Requirements**

| ID         | Requirement            | Target                                    |
| ---------- | ---------------------- | ----------------------------------------- |
| **NFR-1**  | **Forecast accuracy**  | ≥85% (MAPE ≤15%)                          |
| **NFR-2**  | **Waste reduction**    | 30% improvement vs baseline               |
| **NFR-3**  | **Stockout reduction** | 50% improvement vs baseline               |
| **NFR-4**  | **Response time**      | Dashboard loads in <2s                    |
| **NFR-5**  | **Usability**          | Kitchen staff can use without training    |
| **NFR-6**  | **Availability**       | 99% uptime (demo environment)             |
| **NFR-7**  | **Deployment**         | Runs on Hostinger VPS (2GB RAM)           |
| **NFR-8**  | **Security**           | No hardcoded credentials, CORS protected  |
| **NFR-9**  | **Scalability**        | Support 10+ outlets, 6+ months data       |
| **NFR-10** | **Human-in-the-loop**  | AI recommends, human executes final order |

### **Constraints**

- **Budget:** Minimize cloud costs (prefer local LLM vs cloud API)
- **Timeline:** MVP ready for client demo in [X] weeks
- **Tech:** Node.js stack (no heavy ML infrastructure for MVP)
- **Data:** Client provides CSV exports (no real-time POS integration yet)

---

## Success Metrics

| Metric                   | Target    | Measurement                  |
| ------------------------ | --------- | ---------------------------- |
| **Forecast accuracy**    | ≥85%      | MAPE on holdout test set     |
| **Food waste reduction** | 30%       | Simulated vs manual planning |
| **Stockout reduction**   | 50%       | Risk category improvement    |
| **User satisfaction**    | 4/5 stars | Client feedback post-demo    |

---

## Tech Stack (Locked Versions)

```
Backend:  Node.js 22.x + Express + PostgreSQL 16/17
Frontend: React 18.3 + Vite 5 + Tailwind 3.4 + Recharts 2
Optional: Ollama (llama3.1), Python 3.11+ (ML service)
```

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

| Purpose                 | Location                            |
| ----------------------- | ----------------------------------- |
| **Forecasting logic**   | `backend/src/forecasting.js`        |
| **Ingredient planning** | `backend/src/ingredientPlanning.js` |
| **API endpoints**       | `backend/src/index.js`              |
| **Frontend pages**      | `frontend/src/pages/`               |
| **Database schema**     | `backend/src/schema.sql`            |

---

## Key Architectural Decisions

### **Forecasting Approach**

- **Baseline:** Statistical (4-week trailing average by day-of-week)
- **ML:** Optional (Phase 2) - Python FastAPI service
- **Why:** Simplicity for demo, easier deployment, explainable to clients

### **AI/Ollama**

- **Purpose:** Q&A assistant only, NOT for forecasting
- **Deployment:** Local-only (skip on VPS if RAM < 2GB)
- **Alternative:** Cloud LLM API (OpenAI, Anthropic) for production

### **Modularity**

- Backend services separated by concern (forecasting, planning, insights)
- Frontend pages are self-contained components
- Database seeded separately from schema

---

## Security Checklist

- [ ] Env vars in `.env` (NEVER commit)
- [ ] SQL injection prevention (parameterized queries in `db.js`)
- [ ] Rate limiting on API endpoints (todo: add express-rate-limit)
- [ ] CORS configured (whitelist frontend domain only)
- [ ] Input validation on CSV upload (file type, size limits)
- [ ] No hardcoded credentials (use `process.env`)
- [ ] Ollama not exposed publicly (localhost only)

---

## Deployment Notes

**Target:** Hostinger VPS (2GB RAM recommended)

```
VPS Stack:
├── Docker Compose
├── PostgreSQL 16/17 (container)
├── Node.js Backend (PM2 or container)
└── Frontend (Nginx static serve OR Vercel/Netlify)
```

**Ollama on VPS:** Only if 2GB+ RAM, otherwise disable.

---

## Development Workflow

1. **Feature work:** Create feature branch from `main`
2. **Testing:** Manual API testing via curl/Postman
3. **Frontend:** Storybook for components (future: add)
4. **Deployment:** CI/CD via GitHub Actions (future: add)

---

## Extension Points

| Feature                    | How to Add                                                            |
| -------------------------- | --------------------------------------------------------------------- |
| **New forecast algorithm** | Implement in `backend/src/forecasting.js`, add `mode=algorithm` param |
| **New chart type**         | Add Recharts component to relevant page in `frontend/src/pages/`      |
| **New API endpoint**       | Add route in `backend/src/index.js`                                   |
| **New insight rule**       | Add logic to `backend/src/insights.js`                                |

---

## Documentation Structure

```
Project Root/
├── README.md              ← START HERE: Overview, quickstart, demo script
│
├── .claude/
│   ├── CLAUDE.md          ← This file: Business reqs, tech stack, reference
│   ├── INITIAL_BRIEF.md   ← Original project brief from manager
│   ├── docs/
│   │   ├── 01-context.md      ← Problem statement, goals
│   │   ├── 02-architecture.md ← System design, data flow
│   │   ├── 03-forecasting.md  ← Algorithm details
│   │   ├── 04-api-reference.md← Endpoints catalog
│   │   ├── 05-ui-pages.md     ← Frontend pages & components
│   │   └── 06-development.md  ← Dev setup, testing, deployment
│   └── plans/             ← Implementation plans (future)
```

---

## Current Status

✅ Baseline forecasting implemented
✅ Dashboard with KPIs, charts, insights
✅ Manual override for stock adjustments
✅ CSV upload for POS data
✅ Ollama integration (optional)
⏳ ML service (optional, Phase 2)
⏳ E2E tests (todo)
⏳ CI/CD (todo)

---

## Gotchas

- **Demo data auto-loads** on first backend start if DB empty
- **PostgreSQL required** - SQLite not supported (analytics need complex queries)
- **Ollama model:** Pull `llama3.1` or `llama3.2` for best results
- **Timezone:** All dates in UTC, convert to local in frontend
- **Fallbacks:** Forecasting has 5-tier fallback for sparse data

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
