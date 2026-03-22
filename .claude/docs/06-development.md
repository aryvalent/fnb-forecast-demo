# Development Guide

## Setup

### **Prerequisites**

```bash
# Check versions
node --version   # Should be 22.x
npm --version    # Should be 10.x
psql --version   # Should be 16.x or 17.x
```

### **Local PostgreSQL (Recommended)**

```bash
# Create database
createdb fnb_forecasting

# Configure backend
cd backend
cp .env.example .env
# Edit .env with your credentials
```

### **Docker PostgreSQL (Alternative)**

```bash
docker compose up -d
# Auto-creates DB + seeds data
```

---

## Backend Development

```bash
cd backend
npm install
npm run dev      # http://localhost:3001
npm run test     # (TODO: add tests)
npm run lint     # ESLint
```

### **Key Files**

| File | Purpose |
|------|---------|
| `src/index.js` | Express server, routes |
| `src/forecasting.js` | Forecast algorithm |
| `src/ingredientPlanning.js` | Recipe math |
| `src/db.js` | PostgreSQL connection |
| `src/schema.sql` | DB schema |

### **Environment Variables**

```bash
# backend/.env
DATABASE_URL=postgresql://user:pass@localhost:5432/fnb_forecasting
PORT=3001
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
ML_SERVICE_URL=http://localhost:8000  # Optional
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### **Database Management**

```bash
# Check connection
npm run check-db

# Print config
npm run print-db-config

# Reset DB (CAUTION: deletes all data)
npm run reset-db

# Generate mock data
npm run generate-mock
```

---

## Frontend Development

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build    # Production build
npm run preview  # Preview build
npm run lint     # ESLint
```

### **Key Files**

| File | Purpose |
|------|---------|
| `src/App.jsx` | Main app, routing |
| `src/api.js` | API client |
| `src/pages/` | Page components |
| `src/layout/AppLayout.jsx` | Shell component |

### **Environment Variables**

```bash
# frontend/.env (create if needed)
VITE_API_URL=http://localhost:3001/api
```

---

## ML Service (Optional)

```bash
cd ml-service
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

**Testing:**
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"outlet": "Downtown", "dish": "Laksa", "days": 7}'
```

---

## LLM Setup

### **Recommended: Groq SDK (Development + Demo + Production Option)**

```bash
# Install Groq SDK (same for all environments)
cd backend
npm install groq-sdk
```

**Configure in `backend/.env`:**
```bash
# Development
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_...  # Get from https://console.groq.com
GROQ_MODEL=llama3.1-70b-versatile

# Demo (same!)
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_...

# Production (if using Groq)
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_...
```

**Advantages:**
- FREE tier (generous limits: 30 requests/minute)
- Very fast inference (LPU technology)
- Works on 1GB VPS (zero RAM impact)
- Production-ready reliability
- **Same code from dev → demo → production!**

**Get API Key:** https://console.groq.com/keys

---

### **Alternative: OpenAI (Production Only)**

```bash
# Install OpenAI SDK (OpenAI-compatible API)
cd backend
npm install openai
```

**Configure in `backend/.env`:**
```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...  # Get from https://platform.openai.com
OPENAI_MODEL=gpt-4o-mini
```

**Advantages:**
- Enterprise reliability
- Best quality insights
- ~$0.01/month cost for demo usage
- Works on 1GB VPS (zero RAM impact)
- **Similar SDK pattern to Groq (minimal code change!)**

**Get API Key:** https://platform.openai.com/api-keys

---

## LLM Provider Strategy

| Environment | Provider | Cost | RAM Impact | Code Change? |
|-------------|----------|------|------------|--------------|
| **Development** | Groq SDK | FREE (tier) | Zero | No (baseline) |
| **Demo** | Groq SDK | FREE (tier) | Zero | No (same!) |
| **Production** | Groq or OpenAI | $0-0.01/mo | Zero | Minimal (config only) |

**Why Skip Ollama:**
- Ollama uses different API (fetch to localhost:11434)
- Groq/OpenAI use similar SDK patterns (OpenAI-compatible)
- Less code refactoring when deploying from dev → production

**Code Pattern (Same for Groq + OpenAI):**
```javascript
// Both use similar pattern!
const client = new Groq(); // or new OpenAI()
const response = await client.chat.completions.create({
  model: 'llama3.1-70b-versatile', // or 'gpt-4o-mini'
  messages: [...]
});
```

---

## Testing Strategy

### **Manual Testing (Current)**

```bash
# Test API endpoints
curl "http://localhost:3001/api/dashboard/summary?start=2026-03-20&days=7"

# Test CSV upload
curl -F "file=@backend/sample_data/sales.csv" \
  http://localhost:3001/api/upload-sales

# Test ML mode
curl "http://localhost:3001/api/forecast/dish?start=2026-03-20&days=7&mode=ml"
```

### **Unit Tests (TODO)**

```bash
# Backend tests
npm test -- --coverage

# Target files:
# - forecasting.js (algorithm logic)
# - ingredientPlanning.js (math)
# - insights.js (KPI calculations)
```

