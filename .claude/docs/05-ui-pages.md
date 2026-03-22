# UI Pages & Components

## Frontend Stack

```
React 18.3 + Vite 5 + Tailwind 3.4 + Recharts 2
```

**Entry Point:** `frontend/src/main.jsx`
**Router:** React Router v7 (URL-based routing)
**State:** React hooks (useState, useEffect) + Context (DemoProvider)
**API:** `frontend/src/api.js` (centralized fetch wrapper)

---

## Page Structure

### **1. Overview (`/`)**
**File:** `frontend/src/pages/Overview.jsx`

**Purpose:** Main dashboard with KPIs, charts, insights

**Components:**
- KPI cards (accuracy, waste reduction, stockout reduction)
- Forecast vs Actual chart (line chart)
- Demand by Outlet (bar chart)
- Top 5 Dishes table
- At-Risk Ingredients table (color-coded)
- Scenario simulation button

**Key Features:**
- Real-time data refresh
- Surge simulation (+20% weekend)
- Export insights button

---

### **2. Forecast (`/forecast`)**
**File:** `frontend/src/pages/Forecast.jsx`

**Purpose:** Detailed dish demand forecasts

**Components:**
- Outlet selector (dropdown)
- Dish selector (multiselect)
- Date range picker
- Forecast table (daily granularity)
- Export CSV button

**Key Features:**
- Filter by outlet/dish
- Compare forecast vs historical
- Toggle: daily/weekly view

---

### **3. Ingredients (`/ingredients`)**
**File:** `frontend/src/pages/Ingredients.jsx`

**Purpose:** Ingredient planning recommendations

**Components:**
- Outlet selector
- Safety stock slider (0-50%)
- Ingredient table with:
  - Required qty
  - Current stock
  - Recommended order
  - Risk level (color: red/yellow/green)
  - Days of coverage

**Key Features:**
- Adjust safety stock → live recalculation
- Highlight high-risk items
- Export prep sheet

---

### **4. Manual Override (`/override`)**
**File:** `frontend/src/pages/Override.jsx`

**Purpose:** Adjust current stock levels

**Components:**
- Outlet selector
- Ingredient list with stock inputs
- Save button
- Impact preview (before/after)

**Key Features:**
- Bulk edit (CSV upload)
- Undo last override
- Audit log (future)

---

### **5. Prep Sheet (`/prep`)**
**File:** `frontend/src/pages/PrepSheet.jsx`

**Purpose:** Kitchen-friendly prep list

**Components:**
- Outlet selector
- Date range
- Print button
- Prep table (grouped by ingredient)

**Key Features:**
- Print-optimized layout
- Group by dish for efficiency
- Export PDF (future)

---

### **6. AI Assistant (`/assistant`)**
**File:** `frontend/src/pages/Assistant.jsx`

**Purpose:** Natural language Q&A

**Components:**
- Chat input
- Conversation history
- Suggested questions
- Status indicator (Ollama connected?)

**Key Features:**
- Context-aware (uses dashboard snapshot)
- Example questions
- Error handling (Ollama down)

**Requires:** Ollama running locally

---

## Shared Components

### **InfoTip (`frontend/src/components/InfoTip.jsx`)**
Reusable tooltip for KPI explanations

### **AppLayout (`frontend/src/layout/AppLayout.jsx`)**
Shell with:
- Sidebar navigation
- Header (title, date range)
- Responsive design

### **DemoProvider (`frontend/src/DemoProvider.jsx`)**
Context provider for:
- Demo mode toggle
- Mock data injection
- Time acceleration (future)

---

## Design Patterns

### **Data Fetching**
```javascript
// All pages use this pattern
const { data, loading, error } = useSWR(
  '/api/dashboard/summary',
  fetcher
);
```

**Future:** Replace with React Query (TanStack Query)

### **Error Handling**
```javascript
if (error) return <ErrorState error={error} />;
if (loading) return <LoadingSpinner />;
```

### **Responsive Design**
- Desktop: Sidebar + main content
- Mobile: Hamburger menu + stacked cards

---

## Chart Components (Recharts)

| Chart Type | Used In | Purpose |
|------------|---------|---------|
| **Line Chart** | Overview | Forecast vs Actual |
| **Bar Chart** | Overview | Demand by Outlet |
| **Pie Chart** | (future) | Ingredient breakdown |
| **Area Chart** | (future) | Cumulative demand |

**Styling:** Tailwind colors, custom tooltips

---

## State Management

### **Local State (useState)**
- Form inputs, filters, selections
- UI toggles (dropdowns, modals)

### **Global State (Context)**
- Demo mode on/off
- User preferences (theme, outlet)
- Auth (future)

### **Server State (API)**
- Dashboard data, forecasts
- Cache via SWR or React Query

---

## Routing

```javascript
// React Router v7
/
/forecast
/ingredients
/override
/prep
/assistant
```

**Future:** Nested routes for outlet-specific views

---

## Accessibility

- Keyboard navigation
- ARIA labels on icons/buttons
- High contrast mode (future)
- Screen reader support (basic)

---

## Performance Optimization

| Technique | Status |
|-----------|--------|
| **Code splitting** | ✅ Vite default |
| **Lazy loading** | ⏳ Add for pages |
| **Image optimization** | ⏳ Add next-gen formats |
| **Bundle size** | ⏳ Analyze with Bundlephobia |
| **Caching** | ⏳ Add Service Worker |

---

## Future UI Enhancements

1. **Dark mode** - Tailwind dark: class
2. **Storybook** - Component documentation
3. **E2E tests** - Playwright or Cypress
4. **Internationalization** - Multi-language support
5. **Real-time updates** - WebSocket for live forecasts

---

## Related Docs

- [Architecture](02-architecture.md) - Frontend/backend communication
- [API Reference](04-api-reference.md) - Endpoint contracts
- [Development](06-development.md) - Setup & debugging
