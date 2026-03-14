import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './AuthPage.css';

const RULES = [
  { id: 'length',    label: 'At least 8 characters',         test: (p) => p.length >= 8 },
  { id: 'lowercase', label: 'One lowercase letter (a–z)',     test: (p) => /[a-z]/.test(p) },
  { id: 'uppercase', label: 'One uppercase letter (A–Z)',     test: (p) => /[A-Z]/.test(p) },
  { id: 'special',   label: 'One special character (!@#$…)',  test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(p) },
];

// Step 1: Enter email
function StepEmail({ onNext }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      toast.success('OTP sent! Check your email.');
      // In dev mode, show OTP in a toast for easy testing
      if (data.devOtp) {
        toast(`Dev OTP: ${data.devOtp}`, { icon: '🔑', duration: 20000 });
      }
      onNext(email);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2>Forgot Password</h2>
      <p className="auth-desc">Enter your registered email address and we'll send you a 6-digit OTP.</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Email address</label>
          <input
            className="form-input"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} disabled={loading}>
          {loading ? <><span className="spinner" style={{ width: 16, height: 16 }}></span> Sending OTP…</> : 'Send OTP →'}
        </button>
      </form>
      <p className="auth-switch"><Link to="/login">← Back to Sign in</Link></p>
    </>
  );
}

// Step 2: Enter 6-digit OTP
function StepOTP({ email, onNext, onBack }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputs = useRef([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return; // digits only
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpStr = otp.join('');
    if (otpStr.length < 6) { toast.error('Please enter all 6 digits'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp: otpStr });
      toast.success('OTP verified!');
      onNext(data.resetToken);
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed');
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      toast.success('New OTP sent!');
      if (data.devOtp) toast(`Dev OTP: ${data.devOtp}`, { icon: '🔑', duration: 20000 });
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } catch { toast.error('Failed to resend OTP'); }
    finally { setResending(false); }
  };

  return (
    <>
      <h2>Enter OTP</h2>
      <p className="auth-desc">
        We sent a 6-digit code to <strong>{email}</strong>. It expires in 10 minutes.
      </p>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '28px 0 24px' }} onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => inputs.current[i] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              style={{
                width: 48, height: 56,
                textAlign: 'center',
                fontSize: 22,
                fontWeight: 700,
                fontFamily: 'monospace',
                border: `2px solid ${digit ? 'var(--accent, #1a1a1a)' : '#ddd'}`,
                borderRadius: 10,
                outline: 'none',
                background: digit ? 'var(--accent-light, #f5f5f5)' : '#fff',
                transition: 'all 0.15s',
              }}
            />
          ))}
        </div>

        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
          {loading ? <><span className="spinner" style={{ width: 16, height: 16 }}></span> Verifying…</> : 'Verify OTP →'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13.5 }}>
        {countdown > 0 ? (
          <span style={{ color: '#999' }}>Resend OTP in <strong>{countdown}s</strong></span>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent, #1a1a1a)', fontWeight: 600, fontSize: 13.5 }}
          >
            {resending ? 'Resending…' : 'Resend OTP'}
          </button>
        )}
      </div>
      <p className="auth-switch"><button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 13.5 }}>← Change email</button></p>
    </>
  );
}

// Step 3: Set new password
function StepReset({ resetToken, onDone }) {
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const allRulesPassed = RULES.every(r => r.test(form.password));
  const passed = RULES.filter(r => r.test(form.password)).length;
  const colors = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allRulesPassed) { toast.error('Password does not meet requirements'); return; }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { resetToken, newPassword: form.password });
      toast.success('Password reset successfully!');
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2>New Password</h2>
      <p className="auth-desc">Choose a strong password for your account.</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">New password</label>
          <div style={{ position: 'relative' }}>
            <input
              className="form-input"
              type={showPass ? 'text' : 'password'}
              placeholder="Min 8 characters"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              style={{ paddingRight: 40 }}
              autoFocus
            />
            <button type="button" onClick={() => setShowPass(p => !p)}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 14 }}>
              {showPass ? '🙈' : '👁'}
            </button>
          </div>
          {form.password && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < passed ? colors[Math.max(0,passed-1)] : '#e0e0e0', transition: 'background 0.2s' }} />
                ))}
              </div>
              <span style={{ fontSize: 11.5, color: colors[Math.max(0,passed-1)], fontWeight: 600 }}>{labels[Math.max(0,passed-1)]}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                {RULES.map(rule => (
                  <div key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <span style={{ color: rule.test(form.password) ? '#2ecc71' : '#bbb', fontWeight: 700 }}>{rule.test(form.password) ? '✓' : '○'}</span>
                    <span style={{ color: rule.test(form.password) ? '#444' : '#999' }}>{rule.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Confirm new password</label>
          <input
            className={`form-input ${form.confirmPassword && form.password !== form.confirmPassword ? 'input-error' : ''}`}
            type={showPass ? 'text' : 'password'}
            placeholder="Re-enter password"
            value={form.confirmPassword}
            onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
          />
          {form.confirmPassword && form.password !== form.confirmPassword && (
            <span className="field-error">Passwords do not match</span>
          )}
          {form.confirmPassword && form.password === form.confirmPassword && (
            <span style={{ fontSize: 12, color: '#2ecc71', marginTop: 4, display: 'block' }}>✓ Passwords match</span>
          )}
        </div>

        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading || !allRulesPassed || form.password !== form.confirmPassword}>
          {loading ? <><span className="spinner" style={{ width: 16, height: 16 }}></span> Resetting…</> : 'Reset Password →'}
        </button>
      </form>
    </>
  );
}

// Step 4: Success
function StepSuccess() {
  const navigate = useNavigate();
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
      <h2 style={{ marginBottom: 8 }}>All done!</h2>
      <p className="auth-desc">Your password has been reset successfully. You can now sign in with your new password.</p>
      <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={() => navigate('/login')}>
        Go to Sign in →
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const STEPS = ['Email', 'OTP', 'Reset', 'Done'];

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-logo">CI</div>
          <span className="auth-brand-name">CoreInventory</span>
        </div>
        <div className="auth-tagline">
          <h1>Reset your<br /><em>password.</em></h1>
          <p>We'll verify your identity with a one-time code sent to your email.</p>
        </div>
        {/* Step progress indicator */}
        <div style={{ marginTop: 'auto' }}>
          {STEPS.map((label, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, opacity: i > step ? 0.35 : 1, transition: 'opacity 0.3s' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: i < step ? '#4ade80' : i === step ? 'white' : 'rgba(255,255,255,0.15)',
                color: i < step ? '#1a1a1a' : i === step ? '#1a1a1a' : 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, flexShrink: 0,
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 14, color: i === step ? 'white' : 'rgba(255,255,255,0.6)', fontWeight: i === step ? 600 : 400 }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          {step === 0 && <StepEmail onNext={(em) => { setEmail(em); setStep(1); }} />}
          {step === 1 && <StepOTP email={email} onNext={(token) => { setResetToken(token); setStep(2); }} onBack={() => setStep(0)} />}
          {step === 2 && <StepReset resetToken={resetToken} onDone={() => setStep(3)} />}
          {step === 3 && <StepSuccess />}
        </div>
      </div>
    </div>
  );
}