import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  TrendingUp,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Zap,
  Lock,
  User,
  ArrowRight
} from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!form.identifier || !form.password) {
      toast.error('Please enter your email/username and password');
      return;
    }

    setLoading(true);
    try {
      await login(form.identifier, form.password);
      toast.success('Welcome back to InvestTrack AI!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.error || 'Invalid credentials. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setDemoLoading(true);
    setForm({ identifier: 'demo@investtrack.ai', password: 'Demo1234!' });
    try {
      await login('demo@investtrack.ai', 'Demo1234!');
      toast.success('Signed in as Demo Investor! 🚀');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Demo login failed. Please retry.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 20%, #111a36 0%, #080c17 100%)',
      padding: '24px 16px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Ambient Light Orbs */}
      <div style={{
        position: 'absolute',
        top: '12%',
        left: '18%',
        width: 480,
        height: 480,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.16) 0%, transparent 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none',
        animation: 'floatOrb1 14s ease-in-out infinite'
      }} />

      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '16%',
        width: 420,
        height: 420,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(147, 51, 234, 0.14) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        animation: 'floatOrb2 16s ease-in-out infinite'
      }} />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 10 }}>
        {/* Floating Live Market Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          background: 'rgba(30, 41, 59, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 30,
          padding: '6px 16px',
          width: 'fit-content',
          margin: '0 auto 24px',
          backdropFilter: 'blur(12px)',
          animation: 'badgeGlow 4s infinite'
        }}>
          <span style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: '#10b981',
            boxShadow: '0 0 8px #10b981'
          }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0', letterSpacing: 0.5 }}>
            LIVE MARKETS ACTIVE
          </span>
          <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>
            NIFTY 24,850 ▲ +0.42%
          </span>
        </div>

        {/* Logo and Tagline */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 30,
            boxShadow: '0 10px 30px rgba(59, 130, 246, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            📈
          </div>
          <h1 style={{
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: '-0.5px',
            background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 6
          }}>
            InvestTrack AI
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Autonomous Portfolio Analytics & Multi-Agent Intelligence
          </p>
        </div>

        {/* Glassmorphic Login Card */}
        <div className="glass-card" style={{
          borderRadius: 20,
          padding: '32px 28px',
          transition: 'all 0.3s ease'
        }}>
          {/* Quick 1-Click Demo Login Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 12,
            padding: '14px 16px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, color: '#f8fafc' }}>
                <Zap size={15} style={{ color: '#fbbf24' }} />
                Instant Demo Access
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                Pre-configured holdings & AI insights
              </div>
            </div>

            <button
              id="quick-demo-btn"
              type="button"
              onClick={handleQuickDemo}
              disabled={demoLoading || loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                border: 'none',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {demoLoading ? (
                <span className="spinner" style={{ width: 14, height: 14 }} />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={13} />
                </>
              )}
            </button>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 22,
            color: 'var(--text-muted)',
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 1
          }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.08)' }} />
            <span>Or Sign In with Credentials</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.08)' }} />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 18 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 8 }}>
                <User size={14} style={{ color: 'var(--text-muted)' }} />
                Email Address or Username
              </label>
              <input
                id="login-email"
                type="text"
                className="form-input"
                placeholder="e.g. demo@investtrack.ai or demo_investor"
                value={form.identifier}
                onChange={e => setForm(p => ({ ...p, identifier: e.target.value }))}
                required
                autoFocus
                style={{
                  height: 44,
                  fontSize: 14,
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 10
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, margin: 0 }}>
                  <Lock size={14} style={{ color: 'var(--text-muted)' }} />
                  Password
                </label>
                <span style={{ fontSize: 12, color: 'var(--accent)', cursor: 'pointer' }} onClick={() => toast('Use Demo1234! for demo account.')}>
                  Demo: Demo1234!
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                  style={{
                    height: 44,
                    paddingRight: 42,
                    fontSize: 14,
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 10
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 4
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary"
              disabled={loading || demoLoading}
              style={{
                width: '100%',
                justifyContent: 'center',
                height: 46,
                fontSize: 15,
                fontWeight: 700,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                boxShadow: '0 6px 20px rgba(59, 130, 246, 0.35)',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="spinner" style={{ width: 18, height: 18 }} />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight size={16} />
                </div>
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 22, color: 'var(--text-secondary)', fontSize: 13 }}>
            Don't have an account yet?{' '}
            <Link to="/register" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>
              Create Account
            </Link>
          </div>
        </div>

        {/* Security / Compliance Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginTop: 20,
          color: 'var(--text-muted)',
          fontSize: 12
        }}>
          <ShieldCheck size={14} style={{ color: '#10b981' }} />
          <span>Stateless JWT • 256-Bit SSL • No API Key Required</span>
        </div>
      </div>
    </div>
  );
}
