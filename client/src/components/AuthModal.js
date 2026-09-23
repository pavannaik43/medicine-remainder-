import React, { useState } from 'react';
import { IconShield, IconUser, IconGlobe, IconEye, IconEyeOff } from './Icons';
import { API_AUTH } from '../config/api';

export default function AuthModal({
  onLogin,
  onClose,
  isGateway = false,
  currentLang,
  onLanguageChange,
  t = {},
}) {
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState('patient'); // 'patient' | 'caregiver'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [relationship, setRelationship] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email || !email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    if (isRegister) {
      if (!name || !name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (password.length < 4) {
        setError('Password must be at least 4 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter your password.');
        return;
      }
    }

    setLoading(true);

    const endpoint = isRegister ? `${API_AUTH}/register` : `${API_AUTH}/login`;
    const payload = isRegister
      ? {
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          relationship: relationship.trim(),
        }
      : {
          email: email.trim(),
          password,
          role,
        };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        if (text.includes('Cannot POST') || text.includes('Cannot GET')) {
          throw new Error('API endpoint not found. Please restart your backend server.');
        }
        if (text.includes('Proxy error') || res.status === 504 || res.status === 502) {
          throw new Error('Backend server is not reachable on port 5000. Please ensure the server is running.');
        }
        const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        throw new Error(cleanText || 'Server returned an invalid response');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (isRegister) {
        // STRICT REQUIREMENT: Registration does NOT auto-login.
        // Switch to Login tab, clear passwords, and prompt the user to manually sign in.
        setIsRegister(false);
        setPassword('');
        setConfirmPassword('');
        setError('');
        setSuccessMessage('Registration successful! Please login with your credentials.');
      } else {
        onLogin(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTabSwitch = (toRegister) => {
    setIsRegister(toRegister);
    setError('');
    setSuccessMessage('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className={isGateway ? "auth-gateway-container" : "auth-overlay"} role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div className={`auth-modal ${isGateway ? 'auth-modal--gateway' : ''}`}>
        {/* Header with Language Selector */}
        <div className="auth-modal__top-bar">
          <div className="auth-modal__brand">
            <span className="auth-modal__logo-icon">💊</span>
            <span className="auth-modal__app-title">{t.appName || 'Medicine Reminder'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="language-selector-wrap">
              <span className="language-globe-icon"><IconGlobe size={14} /></span>
              <button
                type="button"
                className={`lang-btn ${currentLang === 'en' ? 'lang-btn--active' : ''}`}
                onClick={() => onLanguageChange('en')}
              >
                English
              </button>
              <button
                type="button"
                className={`lang-btn ${currentLang === 'te' ? 'lang-btn--active' : ''}`}
                onClick={() => onLanguageChange('te')}
              >
                తెలుగు
              </button>
              <button
                type="button"
                className={`lang-btn ${currentLang === 'hi' ? 'lang-btn--active' : ''}`}
                onClick={() => onLanguageChange('hi')}
              >
                हिंदी
              </button>
            </div>

            {!isGateway && onClose && (
              <button
                type="button"
                className="icon-btn-close"
                onClick={onClose}
                aria-label="Close"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="auth-modal__content">
          {/* Main Auth Tabs: Sign In vs Create Account */}
          <div className="auth-main-tabs">
            <button
              type="button"
              className={`auth-main-tab ${!isRegister ? 'auth-main-tab--active' : ''}`}
              onClick={() => handleTabSwitch(false)}
            >
              🔑 {t.signIn || 'Sign In'}
            </button>
            <button
              type="button"
              className={`auth-main-tab ${isRegister ? 'auth-main-tab--active' : ''}`}
              onClick={() => handleTabSwitch(true)}
            >
              📝 {t.registerBtn || 'Create Account'}
            </button>
          </div>

          {/* Success Notification Banner */}
          {successMessage && (
            <div
              className="badge badge--success"
              style={{
                display: 'block',
                padding: '12px 14px',
                marginBottom: '16px',
                borderRadius: '8px',
                fontSize: '0.92rem',
                lineHeight: '1.45',
                border: '1px solid #86efac',
                backgroundColor: '#f0fdf4',
                color: '#166534',
                fontWeight: '600',
              }}
              role="status"
            >
              ✓ {successMessage}
            </div>
          )}

          <div className="auth-header-text">
            <h2 id="auth-title" className="auth-modal__heading">
              {isRegister ? (t.registerBtn || 'Create a New Account') : (t.loginTitle || 'Sign in to Your Account')}
            </h2>
            <p className="auth-modal__subheading">
              {isRegister
                ? 'Fill in your details below to set up your account.'
                : 'Select your role and enter your credentials to open your dashboard.'}
            </p>
          </div>

          {/* Role Selection (Mandatory for both Login and Registration) */}
          <div className="auth-role-section">
            <span className="field-label-sm">
              <strong>{isRegister ? (t.selectRole || 'I am registering as:') : (t.whoAreYou || 'Who are you? (Select your role):')}</strong>
            </span>
            <div className="auth-role-selector">
              <button
                type="button"
                className={`auth-role-btn ${role === 'patient' ? 'auth-role-btn--active' : ''}`}
                onClick={() => setRole('patient')}
              >
                <IconUser size={20} />
                <div style={{ textAlign: 'left' }}>
                  <strong style={{ display: 'block', fontSize: '0.95rem' }}>{t.patientRole || 'Patient'}</strong>
                  <small style={{ fontSize: '0.74rem', opacity: 0.85 }}>Personal medicines & alarms</small>
                </div>
              </button>
              <button
                type="button"
                className={`auth-role-btn ${role === 'caregiver' ? 'auth-role-btn--active' : ''}`}
                onClick={() => setRole('caregiver')}
              >
                <IconShield size={20} />
                <div style={{ textAlign: 'left' }}>
                  <strong style={{ display: 'block', fontSize: '0.95rem' }}>{t.caregiverRole || 'Caretaker'}</strong>
                  <small style={{ fontSize: '0.74rem', opacity: 0.85 }}>Monitor patient & adherence</small>
                </div>
              </button>
            </div>
          </div>

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {isRegister && (
              <label className="field">
                <span>{t.fullName || 'Full Name'} *</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  required
                  autoFocus
                />
              </label>
            )}

            <label className="field">
              <span>{t.emailAddress || 'Email Address'} *</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. user@example.com"
                required
              />
            </label>

            <label className="field">
              <span>{t.password || 'Password'} *</span>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isRegister ? 'Create a secure password' : 'Enter your password'}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              </div>
            </label>

            {/* Confirm Password (Registration only) */}
            {isRegister && (
              <label className="field">
                <span>Confirm Password *</span>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                  </button>
                </div>
              </label>
            )}

            {isRegister && role === 'caregiver' && (
              <label className="field">
                <span>Relationship to Patient (e.g. Daughter, Doctor, Nurse)</span>
                <input
                  type="text"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="e.g. Family Caregiver"
                />
              </label>
            )}

            {error && (
              <div className="field-error" role="alert">
                <span>⚠️ {error}</span>
                {error.toLowerCase().includes('not found') && !isRegister && (
                  <button
                    type="button"
                    className="error-link-btn"
                    onClick={() => handleTabSwitch(true)}
                  >
                    Click here to Create Account →
                  </button>
                )}
              </div>
            )}

            <button type="submit" className="btn btn--primary auth-submit-btn" disabled={loading}>
              {loading
                ? 'Please wait...'
                : isRegister
                ? (t.registerBtn || 'Register Account')
                : (t.loginBtn || `Sign In as ${role === 'caregiver' ? 'Caretaker' : 'Patient'}`)}
            </button>
          </form>

          <div className="auth-modal__switch">
            <span>
              {isRegister ? (t.alreadyHaveAccount || 'Already have an account?') : (t.dontHaveAccount || "Don't have an account?")}{' '}
            </span>
            <button
              type="button"
              className="auth-link-btn"
              onClick={() => handleTabSwitch(!isRegister)}
            >
              {isRegister ? (t.signIn || 'Sign In') : (t.register || 'Create Account')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