### **Integration Tests (TODO)**

```bash
# Test full forecast pipeline
# Test API → DB flow
# Test error scenarios
```

### **E2E Tests (TODO)**

```bash
# Playwright or Cypress
# Test user flows:
# - View dashboard
# - Override stock
# - Generate prep sheet
# - Ask AI question
```

---

## Debugging

### **Backend**

```javascript
// Add logging
console.log('Forecast params:', params);

// Check DB queries
console.log('SQL:', query, [params]);

// Ollama debug
curl http://localhost:11434/api/tags  // Check if running
```

### **Frontend**

```javascript
// React DevTools
// Network tab in browser
// Console for API errors

// Check API calls
console.log('Fetching:', url);
console.log('Response:', data);
```

### **Database**

```bash
# Connect to DB
psql -d fnb_forecasting

# Check tables
\dt

# Query sales
SELECT * FROM sales LIMIT 10;

# Check stock levels
SELECT * FROM stock;
```

---

## Git Workflow

```bash
# Feature branch
git checkout -b feature/new-forecast-algorithm

# Commit
git add .
git commit -m "feat: add Prophet forecasting"

# Push
git push origin feature/new-forecast-algorithm

# PR to main
```

**Commit Conventions:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactor
- `test:` Add tests
- `chore:` Maintenance

---

## Deployment

### **Hostinger VPS**

```bash
# On VPS
git clone https://github.com/your-repo.git
cd fnb-forecast-demo

# Install dependencies
cd backend && npm install --production
cd ../frontend && npm install && npm run build

# Setup database
# (Use Hostinger's PostgreSQL or Docker)

# Start services
pm2 start backend/src/index.js --name fnb-backend
nginx -s reload  # Configure to serve frontend build
```

### **Environment Files**

```bash
# Production .env (NEVER commit)
NODE_ENV=production
DATABASE_URL=postgresql://...

# LLM Provider (choose one)
LLM_PROVIDER=groq  # or openai
GROQ_API_KEY=gsk_...  # Get from https://console.groq.com
# OR
# OPENAI_API_KEY=sk-...  # Get from https://platform.openai.com

CORS_ORIGIN=https://your-domain.com
```

### **Frontend Deployment Options**

| Option | Pros | Cons |
|--------|------|------|
| **Nginx on VPS** | Single server | Manual builds |
| **Vercel/Netlify** | Auto CDN, previews | Separate from backend |
| **Docker compose** | Easy rollback | More complex |

---

## Monitoring (TODO)

### **Logging**
- Winston or Pino for backend
- Structured JSON logs
- Log rotation

### **Metrics**
- Response times
- Error rates
- DB query performance
- LLM response time (Groq/OpenAI)

### **Alerts**
- Uptime monitoring (UptimeRobot)
- Error tracking (Sentry)
- DB backup status

---

## Performance Optimization

### **Backend**
- [ ] Add Redis caching for forecasts
- [ ] Optimize SQL queries (indexes)
- [ ] Implement request batching
- [ ] Add compression middleware

### **Frontend**
- [ ] Code splitting per route
- [ ] Lazy load charts
- [ ] Optimize bundle size
- [ ] Add Service Worker

### **Database**
- [ ] Add indexes on sales (date, outlet, dish)
- [ ] Partition sales by month
- [ ] Archive old data

---

## Security Checklist

### **Before Production**

- [ ] Change all default passwords
- [ ] Enable HTTPS (Let's Encrypt)
- [ ] Configure CORS whitelist
- [ ] Add rate limiting
- [ ] Secure LLM API keys (Groq/OpenAI) - never commit to git
- [ ] Set up DB backups
- [ ] Add helmet.js middleware
- [ ] Validate all inputs
- [ ] Sanitize CSV uploads
- [ ] Add audit logging

---

## Troubleshooting

### **Backend won't start**
```bash
# Check port in use
lsof -i :3001

# Check DB connection
npm run check-db

# Check .env exists
cat backend/.env
```

### **Frontend can't reach API**
```bash
# Check backend running
curl http://localhost:3001/api/dashboard/summary

# Check CORS
# See browser console for errors

# Check VITE_API_URL
cat frontend/.env
```

### **Database errors**
```bash
# Check DB exists
psql -l | grep fnb

# Check connection string
npm run print-db-config

# Reset DB
docker compose down -v && docker compose up -d
```

### **LLM not responding (Groq/OpenAI)**
```bash
# Check API key is set
cat backend/.env | grep GROQ_API_KEY
# or
cat backend/.env | grep OPENAI_API_KEY

# Test API connection
curl -X POST https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "llama3.1-8b-instant", "messages": [{"role": "user", "content": "test"}]}'

# Check rate limits (Groq free tier: 30 req/min)
# If exceeded, wait 1 minute and retry

# Check backend logs for specific error messages
tail -f backend/logs/llm.log
```

---

## Related Docs

- [Architecture](02-architecture.md) - System design
- [API Reference](04-api-reference.md) - Endpoint testing
- [Context](01-context.md) - Problem & goals
