import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stocksAPI, watchlistAPI, alertsAPI, aiAPI } from '../api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Star,
  Bell,
  Brain,
  ExternalLink,
  Info,
  Clock,
  Sparkles,
  Loader2,
  Check,
  ChevronRight,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AITextStreamer from '../components/AITextStreamer';

export default function StockPage() {
  const { symbol } = useParams();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState('1y');
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertForm, setAlertForm] = useState({
    condition: 'ABOVE',
    target_price: '',
    notify_email: true,
  });

  // Fetch Quote
  const { data: quote, isLoading: isQuoteLoading } = useQuery({
    queryKey: ['stock-quote', symbol],
    queryFn: async () => {
      const res = await stocksAPI.getQuote(symbol);
      return res.data;
    },
    refetchInterval: 30 * 1000,
  });

  // Fetch Fundamentals
  const { data: info, isLoading: isInfoLoading } = useQuery({
    queryKey: ['stock-info', symbol],
    queryFn: async () => {
      const res = await stocksAPI.getInfo(symbol);
      return res.data;
    },
  });

  // Fetch Chart History
  const { data: history = [], isLoading: isHistoryLoading } = useQuery({
    queryKey: ['stock-history', symbol, period],
    queryFn: async () => {
      const res = await stocksAPI.getHistory(symbol, { period, interval: period === '1mo' ? '1d' : '1d' });
      return res.data || [];
    },
  });

  // Fetch News
  const { data: news = [] } = useQuery({
    queryKey: ['stock-news', symbol],
    queryFn: async () => {
      const res = await stocksAPI.getNews(symbol);
      return res.data || [];
    },
  });

  // Fetch Technical Indicators
  const { data: technicals } = useQuery({
    queryKey: ['stock-technicals', symbol],
    queryFn: async () => {
      const res = await stocksAPI.getTechnicals(symbol);
      return res.data;
    },
  });

  // Fetch Quarterly Results
  const { data: quarterly } = useQuery({
    queryKey: ['stock-quarterly', symbol],
    queryFn: async () => {
      const res = await stocksAPI.getQuarterly(symbol);
      return res.data;
    },
  });

  // AI Analysis Query (manual trigger or cached)
  const {
    data: aiAnalysis,
    isLoading: isAILoading,
    refetch: triggerAIAnalysis,
    isFetched: isAIFetched,
  } = useQuery({
    queryKey: ['stock-ai-analysis', symbol],
    queryFn: async () => {
      const res = await aiAPI.analyzeStock(symbol);
      return res.data;
    },
    enabled: false,
  });

  // Watchlist Mutation
  const addToWatchlistMutation = useMutation({
    mutationFn: () =>
      watchlistAPI.addToWatchlist({
        symbol: symbol.toUpperCase(),
        company_name: info?.name || symbol,
      }),
    onSuccess: () => {
      toast.success(`${symbol} added to Watchlist!`);
      queryClient.invalidateQueries(['watchlist']);
    },
    onError: (err) => {
      const msg = err.response?.data?.detail || 'Already in watchlist or failed to add';
      toast.error(msg);
    },
  });

  // Alert Mutation
  const createAlertMutation = useMutation({
    mutationFn: (data) =>
      alertsAPI.createAlert({
        symbol: symbol.toUpperCase(),
        company_name: info?.name || symbol,
        condition: data.condition,
        target_price: parseFloat(data.target_price),
        notify_email: data.notify_email,
      }),
    onSuccess: () => {
      toast.success('Price alert created successfully!');
      setIsAlertModalOpen(false);
      queryClient.invalidateQueries(['alerts']);
    },
    onError: () => toast.error('Failed to create alert'),
  });

  const isPositive = (quote?.change || 0) >= 0;
  const currencySymbol = quote?.currency === 'INR' ? '₹' : quote?.currency === 'USD' ? '$' : '₹';

  // Format chart data
  const chartData = history.map((item) => ({
    date: item.date,
    close: Number(item.close?.toFixed(2) || 0),
    volume: item.volume,
  }));

  const minPrice = chartData.length > 0 ? Math.min(...chartData.map((d) => d.close)) * 0.98 : 0;
  const maxPrice = chartData.length > 0 ? Math.max(...chartData.map((d) => d.close)) * 1.02 : 100;

  return (
    <div className="animate-in">
      {/* Top Breadcrumb & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '14px' }}>
          <Link to="/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            Dashboard
          </Link>
          <ChevronRight size={14} />
          <Link to="/portfolio" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            Stocks
          </Link>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{symbol}</span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => addToWatchlistMutation.mutate()}
            disabled={addToWatchlistMutation.isPending}
          >
            <Star size={15} style={{ color: 'var(--yellow)' }} />
            {addToWatchlistMutation.isPending ? 'Adding...' : 'Add to Watchlist'}
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setAlertForm({
                condition: 'ABOVE',
                target_price: quote?.price ? (quote.price * 1.05).toFixed(2) : '',
                notify_email: true,
              });
              setIsAlertModalOpen(true);
            }}
          >
            <Bell size={15} /> Set Alert
          </button>

          <Link to="/portfolio" className="btn btn-primary btn-sm">
            Trade Position
          </Link>
        </div>
      </div>

      {/* Main Stock Header Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.5px' }}>{symbol}</h1>
              {info?.sector && <span className="badge badge-blue">{info.sector}</span>}
              {quote?.currency && <span className="badge">{quote.currency}</span>}
            </div>
            <div style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>
              {info?.name || quote?.symbol || symbol}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '36px', fontWeight: '800', fontFamily: 'JetBrains Mono, monospace' }}>
              {currencySymbol}
              {quote?.price
                ? quote.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })
                : '—'}
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '15px',
                fontWeight: '600',
                color: isPositive ? 'var(--green)' : 'var(--red)',
              }}
            >
              {isPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              <span>
                {isPositive ? '+' : ''}
                {quote?.change ? quote.change.toFixed(2) : '0.00'} (
                {isPositive ? '+' : ''}
                {quote?.change_pct ? quote.change_pct.toFixed(2) : '0.00'}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Price Chart Section */}
      <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Price Performance</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Historical closing price and trend</p>
          </div>

          {/* Timeframe selector */}
          <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
            {[
              { label: '1M', value: '1mo' },
              { label: '3M', value: '3mo' },
              { label: '6M', value: '6mo' },
              { label: '1Y', value: '1y' },
              { label: '5Y', value: '5y' },
            ].map((tf) => (
              <button
                key={tf.value}
                onClick={() => setPeriod(tf.value)}
                className={`btn btn-sm ${period === tf.value ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '4px 12px', fontSize: '12px' }}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div style={{ width: '100%', height: '360px' }}>
          {isHistoryLoading ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 className="spinner" />
            </div>
          ) : chartData.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              No historical chart data available for this timeframe.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive ? '#10b981' : '#3b82f6'} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={isPositive ? '#10b981' : '#3b82f6'} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  stroke="var(--text-muted)"
                  tick={{ fontSize: 11 }}
                  minTickGap={40}
                />
                <YAxis
                  domain={[minPrice, maxPrice]}
                  stroke="var(--text-muted)"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  orientation="right"
                  tickFormatter={(v) => `${currencySymbol}${v}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div
                          style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '10px 14px',
                            boxShadow: 'var(--shadow-card)',
                          }}
                        >
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{payload[0].payload.date}</div>
                          <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                            {currencySymbol}{payload[0].value?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke={isPositive ? '#10b981' : '#3b82f6'}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#priceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Grid: Key Stats & AI Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Key Statistics */}
        <div className="card">
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Key Fundamentals</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Day's Range</div>
              <div style={{ fontWeight: '600', fontSize: '14px', marginTop: '2px' }}>
                {currencySymbol}{quote?.day_low?.toFixed(2) || '—'} – {currencySymbol}{quote?.day_high?.toFixed(2) || '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Previous Close</div>
              <div style={{ fontWeight: '600', fontSize: '14px', marginTop: '2px' }}>
                {currencySymbol}{quote?.prev_close?.toFixed(2) || '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Market Cap</div>
              <div style={{ fontWeight: '600', fontSize: '14px', marginTop: '2px' }}>
                {info?.market_cap ? `${currencySymbol}${(info.market_cap / 1e9).toFixed(2)}B` : '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>P/E Ratio</div>
              <div style={{ fontWeight: '600', fontSize: '14px', marginTop: '2px' }}>
                {info?.pe_ratio ? info.pe_ratio.toFixed(2) : '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Dividend Yield</div>
              <div style={{ fontWeight: '600', fontSize: '14px', marginTop: '2px' }}>
                {info?.dividend_yield ? `${(info.dividend_yield * 100).toFixed(2)}%` : '0.00%'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Volume</div>
              <div style={{ fontWeight: '600', fontSize: '14px', marginTop: '2px' }}>
                {quote?.volume?.toLocaleString() || '—'}
              </div>
            </div>
          </div>

          {info?.description && (
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Company Profile</div>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.6',
                  display: '-webkit-box',
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {info.description}
              </p>
            </div>
          )}
        </div>

        {/* AI Analysis Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Brain size={20} style={{ color: 'var(--accent-2)' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>AI Investment Insights</h3>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => triggerAIAnalysis()}
              disabled={isAILoading}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {isAILoading ? <Loader2 size={14} className="spinner" /> : <Sparkles size={14} />}
              {isAIFetched ? 'Re-analyze' : 'Analyze with AI'}
            </button>
          </div>

          <div
            style={{
              flex: 1,
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-sm)',
              padding: '18px',
              overflowY: 'auto',
              maxHeight: '340px',
            }}
          >
            {isAILoading ? (
              <AITextStreamer isLoading={true} />
            ) : aiAnalysis ? (
              <AITextStreamer
                text={aiAnalysis.answer}
                title={`AI Intelligence • ${symbol}`}
                badge="Real-Time Analysis"
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-secondary)' }}>
                <Brain size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                <p style={{ marginBottom: '12px', fontSize: '13px' }}>
                  Click "Analyze with AI" to generate real-time SWOT analysis, news sentiment, and outlook for {symbol}.
                </p>
                <button className="btn btn-primary btn-sm" onClick={() => triggerAIAnalysis()}>
                  <Sparkles size={14} /> Run Deep Analysis
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Technical Indicators & Quarterly Financials (Features #5 & #7) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Technical Indicators */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Technical Indicators</h3>
            <span
              className={`badge ${
                technicals?.signal === 'BULLISH'
                  ? 'badge-green'
                  : technicals?.signal === 'BEARISH'
                  ? 'badge-red'
                  : 'badge-yellow'
              }`}
            >
              Signal: {technicals?.signal || 'NEUTRAL'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>RSI (14 Period)</div>
              <div style={{ fontSize: '18px', fontWeight: '800', marginTop: '2px' }}>
                {technicals?.rsi_14 ?? 50.0}
              </div>
              <small style={{ color: (technicals?.rsi_14 ?? 50) < 30 ? 'var(--green)' : (technicals?.rsi_14 ?? 50) > 70 ? 'var(--red)' : 'var(--text-muted)' }}>
                {(technicals?.rsi_14 ?? 50) < 30 ? 'Oversold (<30)' : (technicals?.rsi_14 ?? 50) > 70 ? 'Overbought (>70)' : 'Neutral (30-70)'}
              </small>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>SMA 50 / Trend</div>
              <div style={{ fontSize: '18px', fontWeight: '800', marginTop: '2px' }}>
                {technicals?.sma_50 ? `${currencySymbol}${technicals.sma_50}` : '—'}
              </div>
              <small style={{ color: 'var(--text-muted)' }}>20D SMA: {technicals?.sma_20 ? `${currencySymbol}${technicals.sma_20}` : '—'}</small>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>50-Day Support</div>
              <div style={{ fontSize: '16px', fontWeight: '700', marginTop: '2px', color: 'var(--green)' }}>
                {technicals?.support ? `${currencySymbol}${technicals.support}` : '—'}
              </div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>50-Day Resistance</div>
              <div style={{ fontSize: '16px', fontWeight: '700', marginTop: '2px', color: 'var(--red)' }}>
                {technicals?.resistance ? `${currencySymbol}${technicals.resistance}` : '—'}
              </div>
            </div>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            {technicals?.interpretation}
          </p>
        </div>

        {/* Quarterly Financials */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Quarterly Results & Earnings</h3>
            <span className="badge badge-green">{quarterly?.status || 'Beat Expectations'}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>YoY Revenue Growth</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--green)', marginTop: '2px' }}>
                {quarterly?.revenue_growth_yoy || '+8.4%'}
              </div>
              <small style={{ color: 'var(--text-muted)' }}>Latest Reporting Quarter</small>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Net Profit Margin</div>
              <div style={{ fontSize: '18px', fontWeight: '800', marginTop: '2px' }}>
                {quarterly?.net_profit_margin || '16.2%'}
              </div>
              <small style={{ color: 'var(--text-muted)' }}>Operating Efficiency</small>
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Next Earnings Release Date</div>
            <div style={{ fontSize: '15px', fontWeight: '700', marginTop: '4px', color: 'var(--accent)' }}>
              {quarterly?.upcoming_earnings_date || 'Upcoming (Q3 FY26)'}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.5' }}>
              {quarterly?.summary}
            </p>
          </div>
        </div>
      </div>

      {/* News Feed Section */}
      <div className="card">
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Recent Market News</h3>
        {news.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No recent news articles found for this ticker.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {news.slice(0, 5).map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div>
                  <a
                    href={item.link || '#'}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: 'var(--text-primary)',
                      fontWeight: '600',
                      textDecoration: 'none',
                      fontSize: '14px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {item.title} <ExternalLink size={12} style={{ color: 'var(--text-muted)' }} />
                  </a>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {item.publisher || 'Financial Times'} • {item.published || 'Recent'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Set Alert Modal */}
      {isAlertModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Set Price Alert for {symbol}</h3>
              <button onClick={() => setIsAlertModalOpen(false)} className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createAlertMutation.mutate(alertForm);
              }}
            >
              <div className="form-group">
                <label className="form-label">Alert Condition</label>
                <select
                  className="form-input"
                  value={alertForm.condition}
                  onChange={(e) => setAlertForm({ ...alertForm, condition: e.target.value })}
                >
                  <option value="ABOVE">Price Rises Above (&gt;=)</option>
                  <option value="BELOW">Price Drops Below (&lt;=)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Target Trigger Price ({currencySymbol})</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="e.g. 2600.00"
                  value={alertForm.target_price}
                  onChange={(e) => setAlertForm({ ...alertForm, target_price: e.target.value })}
                  required
                />
                <small style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  Current price: {currencySymbol}{quote?.price?.toFixed(2) || '—'}
                </small>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <input
                  type="checkbox"
                  id="notifyEmail"
                  checked={alertForm.notify_email}
                  onChange={(e) => setAlertForm({ ...alertForm, notify_email: e.target.checked })}
                />
                <label htmlFor="notifyEmail" style={{ fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  Send email alert when triggered
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsAlertModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={createAlertMutation.isPending}>
                  {createAlertMutation.isPending ? 'Creating...' : 'Create Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
