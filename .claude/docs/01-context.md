# Context & Problem Statement

## Business Problem

F&B operators with multiple outlets face inefficient inventory planning due to volatile demand patterns across locations and days. Manual forecasting leads to:

- **Over-prep:** Food waste from unsold ingredients
- **Under-prep:** Stockouts of popular dishes → lost revenue
- **Reactive decisions:** Kitchen team estimates based on WhatsApp orders

**Target Client:** 5 outlets + central kitchen, orders via POS + delivery apps (Grab/Foodpanda).

---

## Solution Overview

AI-assisted demand forecasting system that:

1. **Ingests** historical POS sales (date, outlet, dish, quantity, channel)
2. **Forecasts** dish demand by outlet (weekly/monthly)
3. **Translates** dish forecasts → ingredient requirements
4. **Recommends** prep quantities with safety stock buffers
5. **Highlights** stockout risks & waste reduction opportunities
6. **Explains** insights in business language (AI assistant)

---

## Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| **Forecast accuracy** | ≥85% (MAPE-based) | ✅ Achievable with baseline |
| **Food waste reduction** | 30% | 🎯 Demo shows potential |
| **Stockout reduction** | 50% | 🎯 Risk highlights help |
| **Usability** | Kitchen staff via browser | ✅ Simple dashboard |

---

## Scope

### **In Scope (MVP)**
- Statistical forecasting (4-week trailing average)
- Ingredient planning with recipe ratios
- Manual stock override
- Dashboard with KPIs, charts, insights
- CSV upload for POS data
- Scenario simulation (surge %)
- AI Q&A assistant (Ollama, optional)

### **Out of Scope (Phase 2+)**
- ML-based forecasting (Prophet, LSTM)
- Real-time POS integration (webhooks)
- Multi-user authentication
- Mobile app
- Automatic ordering to suppliers

---

## Constraints

- **Human-in-the-loop:** AI recommends, human executes final order
- **Deployment:** Hostinger VPS (2GB RAM recommended)
- **Frequency:** Daily, weekly, monthly forecasts
- **Tech:** Node.js, PostgreSQL, React (no heavy ML infrastructure)
- **Budget:** Minimize cloud costs (local LLM preferred)

---

## Data Model (Simplified)

```
Sales Data (Input)
├── date, outlet, dish, quantity, channel

Recipe Data (Static)
├── dish → ingredients mapping
└── qty_per_dish (e.g., 1 laksa = 100g rice)

Stock Data (Dynamic)
├── ingredient, outlet, current_stock
└── shelf_life_days

Forecast Output
├── dish_demand_by_outlet (daily)
└── ingredient_order_recommendations
```

---

## Key Assumptions

- Historical sales patterns repeat weekly (day-of-week seasonality)
- Recipe proportions are stable (provided by client)
- 4-week window sufficient for baseline forecasting
- Safety stock of 15% covers typical variance
- Client can provide POS data in CSV format

---

## Why This Approach?

**Statistical > ML for MVP:**
- ✅ Explainable to clients (no black box)
- ✅ Faster to implement & demo
- ✅ Easier deployment (single codebase)
- ✅ Sufficient accuracy for demo (85% target)

**Add ML Later If:**
- Client requests higher accuracy
- More complex patterns emerge
- Budget allows data science work

---

## Related Docs

- [Architecture](02-architecture.md) - System design & data flow
- [Forecasting](03-forecasting.md) - Algorithm details
- [API Reference](04-api-reference.md) - Endpoints
