import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { alertsAPI, stocksAPI } from '../api';
import {
  Bell,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('alerts'); // 'alerts' | 'notifications'

  // Alert Form State
  const [symbol, setSymbol] = useState('');
  const [condition, setCondition] = useState('ABOVE');
  const [targetPrice, setTargetPrice] = useState('');
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [currentQuote, setCurrentQuote] = useState(null);
  const [isCheckingQuote, setIsCheckingQuote] = useState(false);

  // Queries
  const { data: alerts = [], isLoading: isAlertsLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const res = await alertsAPI.getAlerts();
      return res.data.results || res.data || [];
    },
    refetchInterval: 30 * 1000,
  });

  const { data: notifications = [], isLoading: isNotificationsLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await alertsAPI.getNotifications();
      return res.data.results || res.data || [];
    },
  });

  // Check quote on symbol blur
  const handleSymbolBlur = async () => {
    const sym = symbol.trim().toUpperCase();
    if (!sym) return;
    setIsCheckingQuote(true);
    try {
      const res = await stocksAPI.getQuote(sym);
      if (res.data && res.data.price) {
        setCurrentQuote(res.data);
        if (!targetPrice) {
          const suggested = condition === 'ABOVE' ? res.data.price * 1.05 : res.data.price * 0.95;
          setTargetPrice(suggested.toFixed(2));
        }
      }
    } catch {
      setCurrentQuote(null);
    } finally {
      setIsCheckingQuote(false);
    }
  };

  // Create Alert Mutation
  const createAlertMutation = useMutation({
    mutationFn: (data) => alertsAPI.createAlert(data),
    onSuccess: () => {
      toast.success('Alert created!');
      queryClient.invalidateQueries(['alerts']);
      setSymbol('');
      setTargetPrice('');
      setCurrentQuote(null);
    },
    onError: (err) => {
      const msg = err.response?.data?.error || 'Failed to create alert';
      toast.error(msg);
    },
  });

  // Delete Alert Mutation
  const deleteAlertMutation = useMutation({
    mutationFn: (id) => alertsAPI.deleteAlert(id),
    onSuccess: () => {
      toast.success('Alert removed');
      queryClient.invalidateQueries(['alerts']);
    },
    onError: () => toast.error('Failed to delete alert'),
  });

  // Mark Read Mutation
  const markReadMutation = useMutation({
    mutationFn: (id) => alertsAPI.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!symbol || !targetPrice) {
      toast.error('Please enter symbol and target price');
      return;
    }
    createAlertMutation.mutate({
      symbol: symbol.toUpperCase().trim(),
      company_name: currentQuote?.company_name || currentQuote?.name || symbol.toUpperCase(),
      condition,
      target_price: parseFloat(targetPrice),
      notify_email: notifyEmail,
    });
  };

  const alertsList = Array.isArray(alerts) ? alerts : (alerts?.results || []);
  const notificationsList = Array.isArray(notifications) ? notifications : (notifications?.results || []);
  const unreadCount = notificationsList.filter((n) => !n.is_read).length;

  return (
    <div className="animate-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Price Alerts & Notifications</h1>
          <p className="page-subtitle">Set real-time triggers for target stock levels and stay notified</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          className={`btn ${activeTab === 'alerts' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('alerts')}
        >
          <Bell size={16} /> Active Alerts ({alertsList.length})
        </button>
        <button
          className={`btn ${activeTab === 'notifications' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('notifications')}
        >
          <Info size={16} /> Notifications{' '}
          {unreadCount > 0 && <span className="badge badge-red" style={{ marginLeft: '4px' }}>{unreadCount}</span>}
        </button>
      </div>

      {activeTab === 'alerts' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          {/* Create Alert Card */}
          <div className="card" style={{ height: 'fit-content' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Set New Price Alert</h3>
            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label className="form-label">Stock Symbol</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. RELIANCE.NS, AAPL"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    onBlur={handleSymbolBlur}
                    required
                  />
                  {isCheckingQuote && (
                    <Loader2
                      size={16}
                      className="spinner"
                      style={{ position: 'absolute', right: '12px', top: '12px' }}
                    />
                  )}
                </div>
                {currentQuote && (
                  <div style={{ fontSize: '12px', color: 'var(--green)', marginTop: '4px' }}>
                    Current Price: ₹{currentQuote.price?.toFixed(2)}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Trigger Condition</label>
                <select
                  className="form-input"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                >
                  <option value="ABOVE">Price Rises Above (&gt;=)</option>
                  <option value="BELOW">Price Drops Below (&lt;=)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Target Price (₹)</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="e.g. 2650.00"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <input
                  type="checkbox"
                  id="alertEmail"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                />
                <label htmlFor="alertEmail" style={{ fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  Send email alert when triggered
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={createAlertMutation.isPending}
              >
                {createAlertMutation.isPending ? 'Saving Alert...' : 'Create Price Alert'}
              </button>
            </form>
          </div>

          {/* Active Alerts Table */}
          <div className="card" style={{ padding: '0px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Active Alert Triggers</h3>
            </div>

            {isAlertsLoading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <Loader2 className="spinner" style={{ margin: '0 auto 12px' }} />
                <p style={{ color: 'var(--text-secondary)' }}>Loading alerts...</p>
              </div>
            ) : alertsList.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <Bell size={40} style={{ color: 'var(--text-muted)', marginBottom: '14px' }} />
                <h3 style={{ marginBottom: '6px' }}>No Active Alerts</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Set a price trigger on the left to get notified when a stock hits your target.
                </p>
              </div>
            ) : (
              <div className="table-container" style={{ border: 'none' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Stock</th>
                      <th>Condition</th>
                      <th>Target Price</th>
                      <th>Current Price</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertsList.map((alert) => (
                      <tr key={alert.id}>
                        <td>
                          <Link
                            to={`/stocks/${alert.symbol}`}
                            style={{
                              color: 'var(--accent)',
                              fontWeight: '600',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            {alert.symbol} <ExternalLink size={12} />
                          </Link>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {alert.company_name || alert.symbol}
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '13px',
                              fontWeight: '500',
                            }}
                          >
                            {alert.condition === 'ABOVE' ? (
                              <>
                                <ArrowUpRight size={16} style={{ color: 'var(--green)' }} /> Above
                              </>
                            ) : (
                              <>
                                <ArrowDownRight size={16} style={{ color: 'var(--red)' }} /> Below
                              </>
                            )}
                          </span>
                        </td>
                        <td style={{ fontWeight: '700' }}>
                          ₹{Number(alert.target_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {alert.current_price
                            ? `₹${Number(alert.current_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                            : '—'}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              alert.status === 'TRIGGERED'
                                ? 'badge-yellow'
                                : alert.status === 'ACTIVE'
                                ? 'badge-green'
                                : 'badge-red'
                            }`}
                          >
                            {alert.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--red)' }}
                            onClick={() => deleteAlertMutation.mutate(alert.id)}
                            title="Delete alert"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="card">
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Notifications Inbox</h3>
          {isNotificationsLoading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <Loader2 className="spinner" />
            </div>
          ) : notificationsList.length === 0 ? (
            <div style={{ padding: '50px 20px', textAlign: 'center' }}>
              <CheckCircle size={40} style={{ color: 'var(--green)', marginBottom: '14px' }} />
              <h3 style={{ marginBottom: '6px' }}>You're all caught up!</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                No notifications or price trigger events at this time.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notificationsList.map((n) => (
                <div
                  key={n.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 18px',
                    background: n.is_read ? 'var(--bg-secondary)' : 'var(--bg-card-hover)',
                    borderLeft: n.is_read ? 'none' : '3px solid var(--accent)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '600', fontSize: '14px' }}>{n.title}</span>
                      {n.related_symbol && <span className="badge badge-blue">{n.related_symbol}</span>}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {n.message}
                    </p>
                  </div>
                  {!n.is_read && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => markReadMutation.mutate(n.id)}
                    >
                      Mark read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
