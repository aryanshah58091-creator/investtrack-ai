import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { portfolioAPI, stocksAPI } from '../api';
import {
  TrendingUp,
  TrendingDown,
  PlusCircle,
  Trash2,
  ExternalLink,
  Search,
  Filter,
  DollarSign,
  PieChart,
  History,
  Briefcase,
  X,
  Loader2,
  RefreshCw,
  Link2,
  UploadCloud,
  CheckCircle,
  Shield,
  Zap,
  FileSpreadsheet,
  ArrowUpRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PortfolioPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('holdings'); // 'holdings' | 'transactions' | 'brokers'
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);
  const [brokerTab, setBrokerTab] = useState('angel_one'); // 'angel_one' | 'groww' | 'zerodha' | 'statement'
  const [brokerForm, setBrokerForm] = useState({
    client_id: '',
    api_key: '',
    api_secret: '',
    totp_secret: '',
  });
  const [statementFile, setStatementFile] = useState(null);
  const [statementText, setStatementText] = useState('');


  // Form state for adding transaction
  const [form, setForm] = useState({
    transaction_type: 'BUY',
    symbol: '',
    company_name: '',
    quantity: '',
    price: '',
    fees: '0',
    notes: '',
  });
  const [isSearchingStock, setIsSearchingStock] = useState(false);

  // Queries
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['portfolio-summary'],
    queryFn: async () => {
      const res = await portfolioAPI.getSummary();
      return res.data;
    },
    refetchInterval: 60 * 1000,
  });

  const { data: holdings = [], isLoading: isHoldingsLoading } = useQuery({
    queryKey: ['portfolio-holdings'],
    queryFn: async () => {
      const res = await portfolioAPI.getHoldings();
      return Array.isArray(res.data) ? res.data : (res.data?.results || []);
    },
    refetchInterval: 60 * 1000,
  });

  const { data: transactions = [], isLoading: isTransactionsLoading } = useQuery({
    queryKey: ['portfolio-transactions'],
    queryFn: async () => {
      const res = await portfolioAPI.getTransactions();
      return Array.isArray(res.data) ? res.data : (res.data?.results || []);
    },
  });

  // Add Transaction Mutation
  const addTransactionMutation = useMutation({
    mutationFn: (data) => portfolioAPI.addTransaction(data),
    onSuccess: () => {
      toast.success('Transaction added successfully!');
      queryClient.invalidateQueries(['portfolio-summary']);
      queryClient.invalidateQueries(['portfolio-holdings']);
      queryClient.invalidateQueries(['portfolio-transactions']);
      setIsModalOpen(false);
      setForm({
        transaction_type: 'BUY',
        symbol: '',
        company_name: '',
        quantity: '',
        price: '',
        fees: '0',
        notes: '',
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Failed to add transaction';
      toast.error(msg);
    },
  });

  // Delete Transaction Mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: (id) => portfolioAPI.deleteTransaction(id),
    onSuccess: () => {
      toast.success('Transaction deleted');
      queryClient.invalidateQueries(['portfolio-summary']);
      queryClient.invalidateQueries(['portfolio-holdings']);
      queryClient.invalidateQueries(['portfolio-transactions']);
    },
    onError: () => toast.error('Failed to delete transaction'),
  });

  // Brokers Query
  const { data: brokers = [], isLoading: isBrokersLoading } = useQuery({
    queryKey: ['portfolio-brokers'],
    queryFn: async () => {
      const res = await portfolioAPI.getBrokers();
      return Array.isArray(res.data) ? res.data : (res.data?.results || []);
    },
  });

  // Connect Broker Mutation
  const connectBrokerMutation = useMutation({
    mutationFn: (data) => portfolioAPI.connectBroker(data),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Broker connected and holdings synced!');
      queryClient.invalidateQueries(['portfolio-summary']);
      queryClient.invalidateQueries(['portfolio-holdings']);
      queryClient.invalidateQueries(['portfolio-transactions']);
      queryClient.invalidateQueries(['portfolio-brokers']);
      setIsBrokerModalOpen(false);
    },
    onError: (err) => {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to connect broker';
      toast.error(msg);
    },
  });

  // Sync Broker Mutation
  const syncBrokerMutation = useMutation({
    mutationFn: (id) => portfolioAPI.syncBroker(id),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Holdings refreshed from broker!');
      queryClient.invalidateQueries(['portfolio-summary']);
      queryClient.invalidateQueries(['portfolio-holdings']);
      queryClient.invalidateQueries(['portfolio-transactions']);
      queryClient.invalidateQueries(['portfolio-brokers']);
    },
    onError: () => toast.error('Failed to sync broker'),
  });

  // Disconnect Broker Mutation
  const disconnectBrokerMutation = useMutation({
    mutationFn: (id) => portfolioAPI.disconnectBroker(id),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Broker disconnected');
      queryClient.invalidateQueries(['portfolio-brokers']);
    },
    onError: () => toast.error('Failed to disconnect broker'),
  });

  // Import Statement Mutation
  const importStatementMutation = useMutation({
    mutationFn: (data) => portfolioAPI.importStatement(data),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Statement parsed and holdings imported!');
      queryClient.invalidateQueries(['portfolio-summary']);
      queryClient.invalidateQueries(['portfolio-holdings']);
      queryClient.invalidateQueries(['portfolio-transactions']);
      queryClient.invalidateQueries(['portfolio-brokers']);
      setIsBrokerModalOpen(false);
      setStatementFile(null);
      setStatementText('');
    },
    onError: (err) => {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to import statement';
      toast.error(msg);
    },
  });

  // Refresh Prices Mutation
  const refreshPricesMutation = useMutation({
    mutationFn: () => portfolioAPI.refreshPrices(),
    onSuccess: (res) => {
      toast.success(
        `Updated ${res.data?.updated_count || 0} stocks with live prices! Current Valuation: ₹${Number(
          res.data?.total_current_value || 0
        ).toLocaleString('en-IN')}`
      );
      queryClient.invalidateQueries(['portfolio-summary']);
      queryClient.invalidateQueries(['portfolio-holdings']);
    },
    onError: () => toast.error('Failed to refresh market prices'),
  });


  // Handle symbol blur / auto-fill price
  const handleSymbolBlur = async () => {
    const sym = form.symbol.trim().toUpperCase();
    if (!sym) return;
    setIsSearchingStock(true);
    try {
      const res = await stocksAPI.getQuote(sym);
      if (res.data && res.data.price) {
        setForm((prev) => ({
          ...prev,
          price: res.data.price.toFixed(2),
          company_name: prev.company_name || sym,
        }));
      }
    } catch {
      // Ignore if quote fails
    } finally {
      setIsSearchingStock(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.symbol || !form.quantity || !form.price) {
      toast.error('Please enter Symbol, Quantity, and Price');
      return;
    }
    addTransactionMutation.mutate({
      ...form,
      symbol: form.symbol.toUpperCase().trim(),
      quantity: parseFloat(form.quantity),
      price: parseFloat(form.price),
      fees: parseFloat(form.fees || 0),
    });
  };

  // Filtered lists
  const holdingsList = Array.isArray(holdings) ? holdings : (holdings?.results || []);
  const transactionsList = Array.isArray(transactions) ? transactions : (transactions?.results || []);
  const brokersList = Array.isArray(brokers) ? brokers : (brokers?.results || []);

  const filteredHoldings = holdingsList.filter(
    (h) =>
      h.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = transactionsList.filter(
    (t) =>
      t.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalInvested = Number(summary?.total_invested || 0);
  const currentValue = Number(summary?.total_current_value || 0);
  const totalPnl = Number(summary?.total_pnl || 0);
  const totalPnlPct = Number(summary?.total_pnl_pct || 0);
  const isPositive = totalPnl >= 0;

  return (
    <div className="animate-in">
      {/* Header */}
      <div
        className="page-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}
      >
        <div>
          <h1 className="page-title">Portfolio Manager</h1>
          <p className="page-subtitle">Track live broker holdings, transactions, and real-time valuations</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => refreshPricesMutation.mutate()}
            disabled={refreshPricesMutation.isPending}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            title="Fetch real-time prices for all holdings"
          >
            <RefreshCw size={15} className={refreshPricesMutation.isPending ? 'spinner' : ''} />
            {refreshPricesMutation.isPending ? 'Updating...' : 'Live Price Refresh'}
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => setIsBrokerModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: '1px solid var(--accent)',
              background: 'rgba(59, 130, 246, 0.08)',
            }}
          >
            <Link2 size={16} style={{ color: 'var(--accent)' }} /> Connect Broker
          </button>

          <button
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <PlusCircle size={16} /> Add Trade
          </button>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card card">
          <div className="stat-label">Total Portfolio Value</div>
          <div className="stat-value">₹{currentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className="stat-change" style={{ color: isPositive ? 'var(--green)' : 'var(--red)' }}>
            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>
              {isPositive ? '+' : ''}
              {totalPnlPct.toFixed(2)}%
            </span>
          </div>
          <DollarSign className="stat-icon" size={48} />
        </div>

        <div className="stat-card card">
          <div className="stat-label">Total Invested</div>
          <div className="stat-value">₹{totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className="stat-change" style={{ color: 'var(--text-secondary)' }}>
            Across {holdingsList.length} holding{holdingsList.length !== 1 ? 's' : ''}
          </div>
          <Briefcase className="stat-icon" size={48} />
        </div>

        <div className="stat-card card">
          <div className="stat-label">Overall Return</div>
          <div
            className="stat-value"
            style={{ color: isPositive ? 'var(--green)' : 'var(--red)' }}
          >
            {isPositive ? '+' : ''}₹{totalPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="stat-change" style={{ color: isPositive ? 'var(--green)' : 'var(--red)' }}>
            {isPositive ? 'Unrealized Profit' : 'Unrealized Loss'}
          </div>
          <PieChart className="stat-icon" size={48} />
        </div>

        <div className="stat-card card">
          <div className="stat-label">Connected Brokers</div>
          <div className="stat-value">{brokersList.length}</div>
          <div className="stat-change" style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => setActiveTab('brokers')}>
            {brokersList.length > 0 ? `${brokersList[0]?.broker_display || 'Broker'} Active` : 'Click to connect'}
          </div>
          <Link2 className="stat-icon" size={48} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="card" style={{ padding: '0px' }}>
        {/* Navigation Tabs & Search */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className={`btn btn-sm ${activeTab === 'holdings' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('holdings')}
            >
              Holdings ({holdingsList.length})
            </button>
            <button
              className={`btn btn-sm ${activeTab === 'transactions' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('transactions')}
            >
              Transactions ({transactionsList.length})
            </button>
            <button
              className={`btn btn-sm ${activeTab === 'brokers' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('brokers')}
            >
              <Link2 size={14} style={{ marginRight: '4px' }} /> Brokers & Sync ({brokersList.length})
            </button>
          </div>


          <div style={{ position: 'relative', width: '280px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="form-input"
              placeholder="Search by symbol or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '34px', height: '36px' }}
            />
          </div>
        </div>

        {/* Tab 1: Holdings Table */}
        {activeTab === 'holdings' && (
          <div className="table-container" style={{ border: 'none' }}>
            {isHoldingsLoading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <Loader2 className="spinner" style={{ margin: '0 auto 12px' }} />
                <p style={{ color: 'var(--text-secondary)' }}>Loading holdings...</p>
              </div>
            ) : filteredHoldings.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <Briefcase size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                <h3 style={{ marginBottom: '8px' }}>No Holdings Found</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  {searchTerm ? 'No holdings match your search.' : "You haven't added any stock positions yet."}
                </p>
                <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
                  <PlusCircle size={14} /> Add Your First Position
                </button>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Symbol / Asset</th>
                    <th>Shares / Qty</th>
                    <th>Avg Price</th>
                    <th>Current Price</th>
                    <th>Current Value</th>
                    <th>Unrealized P&L</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHoldings.map((h) => {
                    const pnl = h.pnl || (h.current_value - h.total_invested);
                    const pnlPct = h.pnl_pct || (h.total_invested > 0 ? (pnl / h.total_invested) * 100 : 0);
                    const positive = pnl >= 0;

                    return (
                      <tr key={h.id || h.symbol}>
                        <td>
                          <div>
                            <Link
                              to={`/stocks/${h.symbol}`}
                              style={{
                                color: 'var(--accent)',
                                fontWeight: '600',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              {h.symbol} <ExternalLink size={12} />
                            </Link>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {h.company_name || h.symbol}
                            </div>
                          </div>
                        </td>
                        <td style={{ fontWeight: '500' }}>{Number(h.quantity).toLocaleString()}</td>
                        <td>₹{Number(h.avg_buy_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td style={{ fontWeight: '600' }}>
                          ₹{Number(h.current_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ fontWeight: '600' }}>
                          ₹{Number(h.current_value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td>
                          <span className={`badge ${positive ? 'badge-green' : 'badge-red'}`}>
                            {positive ? '+' : ''}₹{Number(pnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({positive ? '+' : ''}
                            {Number(pnlPct).toFixed(2)}%)
                          </span>
                        </td>
                        <td>
                          <Link
                            to={`/stocks/${h.symbol}`}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '4px 8px' }}
                          >
                            Analyze
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Transactions Table */}
        {activeTab === 'transactions' && (
          <div className="table-container" style={{ border: 'none' }}>
            {isTransactionsLoading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <Loader2 className="spinner" style={{ margin: '0 auto 12px' }} />
                <p style={{ color: 'var(--text-secondary)' }}>Loading transactions...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <History size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                <h3 style={{ marginBottom: '8px' }}>No Transactions</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  No transaction history recorded yet.
                </p>
                <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
                  Record Transaction
                </button>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Symbol</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total Value</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((t) => (
                    <tr key={t.id}>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                        {t.executed_at ? new Date(t.executed_at).toLocaleDateString() : 'Recent'}
                      </td>
                      <td>
                        <span className={`badge ${t.transaction_type === 'BUY' ? 'badge-green' : 'badge-red'}`}>
                          {t.transaction_type}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/stocks/${t.symbol}`}
                          style={{ color: 'var(--accent)', fontWeight: '600', textDecoration: 'none' }}
                        >
                          {t.symbol}
                        </Link>
                      </td>
                      <td>{Number(t.quantity).toLocaleString()}</td>
                      <td>₹{Number(t.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td style={{ fontWeight: '600' }}>
                        ₹{Number(t.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.notes || '—'}
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--red)', padding: '4px 8px' }}
                          title="Delete transaction"
                          onClick={() => {
                            if (window.confirm(`Delete transaction for ${t.symbol}?`)) {
                              deleteTransactionMutation.mutate(t.id);
                            }
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 3: Connected Brokers & Sync */}
        {activeTab === 'brokers' && (
          <div style={{ padding: '24px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Connected Broker Accounts</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
                  Auto-sync holdings, quantities, and transaction books directly from your broker.
                </p>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setIsBrokerModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Link2 size={15} /> Connect New Broker
              </button>
            </div>

            {isBrokersLoading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <Loader2 className="spinner" style={{ margin: '0 auto 12px' }} />
                <p style={{ color: 'var(--text-secondary)' }}>Loading connected brokers...</p>
              </div>
            ) : brokersList.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <Shield size={48} style={{ color: 'var(--text-muted)', marginBottom: '14px' }} />
                <h3 style={{ marginBottom: '6px' }}>No Brokers Connected Yet</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '440px', margin: '0 auto 20px' }}>
                  Connect your Angel One SmartAPI, Groww, or Zerodha account to import your complete portfolio with 1 click.
                </p>
                <button className="btn btn-primary" onClick={() => setIsBrokerModalOpen(true)}>
                  Connect Broker Now
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {brokersList.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                      padding: '18px 20px',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '12px',
                          background:
                            b.broker_type === 'angel_one'
                              ? 'rgba(239, 68, 68, 0.15)'
                              : b.broker_type === 'groww'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(59, 130, 246, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color:
                            b.broker_type === 'angel_one'
                              ? '#ef4444'
                              : b.broker_type === 'groww'
                              ? '#10b981'
                              : '#3b82f6',
                          fontWeight: '800',
                          fontSize: '18px',
                        }}
                      >
                        {b.broker_type === 'angel_one' ? 'AO' : b.broker_type === 'groww' ? 'G' : 'Z'}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '700', fontSize: '16px' }}>{b.broker_display}</span>
                          <span className={`badge ${b.is_connected ? 'badge-green' : 'badge-yellow'}`}>
                            {b.is_connected ? 'Active Sync' : 'Disconnected'}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Client ID: <strong style={{ color: 'var(--text-primary)' }}>{b.client_id || 'Primary'}</strong> •{' '}
                          {b.holdings_count} Holdings Synced • Last sync:{' '}
                          {b.last_sync_at ? new Date(b.last_sync_at).toLocaleString() : 'Recent'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => syncBrokerMutation.mutate(b.id)}
                        disabled={syncBrokerMutation.isPending}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <RefreshCw size={13} className={syncBrokerMutation.isPending ? 'spinner' : ''} />
                        {syncBrokerMutation.isPending ? 'Syncing...' : 'Sync Now'}
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--red)' }}
                        onClick={() => {
                          if (window.confirm(`Disconnect ${b.broker_display}?`)) {
                            disconnectBrokerMutation.mutate(b.id);
                          }
                        }}
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Connect Broker Modal */}
      {isBrokerModalOpen && (
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
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '600px',
              padding: '28px',
              position: 'relative',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '14px',
              }}
            >
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Connect Broker or Import Portfolio</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
                  Auto-fetch your holdings and transactions for institutional-grade AI analysis
                </p>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setIsBrokerModalOpen(false)}
                style={{ padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Broker Provider Selector */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                marginBottom: '20px',
              }}
            >
              {[
                { id: 'angel_one', name: 'Angel One', tag: 'SmartAPI' },
                { id: 'groww', name: 'Groww', tag: 'Direct Sync' },
                { id: 'zerodha', name: 'Zerodha', tag: 'Kite' },
                { id: 'statement', name: 'Statement', tag: 'CAS / CSV' },
              ].map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBrokerTab(b.id)}
                  style={{
                    padding: '12px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: brokerTab === b.id ? '2px solid var(--accent)' : '1px solid var(--border)',
                    background: brokerTab === b.id ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontWeight: '700', fontSize: '14px' }}>{b.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{b.tag}</div>
                </button>
              ))}
            </div>

            {/* TAB: Angel One */}
            {brokerTab === 'angel_one' && (
              <div>
                <div
                  style={{
                    padding: '12px 14px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '18px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Connect your <strong>Angel One SmartAPI</strong> to fetch real-time portfolio holdings, live positions, and execution books automatically.
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    connectBrokerMutation.mutate({
                      broker_type: 'angel_one',
                      ...brokerForm,
                    });
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">Client ID / Angel One User Code</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. A994821"
                      value={brokerForm.client_id}
                      onChange={(e) => setBrokerForm({ ...brokerForm, client_id: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SmartAPI Key</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Enter SmartAPI Key"
                      value={brokerForm.api_key}
                      onChange={(e) => setBrokerForm({ ...brokerForm, api_key: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">MPIN / TOTP Token</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="4-digit MPIN or TOTP Secret"
                      value={brokerForm.totp_secret}
                      onChange={(e) => setBrokerForm({ ...brokerForm, totp_secret: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => {
                        connectBrokerMutation.mutate({
                          broker_type: 'angel_one',
                          client_id: 'ANGEL-DEMO1',
                          api_key: 'live-smartapi-demo',
                          totp_secret: '1234',
                        });
                      }}
                      disabled={connectBrokerMutation.isPending}
                    >
                      <Zap size={14} style={{ color: 'var(--yellow)' }} /> 1-Click Fast Sync
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ flex: 1, justifyContent: 'center' }}
                      disabled={connectBrokerMutation.isPending}
                    >
                      {connectBrokerMutation.isPending ? 'Connecting...' : 'Connect & Import'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB: Groww */}
            {brokerTab === 'groww' && (
              <div>
                <div
                  style={{
                    padding: '12px 14px',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '18px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Directly synchronize your <strong>Groww Stocks Portfolio</strong>. Enter your Groww investor ID or run a quick sync tranche.
                </div>

                <div className="form-group">
                  <label className="form-label">Groww Account / Client ID</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. GROWW-IN-8832"
                    value={brokerForm.client_id}
                    onChange={(e) => setBrokerForm({ ...brokerForm, client_id: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => {
                      connectBrokerMutation.mutate({
                        broker_type: 'groww',
                        client_id: brokerForm.client_id || 'GROWW-USER-77',
                      });
                    }}
                    disabled={connectBrokerMutation.isPending}
                  >
                    {connectBrokerMutation.isPending ? 'Syncing...' : '1-Click Groww Portfolio Sync'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB: Zerodha */}
            {brokerTab === 'zerodha' && (
              <div>
                <div
                  style={{
                    padding: '12px 14px',
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '18px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Connect your <strong>Zerodha Kite Connect</strong> session to pull Demat holdings, orders, and execution prices.
                </div>

                <div className="form-group">
                  <label className="form-label">Zerodha User ID (Kite)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. ZER-AA1234"
                    value={brokerForm.client_id}
                    onChange={(e) => setBrokerForm({ ...brokerForm, client_id: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Kite Connect API Key</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Enter Kite API Key"
                    value={brokerForm.api_key}
                    onChange={(e) => setBrokerForm({ ...brokerForm, api_key: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => {
                      connectBrokerMutation.mutate({
                        broker_type: 'zerodha',
                        client_id: brokerForm.client_id || 'KITE-USER-89',
                        api_key: brokerForm.api_key || 'kite-token',
                      });
                    }}
                    disabled={connectBrokerMutation.isPending}
                  >
                    {connectBrokerMutation.isPending ? 'Syncing...' : '1-Click Zerodha Sync'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB: Statement Import */}
            {brokerTab === 'statement' && (
              <div>
                <div
                  style={{
                    padding: '12px 14px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '18px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Upload your <strong>CDSL / NSDL e-CAS Statement</strong>, Groww Excel/CSV export, or Angel One trade statement. Our parser automatically normalizes tickers and pulls live prices.
                </div>

                <div className="form-group">
                  <label className="form-label">Select File (.csv, .json, .txt)</label>
                  <input
                    type="file"
                    className="form-input"
                    accept=".csv,.json,.txt"
                    onChange={(e) => setStatementFile(e.target.files[0])}
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Or Paste CSV Rows</label>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '11px', padding: '0 4px', height: 'auto' }}
                      onClick={() => {
                        setStatementText(
                          "Symbol,Quantity,Price,Name\nRELIANCE.NS,20,2850.00,Reliance Industries\nTCS.NS,10,3800.00,Tata Consultancy Services\nINFY.NS,35,1520.00,Infosys Ltd\nHDFCBANK.NS,30,1670.00,HDFC Bank\nNVDA,5,125.00,NVIDIA Corporation"
                        );
                      }}
                    >
                      Fill Sample Data
                    </button>
                  </div>
                  <textarea
                    className="form-input"
                    rows={4}
                    placeholder="Symbol, Quantity, Price, Name"
                    value={statementText}
                    onChange={(e) => setStatementText(e.target.value)}
                    style={{ fontFamily: 'monospace', fontSize: '12px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ flex: 1, justifyContent: 'center' }}
                    disabled={importStatementMutation.isPending || (!statementFile && !statementText)}
                    onClick={() => {
                      if (statementFile) {
                        const fd = new FormData();
                        fd.append('file', statementFile);
                        importStatementMutation.mutate(fd);
                      } else if (statementText) {
                        importStatementMutation.mutate({ content: statementText });
                      }
                    }}
                  >
                    {importStatementMutation.isPending ? 'Importing...' : 'Parse & Import Portfolio'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      {/* Add Transaction Modal */}
      {isModalOpen && (
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
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '520px',
              padding: '28px',
              position: 'relative',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Record New Transaction</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn btn-ghost btn-sm"
                style={{ padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Type toggle */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
                <button
                  type="button"
                  className={`btn ${form.transaction_type === 'BUY' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setForm({ ...form, transaction_type: 'BUY' })}
                >
                  BUY
                </button>
                <button
                  type="button"
                  className={`btn ${form.transaction_type === 'SELL' ? 'btn-danger' : 'btn-secondary'}`}
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setForm({ ...form, transaction_type: 'SELL' })}
                >
                  SELL
                </button>
              </div>

              {/* Symbol */}
              <div className="form-group">
                <label className="form-label">Stock Symbol / Ticker</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. RELIANCE.NS, TCS.NS, AAPL, NVDA"
                    value={form.symbol}
                    onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                    onBlur={handleSymbolBlur}
                    required
                  />
                  {isSearchingStock && (
                    <Loader2
                      size={16}
                      className="spinner"
                      style={{ position: 'absolute', right: '12px', top: '12px' }}
                    />
                  )}
                </div>
                <small style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                  Tip: Use .NS for NSE stocks (e.g. INFY.NS, TATAMOTORS.NS) or US tickers (AAPL, MSFT).
                </small>
              </div>

              {/* Quantity and Price row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Quantity (Shares)</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    placeholder="e.g. 10"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Price per Share (₹)</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    placeholder="e.g. 2450.50"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Total Calculation */}
              {form.quantity && form.price && (
                <div
                  style={{
                    background: 'var(--bg-secondary)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '14px',
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>Total Trade Value:</span>
                  <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                    ₹{(parseFloat(form.quantity || 0) * parseFloat(form.price || 0)).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">Notes (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Long-term core holding, SIP tranche"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  disabled={addTransactionMutation.isPending}
                >
                  {addTransactionMutation.isPending ? 'Saving...' : 'Add Position'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
