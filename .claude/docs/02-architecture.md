# System Architecture

## High-Level Design

```
┌──────────────────────────────────────────────────────────────────┐
│                          Frontend (React)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐  │
│  │ Overview │ │Forecast  │ │Ingredients│ │Override  │ │Assistant│  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              │ HTTP/JSON
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                       Backend (Node.js/Express)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │  Forecasting │  │   Planning   │  │   Insights   │            │
│  │   Service    │  │    Service   │  │   Service    │            │
│  │ (Statistical)│  │   (Math)     │  │  (Rules+LLM) │            │
│  └──────────────┘  └──────────────┘  └──────┬───────┘            │
│                                 ↓               │                 │
│  ┌────────────────────────────────────────┐    │                 │
│  │              PostgreSQL Database       │    │                 │
│  │  sales │ recipes │ stock │ ingredients  │    │                 │
│  └────────────────────────────────────────┘    │                 │
└─────────────────────────────────────────────────┼─────────────────┘
                                                  │
                    ┌─────────────────────────────┼───────────────┐
                    │                             │               │
                    ↓                             ↓               ↓
          ┌─────────────────┐         ┌─────────────────┐  ┌─────────────┐
          │  Groq (Dev)     │         │  Groq (Demo)   │  │ OpenAI (Prod)│
          │  API (free)     │         │  API (free)    │  │ API ($0.01/m)│
          └─────────────────┘         └─────────────────┘  └─────────────┘
```

**Key:** Groq and OpenAI use similar SDK patterns (OpenAI-compatible), easier to maintain than switching between Ollama and cloud APIs.

---

## Component Responsibilities

### **Frontend (`/frontend/src/`)**

| Page | Purpose | Key Features |
|------|---------|--------------|
| `Overview.jsx` | Main dashboard | KPI cards, forecast charts, top items |
| `Forecast.jsx` | Dish demand details | Outlet-specific predictions |
| `Ingredients.jsx` | Ingredient planning | Order recommendations, risk tables |
| `Override.jsx` | Manual stock adjustment | Edit current stock, impact preview |
| `PrepSheet.jsx` | Kitchen view | Print-friendly prep lists |
| `Assistant.jsx` | AI Q&A | Natural language queries |

**Design Pattern:** Page components are self-contained, fetch data via `api.js`, manage local state.

---

### **Backend (`/backend/src/`)**

| Module | Responsibility |
|--------|----------------|
| `index.js` | Express server, API routes, CORS |
| `db.js` | PostgreSQL connection pool |
| `forecasting.js` | Demand prediction algorithm (statistical) |
| `ingredientPlanning.js` | Recipe → ingredient conversion (math) |
| `insights.js` | KPI calculation, rule-based insights |
| `llm.js` | LLM integration (Ollama/Groq/OpenAI) |
| `mlClient.js` | Python ML service client (optional) |
| `initDb.js` | Schema creation + seed data |

**Design Pattern:** Functional services, no framework overhead (Express is sufficient).

---

### **Database Schema**

```sql
outlets (id, name, location)
ingredients (id, name, unit, shelf_life_days, category)
dishes (id, name, category)
recipes (dish_id, ingredient_id, qty_per_dish)
stock (outlet_id, ingredient_id, current_stock, last_updated)
sales (date, outlet_id, dish_id, quantity, channel)
```

**Key Relationships:**
- `sales` → `outlets` (many-to-one)
- `sales` → `dishes` (many-to-one)
- `dishes` ↔ `ingredients` (many-to-many via `recipes`)

---

## Data Flow

### **Forecasting Pipeline**

```
1. CSV Upload (or use demo data)
   ↓
2. Aggregate sales by (date, outlet, dish, channel)
   ↓
3. Compute 4-week trailing average by day-of-week
   ↓
4. Forecast next N days (repeat day-of-week pattern)
   ↓
5. Apply fallbacks for sparse data (5-tier)
   ↓
6. Store/present forecast
```

### **Ingredient Planning Pipeline**

```
1. Fetch dish forecasts (from above)
   ↓
2. Multiply by recipe ratios
   ↓
3. Sum by ingredient + outlet
   ↓
4. Apply safety stock buffer (default 15%)
   ↓
5. Subtract current stock
   ↓
6. Cap by shelf life (perishables)
   ↓
7. Return order recommendations
```

### **AI Insights Pipeline (Two-Layer Architecture)**

```
LAYER 1: Statistical Calculation (Backend)
──────────────────────────────────────────
Raw Sales Data
    ↓
Forecasting Algorithm (4-week averages)
    ↓
Calculated Metrics (NUMBERS):
  - forecast_laksa: 49 portions/day
  - rice_coverage: 1.8 days
  - weekend_surge: +35%
  - at_risk: [rice, chicken]

LAYER 2: AI Reasoning (LLM)
──────────────────────────────────
Calculated Metrics → LLM → Natural Language Insights

Input to LLM (NOT raw sales data):
{
  "forecasts": { "Laksa": 49, "Nasi Lemak": 35 },
  "risks": { "rice": "1.8 days", "chicken": "2.1 days" },
  "trends": { "weekend_surge": "+35%" }
}

LLM Output (Business Language):
"Rice stock will run out in 1.8 days. Order 32kg immediately.
Laksa demand spikes 35% on weekends—prep extra on Thursday."
```

