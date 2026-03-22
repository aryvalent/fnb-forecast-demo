# Forecasting Algorithm

## Overview

**Approach:** Statistical time-series forecasting using trailing 4-week averages by day-of-week.

**Why This Method:**
- ✅ Explainable to clients (simple math)
- ✅ Works well for F&B (weekly seasonality)
- ✅ Handles sparse data gracefully
- ✅ Fast computation (no training)
- ✅ Sufficient for 85% accuracy target

---

## Algorithm Steps

### **1. Data Aggregation**

```javascript
// Raw sales: { date, outlet, dish, quantity, channel }
// → Aggregate by (date, outlet, dish)
// → Sum quantity across channels
```

### **2. Day-of-Week Average**

```javascript
// For each (outlet, dish, day_of_week):
//   Get sales from last 28 days (4 weeks)
//   Compute average quantity per day_of_week
//
// Example: Laksa at Downtown outlet
//   Mon (last 4): [45, 52, 48, 50] → avg = 48.75
//   Tue (last 4): [38, 42, 40, 41] → avg = 40.25
```

### **3. Forecast Generation**

```javascript
// For next N days:
//   Get day_of_week for each date
//   Assign corresponding average
//
// Example: Forecast for Mon Mar 23 → 48.75 Laksa
```

### **4. Fallback Hierarchy (5-Tier)**

When data is sparse (e.g., new dish/outlet):

```javascript
1. Series day-of-week average  // Best: (outlet, dish, dow)
2. Series overall average      // Fallback: (outlet, dish)
3. Dish-level average          // Fallback: dish across all outlets
4. Outlet-level average        // Fallback: all dishes at outlet
5. Global average              // Last resort: overall mean
```

**Why 5 tiers:** Ensures forecast always exists, degrades gracefully.

---

## Example Calculation

### **Scenario:** Forecast Laksa demand for Downtown outlet, next 7 days

**Historical Data (last 4 weeks):**
```
Week 1 Mon: 45, Tue: 38, Wed: 42, Thu: 40, Fri: 55, Sat: 62, Sun: 58
Week 2 Mon: 52, Tue: 42, Wed: 48, Thu: 44, Fri: 58, Sat: 68, Sun: 62
Week 3 Mon: 48, Tue: 40, Wed: 45, Thu: 41, Fri: 54, Sat: 65, Sun: 60
Week 4 Mon: 50, Tue: 41, Wed: 46, Thu: 42, Fri: 56, Sat: 66, Sun: 61
```

**Day-of-Week Averages:**
```
Mon: (45+52+48+50)/4 = 48.75
Tue: (38+42+40+41)/4 = 40.25
Wed: (42+48+45+46)/4 = 45.25
Thu: (40+44+41+42)/4 = 41.75
Fri: (55+58+54+56)/4 = 55.75
Sat: (62+68+65+66)/4 = 65.25
Sun: (58+62+60+61)/4 = 60.25
```

**7-Day Forecast:**
```
Day 1 (Mon): 49
Day 2 (Tue): 40
Day 3 (Wed): 45
Day 4 (Thu): 42
Day 5 (Fri): 56
Day 6 (Sat): 65
Day 7 (Sun): 60
```

---

## Surge Simulation

**Purpose:** Stress-test forecast with scenario modifiers.

```javascript
surge_multiplier = 1 + surgePct  // e.g., 0.2 = +20%
surge_days = [Fri, Sat, Sun]     // Weekend surge

forecast[dow in surge_days] *= surge_multiplier
```

**Example:** +20% weekend surge
```
Fri: 56 × 1.2 = 67
Sat: 65 × 1.2 = 78
Sun: 60 × 1.2 = 72
```

---

## Accuracy Measurement

### **MAPE (Mean Absolute Percentage Error)**

```javascript
MAPE = (1/n) × Σ(|actual - forecast| / actual) × 100

Target: ≤15% MAPE → 85% accuracy
```

### **Naive Comparison**

```javascript
naive_forecast = yesterday_sales
improvement_vs_naive = (naive_mape - model_mape) / naive_mape
```

**Purpose:** Show improvement over manual/naive methods.

---

## Ingredient Planning Math

### **From Dishes to Ingredients**

```javascript
// For each dish forecast:
required_ingredient = forecast_dish_qty × qty_per_dish

// Sum by ingredient + outlet
total_required = Σ(required_ingredient)

// Apply safety stock
buffered_required = total_required × (1 + safetyStockPct)  // default 15%

// Subtract current stock
recommended_order = max(0, buffered_required - current_stock)

// Cap by shelf life (perishables)
daily_usage = total_required / forecast_days
max_stock = daily_usage × shelf_life_days
final_recommendation = min(recommended_order, max_stock)
```

### **Risk Classification**

```javascript
days_of_stock = current_stock / daily_usage

risk =
  days_of_stock < 2  ? "HIGH"
  days_of_stock < 4  ? "MEDIUM"
  : "LOW"
```

---

## ML Service (Optional, Phase 2)

### **When to Use:**

- Client requests >85% accuracy
- Complex patterns (holidays, events)
- Large dataset (6+ months history)

### **Options:**

| Algorithm | Pros | Cons |
|-----------|------|------|
| **Prophet** | Handles seasonality, holidays | Heavy, Facebook dep |
| **ARIMA** | Classic time-series | Complex tuning |
| **LSTM** | Deep learning | Overkill for demo |
| **XGBoost** | Feature engineering | Needs more features |

### **Integration:**

```javascript
// backend/src/mlClient.js
async function forecastWithML(params) {
  const response = await fetch(`${ML_SERVICE_URL}/predict`, {
    method: 'POST',
    body: JSON.stringify(params)
  });
  return response.json();
}
```

**API Param:** `mode=ml` on `/forecast/*` endpoints

---

## Performance Considerations

| Metric | Target | Notes |
|--------|--------|-------|
| **Forecast speed** | <500ms | 4-week agg is fast |
| **Memory** | <100MB | In-memory aggregation |
| **DB load** | 1 query per forecast | Can cache in Redis |
| **Cold start** | <2s | Demo data loads once |

---

## Future Improvements

1. **Exponential smoothing** - Weight recent weeks higher
2. **Holiday detection** - Separate holiday averages
3. **Outlet clustering** - Share patterns across similar outlets
4. **Weather integration** - Adjust for rain/heat (affects F&B)
5. **Event calendar** - Promotions, concerts nearby

---

## Related Docs

- [Architecture](02-architecture.md) - Data flow
- [API Reference](04-api-reference.md) - Forecast endpoints
- [Development](06-development.md) - Testing & tuning
