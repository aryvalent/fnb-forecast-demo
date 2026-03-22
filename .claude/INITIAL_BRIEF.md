# AI Demand Forecasting for Multi-Outlet F&B

## Problem Brief

---

### 1. Business Context

An F&B operator with multiple outlets is looking for a solution to improve inventory/ingredient demand forecasting and reduce food waste through better data-driven preparation planning.

- **F&B operator** with 5 outlets and a central kitchen.
- **Order Channels:**
    - POS systems in each outlet
    - Delivery platforms (Grab / Foodpanda)
- The **central kitchen** prepares ingredients daily for all outlets.

---

### 2. Current Workflow

1.  **Outlet sales** recorded in POS system.
2.  **POS data** reviewed by the kitchen team.
3.  **Kitchen team** manually estimates next day preparation through WhatsApp orders.
4.  **Ingredients** ordered and prepared centrally.

**Challenges:**

- Manual forecasting processes.
- Inefficient ordering of ingredients.
- Significant food waste.
- Stockouts of popular dishes.

---

### 3. Data Available

**Data sources:**

- POS sales transactions.
- Grab/Foodpanda orders.
- Historical sales data.

**Typical data fields:**

- Date, Outlet, Dish, and Quantity sold.

> **Note:** POS "Dish" data fields should be linked and broken down into "ingredients" sub-data fields for accurate forecasting.

---

### 4. Desired Outcome

An AI System that forecasts weekly and monthly demand of ingredients needed for dishes in each specific outlet.

**Core Requirements:**

- Account for ingredient shelf life and delivery timelines.
- Base predictions on POS Sales Data.
- Recommend appropriate ingredient quantities (based on proportions provided by the F&B company).
- Support kitchen prep planning and pattern recognition.
- Provide dashboards for overall management, insights, and prediction analysis.

**Example Output:**

- **Dish Forecast:** Chicken rice (420 portions), Laksa (150 portions), Nasi lemak (210 portions).
- **Ingredient Recommendation:** Chicken (60kg), Rice (40kg), Sambal (5kg).

_Forecasts should be generated per outlet and aggregated for central kitchen preparation._

---

### 5. Success Metrics

- **Forecast accuracy:** $\ge85\%$
- **Food waste reduction:** 30%
- **Stockout reduction:** 50%

**Financial Impact:**
Improving forecasting accuracy is expected to significantly reduce food waste and prevent lost revenue from stockouts across all outlets.

---

### 6. Constraints

- **Integration:** Must integrate with existing POS data.
- **Frequency:** Generate forecasts daily, weekly, and monthly.
- **Usability:** Simple for kitchen staff to use via web browser.
- **Human-in-the-loop:** AI provides recommendations; a human must execute the final order.
- **Control:** Must include a manual override for existing stock information.

---

### 7. Builder Proposal Requirements

Proposals should be concise (ideally 1 page) and include:

1. Proposed solution architecture.
2. Build vs. integrate approach (tools/libraries used).
3. Forecasting approach + evaluation method.
4. MVP recommendation.
5. Estimated timeline and cost range.
6. Expected impact and key risks/assumptions.

---

**Prepared by:** Amanda, AI Playground Labs
