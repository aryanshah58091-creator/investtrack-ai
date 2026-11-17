import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { portfolioAPI, stocksAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp, TrendingDown, Briefcase, DollarSign,
  BarChart2, Brain, ArrowRight, RefreshCw
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function StatCard({ label, value, change, changePct, icon: Icon, color = 'var(--accent)' }) {
  const isPositive = parseFloat(change) >= 0;
  return (
    <div className="stat-card animate-in">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {change !== undefined && (
        <div className="stat-change" style={{ color: isPositive ? 'var(--green)' : 'var(--red)' }}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {isPositive ? '+' : ''}{change}
          {changePct && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({changePct}%)</span>}
        </div>
      )}
      <div className="stat-icon" style={{ color }}>
        <Icon size={48} />
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '10px 14px', fontSize: 13
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 600, color: 'var(--accent)' }}>
        ₹{Number(payload[0]?.value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: summary, isLoading: summaryLoading, refetch } = useQuery({
    queryKey: ['portfolio-summary'],
    queryFn: () => portfolioAPI.getSummary().then(r => r.data),
    refetchInterval: 60000, // refresh every minute
  });

  const { data: holdings, isLoading: holdingsLoading } = useQuery({
    queryKey: ['holdings'],
    queryFn: () => portfolioAPI.getHoldings().then(r => r.data?.results || r.data),
  });

  const { data: brokers } = useQuery({
    queryKey: ['portfolio-brokers'],
    queryFn: () => portfolioAPI.getBrokers().then(r => r.data?.results || r.data || []),
  });

  const connectedBroker = Array.isArray(brokers) && brokers.length > 0 ? brokers[0] : null;

  const fmt = (val) => `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtPct = (val) => `${Number(val || 0).toFixed(2)}%`;

  const isPositive = parseFloat(summary?.total_pnl || 0) >= 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="animate-in">
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="page-title">
              {greeting}, {user?.first_name || 'Investor'} 👋
            </h1>
            {connectedBroker ? (
              <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                {connectedBroker.broker_display} Synced
              </span>
            ) : (
              <Link to="/portfolio" className="badge badge-yellow" style={{ textDecoration: 'none' }}>
                + Connect Broker
              </Link>
            )}
          </div>
          <p className="page-subtitle">Here's your real-time portfolio intelligence overview</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/portfolio" className="btn btn-secondary btn-sm" style={{ border: '1px solid var(--accent)' }}>
            Broker Hub
          </Link>
          <button className="btn btn-secondary btn-sm" onClick={refetch}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>


      {/* Stats Grid */}
      {summaryLoading ? (
        <div className="loading-state"><div className="spinner" /> Loading portfolio...</div>
      ) : (
        <div className="stats-grid">
          <StatCard
            label="Total Invested"
            value={fmt(summary?.total_invested)}
            icon={DollarSign}
          />
          <StatCard
            label="Current Value"
            value={fmt(summary?.total_current_value)}
            icon={Briefcase}
            color="var(--accent-2)"
          />
          <StatCard
            label="Total P&L"
            value={fmt(summary?.total_pnl)}
            change={fmt(summary?.total_pnl)}
            changePct={fmtPct(summary?.total_pnl_pct)}
            icon={isPositive ? TrendingUp : TrendingDown}
            color={isPositive ? 'var(--green)' : 'var(--red)'}
          />
          <StatCard
            label="Holdings"
            value={summary?.holdings_count ?? '—'}
            icon={BarChart2}
            color="var(--yellow)"
          />
        </div>
      )}

      {/* Holdings Table + AI Banner */}
      <div className="grid-2" style={{ gap: 20 }}>
        {/* Holdings */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">My Holdings</div>
              <div className="card-subtitle">Top positions by value</div>
            </div>
            <Link to="/portfolio" className="btn btn-ghost btn-sm">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {holdingsLoading ? (
            <div className="loading-state"><div className="spinner" /></div>
          ) : !holdings?.length ? (
            <div className="empty-state">
              <Briefcase size={36} opacity={0.3} />
              <h3>No holdings yet</h3>
              <p>Add your first transaction to get started</p>
              <Link to="/portfolio" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
                Add Transaction
              </Link>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Stock</th>
                    <th>Qty</th>
                    <th>Avg Price</th>
                    <th>Current</th>
                    <th>P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.slice(0, 6).map(h => {
                    const pnlPos = parseFloat(h.pnl) >= 0;
                    return (
                      <tr key={h.id}>
                        <td>
                          <Link to={`/stocks/${h.symbol}`} style={{ textDecoration: 'none' }}>
                            <div style={{ fontWeight: 600, color: 'var(--accent)' }}>{h.symbol}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{h.company_name}</div>
                          </Link>
                        </td>
                        <td>{parseFloat(h.quantity).toFixed(2)}</td>
                        <td>₹{parseFloat(h.avg_buy_price).toFixed(2)}</td>
                        <td>₹{parseFloat(h.current_price).toFixed(2)}</td>
                        <td>
                          <div style={{ color: pnlPos ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                            {pnlPos ? '+' : ''}₹{parseFloat(h.pnl).toFixed(2)}
                          </div>
                          <div style={{ fontSize: 12, color: pnlPos ? 'var(--green)' : 'var(--red)' }}>
                            {pnlPos ? '+' : ''}{parseFloat(h.pnl_pct).toFixed(2)}%
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* AI Insights Banner + Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* AI Banner */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.1))',
            border: '1px solid rgba(59,130,246,0.3)',
          }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Brain size={24} color="white" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
                  Ask InvestTrack AI
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 14 }}>
                  Get personalized insights about your portfolio, stock analysis, and investment ideas.
                </div>
                <Link to="/ai-insights" className="btn btn-primary btn-sm">
                  Open AI Chat <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Add Transaction', to: '/portfolio', emoji: '💼' },
                { label: 'Add to Watchlist', to: '/watchlist', emoji: '⭐' },
                { label: 'Set Price Alert', to: '/alerts', emoji: '🔔' },
                { label: 'View Analytics', to: '/portfolio', emoji: '📊' },
              ].map(({ label, to, emoji }) => (
                <Link
                  key={label} to={to}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-secondary)', textDecoration: 'none',
                    color: 'var(--text-primary)', fontSize: 14, fontWeight: 500,
                    transition: 'background 0.2s',
                    border: '1px solid var(--border)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                >
                  <span style={{ fontSize: 18 }}>{emoji}</span>
                  {label}
                  <ArrowRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
