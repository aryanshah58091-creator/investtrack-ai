import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { watchlistAPI, stocksAPI, alertsAPI } from '../api';
import {
  Star,
  Search,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Bell,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function WatchlistPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filterTerm, setFilterTerm] = useState('');

  // Set alert modal state
  const [alertModalStock, setAlertModalStock] = useState(null);
  const [alertForm, setAlertForm] = useState({
    condition: 'ABOVE',
    target_price: '',
    notify_email: true,
  });

  // Query Watchlist
  const { data: watchlist = [], isLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const res = await watchlistAPI.getWatchlist();
      return Array.isArray(res.data) ? res.data : (res.data?.results || []);
    },
    refetchInterval: 30 * 1000,
  });

  // Remove from Watchlist Mutation
  const removeMutation = useMutation({
    mutationFn: (id) => watchlistAPI.removeFromWatchlist(id),
    onSuccess: () => {
      toast.success('Removed from watchlist');
      queryClient.invalidateQueries(['watchlist']);
    },
    onError: () => toast.error('Failed to remove item'),
  });

  // Add to Watchlist Mutation
  const addMutation = useMutation({
    mutationFn: (item) =>
      watchlistAPI.addToWatchlist({
        symbol: item.symbol,
        company_name: item.name || item.company_name || item.symbol,
      }),
    onSuccess: (data, variables) => {
      toast.success(`${variables.symbol} added to watchlist!`);
      queryClient.invalidateQueries(['watchlist']);
      setSearchQuery('');
      setSearchResults([]);
    },
    onError: (err) => {
      const msg = err.response?.data?.detail || 'Already in watchlist';
      toast.error(msg);
    },
  });

  // Create Alert Mutation
  const createAlertMutation = useMutation({
    mutationFn: (data) =>
      alertsAPI.createAlert({
        symbol: alertModalStock.symbol,
        company_name: alertModalStock.company_name || alertModalStock.symbol,
        condition: data.condition,
        target_price: parseFloat(data.target_price),
        notify_email: data.notify_email,
      }),
    onSuccess: () => {
      toast.success('Price alert set successfully!');
      setAlertModalStock(null);
      queryClient.invalidateQueries(['alerts']);
    },
    onError: () => toast.error('Failed to create alert'),
  });

  // Handle Search Input
  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await stocksAPI.search(val);
      setSearchResults(res.data || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const watchlistItems = Array.isArray(watchlist) ? watchlist : (watchlist?.results || []);

  const filteredWatchlist = watchlistItems.filter(
    (item) =>
      item.symbol?.toLowerCase().includes(filterTerm.toLowerCase()) ||
      item.company_name?.toLowerCase().includes(filterTerm.toLowerCase())
  );

  return (
    <div className="animate-in">
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Watchlist</h1>
          <p className="page-subtitle">Monitor stock price movements, highs, lows, and quick alerts</p>
        </div>
      </div>

      {/* Add Stock Search Section */}
      <div className="card" style={{ marginBottom: '24px', position: 'relative' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Add Stock to Watchlist</h3>
        <div style={{ position: 'relative' }}>
          <Search
            size={18}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            className="form-input"
            placeholder="Search stock ticker or company name (e.g. INFY, RELIANCE, AAPL, TSLA)..."
            value={searchQuery}
            onChange={handleSearchChange}
            style={{ paddingLeft: '40px' }}
          />
          {isSearching && (
            <Loader2
              size={18}
              className="spinner"
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              marginTop: '6px',
              zIndex: 100,
              maxHeight: '280px',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            {searchResults.map((result) => (
              <div
                key={result.symbol}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 18px',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <span style={{ fontWeight: '700', color: 'var(--accent)' }}>{result.symbol}</span>
                  <span style={{ marginLeft: '10px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {result.name || result.company_name}
                  </span>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => addMutation.mutate(result)}
                  disabled={addMutation.isPending}
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Watchlist Table */}
      <div className="card" style={{ padding: '0px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Star size={18} style={{ color: 'var(--yellow)' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Tracked Stocks ({watchlistItems.length})</h3>
          </div>

          <div style={{ width: '240px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Filter watchlist..."
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              style={{ height: '34px', fontSize: '13px' }}
            />
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Loader2 className="spinner" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Loading watchlist...</p>
          </div>
        ) : filteredWatchlist.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Star size={44} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
            <h3 style={{ marginBottom: '8px' }}>Your Watchlist is Empty</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Search above to add any stock ticker to monitor real-time prices.
            </p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Company</th>
                  <th>Current Price</th>
                  <th>Today's Change</th>
                  <th>Day Range</th>
                  <th>Volume</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWatchlist.map((item) => {
                  const quote = item.quote || {};
                  const isPositive = (quote.change || 0) >= 0;
                  const currSym = quote.currency === 'USD' ? '$' : '₹';

                  return (
                    <tr key={item.id}>
                      <td>
                        <Link
                          to={`/stocks/${item.symbol}`}
                          style={{
                            color: 'var(--accent)',
                            fontWeight: '700',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {item.symbol} <ExternalLink size={12} />
                        </Link>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.company_name || quote.name || item.symbol}
                      </td>
                      <td style={{ fontWeight: '700', fontFamily: 'JetBrains Mono, monospace' }}>
                        {quote.price ? `${currSym}${quote.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td>
                        <span className={`badge ${isPositive ? 'badge-green' : 'badge-red'}`}>
                          {isPositive ? '+' : ''}
                          {quote.change ? quote.change.toFixed(2) : '0.00'} ({isPositive ? '+' : ''}
                          {quote.change_pct ? quote.change_pct.toFixed(2) : '0.00'}%)
                        </span>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {quote.day_low && quote.day_high
                          ? `${currSym}${quote.day_low.toFixed(2)} - ${currSym}${quote.day_high.toFixed(2)}`
                          : '—'}
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {quote.volume ? quote.volume.toLocaleString() : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Link to={`/stocks/${item.symbol}`} className="btn btn-ghost btn-sm" title="View Chart">
                            Chart
                          </Link>
                          <button
                            className="btn btn-ghost btn-sm"
                            title="Set Alert"
                            onClick={() => {
                              setAlertModalStock(item);
                              setAlertForm({
                                condition: 'ABOVE',
                                target_price: quote.price ? (quote.price * 1.05).toFixed(2) : '',
                                notify_email: true,
                              });
                            }}
                          >
                            <Bell size={14} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--red)' }}
                            title="Remove from watchlist"
                            onClick={() => removeMutation.mutate(item.id)}
                          >
                            <Trash2 size={14} />
                          </button>
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

      {/* Set Alert Modal */}
      {alertModalStock && (
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
          <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Price Alert: {alertModalStock.symbol}</h3>
              <button onClick={() => setAlertModalStock(null)} className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
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
                <label className="form-label">Condition</label>
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
                <label className="form-label">Target Trigger Price (₹)</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="e.g. 2500"
                  value={alertForm.target_price}
                  onChange={(e) => setAlertForm({ ...alertForm, target_price: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setAlertModalStock(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={createAlertMutation.isPending}>
                  {createAlertMutation.isPending ? 'Setting...' : 'Set Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
