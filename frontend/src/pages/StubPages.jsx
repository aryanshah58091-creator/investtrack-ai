import React from 'react';

// Stub pages — to be fully implemented
export function PortfolioPage() {
  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Portfolio</h1>
          <p className="page-subtitle">Manage your holdings and transactions</p>
        </div>
      </div>
      <div className="card">
        <div className="empty-state">
          <div style={{ fontSize: 48 }}>💼</div>
          <h3>Portfolio page coming soon</h3>
          <p>Full portfolio management with transactions, P&L charts, and more</p>
        </div>
      </div>
    </div>
  );
}

export function StockPage() {
  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Analysis</h1>
        </div>
      </div>
      <div className="card">
        <div className="empty-state">
          <div style={{ fontSize: 48 }}>📈</div>
          <h3>Stock detail page coming soon</h3>
          <p>Price charts, fundamentals, news, and AI analysis</p>
        </div>
      </div>
    </div>
  );
}

export function WatchlistPage() {
  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Watchlist</h1>
          <p className="page-subtitle">Track stocks you're interested in</p>
        </div>
      </div>
      <div className="card">
        <div className="empty-state">
          <div style={{ fontSize: 48 }}>⭐</div>
          <h3>Watchlist coming soon</h3>
          <p>Add stocks to track their prices and get alerts</p>
        </div>
      </div>
    </div>
  );
}

export function AlertsPage() {
  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Alerts</h1>
          <p className="page-subtitle">Price alerts and notifications</p>
        </div>
      </div>
      <div className="card">
        <div className="empty-state">
          <div style={{ fontSize: 48 }}>🔔</div>
          <h3>Alerts coming soon</h3>
          <p>Set price alerts for any stock</p>
        </div>
      </div>
    </div>
  );
}

export function SettingsPage() {
  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account and preferences</p>
        </div>
      </div>
      <div className="card">
        <div className="empty-state">
          <div style={{ fontSize: 48 }}>⚙️</div>
          <h3>Settings coming soon</h3>
          <p>Profile, notifications, and security settings</p>
        </div>
      </div>
    </div>
  );
}
