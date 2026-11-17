import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import {
  User,
  Shield,
  Bell,
  Globe,
  Save,
  KeyRound,
  CheckCircle,
  Loader2,
  LogOut,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, logout } = useAuth();

  // Profile Form
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    email_alerts: true,
    push_alerts: true,
    weekly_report: true,
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Form
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        currency: user.currency || 'INR',
        timezone: user.timezone || 'Asia/Kolkata',
        email_alerts: user.email_alerts ?? true,
        push_alerts: user.push_alerts ?? true,
        weekly_report: user.weekly_report ?? true,
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await authAPI.updateProfile(profileForm);
      toast.success('Profile preferences updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile settings');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.new_password.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    setIsSavingPassword(true);
    try {
      await authAPI.changePassword({
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });
      toast.success('Password changed successfully!');
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Failed to update password';
      toast.error(msg);
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="animate-in" style={{ maxWidth: '900px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings & Preferences</h1>
          <p className="page-subtitle">Manage your account, display currency, alerts, and security</p>
        </div>
      </div>

      {/* Profile & Display Preferences */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <User size={20} style={{ color: 'var(--accent)' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Investor Profile</h3>
        </div>

        <form onSubmit={handleProfileSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">First Name</label>
              <input
                type="text"
                className="form-input"
                value={profileForm.first_name}
                onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Last Name</label>
              <input
                type="text"
                className="form-input"
                value={profileForm.last_name}
                onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address (Read-only)</label>
            <input
              type="email"
              className="form-input"
              value={user?.email || ''}
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Preferred Currency</label>
              <select
                className="form-input"
                value={profileForm.currency}
                onChange={(e) => setProfileForm({ ...profileForm, currency: e.target.value })}
              >
                <option value="INR">INR (₹) — Indian Rupee</option>
                <option value="USD">USD ($) — US Dollar</option>
                <option value="EUR">EUR (€) — Euro</option>
                <option value="GBP">GBP (£) — British Pound</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Timezone</label>
              <select
                className="form-input"
                value={profileForm.timezone}
                onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              </select>
            </div>
          </div>

          {/* Notifications Toggles */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '18px', marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Notification Channels</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={profileForm.email_alerts}
                  onChange={(e) => setProfileForm({ ...profileForm, email_alerts: e.target.checked })}
                />
                Receive instant email alerts for stock target breaches
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={profileForm.weekly_report}
                  onChange={(e) => setProfileForm({ ...profileForm, weekly_report: e.target.checked })}
                />
                Receive weekly AI portfolio health summary digest
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSavingProfile}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {isSavingProfile ? <Loader2 size={16} className="spinner" /> : <Save size={16} />}
            Save Preferences
          </button>
        </form>
      </div>

      {/* Security & Password */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <KeyRound size={20} style={{ color: 'var(--yellow)' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Security & Password</h3>
        </div>

        <form onSubmit={handlePasswordSubmit}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              className="form-input"
              value={passwordForm.old_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="At least 8 characters"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Re-enter new password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-secondary"
            disabled={isSavingPassword}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {isSavingPassword ? <Loader2 size={16} className="spinner" /> : <Shield size={16} />}
            Update Password
          </button>
        </form>
      </div>

      {/* Account Session Logout */}
      <div className="card" style={{ border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--red)' }}>Sign Out</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Safely end your current session and sign out of InvestTrack AI.
            </p>
          </div>
          <button className="btn btn-danger" onClick={logout}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
