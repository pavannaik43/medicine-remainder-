import React, { useState, useEffect } from 'react';
import { playTestChime, toggleMute, isMuteEnabled } from '../utils/soundService';
import {
  IconPill,
  IconClock,
  IconBell,
  IconBellOff,
  IconPlus,
  IconCalendar,
  IconHistory,
  IconChart,
  IconShield,
  IconUser,
} from './Icons';

export default function Header({
  currentUser,
  activeTab,
  onTabChange,
  takenCount,
  totalCount,
  onAddClick,
  notificationPermission,
  onRequestNotification,
  currentLang,
  onLanguageChange,
  onOpenCaregiverAccess,
  onSwitchAccount,
  t = {},
}) {
  const [currentDateTime, setCurrentDateTime] = useState({
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    date: new Date().toLocaleDateString(currentLang === 'te' ? 'te-IN' : currentLang === 'hi' ? 'hi-IN' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  });
  const [muted, setMuted] = useState(isMuteEnabled());

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentDateTime({
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        date: now.toLocaleDateString(currentLang === 'te' ? 'te-IN' : currentLang === 'hi' ? 'hi-IN' : 'en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentLang]);

  const handleToggleMute = () => {
    const newMuteState = toggleMute();
    setMuted(newMuteState);
  };

  const allDone = totalCount > 0 && takenCount === totalCount;
  const isCaregiver = currentUser?.role === 'caregiver';

  return (
    <header className="app-header">
      {/* Top Brand, User Profile, Language Selector & Live Clock */}
      <div className="app-header__top-row">
        <div className="app-header__brand">
          <div className="brand-logo-badge">
            <IconPill size={24} />
          </div>
          <div>
            <div className="brand-title-wrap">
              <h1 className="brand-title">{t.appName || 'Medicine Reminder'}</h1>
            </div>
            <p className="app-header__subtitle">
              {isCaregiver
                ? (t.caregiverDashboardSubtitle || 'Caregiver Monitoring Center')
                : totalCount === 0
                ? (t.noRemindersYet || 'No medicines added yet.')
                : allDone
                ? (t.allDoneToday || 'All medicines taken for today!')
                : `${takenCount} ${t.of || 'of'} ${totalCount} ${t.dosesTakenToday || 'taken today'}`}
            </p>
          </div>
        </div>

        <div className="app-header__right-panel">
          {/* Current User Badge & Account Actions */}
          {currentUser && (
            <div className="header-user-pill">
              <span className={`user-role-badge user-role-badge--${currentUser.role}`}>
                {isCaregiver ? <IconShield size={13} /> : <IconUser size={13} />}
                {isCaregiver ? (t.caregiverRole || 'Caregiver') : (t.patientRole || 'Patient')}
              </span>
              <span className="user-name-text">{currentUser.name}</span>

              {!isCaregiver && (
                <button
                  type="button"
                  className="btn-header-action"
                  onClick={onOpenCaregiverAccess}
                  title={t.caregiverAccess || 'Caregiver Access'}
                >
                  <IconShield size={13} /> {t.caregiverAccess || 'Caregiver Access'}
                </button>
              )}

              <button
                type="button"
                className="btn-header-action btn-header-action--switch"
                onClick={onSwitchAccount}
                title={t.logout || 'Switch / Logout'}
              >
                {t.logout || 'Switch'}
              </button>
            </div>
          )}

          {/* Language Selector */}
          <div className="language-selector-wrap" title="Choose language / భాష / भाषा">
            <span className="language-globe-icon">🌐</span>
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

          {/* Live Clock */}
          <div className="system-clock-card">
            <div className="system-clock-item">
              <IconClock size={16} className="text-primary" />
              <span className="system-clock-time">{currentDateTime.time}</span>
            </div>
            <div className="system-clock-divider"></div>
            <div className="system-clock-item text-muted">
              <IconCalendar size={14} />
              <span className="system-clock-date">{currentDateTime.date}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="app-nav-tabs">
        {isCaregiver ? (
          <button
            type="button"
            className={`nav-tab ${activeTab === 'caregiver' ? 'nav-tab--active' : ''}`}
            onClick={() => onTabChange('caregiver')}
          >
            <IconShield size={17} />
            <span>{t.tabCaregiverView || 'Caregiver Monitor'}</span>
          </button>
        ) : (
          <button
            type="button"
            className={`nav-tab ${activeTab === 'schedule' ? 'nav-tab--active' : ''}`}
            onClick={() => onTabChange('schedule')}
          >
            <IconCalendar size={17} />
            <span>{t.tabSchedule || "Today's Medicines"}</span>
            {totalCount > 0 && (
              <span className="nav-tab__pill">
                {takenCount}/{totalCount}
              </span>
            )}
          </button>
        )}

        <button
          type="button"
          className={`nav-tab ${activeTab === 'history' ? 'nav-tab--active' : ''}`}
          onClick={() => onTabChange('history')}
        >
          <IconHistory size={17} />
          <span>{t.tabHistory || 'History & Log'}</span>
        </button>

        <button
          type="button"
          className={`nav-tab ${activeTab === 'analytics' ? 'nav-tab--active' : ''}`}
          onClick={() => onTabChange('analytics')}
        >
          <IconChart size={17} />
          <span>{t.tabAnalytics || 'Progress & Stock'}</span>
        </button>
      </div>

      {/* Control Utility Toolbar */}
      <div className="app-header__controls">
        <div className="app-header__alarm-tools">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={playTestChime}
            title={t.testAlarm || 'Test Alarm'}
          >
            <IconBell size={15} /> {t.testAlarm || 'Test Alarm'}
          </button>

          <button
            type="button"
            className={`btn btn--secondary btn--sm ${muted ? 'btn--muted' : ''}`}
            onClick={handleToggleMute}
            title={muted ? (t.muted || 'Muted') : (t.soundOn || 'Sound On')}
          >
            {muted ? <IconBellOff size={15} /> : <IconBell size={15} />}
            {muted ? (t.muted || 'Muted') : (t.soundOn || 'Sound On')}
          </button>

          {notificationPermission !== 'granted' && (
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={onRequestNotification}
              title={t.enableNotifications || 'Enable Alerts'}
            >
              <IconBell size={15} /> {t.enableNotifications || 'Enable Alerts'}
            </button>
          )}
        </div>

        {!isCaregiver && (
          <button
            type="button"
            className="btn btn--primary"
            onClick={onAddClick}
            title={t.addMedicine || 'Add Medicine'}
          >
            <IconPlus size={16} /> {t.addMedicine || 'Add Medicine'}
          </button>
        )}
      </div>
    </header>
  );
}
