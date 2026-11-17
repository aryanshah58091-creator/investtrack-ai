# InvestTrack AI

> AI-Powered Personal Stock Portfolio Management Platform

---

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- Node.js 18+
- MySQL 8+
- Redis (for Celery + Cache + WebSocket)

---

### 1. Backend Setup

```bash
cd backend

# Activate virtual environment
venv\Scripts\activate       # Windows
source venv/bin/activate    # Mac/Linux

# Copy and configure environment
cp .env.example .env
# Edit .env with your DB credentials, GEMINI_API_KEY, etc.

# Run migrations
python manage.py migrate

# Create superuser (admin)
python manage.py createsuperuser

# Start dev server
python manage.py runserver
```

> Backend runs at: http://localhost:8000
> Admin panel: http://localhost:8000/admin/

### 2. Frontend Setup

```bash
cd frontend
npm install     # (already done)

# Start dev server
npm run dev
```

> Frontend runs at: http://localhost:5173

### 3. Start Celery Worker (Background Tasks)

```bash
cd backend
venv\Scripts\activate
celery -A investtrack worker -l info
```

### 4. Start Celery Beat (Scheduled Tasks)

```bash
cd backend
venv\Scripts\activate
celery -A investtrack beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

---

## 📁 Project Structure

```
invest.ai/
├── backend/                    # Django + DRF
│   ├── investtrack/            # Core Django config
│   │   ├── settings.py         # All settings (MySQL, Redis, JWT, Celery)
│   │   ├── urls.py             # Root URL config
│   │   ├── asgi.py             # ASGI (HTTP + WebSocket)
│   │   └── celery.py           # Celery config
│   ├── apps/
│   │   ├── accounts/           # User auth (JWT)
│   │   ├── portfolio/          # Portfolio, Holdings, Transactions
│   │   ├── stocks/             # yfinance + Redis cache service
│   │   ├── watchlist/          # Watchlist management
│   │   ├── alerts/             # Price alerts + WebSocket consumer
│   │   ├── ai_agent/           # Gemini AI agent (LangChain)
│   │   ├── analytics/          # Portfolio analytics
│   │   └── reports/            # Weekly reports
│   ├── requirements.txt
│   ├── manage.py
│   └── .env
│
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── api/index.js        # Axios client with JWT interceptors
│   │   ├── context/AuthContext.jsx
│   │   ├── components/Layout.jsx
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── PortfolioPage.jsx
│   │   │   ├── AIInsightsPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── App.jsx
│   │   └── index.css           # Full design system
│   └── .env
│
├── start-backend.bat
├── start-frontend.bat
└── README.md
```

---

## 🔑 Environment Variables (backend/.env)

| Variable | Description |
|---|---|
| `SECRET_KEY` | Django secret key |
| `DB_NAME/USER/PASSWORD/HOST` | MySQL credentials |
| `REDIS_URL` | Redis connection URL |
| `GEMINI_API_KEY` | Google Gemini API key |
| `SENDGRID_API_KEY` | Email service (optional) |

---

## 📡 API Endpoints

| Method | URL | Description |
|---|---|---|
| POST | `/api/v1/auth/register/` | Register |
| POST | `/api/v1/auth/token/` | Login (get JWT) |
| GET | `/api/v1/portfolio/summary/` | Portfolio summary |
| GET | `/api/v1/portfolio/holdings/` | All holdings |
| POST | `/api/v1/portfolio/transactions/` | Add transaction |
| GET | `/api/v1/stocks/<symbol>/quote/` | Live stock price |
| GET | `/api/v1/stocks/<symbol>/history/` | Price history |
| GET | `/api/v1/stocks/search/?q=<query>` | Search stocks |
| POST | `/api/v1/ai/ask/` | AI Q&A |
| GET | `/api/v1/ai/insights/` | Auto portfolio analysis |
| WS | `ws://localhost:8000/ws/alerts/` | Real-time alerts |

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, React Query, React Router, Recharts, Axios
- **Backend**: Python 3.12, Django 5, DRF, Django Channels, Celery
- **Database**: MySQL 8 (partitioned PriceHistory)
- **Cache/Broker**: Redis
- **AI**: Google Gemini 1.5 Flash + LangChain
- **Market Data**: yfinance (Yahoo Finance — free, no key needed)
- **Deployment**: Docker, Nginx, Gunicorn (WSGI) + Daphne (ASGI)
