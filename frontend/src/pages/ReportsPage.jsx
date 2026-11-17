import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsAPI } from '../api';
import {
  FileText,
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  ExternalLink,
  Loader2,
  Printer,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AITextStreamer from '../components/AITextStreamer';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('weekly'); // 'weekly' | 'calendar'

  const { data: weeklyReport, isLoading: isWeeklyLoading } = useQuery({
    queryKey: ['reports-weekly'],
    queryFn: async () => {
      const res = await reportsAPI.getWeeklyReport();
      return res.data;
    },
  });

  const { data: calendarData, isLoading: isCalendarLoading } = useQuery({
    queryKey: ['reports-calendar'],
    queryFn: async () => {
      const res = await reportsAPI.getEarningsCalendar();
      return res.data;
    },
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="animate-in">
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Executive Reports & Earnings Calendar</h1>
          <p className="page-subtitle">
            Weekly AI executive digests and upcoming quarterly earnings announcement calendar
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
            <Printer size={15} /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          className={`btn ${activeTab === 'weekly' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('weekly')}
        >
          <FileText size={16} /> Weekly Executive AI Report
        </button>
        <button
          className={`btn ${activeTab === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('calendar')}
        >
          <Calendar size={16} /> Quarterly Earnings Calendar ({calendarData?.total_tracked || 0})
        </button>
      </div>

      {/* -------------------------------------------------------------
          TAB 1: WEEKLY AI EXECUTIVE DIGEST (Feature #14)
      ------------------------------------------------------------- */}
      {activeTab === 'weekly' && (
        <div>
          {isWeeklyLoading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <Loader2 className="spinner" style={{ margin: '0 auto 14px' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Generating executive portfolio digest...</p>
            </div>
          ) : (
            <div className="card" style={{ padding: '32px' }}>
              {/* Report Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border)',
                  paddingBottom: '20px',
                  marginBottom: '24px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Sparkles size={22} style={{ color: 'var(--accent)' }} />
                    <h2 style={{ fontSize: '22px', fontWeight: '800' }}>{weeklyReport?.report_title}</h2>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Generated on {weeklyReport?.generated_at} for {weeklyReport?.user}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-blue">CONFIDENTIAL & PRIVATE</span>
                </div>
              </div>

              {/* Summary Metrics */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '16px',
                  marginBottom: '24px',
                  background: 'var(--bg-secondary)',
                  padding: '20px',
                  borderRadius: 'var(--radius)',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>PORTFOLIO VALUE</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', marginTop: '4px' }}>
                    ₹{weeklyReport?.summary?.current_value?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>TOTAL INVESTED</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', marginTop: '4px' }}>
                    ₹{weeklyReport?.summary?.total_invested?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>TOTAL P&L</div>
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: '800',
                      marginTop: '4px',
                      color: (weeklyReport?.summary?.total_pnl || 0) >= 0 ? 'var(--green)' : 'var(--red)',
                    }}
                  >
                    {(weeklyReport?.summary?.total_pnl || 0) >= 0 ? '+' : ''}
                    ₹{weeklyReport?.summary?.total_pnl?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>RETURN (%)</div>
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: '800',
                      marginTop: '4px',
                      color: (weeklyReport?.summary?.total_pnl_pct || 0) >= 0 ? 'var(--green)' : 'var(--red)',
                    }}
                  >
                    {(weeklyReport?.summary?.total_pnl_pct || 0) >= 0 ? '+' : ''}
                    {weeklyReport?.summary?.total_pnl_pct?.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* AI Strategic Takeaway */}
              <div style={{ marginBottom: '28px' }}>
                <AITextStreamer
                  text={weeklyReport?.ai_takeaway}
                  title="Strategic AI Portfolio Digest"
                  badge="Executive Takeaway"
                />
              </div>

              {/* Top Gainers & Losers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '18px', borderRadius: 'var(--radius)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--green)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TrendingUp size={16} /> Top Performing Positions
                  </h4>
                  {(weeklyReport?.top_gainers || []).map((g, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontWeight: '600' }}>{g.symbol}</span>
                      <span style={{ color: 'var(--green)', fontWeight: '700' }}>+{g.pnl_pct}% (+₹{g.pnl.toLocaleString('en-IN')})</span>
                    </div>
                  ))}
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '18px', borderRadius: 'var(--radius)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TrendingDown size={16} /> Positions Requiring Monitoring
                  </h4>
                  {(weeklyReport?.top_losers || []).length === 0 ? (
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>All current positions are generating positive returns.</p>
                  ) : (
                    (weeklyReport?.top_losers || []).map((l, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontWeight: '600' }}>{l.symbol}</span>
                        <span style={{ color: 'var(--red)', fontWeight: '700' }}>{l.pnl_pct}% (₹{l.pnl.toLocaleString('en-IN')})</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* All Holdings Breakdown */}
              <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>Full Portfolio Ledger</h4>
              <div className="table-container" style={{ border: 'none' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Quantity</th>
                      <th>Total Invested</th>
                      <th>Current Value</th>
                      <th>Net Return</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(weeklyReport?.all_holdings || []).map((h, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: '600' }}>{h.symbol}</td>
                        <td>{h.quantity}</td>
                        <td>₹{h.invested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td style={{ fontWeight: '700' }}>₹{h.current_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td>
                          <span className={`badge ${h.pnl >= 0 ? 'badge-green' : 'badge-red'}`}>
                            {h.pnl >= 0 ? '+' : ''}₹{h.pnl.toLocaleString('en-IN')} ({h.pnl_pct}%)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 2: QUARTERLY RESULTS & EARNINGS CALENDAR (Feature #15)
      ------------------------------------------------------------- */}
      {activeTab === 'calendar' && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Earnings Release Notifications & Calendar</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Track earnings announcement dates, recent YoY growth, and status for all stocks in your portfolio and watchlist
            </p>
          </div>

          {isCalendarLoading ? (
            <div style={{ padding: '50px', textAlign: 'center' }}>
              <Loader2 className="spinner" />
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Stock</th>
                    <th>Source</th>
                    <th>Current Price</th>
                    <th>Upcoming Earnings Date</th>
                    <th>Recent YoY Revenue</th>
                    <th>Result Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(calendarData?.earnings_calendar || []).map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <div style={{ fontWeight: '700', color: 'var(--accent)' }}>{item.symbol}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.company_name}</div>
                      </td>
                      <td>
                        <span className={`badge ${item.source === 'Holding' ? 'badge-blue' : 'badge-yellow'}`}>
                          {item.source}
                        </span>
                      </td>
                      <td style={{ fontWeight: '600' }}>₹{item.price?.toFixed(2) || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                          <span style={{ fontWeight: '500' }}>{item.upcoming_date}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--green)', fontWeight: '600' }}>{item.revenue_growth}</td>
                      <td>
                        <span className="badge badge-green">
                          <CheckCircle size={12} style={{ marginRight: '4px' }} />
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
