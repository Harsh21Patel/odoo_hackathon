import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './AuthPage.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
      toast.success('Welcome back!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  const fillDemo = () => setForm({ email: 'admin@coreinventory.com', password: 'admin123' });

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-logo">CI</div>
          <span className="auth-brand-name">CoreInventory</span>
        </div>
        <div className="auth-tagline">
          <h1>Stock operations,<br /><em>simplified.</em></h1>
          <p>Centralize your warehouse, receipts, deliveries, and stock tracking in one powerful system.</p>
        </div>
        <div className="auth-features">
          {['Real-time stock visibility', 'Multi-warehouse support', 'Complete audit trail', 'Smart low-stock alerts'].map(f => (
            <div key={f} className="auth-feature"><span>✓</span>{f}</div>
          ))}
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <h2>Sign in</h2>
          <p className="auth-desc">Enter your credentials to access your inventory dashboard.</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input className="form-input" type="email" placeholder="you@company.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
            </div>
            <button className="btn btn-primary" style={{width:'100%', justifyContent:'center', marginTop:4}} disabled={loading}>
              {loading ? <><span className="spinner" style={{width:16,height:16}}></span> Signing in…</> : 'Sign in →'}
            </button>
          </form>
          <button className="demo-btn" onClick={fillDemo}>Use demo credentials</button>
          <p className="auth-switch"><Link to="/forgot-password" style={{float:"left"}}>Forgot password?</Link>
          <span>Don't have an account? <Link to="/register">Sign up</Link></span></p>
        </div>
      </div>
    </div>
  );
}