**Privacy Strategy:**
- ❌ Never send raw sales data to external LLMs
- ✅ Send only calculated metrics (aggregated, non-identifiable)
- ✅ Two-layer approach: Statistical math (Layer 1) + AI reasoning (Layer 2)

---

## API Architecture

**Style:** RESTful JSON
**Base URL:** `http://localhost:3001/api`
**Response Format:** `{ data: ..., error: ..., meta: ... }`

**Key Endpoints:**
- `GET /dashboard/summary` - Full dashboard data
- `GET /forecast/dish` - Dish demand predictions
- `GET /forecast/ingredient` - Ingredient recommendations
- `GET /insights` - Business insights
- `GET /prep-sheet` - Kitchen prep sheet
- `POST /upload-sales` - CSV import
- `POST /override-stock` - Manual stock adjustment

**Rate Limiting:** (TODO: Add `express-rate-limit`)

---

## Security Architecture

### **Layers:**

1. **Environment:** All secrets in `.env` (postgres, API keys)
2. **API:** Parameterized SQL queries (no injection)
3. **CORS:** Whitelist frontend origin
4. **Input:** Validate CSV schema, file size limits
5. **LLM Privacy:**
   - Development: Ollama localhost-only (no external exposure)
   - Demo/Production: Send calculated metrics only (never raw sales data)
   - External APIs: Use HTTPS, API keys in env vars

### **LLM Data Privacy Strategy:**

| Data Type | Sent to External LLM? | Example |
|-----------|----------------------|---------|
| **Raw sales** | ❌ NO | `{ date: "2026-03-15", dish: "Laksa", qty: 45 }` |
| **Calculated metrics** | ✅ YES | `{ forecast_laksa: 49, risk: "HIGH" }` |
| **Aggregated insights** | ✅ YES | `{ top_dishes: ["Laksa: 49/day"] }` |

**Why:** Protects sensitive sales/revenue data while still enabling AI reasoning.

### **Future Additions:**
- JWT authentication (multi-user)
- API key management (external integrations)
- Request signing (POS webhooks)
- Audit logging

---

## Deployment Architecture

### **Local Development**
```
PostgreSQL (Docker or local)
Backend (Node.js, port 3001)
Frontend (Vite dev server, port 5173)
Ollama (localhost:11434, for LLM testing)
```

### **Production (Hostinger VPS 1GB)**
```
┌─────────────────────────────────────┐
│  Ubuntu 22.04/24.04                  │
│  ┌─────────────────────────────┐    │
│  │  Docker Compose             │    │
│  │  ├─ PostgreSQL 16/17        │    │
│  │  ├─ Node.js Backend (PM2)   │    │
│  │  └─ Nginx (reverse proxy)   │    │
│  └─────────────────────────────┘    │
│                                      │
│  Frontend: Nginx static OR Vercel   │
│  LLM: Groq (free) or OpenAI API     │
└─────────────────────────────────────┘
```

**Resource Requirements:**
- **1GB RAM:** Sufficient with Groq/OpenAI (API-based LLM)
- **8GB+ RAM:** Only if self-hosting Ollama (not recommended for 1GB VPS)
- Storage: 20GB+ (logs + backups)

**LLM Provider Selection:**
| Environment | Provider | RAM Impact | Monthly Cost |
|-------------|----------|------------|--------------|
| Development | Groq SDK | Zero (API) | FREE (tier) |
| Demo | Groq SDK | Zero (API) | FREE (tier) |
| Production | Groq or OpenAI | Zero (API) | $0-0.01 |

**Why Groq for dev too:** Same SDK pattern as OpenAI, minimal code changes when deploying to production.

---

## Extension Points

| Feature | How to Extend |
|---------|---------------|
| **New forecast algorithm** | Add `mode=algorithm` to `/forecast/*` endpoints |
| **New ML service** | Implement in Python, call via `mlClient.js` |
| **New data source** | Add importer in `backend/src/` |
| **New insight rule** | Add to `insights.js` rule engine |
| **New UI page** | Create in `frontend/src/pages/`, add to router |

---

## Modularity Principles

1. **Backend services** are pure functions (testable, swappable)
2. **Frontend pages** are self-contained (easy to add/remove)
3. **Database** is normalized (flexible for new entities)
4. **API** is versioned (`/api/v1/`) - future-proof
5. **Config** is environment-based (no hardcoded values)

---

## Related Docs

- [Forecasting Algorithm](03-forecasting.md) - Math details
- [API Reference](04-api-reference.md) - Endpoint specs
- [Development](06-development.md) - Setup & deployment
