import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './AuthPage.css';

// Password rules matching backend
const RULES = [
  { id: 'length',    label: 'At least 8 characters',          test: (p) => p.length >= 8 },
  { id: 'lowercase', label: 'One lowercase letter (a–z)',      test: (p) => /[a-z]/.test(p) },
  { id: 'uppercase', label: 'One uppercase letter (A–Z)',      test: (p) => /[A-Z]/.test(p) },
  { id: 'special',   label: 'One special character (!@#$…)',   test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(p) },
];

function PasswordStrength({ password }) {
  if (!password) return null;
  const passed = RULES.filter(r => r.test(password)).length;
  const colors = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const idx = Math.max(0, passed - 1);

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i < passed ? colors[idx] : '#e0e0e0',
            transition: 'background 0.2s',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11.5, color: colors[idx], fontWeight: 600 }}>{labels[idx]}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {RULES.map(rule => (
          <div key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span style={{ color: rule.test(password) ? '#2ecc71' : '#bbb', fontWeight: 700, fontSize: 13 }}>
              {rule.test(password) ? '✓' : '○'}
            </span>
            <span style={{ color: rule.test(password) ? '#444' : '#999' }}>{rule.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    const allRulesPassed = RULES.every(r => r.test(form.password));
    if (!allRulesPassed) e.password = 'Password does not meet all requirements';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
      toast.success('Account created! Welcome aboard.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const f = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: undefined })); };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-logo">CI</div>
          <span className="auth-brand-name">CoreInventory</span>
        </div>
        <div className="auth-tagline">
          <h1>Get started<br /><em>for free.</em></h1>
          <p>Set up your inventory system in minutes. No complex setup required.</p>
        </div>
        <div className="auth-features">
          {['Real-time stock visibility', 'Multi-warehouse support', 'Complete audit trail', 'Smart low-stock alerts'].map(feat => (
            <div key={feat} className="auth-feature"><span>✓</span>{feat}</div>
          ))}
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2>Create account</h2>
          <p className="auth-desc">Start managing your inventory today.</p>
          <form onSubmit={handleSubmit} noValidate>

            <div className="form-group">
              <label className="form-label">Full name</label>
              <input
                className={`form-input ${errors.name ? 'input-error' : ''}`}
                type="text"
                placeholder="John Doe"
                value={form.name}
                onChange={e => f('name', e.target.value)}
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                className={`form-input ${errors.email ? 'input-error' : ''}`}
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={e => f('email', e.target.value)}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className={`form-input ${errors.password ? 'input-error' : ''}`}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={e => f('password', e.target.value)}
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 14 }}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
              {errors.password && <span className="field-error">{errors.password}</span>}
              <PasswordStrength password={form.password} />
            </div>

            <div className="form-group">
              <label className="form-label">Re-enter password</label>
              <input
                className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                type={showPass ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onChange={e => f('confirmPassword', e.target.value)}
              />
              {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
              {form.confirmPassword && form.password === form.confirmPassword && (
                <span style={{ fontSize: 12, color: '#2ecc71', marginTop: 4, display: 'block' }}>✓ Passwords match</span>
              )}
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              disabled={loading}
            >
              {loading
                ? <><span className="spinner" style={{ width: 16, height: 16 }}></span> Creating…</>
                : 'Create account →'}
            </button>
          </form>

          <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}