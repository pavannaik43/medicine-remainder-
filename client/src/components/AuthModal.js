import React, { useState } from 'react';
import { IconShield, IconUser, IconGlobe } from './Icons';
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
  const [relationship, setRelationship] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isRegister ? `${API_AUTH}/register` : `${API_AUTH}/login`;
    const payload = isRegister
      ? { name, email, password, role, relationship }
      : { email, password, role };

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
        if (text.includes('Proxy error') || res.status === 504 || res.status === 502) {
          throw new Error('Backend server is not running on port 5000. Please start the server in a second terminal.');
        }
        throw new Error(text || 'Server returned an invalid response');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (demoRole) => {
    if (demoRole === 'patient') {
      setEmail('patient@demo.com');
      setPassword('password123');
      setRole('patient');
      setIsRegister(false);
      onLogin({
        id: 'patient-1',
        name: 'Ramesh Kumar (Patient)',
        email: 'patient@demo.com',
        role: 'patient',
        pairingCode: 'MED-7842',
        connectedCaregivers: [
          {
            id: 'caregiver-1',
            name: 'Priya Sharma (Caregiver)',
            email: 'caregiver@demo.com',
            relationship: 'Family Member / Daughter',
          },
        ],
      });
    } else {
      setEmail('caregiver@demo.com');
      setPassword('password123');
      setRole('caregiver');
      setIsRegister(false);
      onLogin({
        id: 'caregiver-1',
        name: 'Priya Sharma (Caregiver)',
        email: 'caregiver@demo.com',
        role: 'caregiver',
        connectedPatients: [
          {
            id: 'patient-1',
            name: 'Ramesh Kumar (Patient)',
            email: 'patient@demo.com',
            pairingCode: 'MED-7842',
            relationship: 'Father',
          },
        ],
      });
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
          <h2 id="auth-title" className="auth-modal__heading">
            {isRegister ? (t.registerBtn || 'Create Account') : (t.loginTitle || 'Welcome to Medicine Reminder')}
          </h2>
          <p className="auth-modal__subheading">
            {t.loginSubtitle || 'Choose your account or register to manage your medicines'}
          </p>

          {/* Role Toggle Selector */}
          <div className="auth-role-selector">
            <button
              type="button"
              className={`auth-role-btn ${role === 'patient' ? 'auth-role-btn--active' : ''}`}
              onClick={() => setRole('patient')}
            >
              <IconUser size={18} />
              <span>{t.patientRole || 'Patient'}</span>
            </button>
            <button
              type="button"
              className={`auth-role-btn ${role === 'caregiver' ? 'auth-role-btn--active' : ''}`}
              onClick={() => setRole('caregiver')}
            >
              <IconShield size={18} />
              <span>{t.caregiverRole || 'Caregiver'}</span>
            </button>
          </div>

          {/* Quick Demo 1-Click Buttons */}
          <div className="auth-demo-section">
            <span className="auth-demo-title">{t.demoAccounts || 'Quick Demo Logins:'}</span>
            <div className="auth-demo-btns">
              <button
                type="button"
                className="btn btn--outline btn--sm auth-demo-pill"
                onClick={() => handleQuickDemoLogin('patient')}
              >
                {t.demoPatientBtn || '👤 Demo Patient (Ramesh)'}
              </button>
              <button
                type="button"
                className="btn btn--outline btn--sm auth-demo-pill"
                onClick={() => handleQuickDemoLogin('caregiver')}
              >
                {t.demoCaregiverBtn || '🛡️ Demo Caregiver (Priya)'}
              </button>
            </div>
          </div>

          <div className="auth-divider">
            <span>or continue with email</span>
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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
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
                ⚠️ {error}
              </div>
            )}

            <button type="submit" className="btn btn--primary auth-submit-btn" disabled={loading}>
              {loading ? 'Please wait...' : isRegister ? (t.registerBtn || 'Create Account') : (t.loginBtn || 'Log In')}
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
              }}
            >
              {isRegister ? (t.signIn || 'Sign In') : (t.register || 'Register')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
