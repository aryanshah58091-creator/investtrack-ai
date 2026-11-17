import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, TrendingUp, Star,
  Brain, Bell, Settings, LogOut, Search, ChevronRight,
  PieChart, FileText, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { stocksAPI } from '../api';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const NAV_GROUPS = [
  {
    title: 'Core',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
      { label: 'Portfolio', icon: Briefcase, to: '/portfolio' },
      { label: 'Watchlist', icon: Star, to: '/watchlist' },
    ]
  },
  {
    title: 'Analytics',
    items: [
      { label: 'Portfolio Analytics', icon: PieChart, to: '/analytics' },
    ]
  },
  {
    title: 'AI Intelligence',
    items: [
      { label: 'AI Engine Hub', icon: Sparkles, to: '/ai-insights', badge: '7 Engines' },
    ]
  },
  {
    title: 'Automation',
    items: [
      { label: 'Smart Alerts', icon: Bell, to: '/alerts' },
      { label: 'Reports & Calendar', icon: FileText, to: '/reports' },
    ]
  },
  {
    title: 'Account',
    items: [
      { label: 'Settings', icon: Settings, to: '/settings' },
    ]
  }
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const { data: searchResults, isFetching: isSearching } = useQuery({
    queryKey: ['stock-search', searchQuery],
    queryFn: () => stocksAPI.search(searchQuery).then(r => r.data),
    enabled: searchQuery.length >= 2,
    staleTime: 60000,
  });

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || user.email?.[0] || ''}`.toUpperCase()
    : '?';

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">📈</div>
          <span className="logo-text">InvestTrack</span>
          <span className="logo-badge">AI</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} style={{ marginBottom: 8 }}>
              <div className="nav-section-label">{group.title}</div>
              {group.items.map(({ label, icon: Icon, to, badge }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Icon size={17} />
                    <span>{label}</span>
                  </div>
                  {badge && (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 10,
                      background: 'rgba(99, 102, 241, 0.2)',
                      color: '#818cf8',
                      letterSpacing: 0.3
                    }}>
                      {badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="user-name">{user?.first_name || user?.username || 'User'}</div>
              <div className="user-email" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-search">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search stocks (e.g. RELIANCE, TCS)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
              id="global-search"
            />
            {showSearchResults && searchResults?.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', zIndex: 200, overflow: 'hidden'
              }}>
                {searchResults.slice(0, 6).map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => {
                      navigate(`/stocks/${stock.symbol}`);
                      setSearchQuery('');
                      setShowSearchResults(false);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', padding: '10px 14px', background: 'none',
                      border: 'none', color: 'var(--text-primary)', cursor: 'pointer',
                      fontSize: 14, textAlign: 'left', borderBottom: '1px solid var(--border)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--accent)', minWidth: 70 }}>{stock.symbol}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 13, flex: 1 }}>{stock.name}</span>
                    <ChevronRight size={14} color="var(--text-muted)" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="header-right">
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
