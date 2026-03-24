# FnB Demand Forecasting Demo (Client-Ready)

## What Problem This Solves

Multi-outlet F&B operations typically over-prep (waste) or under-prep (stockouts) because demand is volatile by outlet and day-of-week.

This demo shows an end-to-end workflow that:

- Forecasts dish demand (weekly/monthly)
- Translates dish forecasts into ingredient orders
- Highlights stockout risk + waste reduction impact
- Produces “AI insights” in plain business language

## Key Features (Demo Value)

- **Demand forecast**: trailing 4-week average by day-of-week per outlet + dish, with smart fallbacks for sparse data
- **Ingredient planning**: recipe ratios + configurable safety stock (default 15%) + simple shelf-life cap for perishables
- **Business KPIs**: forecast accuracy (MAPE + accuracy%), naive comparison (waste reduction %), risk distribution (low/medium/high)
- **AI insight layer**: short, rule-based insights for client-friendly storytelling
- **Scenario simulation**: “Weekend Surge (+20%)” to show operational impact instantly
- **Kitchen-friendly UI**: KPI cards, tables with risk colors, and charts for quick decisions

## Architecture (Simple REST + Postgres)

```
                 +-------------------+
 CSV Upload ---> |  Node.js API      | -----> PostgreSQL
 (mock POS)      |  Express (REST)   |        sales / recipes / stock
                 +-------------------+
                          |
                          | JSON
                          v
                 +-------------------+
                 |  React Dashboard  |
                 |  (Vite + Charts)  |
                 +-------------------+

 Optional:
   Node.js API -> Python ML Service (/predict)
```

Repo folders:

