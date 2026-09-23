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
        {/* Header with Brand & Language Selector */}
        <div className="auth-modal__top-bar">
          <div className="auth-modal__brand">
            <span className="auth-modal__logo-icon">💊</span>
            <div>
              <span className="auth-modal__app-title">{t.appName || 'Medicine Reminder'}</span>
              <span className="auth-modal__app-tagline">Daily Health & Schedule Assistant</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="language-selector-wrap">
              <span className="language-globe-icon"><IconGlobe size={14} /></span>
              <button
                type="button"
                className={`lang-btn ${currentLang === 'en' ? 'lang-btn--active' : ''}`}
                onClick={() => onLanguageChange('en')}
              >
                EN
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
              <span className="auth-tab-icon">🔑</span>
              <span>{t.signIn || 'Sign In'}</span>
            </button>
            <button
              type="button"
              className={`auth-main-tab ${isRegister ? 'auth-main-tab--active' : ''}`}
              onClick={() => handleTabSwitch(true)}
            >
              <span className="auth-tab-icon">✨</span>
              <span>{t.registerBtn || 'Create Account'}</span>
            </button>
          </div>

          {/* Success Notification Banner */}
          {successMessage && (
            <div className="auth-alert-banner auth-alert-banner--success" role="status">
              <span className="auth-alert-icon">✓</span>
              <div>
                <strong>Account Created!</strong>
                <p>{successMessage}</p>
              </div>
            </div>
          )}

          {/* Heading */}
          <div className="auth-header-text">
            <h2 id="auth-title" className="auth-modal__heading">
              {isRegister ? (t.registerBtn || 'Create an Account') : (t.loginTitle || 'Welcome Back')}
            </h2>
            <p className="auth-modal__subheading">
              {isRegister
                ? 'Select your role below to configure your tailored experience.'
                : 'Select your role to access your personalized medical portal.'}
            </p>
          </div>

          {/* PREMIUM ROLE SELECTOR CARDS */}
          <div className="auth-role-section">
            <div className="auth-role-section__label-row">
              <span className="auth-role-section__title">
                {isRegister ? (t.selectRole || 'Choose Your Account Type:') : (t.whoAreYou || 'Select Who You Are:')}
              </span>
              <span className={`auth-role-active-indicator auth-role-active-indicator--${role}`}>
                Active: {role === 'caregiver' ? 'Caretaker' : 'Patient'}
              </span>
            </div>

            <div className="auth-role-grid">
              {/* Patient Card */}
              <div
                className={`auth-role-card auth-role-card--patient ${role === 'patient' ? 'auth-role-card--active' : ''}`}
                onClick={() => setRole('patient')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setRole('patient'); }}
              >
                <div className="auth-role-card__header">
                  <div className="auth-role-card__icon-badge auth-role-card__icon-badge--patient">
                    <IconUser size={24} />
                  </div>
                  <div className="auth-role-card__radio">
                    {role === 'patient' && <span className="auth-role-card__check-dot">✓</span>}
                  </div>
                </div>

                <div className="auth-role-card__info">
                  <div className="auth-role-card__title-row">
                    <h3 className="auth-role-card__name">{t.patientRole || 'Patient'}</h3>
                    <span className="auth-role-card__tag auth-role-card__tag--patient">Self</span>
                  </div>
                  <p className="auth-role-card__desc">
                    I take medicines, manage daily reminders, alarms & log dose history.
                  </p>
                </div>

                {role === 'patient' && (
                  <div className="auth-role-card__footer-bar auth-role-card__footer-bar--patient">
                    <span>Selected Role</span>
                  </div>
                )}
              </div>

              {/* Caretaker Card */}
              <div
                className={`auth-role-card auth-role-card--caregiver ${role === 'caregiver' ? 'auth-role-card--active' : ''}`}
                onClick={() => setRole('caregiver')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setRole('caregiver'); }}
              >
                <div className="auth-role-card__header">
                  <div className="auth-role-card__icon-badge auth-role-card__icon-badge--caregiver">
                    <IconShield size={24} />
                  </div>
                  <div className="auth-role-card__radio">
                    {role === 'caregiver' && <span className="auth-role-card__check-dot">✓</span>}
                  </div>
                </div>

                <div className="auth-role-card__info">
                  <div className="auth-role-card__title-row">
                    <h3 className="auth-role-card__name">{t.caregiverRole || 'Caretaker / Family'}</h3>
                    <span className="auth-role-card__tag auth-role-card__tag--caregiver">Care</span>
                  </div>
                  <p className="auth-role-card__desc">
                    I monitor patients, configure medicines, view adherence & receive dose alerts.
                  </p>
                </div>

                {role === 'caregiver' && (
                  <div className="auth-role-card__footer-bar auth-role-card__footer-bar--caregiver">
                    <span>Selected Role</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {isRegister && (
              <label className="field auth-field">
                <span className="field-label-text">{t.fullName || 'Full Name'} *</span>
                <input
                  type="text"
                  className="auth-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  required
                  autoFocus
                />
              </label>
            )}

            <label className="field auth-field">
              <span className="field-label-text">{t.emailAddress || 'Email Address'} *</span>
              <input
                type="email"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. name@example.com"
                required
              />
            </label>

            <label className="field auth-field">
              <span className="field-label-text">{t.password || 'Password'} *</span>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isRegister ? 'Create a secure password (min 4 chars)' : 'Enter your password'}
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
              <label className="field auth-field">
                <span className="field-label-text">Confirm Password *</span>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="auth-input"
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
              <label className="field auth-field">
                <span className="field-label-text">Relationship to Patient (e.g. Daughter, Doctor, Guardian)</span>
                <input
                  type="text"
                  className="auth-input"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="e.g. Family Member / Caretaker"
                />
              </label>
            )}

            {error && (
              <div className="auth-alert-banner auth-alert-banner--error" role="alert">
                <span className="auth-alert-icon">⚠️</span>
                <div>
                  <p>{error}</p>
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
              </div>
            )}

            <button
              type="submit"
              className={`btn auth-submit-btn auth-submit-btn--${role}`}
              disabled={loading}
            >
              {loading ? (
                <span>🔄 Authenticating...</span>
              ) : isRegister ? (
                <span>✨ Create {role === 'caregiver' ? 'Caretaker' : 'Patient'} Account →</span>
              ) : (
                <span>🚪 Sign In as {role === 'caregiver' ? 'Caretaker' : 'Patient'} →</span>
              )}
            </button>
          </form>

          {/* Bottom Switcher */}
          <div className="auth-modal__switch">
            <span>
              {isRegister ? (t.alreadyHaveAccount || 'Already have an account?') : (t.dontHaveAccount || "Don't have an account yet?")}{' '}
            </span>
            <button
              type="button"
              className="auth-link-btn"
              onClick={() => handleTabSwitch(!isRegister)}
            >
              {isRegister ? (t.signIn || 'Sign In here') : (t.register || 'Create an account')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

