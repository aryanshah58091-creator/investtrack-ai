import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../api';
import {
  PieChart,
  ShieldAlert,
  Layers,
  TrendingUp,
  BarChart3,
  Award,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export default function AnalyticsPage() {
  const { data: sectorData, isLoading: isSectorLoading } = useQuery({
    queryKey: ['analytics-sector'],
    queryFn: async () => {
      const res = await analyticsAPI.getSectorAllocation();
      return res.data;
    },
  });

  const { data: riskData, isLoading: isRiskLoading } = useQuery({
    queryKey: ['analytics-risk'],
    queryFn: async () => {
      const res = await analyticsAPI.getRiskMetrics();
      return res.data;
    },
  });

  const { data: divData, isLoading: isDivLoading } = useQuery({
    queryKey: ['analytics-diversification'],
    queryFn: async () => {
      const res = await analyticsAPI.getDiversification();
      return res.data;
    },
  });

  const { data: benchData, isLoading: isBenchLoading } = useQuery({
    queryKey: ['analytics-benchmark'],
    queryFn: async () => {
      const res = await analyticsAPI.getBenchmark();
      return res.data;
    },
  });

  const isLoading = isSectorLoading || isRiskLoading || isDivLoading || isBenchLoading;

  if (isLoading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <Loader2 className="spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Calculating risk metrics & sector allocation...</p>
      </div>
    );
  }

  const sectors = sectorData?.sectors || [];
  const divScore = divData?.score || 50;

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Portfolio Analytics & Risk Engine</h1>
          <p className="page-subtitle">
            Sector allocation, volatility sensitivity, diversification index, and benchmark comparison
          </p>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card card">
          <div className="stat-label">Portfolio Beta</div>
          <div className="stat-value">{riskData?.portfolio_beta || '1.00'}</div>
          <div className="stat-change" style={{ color: 'var(--accent)' }}>
            {riskData?.risk_level || 'Moderate'}
          </div>
          <ShieldAlert className="stat-icon" size={48} />
        </div>

        <div className="stat-card card">
          <div className="stat-label">Annualized Volatility</div>
          <div className="stat-value">{riskData?.volatility_pct || '15.0'}%</div>
          <div className="stat-change" style={{ color: 'var(--text-secondary)' }}>
            Est. Price Variance
          </div>
          <BarChart3 className="stat-icon" size={48} />
        </div>

        <div className="stat-card card">
          <div className="stat-label">Diversification Score</div>
          <div className="stat-value" style={{ color: divScore >= 70 ? 'var(--green)' : 'var(--yellow)' }}>
            {divScore}/100
          </div>
          <div className="stat-change" style={{ color: divScore >= 70 ? 'var(--green)' : 'var(--yellow)' }}>
            {divData?.rating || 'Good'}
          </div>
          <Layers className="stat-icon" size={48} />
        </div>

        <div className="stat-card card">
          <div className="stat-label">Sharpe Ratio</div>
          <div className="stat-value">{riskData?.sharpe_ratio || '0.00'}</div>
          <div className="stat-change" style={{ color: 'var(--text-secondary)' }}>
            Risk-adjusted Return
          </div>
          <Award className="stat-icon" size={48} />
        </div>
      </div>

      {/* 2-Column Grid: Sector Allocation & Diversification */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Sector Allocation */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart size={20} style={{ color: 'var(--accent)' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Sector Allocation</h3>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {sectors.length} Sector{sectors.length !== 1 ? 's' : ''}
            </span>
          </div>

          {sectors.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No holdings to allocate.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {sectors.map((sec, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '600' }}>{sec.sector}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      ₹{sec.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({sec.percentage}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${sec.percentage}%`,
                        height: '100%',
                        background: idx === 0 ? 'var(--accent)' : idx === 1 ? 'var(--accent-2)' : idx === 2 ? 'var(--green)' : 'var(--yellow)',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Diversification & Concentration Breakdown */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <Layers size={20} style={{ color: 'var(--accent-2)' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Diversification Health</h3>
          </div>

          <div
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: divScore >= 70 ? 'var(--green-bg)' : 'var(--yellow-bg)',
                color: divScore >= 70 ? 'var(--green)' : 'var(--yellow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: '800',
              }}
            >
              {divScore}
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '15px' }}>{divData?.rating} Allocation</div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {divData?.feedback}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px' }}>
            <div style={{ background: 'var(--bg-card-hover)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Top Holding Weight</div>
              <div style={{ fontWeight: '700', fontSize: '16px', marginTop: '4px' }}>
                {divData?.top_holding} ({divData?.max_concentration_pct}%)
              </div>
              <small style={{ color: 'var(--text-muted)' }}>Target: &lt; 25% of total</small>
            </div>

            <div style={{ background: 'var(--bg-card-hover)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Active Holdings</div>
              <div style={{ fontWeight: '700', fontSize: '16px', marginTop: '4px' }}>
                {divData?.holding_count} Stocks
              </div>
              <small style={{ color: 'var(--text-muted)' }}>Across {divData?.sector_count} sectors</small>
            </div>
          </div>
        </div>
      </div>

      {/* Benchmark Comparison Table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <TrendingUp size={20} style={{ color: 'var(--green)' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Benchmark Comparison (Alpha Generation)</h3>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '18px' }}>
          Comparing your portfolio return against standard market benchmark indices (Annualized).
        </p>

        <div className="table-container" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Benchmark Index</th>
                <th>Benchmark Return</th>
                <th>Your Return</th>
                <th>Alpha (Excess Return)</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {(benchData?.benchmarks || []).map((b, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: '600' }}>{b.name}</td>
                  <td>{b.benchmark_return}%</td>
                  <td style={{ fontWeight: '700' }}>{benchData?.portfolio_return}%</td>
                  <td style={{ fontWeight: '700', color: b.alpha >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {b.alpha >= 0 ? '+' : ''}{b.alpha}%
                  </td>
                  <td>
                    <span className={`badge ${b.outperforming ? 'badge-green' : 'badge-yellow'}`}>
                      {b.outperforming ? 'Outperforming' : 'Tracking'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