- [backend](file:///d:/Working%20Folder/FnB%20Forecasting/backend) (Express + PostgreSQL)
- [frontend](file:///d:/Working%20Folder/FnB%20Forecasting/frontend) (React + Recharts)
- [ml-service](file:///d:/Working%20Folder/FnB%20Forecasting/ml-service) (optional)

## Prerequisites

- Node.js 22+
- PostgreSQL 16+ (local install or Docker)
- Python 3.11+ (only if running ml-service)

## Quickstart (Recommended: Local PostgreSQL)

1. Create database + set connection string

Make sure you have a local database named `fnb_forecasting`, and update `backend/.env` with your local credentials.

2. Backend setup

```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run dev
```

Backend: http://localhost:3001

### Code Quality (Biome)

Backend uses Biome for fast linting + formatting:

```bash
# Check all lint rules
npx @biomejs/biome check backend/src/

# Auto-fix formatting
npx @biomejs/biome format --write backend/src/

# Check + fix in one command
npx @biomejs/biome check backend/src/ --write
```

3. Frontend setup

```powershell
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

The backend auto-loads demo data into PostgreSQL on startup if the tables are empty (ingredients, recipes, stock, and sample sales history).

## Optional: Docker PostgreSQL

If you want a throwaway Postgres in Docker (demo data auto-loaded on first boot):

```bash
docker compose up -d
```

If you previously started the DB, reset it to re-run the auto-import:

```bash
docker compose down -v
docker compose up -d
```

## Optional: Local LLM Insights (Ollama)

This demo can use a local LLM (no cloud) to answer questions using a safe, read-only snapshot of dashboard data.

1. Install Ollama: https://ollama.com

2. Pull a model:

```bash
ollama pull llama3.1
```

3. Configure backend env (defaults work):

- `OLLAMA_URL=http://localhost:11434`
- `OLLAMA_MODEL=llama3.1`

4. Start backend and open the UI:

- In the dashboard nav, go to **Ask AI**

## Step-by-Step Client Demo Script (2–3 minutes)

1. **Show business KPIs (one sentence each)**
    - Accuracy: “How close predictions are vs actual demand”
    - Waste reduction: “Estimated improvement vs manual planning”
    - Stockout reduction: “Fewer ingredient stockouts with better ordering”

2. **Tell the visual story**
    - Forecast vs Actual chart: show the model tracks demand better than naive
    - Demand by Outlet: show where prep needs to be focused
    - Ingredient usage breakdown: show what purchasing will be driven by

3. **Highlight top demand items**
    - Top 5 Dishes card: “These drive the week’s prep plan”

4. **Show operational action**
    - At-Risk Ingredients table: risk colors + days of coverage

5. **Manual override**
    - Go to Manual Override → adjust stock for a high-risk ingredient → Save
    - Return to Overview / Ingredient Planning to show updated recommendations

6. **Scenario simulation**
    - Click “Simulate Weekend Surge (+20%)”
    - Say: “We can stress-test the plan instantly”

7. **AI insights**
    - Read 2–3 insight bullets: “This is what a manager would act on today”

## API Endpoints (Useful for Live Demos)

Base URL: `http://localhost:3001/api`

### Upload sales CSV (optional)

CSV header:

`date,outlet,dish,quantity,channel`

```bash
curl -F "file=@backend/sample_data/sales.csv" http://localhost:3001/api/upload-sales
```

### Dashboard summary (KPIs + charts + insights)

```bash
curl "http://localhost:3001/api/dashboard/summary?start=2026-03-20&days=7"
```

Weekend surge simulation (+20% on Fri/Sat/Sun):

```bash
curl "http://localhost:3001/api/dashboard/summary?start=2026-03-20&days=7&surgePct=0.2"
```

### Dish forecast

```bash
curl "http://localhost:3001/api/forecast/dish?start=2026-03-20&days=7"
curl "http://localhost:3001/api/forecast/dish?start=2026-03-20&days=7&surgePct=0.2"
```

Daily rows for charting:

```bash
curl "http://localhost:3001/api/forecast/dish?start=2026-03-20&days=7&granularity=daily"
```

### Ingredient planning

```bash
curl "http://localhost:3001/api/forecast/ingredient?start=2026-03-20&days=7&safetyStockPct=0.15"
```

### Insights only

```bash
curl "http://localhost:3001/api/insights?start=2026-03-20&days=7"
```

### Kitchen prep sheet (JSON or CSV)

```bash
curl "http://localhost:3001/api/prep-sheet?start=2026-03-20&days=7&safetyStockPct=0.15"
curl "http://localhost:3001/api/prep-sheet?start=2026-03-20&days=7&safetyStockPct=0.15&format=csv"
```

### Manual override stock

```bash
curl -X POST http://localhost:3001/api/override-stock -H "Content-Type: application/json" -d "{\"outlet\":\"Downtown\",\"ingredient\":\"rice\",\"current_stock\":25}"
```

## Forecasting Logic (Baseline)

For each outlet + dish:

- Aggregate sales per day across channels
- Compute average quantity for each day-of-week using trailing 28 days
- Forecast the next N days by repeating day-of-week averages

Fallbacks (when data is sparse):

1. Series day-of-week average
2. Series overall average
3. Dish-level average
4. Outlet-level average
5. Global average

## Ingredient Planning Logic

Per outlet:

- `required_ingredient_qty += predicted_dish_qty * qty_per_dish`
- `buffered_required = required * (1 + safetyStockPct)`
- `recommended_order_raw = max(0, buffered_required - current_stock)`

Shelf-life cap (simple demo rule):

- cap target stock to `daily_usage * shelf_life_days` for perishables

## Optional: Python ML Service (Advanced Mode)

1. Start the ML service

```powershell
cd ml-service
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

2. Point the backend to it

Set in `backend/.env`:

`ML_SERVICE_URL=http://localhost:8000`

3. Call ML mode forecasts

```bash
curl "http://localhost:3001/api/forecast/dish?start=2026-03-20&days=7&mode=ml"
curl "http://localhost:3001/api/forecast/ingredient?start=2026-03-20&days=7&mode=ml"
```
