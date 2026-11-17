import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:8000/api/v1' : 'https://investtrack-ai.onrender.com/api/v1');

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — try token refresh
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const res = await axios.post(`${API_BASE}/auth/token/refresh/`, { refresh });
          const newAccess = res.data.access;
          localStorage.setItem('access_token', newAccess);
          original.headers.Authorization = `Bearer ${newAccess}`;
          return api(original);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// --- Auth ---
export const authAPI = {
  login: (data) => api.post('/auth/token/', data),
  register: (data) => api.post('/auth/register/', data),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.patch('/auth/profile/', data),
  changePassword: (data) => api.post('/auth/change-password/', data),
  refreshToken: (refresh) => api.post('/auth/token/refresh/', { refresh }),
};

// --- Portfolio ---
export const portfolioAPI = {
  getSummary: () => api.get('/portfolio/summary/'),
  getPortfolio: () => api.get('/portfolio/'),
  getHoldings: () => api.get('/portfolio/holdings/'),
  getTransactions: (params) => api.get('/portfolio/transactions/', { params }),
  addTransaction: (data) => api.post('/portfolio/transactions/', data),
  deleteTransaction: (id) => api.delete(`/portfolio/transactions/${id}/`),
  // Brokers & Live Sync
  getBrokers: () => api.get('/portfolio/brokers/'),
  connectBroker: (data) => api.post('/portfolio/brokers/connect/', data),
  syncBroker: (id) => api.post(`/portfolio/brokers/${id}/sync/`),
  disconnectBroker: (id) => api.post(`/portfolio/brokers/${id}/disconnect/`),
  importStatement: (formData) =>
    api.post('/portfolio/import-statement/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  refreshPrices: () => api.post('/portfolio/refresh-prices/'),
};

// --- Stocks ---
export const stocksAPI = {
  getQuote: (symbol) => api.get(`/stocks/${symbol}/quote/`),
  getHistory: (symbol, params) => api.get(`/stocks/${symbol}/history/`, { params }),
  getInfo: (symbol) => api.get(`/stocks/${symbol}/info/`),
  getNews: (symbol) => api.get(`/stocks/${symbol}/news/`),
  getTechnicals: (symbol) => api.get(`/stocks/${symbol}/technicals/`),
  getQuarterly: (symbol) => api.get(`/stocks/${symbol}/quarterly/`),
  search: (q) => api.get('/stocks/search/', { params: { q } }),
  getMultipleQuotes: (symbols) => api.post('/stocks/quotes/', { symbols }),
};

// --- Watchlist ---
export const watchlistAPI = {
  getWatchlist: () => api.get('/watchlist/'),
  addToWatchlist: (data) => api.post('/watchlist/', data),
  removeFromWatchlist: (id) => api.delete(`/watchlist/${id}/`),
};

// --- Alerts ---
export const alertsAPI = {
  getAlerts: () => api.get('/alerts/'),
  createAlert: (data) => api.post('/alerts/', data),
  deleteAlert: (id) => api.delete(`/alerts/${id}/`),
  getNotifications: () => api.get('/alerts/notifications/'),
  markNotificationRead: (id) => api.patch(`/alerts/notifications/${id}/`, { is_read: true }),
};

// --- AI Engines (All 7 Specialized Agents) ---
export const aiAPI = {
  ask: (data) => api.post('/ai/ask/', data),
  getPortfolioAnalyst: () => api.get('/ai/portfolio-analyst/'),
  getQuarterlyAnalyst: (symbol) => api.get(`/ai/quarterly/${symbol}/`),
  getNewsSentiment: (params) => api.get('/ai/news-sentiment/', { params }),
  getHealthScore: () => api.get('/ai/health-score/'),
  getTradeIdeas: () => api.get('/ai/trade-ideas/'),
  getWhyMoved: () => api.get('/ai/why-moved/'),
  compareStocks: (params) => api.get('/ai/compare/', { params }),
};

// --- Analytics ---
export const analyticsAPI = {
  getSectorAllocation: () => api.get('/analytics/sector-allocation/'),
  getRiskMetrics: () => api.get('/analytics/risk/'),
  getDiversification: () => api.get('/analytics/diversification/'),
  getBenchmark: () => api.get('/analytics/benchmark/'),
  getPerformance: (params) => api.get('/analytics/performance/', { params }),
};

// --- Reports & Earnings Automation ---
export const reportsAPI = {
  getWeeklyReport: () => api.get('/reports/weekly/'),
  getEarningsCalendar: () => api.get('/reports/earnings-calendar/'),
};

export default api;
