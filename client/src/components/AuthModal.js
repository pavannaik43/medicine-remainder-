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
  const [showPassword, setShowPassword] = useState(false);
  const [relationship, setRelationship] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    const endpoint = isRegister ? `${API_AUTH}/register` : `${API_AUTH}/login`;
    const payload = isRegister
      ? { name: name.trim(), email: email.trim(), password, role, relationship: relationship.trim() }
      : { email: email.trim(), password };

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
          throw new Error('Endpoint not found. Please restart your backend server.');
        }
        if (text.includes('Proxy error') || res.status === 504 || res.status === 502) {
          throw new Error('Backend server is not running on port 5000. Please start the server in terminal.');
        }
        const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        throw new Error(cleanText || 'Server returned an invalid response');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (isRegister) {
        // Switch to Sign In tab upon registration so user logs in with credentials
        setIsRegister(false);
        setPassword('');
        setError('');
        setSuccessMessage(`✓ Account created successfully for ${data.name}! Please enter your password to sign in.`);
      } else {
        onLogin(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
              onClick={() => {
                setIsRegister(false);
                setError('');
                setSuccessMessage('');
              }}
            >
              🔑 {t.signIn || 'Sign In'}
            </button>
            <button
              type="button"
              className={`auth-main-tab ${isRegister ? 'auth-main-tab--active' : ''}`}
              onClick={() => {
                setIsRegister(true);
                setError('');
                setSuccessMessage('');
              }}
            >
              📝 {t.registerBtn || 'Create Account'}
            </button>
          </div>

          {successMessage && (
            <div className="badge badge--success" style={{ display: 'block', padding: '10px 14px', marginBottom: '14px', borderRadius: '8px', fontSize: '0.9rem', lineHeight: '1.4' }}>
              {successMessage}
            </div>
          )}

          <div className="auth-header-text">
            <h2 id="auth-title" className="auth-modal__heading">
              {isRegister ? (t.registerBtn || 'Create a New Account') : (t.loginTitle || 'Sign in to Your Account')}
            </h2>
            <p className="auth-modal__subheading">
              {isRegister
                ? 'Select whether you are a Patient or Caretaker to set up your account.'
                : 'Enter your email and password to access your schedule and alerts.'}
            </p>
          </div>

          {/* Role Toggle Selector (Only when registering) */}
          {isRegister && (
            <div className="auth-role-section">
              <span className="field-label-sm">{t.selectRole || 'I am registering as:'}</span>
              <div className="auth-role-selector">
                <button
                  type="button"
                  className={`auth-role-btn ${role === 'patient' ? 'auth-role-btn--active' : ''}`}
                  onClick={() => setRole('patient')}
                >
                  <IconUser size={18} />
                  <div style={{ textAlign: 'left' }}>
                    <strong style={{ display: 'block' }}>{t.patientRole || 'Patient'}</strong>
                    <small style={{ fontSize: '0.74rem', opacity: 0.85 }}>Track medicines & alarms</small>
                  </div>
                </button>
                <button
                  type="button"
                  className={`auth-role-btn ${role === 'caregiver' ? 'auth-role-btn--active' : ''}`}
                  onClick={() => setRole('caregiver')}
                >
                  <IconShield size={18} />
                  <div style={{ textAlign: 'left' }}>
                    <strong style={{ display: 'block' }}>{t.caregiverRole || 'Caretaker'}</strong>
                    <small style={{ fontSize: '0.74rem', opacity: 0.85 }}>Monitor family & adherence</small>
                  </div>
                </button>
              </div>
            </div>
          )}

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
                  placeholder="••••••••"
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

            {isRegister && role === 'caregiver' && (
              <label className="field">
                <span>Relationship (e.g. Daughter, Doctor, Nurse)</span>
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
                {error.toLowerCase().includes('not found') && (
                  <button
                    type="button"
                    className="error-link-btn"
                    onClick={() => {
                      setIsRegister(true);
                      setError('');
                      setSuccessMessage('');
                    }}
                  >
                    Click here to Create Account →
                  </button>
                )}
              </div>
            )}

            <button type="submit" className="btn btn--primary auth-submit-btn" disabled={loading}>
              {loading ? 'Please wait...' : isRegister ? (t.registerBtn || 'Create Account') : (t.loginBtn || 'Sign In')}
            </button>
          </form>

          <div className="auth-modal__switch">
            <span>
              {isRegister ? (t.alreadyHaveAccount || 'Already have an account?') : (t.dontHaveAccount || "Don't have an account?")}{' '}
            </span>
            <button
              type="button"
              className="auth-link-btn"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
                setSuccessMessage('');
              }}
            >
              {isRegister ? (t.signIn || 'Sign In') : (t.register || 'Create Account')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

