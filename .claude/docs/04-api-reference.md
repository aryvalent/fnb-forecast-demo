# API Reference

## Base Configuration

**Base URL:** `http://localhost:3001/api`
**Response Format:** JSON
**Error Format:** `{ error: string, details?: any }`

**Common Query Params:**
- `start` (YYYY-MM-DD) - Forecast start date
- `days` (number) - Forecast horizon (default: 7)
- `surgePct` (0-1) - Surge multiplier for simulation
- `mode` (baseline|ml) - Forecast algorithm

---

## Endpoints

### **Dashboard Summary**

```
GET /api/dashboard/summary?start={date}&days={n}&surgePct={0-1}
```

**Returns:** Complete dashboard data (KPIs, charts, insights, top items)

**Response:**
```json
{
  "kpis": {
    "accuracy": 87.5,
    "wasteReduction": 32,
    "stockoutReduction": 55
  },
  "forecastVsActual": [...],
  "demandByOutlet": [...],
  "ingredientUsage": [...],
  "topDishes": [...],
  "atRiskIngredients": [...],
  "insights": [...]
}
```

**Used by:** Overview page

---

### **Dish Forecast**

```
GET /api/forecast/dish?start={date}&days={n}&granularity={daily|weekly}
```

**Returns:** Dish demand predictions by outlet

**Response:**
```json
{
  "forecasts": [
    {
      "outlet": "Downtown",
      "dish": "Laksa",
      "date": "2026-03-23",
      "predicted_qty": 49,
      "confidence": "medium"
    }
  ]
}
```

**Granularity:**
- `daily` (default) - One row per day
- `weekly` - Aggregated by week

---

### **Ingredient Forecast**

```
GET /api/forecast/ingredient?start={date}&days={n}&safetyStockPct={0-1}
```

**Returns:** Ingredient order recommendations

**Response:**
```json
{
  "recommendations": [
    {
      "outlet": "Downtown",
      "ingredient": "rice",
      "required_qty": 45.2,
      "current_stock": 20,
      "recommended_order": 32,
      "risk_level": "HIGH",
      "days_of_coverage": 1.8
    }
  ]
}
```

**Safety Stock:** Default 15% (0.15), configurable

---

### **Insights**

```
GET /api/insights?start={date}&days={n}
```

**Returns:** Business insights in plain language

**Response:**
```json
{
  "insights": [
    {
      "type": "warning",
      "title": "Rice stockout risk",
      "message": "Downtown outlet has 1.8 days of rice coverage. Recommend ordering 32kg immediately."
    },
    {
      "type": "opportunity",
      "title": "Weekend opportunity",
      "message": "Laksa demand increases 35% on weekends. Consider prep increase on Thu evenings."
    }
  ]
}
```

**Insight Types:** warning, opportunity, info

---

### **Prep Sheet**

```
GET /api/prep-sheet?start={date}&days={n}&format={json|csv}
```

**Returns:** Kitchen-friendly prep list

**JSON Response:**
```json
{
  "prep_items": [
    {
      "outlet": "Downtown",
      "ingredient": "rice",
      "prep_qty": 45.2,
      "unit": "kg",
      "dishes": ["Laksa", "Nasi Lemak"]
    }
  ]
}
```

**CSV Response:** Downloadable file

---

### **Upload Sales CSV**

```
POST /api/upload-sales
Content-Type: multipart/form-data
```

**Request:**
```
file: sales.csv
```

**CSV Format:**
```csv
date,outlet,dish,quantity,channel
2026-03-15,Downtown,Laksa,45,pos
2026-03-15,Downtown,Laksa,12,grab
```

**Response:**
```json
{
  "success": true,
  "rows_imported": 150,
  "warnings": []
}
```

---

### **Override Stock**

```
POST /api/override-stock
Content-Type: application/json
```

**Request:**
```json
{
  "outlet": "Downtown",
  "ingredient": "rice",
  "current_stock": 25,
  "note": "Manual count"
}
```

**Response:**
```json
{
  "success": true,
  "updated_at": "2026-03-22T10:30:00Z"
}
```

**Triggers:** Re-calculation of recommendations

---

### **AI Assistant (Optional)**

```
POST /api/assistant/ask
Content-Type: application/json
```

**Request:**
```json
{
  "question": "Which ingredients are at risk?",
  "context_snapshot": { ... }  // From dashboard
}
```

**Response:**
```json
{
  "answer": "Based on current forecasts, rice and chicken are at high risk...",
  "sources": ["forecast", "stock"]
}
```

**Requires:** Ollama running on localhost:11434

---

## Error Codes

| Code | Description |
|------|-------------|
| `400` | Invalid input (bad CSV, missing params) |
| `404` | Resource not found (outlet, dish) |
| `500` | Server error (DB connection, ML service) |
| `503` | Service unavailable (Ollama down) |

---

## Rate Limiting (TODO)

**Planned:**
- 100 requests/minute per IP
- Burst: 20 requests in 10 seconds

**Implementation:** `express-rate-limit`

---

## Authentication (TODO)

**Phase 2:**
- JWT tokens for multi-user
- Role-based access (admin vs viewer)
- API keys for POS integration

---

## CORS Configuration

**Development:**
```javascript
origin: ["http://localhost:5173"]
credentials: true
```

**Production:**
```javascript
origin: ["https://your-domain.com"]
credentials: false
```

---

## Related Docs

- [Architecture](02-architecture.md) - API design
- [Forecasting](03-forecasting.md) - Algorithm behind endpoints
- [Development](06-development.md) - Testing & debugging
