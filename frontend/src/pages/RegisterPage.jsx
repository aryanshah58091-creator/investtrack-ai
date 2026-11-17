import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: '', last_name: '', username: '', email: '', password: '', password2: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password2) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authAPI.register(form);
      await login(form.email, form.password);
      toast.success('Account created! Welcome to InvestTrack AI 🎉');
      navigate('/dashboard');
    } catch (err) {
      const errors = err.response?.data;
      if (errors) {
        const msg = Object.values(errors).flat().join(', ');
        toast.error(msg);
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const update = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg-primary)', padding: 20
    }}>
      <div style={{
        position: 'fixed', top: '5%', right: '10%', width: 350, height: 350,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: 480, position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, margin: '0 auto 14px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26
          }}>📈</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Create your account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Start tracking your investments with AI-powered insights
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">First Name</label>
                <input id="reg-first-name" type="text" className="form-input" value={form.first_name}
                  onChange={update('first_name')} placeholder="John" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Last Name</label>
                <input id="reg-last-name" type="text" className="form-input" value={form.last_name}
                  onChange={update('last_name')} placeholder="Doe" />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label">Username</label>
              <input id="reg-username" type="text" className="form-input" value={form.username}
                onChange={update('username')} placeholder="johndoe" required />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input id="reg-email" type="email" className="form-input" value={form.email}
                onChange={update('email')} placeholder="you@example.com" required />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input id="reg-password" type="password" className="form-input" value={form.password}
                onChange={update('password')} placeholder="Min 8 characters" required minLength={8} />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input id="reg-password2" type="password" className="form-input" value={form.password2}
                onChange={update('password2')} placeholder="Repeat password" required />
            </div>

            <button
              id="register-submit"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15 }}
            >
              {loading ? <span className="spinner" style={{ width: 20, height: 20 }} /> : 'Create Account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-secondary)', fontSize: 14 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
