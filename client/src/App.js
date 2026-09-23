import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import './App.css';
import Header from './components/Header';
import ReminderCard from './components/ReminderCard';
import ReminderForm from './components/ReminderForm';
import EmptyState from './components/EmptyState';
import HistorySection from './components/HistorySection';
import AnalyticsSection from './components/AnalyticsSection';
import AsNeededSection from './components/AsNeededSection';
import AlarmModal from './components/AlarmModal';
import AuthModal from './components/AuthModal';
import CaregiverView from './components/CaregiverView';
import CaregiverAccessModal from './components/CaregiverAccessModal';
import { PERIODS, getPeriod } from './timeOfDay';
import { startAlarm, stopAlarm, unlockAudio } from './utils/soundService';
import { getTranslation } from './utils/translations';
import { API_REMININDERS as API_BASE, API_HISTORY as HISTORY_API_BASE, API_PATIENT, API_AUTH } from './config/api';

function isReminderScheduledForDate(reminder, date) {
  const dayOfWeek = date.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
  const freq = reminder.frequency || 'Every day';

  if (freq === 'As needed') {
    return false; // Handled separately in PRN section
  }

  if (freq === 'Every day' || freq === 'Twice a day' || freq === '3 times a day' || freq === '4 times a day') {
    return true;
  }

  if (freq === 'Weekdays only') {
    return dayOfWeek >= 1 && dayOfWeek <= 5;
  }

  if (freq === 'Weekends only') {
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  if (freq === 'Specific days') {
    return Array.isArray(reminder.daysOfWeek) ? reminder.daysOfWeek.includes(dayOfWeek) : true;
  }

  if (freq === 'Every other day') {
    const created = new Date(reminder.createdAt || Date.now());
    const diffDays = Math.floor((date.setHours(0,0,0,0) - new Date(created).setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
    return Math.abs(diffDays) % 2 === 0;
  }

  return true;
}

export default function App() {
  // Language State
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem('app_lang') || 'en';
  });
  const t = useMemo(() => getTranslation(currentLang), [currentLang]);

  const handleLanguageChange = (newLang) => {
    setCurrentLang(newLang);
    try {
      localStorage.setItem('app_lang', newLang);
    } catch (e) {}
  };

  // User Auth & Role State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('app_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [caregiverAccessModalOpen, setCaregiverAccessModalOpen] = useState(false);
  const [targetPatientId, setTargetPatientId] = useState(null);
  const [caregiverReloadKey, setCaregiverReloadKey] = useState(0);

  // Active Tab
  const [activeTab, setActiveTab] = useState(() => {
    return currentUser?.role === 'caregiver' ? 'caregiver' : 'schedule';
  });

  const [reminders, setReminders] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [toast, setToast] = useState('');

  // Active Alarm state (holds the doseItem ringing)
  const [activeAlarmDose, setActiveAlarmDose] = useState(null);
  const [, setSnoozedList] = useState([]); // [{ doseId, triggerTime, doseItem }]
  const [notificationPermission, setNotificationPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  const firedMinutesRef = useRef(new Set());

  // Load reminders and history for current user (or all if caregiver) and sync user profile
  const loadData = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const patientParam = currentUser?.role === 'patient' ? `?patientId=${currentUser.id}` : '';
      const [resReminders, resHistory, resUser] = await Promise.all([
        fetch(`${API_BASE}${patientParam}`),
        fetch(`${HISTORY_API_BASE}${patientParam}`),
        fetch(`${API_AUTH}/users/${currentUser.id}`),
      ]);

      if (!resReminders.ok) throw new Error('Failed to load reminders');
      const dataReminders = await resReminders.json();
      setReminders(dataReminders);

      if (resHistory.ok) {
        const dataHistory = await resHistory.json();
        setHistory(dataHistory);
      }

      if (resUser.ok) {
        const freshUser = await resUser.json();
        if (freshUser && freshUser.id) {
          setCurrentUser(freshUser);
          try {
            localStorage.setItem('app_user', JSON.stringify(freshUser));
          } catch (e) {}
        }
      }
      setLoadError('');
    } catch (err) {
      setLoadError('Could not connect to the medication API server.');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Request browser desktop notification permission
  const handleRequestNotificationPermission = async () => {
    unlockAudio();
    if (!('Notification' in window)) {
      setToast('Desktop notifications are not supported in this browser');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        setToast('🔔 Desktop notifications active');
        new Notification('Medicine Reminder', {
          body: 'Alerts enabled. You will receive notifications when medication is due.',
        });
      } else {
        setToast('Notification permission was denied');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Trigger an alarm for a specific dose item
  const triggerAlarm = useCallback((doseItem) => {
    setActiveAlarmDose(doseItem);
    startAlarm();

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(`⏰ Medicine Alert: ${doseItem.name}`, {
          body: `${doseItem.dosage ? `${doseItem.dosage} · ` : ''}${doseItem.time} (${doseItem.doseLabel})\n${
            doseItem.notes || 'Please take your scheduled medicine now.'
          }`,
          tag: doseItem.doseId,
          requireInteraction: true,
        });
        notif.onclick = () => {
          window.focus();
        };
      } catch (e) {
        console.error('Notification error:', e);
      }
    }
  }, []);

  // Compute today's active dose items
  const todayDateStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const { todayDoses, prnReminders } = useMemo(() => {
    const today = new Date();
    const doses = [];
    const prn = [];

    reminders.forEach((r) => {
      if (r.frequency === 'As needed') {
        prn.push(r);
        return;
      }

      if (isReminderScheduledForDate(r, today)) {
        const times = Array.isArray(r.times) && r.times.length > 0 ? r.times : [r.time || '08:00'];
        const takenDoseIndices = r.takenDoses?.[todayDateStr] || [];

        times.forEach((tVal, idx) => {
          doses.push({
            doseId: `${r.id}-dose-${idx}`,
            reminderId: r.id,
            name: r.name,
            dosage: r.dosage,
            time: tVal,
            doseIndex: idx,
            totalDoses: times.length,
            doseLabel: times.length > 1 ? `Dose ${idx + 1} of ${times.length}` : 'Daily Dose',
            frequency: r.frequency,
            notes: r.notes,
            stock: r.stock,
            image: r.image,
            taken: takenDoseIndices.includes(idx),
            reminder: r,
          });
        });
      }
    });

    return { todayDoses: doses, prnReminders: prn };
  }, [reminders, todayDateStr]);

  // Background timer checking active doses and snoozes
  useEffect(() => {
    const checkTimer = setInterval(() => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentHHMM = `${hours}:${minutes}`;
      const currentTimeKey = `${todayDateStr}-${currentHHMM}`;

      todayDoses.forEach((d) => {
        if (!d.taken && d.time === currentHHMM) {
          const fireKey = `${d.doseId}-${currentTimeKey}`;
          if (!firedMinutesRef.current.has(fireKey)) {
            firedMinutesRef.current.add(fireKey);
            triggerAlarm(d);
          }
        }
      });

      const nowTimestamp = Date.now();
      setSnoozedList((prevSnoozed) => {
        const remaining = [];
        prevSnoozed.forEach((item) => {
          if (nowTimestamp >= item.triggerTime) {
            const currentDose = todayDoses.find((d) => d.doseId === item.doseId) || item.doseItem;
            if (!currentDose.taken) {
              triggerAlarm(currentDose);
            }
          } else {
            remaining.push(item);
          }
        });
        return remaining;
      });
    }, 1000);

    return () => clearInterval(checkTimer);
  }, [todayDoses, todayDateStr, triggerAlarm]);

  // Group today's doses by time of day
  const groupedDoses = useMemo(() => {
    const map = Object.fromEntries(PERIODS.map((p) => [p.key, []]));
    [...todayDoses]
      .sort((a, b) => a.time.localeCompare(b.time))
      .forEach((d) => {
        map[getPeriod(d.time).key].push(d);
      });
    return map;
  }, [todayDoses]);

  const takenDosesCount = todayDoses.filter((d) => d.taken).length;

  // Toggle dose taken status (Standard On-Time TAKEN)
  async function handleToggleDoseTaken(doseItem) {
    const { reminderId, doseIndex, taken, name, dosage, time, doseLabel, reminder } = doseItem;
    const nextTaken = !taken;

    if (activeAlarmDose && activeAlarmDose.doseId === doseItem.doseId) {
      stopAlarm();
      setActiveAlarmDose(null);
    }

    const prevTakenDoses = reminder.takenDoses?.[todayDateStr] || [];
    let updatedIndices = nextTaken
      ? [...prevTakenDoses, doseIndex]
      : prevTakenDoses.filter((i) => i !== doseIndex);

    setReminders((prev) =>
      prev.map((r) => {
        if (r.id === reminderId) {
          const updatedTakenDoses = { ...(r.takenDoses || {}), [todayDateStr]: updatedIndices };
          const newStock = nextTaken && typeof r.stock === 'number' && r.stock > 0 ? r.stock - 1 : r.stock;
          return { ...r, takenDoses: updatedTakenDoses, stock: newStock };
        }
        return r;
      })
    );

    if (nextTaken) {
      const newLog = {
        id: `hist-${Date.now()}`,
        patientId: currentUser?.id || 'patient-1',
        reminderId,
        name,
        dosage: dosage || '',
        time,
        doseLabel,
        takenAt: new Date().toISOString(),
        status: 'taken',
        notes: reminder.notes || '',
      };
      setHistory((prev) => [newLog, ...prev]);
      setToast(`✓ ${name} logged as TAKEN`);
    } else {
      setToast(`${name} set to PENDING`);
    }

    try {
      await fetch(`${API_BASE}/${reminderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          takenDoses: { ...(reminder.takenDoses || {}), [todayDateStr]: updatedIndices },
          logDose: nextTaken ? { time, doseLabel, status: 'taken' } : undefined,
        }),
      });
    } catch (err) {
      loadData();
      setToast('Could not sync with server');
    }
  }

  // Demonstration Simulation Handler: TAKEN, TAKEN LATE, or MISSED
  const handleSimulateStatus = async (doseItemOrMed, status) => {
    const reminderId = doseItemOrMed.reminderId || doseItemOrMed.id;
    const name = doseItemOrMed.name;
    const dosage = doseItemOrMed.dosage || '';
    const time = doseItemOrMed.time || '08:00';
    const doseLabel = doseItemOrMed.doseLabel || 'Scheduled Dose';

    let delayMinutes = 0;
    if (status === 'taken_late') delayMinutes = 45;

    // Create history entry
    const newLog = {
      id: `hist-${Date.now()}`,
      patientId: currentUser?.id || 'patient-1',
      reminderId,
      name,
      dosage,
      time,
      doseLabel,
      takenAt: new Date().toISOString(),
      status, // 'taken' | 'taken_late' | 'missed'
      delayMinutes,
      notes: status === 'taken_late' ? 'Confirmed taking with 45m delay' : status === 'missed' ? 'Dose unconfirmed by patient' : 'Taken on time',
    };

    setHistory((prev) => [newLog, ...prev]);

    // Update reminder taken status if taken or late
    if (status !== 'missed') {
      setReminders((prev) =>
        prev.map((r) => {
          if (r.id === reminderId) {
            const currentIndices = r.takenDoses?.[todayDateStr] || [];
            const newStock = typeof r.stock === 'number' && r.stock > 0 ? r.stock - 1 : r.stock;
            return {
              ...r,
              takenDoses: { ...(r.takenDoses || {}), [todayDateStr]: [...new Set([...currentIndices, 0])] },
              stock: newStock,
            };
          }
          return r;
        })
      );
    }

    try {
      await fetch(HISTORY_API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog),
      });

      if (status === 'taken') {
        setToast(`✓ ${name} marked as TAKEN (On-Time)`);
      } else if (status === 'taken_late') {
        setToast(`⏱ ${name} recorded as TAKEN LATE (~45m delay)`);
      } else if (status === 'missed') {
        setToast(`⚠️ ${name} recorded as MISSED DOSE — Caregiver Alert triggered!`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Alarm Actions
  const handleAlarmTake = async (doseItem) => {
    stopAlarm();
    setActiveAlarmDose(null);
    setSnoozedList((prev) => prev.filter((s) => s.doseId !== doseItem.doseId));
    await handleToggleDoseTaken(doseItem);
  };

  const handleAlarmSnooze = (doseItem, minutes = 5) => {
    stopAlarm();
    setActiveAlarmDose(null);
    const triggerTime = Date.now() + minutes * 60 * 1000;
    setSnoozedList((prev) => [
      ...prev.filter((s) => s.doseId !== doseItem.doseId),
      { doseId: doseItem.doseId, triggerTime, doseItem },
    ]);
    setToast(`⏱ Alarm for ${doseItem.name} snoozed for ${minutes} min`);
  };

  const handleAlarmDismiss = (doseItem) => {
    stopAlarm();
    setActiveAlarmDose(null);
    setToast(`Alarm for ${doseItem.name} dismissed`);
  };

  // Log PRN / As Needed Dose Taken
  const handleLogPrnDose = async (med) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newLog = {
      id: `hist-${Date.now()}`,
      patientId: currentUser?.id || 'patient-1',
      reminderId: med.id,
      name: med.name,
      dosage: med.dosage || '',
      time: timeNow,
      doseLabel: 'As Needed (PRN)',
      takenAt: new Date().toISOString(),
      status: 'taken',
      notes: med.notes || '',
    };
    setHistory((prev) => [newLog, ...prev]);

    setReminders((prev) =>
      prev.map((r) =>
        r.id === med.id && typeof r.stock === 'number' && r.stock > 0
          ? { ...r, stock: r.stock - 1 }
          : r
      )
    );
    setToast(`✓ Extra dose of ${med.name} recorded`);

    try {
      await fetch(HISTORY_API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog),
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Save/Create Reminder
  async function handleSaveReminder(form) {
    try {
      const effectivePatientId =
        targetPatientId || (currentUser?.role === 'patient' ? currentUser.id : 'patient-1');
      const payload = {
        ...form,
        patientId: effectivePatientId,
      };

      if (editingReminder) {
        const res = await fetch(`${API_BASE}/${editingReminder.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        setReminders((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        setToast('Medicine updated');
      } else {
        const res = await fetch(API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        const created = await res.json();
        setReminders((prev) => [...prev, created]);
        setToast('Medicine added to schedule');
      }
      setCaregiverReloadKey((k) => k + 1);
      closeForm();
    } catch (err) {
      setToast('Something went wrong saving the medicine');
    }
  }

  // Delete Reminder
  async function handleDeleteReminder(reminder) {
    const confirmed = window.confirm(`Remove ${reminder.name} from schedule?`);
    if (!confirmed) return;
    if (activeAlarmDose && activeAlarmDose.reminderId === reminder.id) {
      stopAlarm();
      setActiveAlarmDose(null);
    }
    const prevReminders = reminders;
    setReminders((prev) => prev.filter((r) => r.id !== reminder.id));
    try {
      const res = await fetch(`${API_BASE}/${reminder.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setToast(`${reminder.name} removed`);
      setCaregiverReloadKey((k) => k + 1);
    } catch (err) {
      setReminders(prevReminders);
      setToast('Could not delete medicine');
    }
  }

  async function handleDeleteHistoryEntry(id) {
    setHistory((prev) => prev.filter((h) => h.id !== id));
    try {
      await fetch(`${HISTORY_API_BASE}/${id}`, { method: 'DELETE' });
      setToast('Log entry removed');
    } catch (e) {
      console.error(e);
    }
  }

  async function handleClearHistory() {
    const confirmed = window.confirm('Are you sure you want to clear all history records?');
    if (!confirmed) return;
    setHistory([]);
    try {
      const patientParam = currentUser?.role === 'patient' ? `?patientId=${currentUser.id}` : '';
      await fetch(`${HISTORY_API_BASE}${patientParam}`, { method: 'DELETE' });
      setToast('History cleared');
    } catch (e) {
      console.error(e);
    }
  }

  // Revoke / Remove Caregiver Access
  const handleRevokeCaregiver = async (caregiverId) => {
    const confirmed = window.confirm(
      t.confirmRemoveAccess || 'Are you sure you want to remove this caregiver?'
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_PATIENT}/caregivers/${caregiverId}?patientId=${currentUser.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        const updatedCaregivers = (currentUser.connectedCaregivers || []).filter(
          (c) => c.id !== caregiverId
        );
        const updatedUser = { ...currentUser, connectedCaregivers: updatedCaregivers };
        setCurrentUser(updatedUser);
        localStorage.setItem('app_user', JSON.stringify(updatedUser));
        setToast(t.caregiverRemovedSuccess || 'Caregiver access has been removed.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Auth Modal Handlers
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('app_user', JSON.stringify(user));
    } catch (e) {}
    setActiveTab(user.role === 'caregiver' ? 'caregiver' : 'schedule');
    setAuthModalOpen(false);
    setToast(`Logged in as ${user.name}`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('app_user');
    } catch (e) {}
    setActiveTab('schedule');
    setAuthModalOpen(false);
    setToast('Logged out successfully');
  };

  function openAddForm() {
    unlockAudio();
    setTargetPatientId(null);
    setEditingReminder(null);
    setFormOpen(true);
  }

  function openEditForm(reminder) {
    unlockAudio();
    setTargetPatientId(null);
    setEditingReminder(reminder);
    setFormOpen(true);
  }

  // Caregiver-specific medicine actions for connected patients
  const handleCaregiverAddMedicine = (patientId) => {
    unlockAudio();
    setTargetPatientId(patientId);
    setEditingReminder(null);
    setFormOpen(true);
  };

  const handleCaregiverEditMedicine = (reminder, patientId) => {
    unlockAudio();
    setTargetPatientId(patientId);
    setEditingReminder(reminder);
    setFormOpen(true);
  };

  const handleCaregiverDeleteMedicine = async (reminder, patientId) => {
    await handleDeleteReminder(reminder);
    setCaregiverReloadKey((k) => k + 1);
  };

  function closeForm() {
    setFormOpen(false);
    setEditingReminder(null);
    setTargetPatientId(null);
  }

  // FIRST SCREEN: If user is not logged in, present the full-screen Login / Register Gateway
  if (!currentUser) {
    return (
      <div className="app auth-gateway-screen" onClick={unlockAudio}>
        <AuthModal
          isGateway={true}
          onLogin={handleLoginSuccess}
          currentLang={currentLang}
          onLanguageChange={handleLanguageChange}
          t={t}
        />
        <div className={`toast ${toast ? 'toast--visible' : ''}`} role="status" aria-live="polite">
          {toast}
        </div>
      </div>
    );
  }

  const isCaregiver = currentUser?.role === 'caregiver';

  return (
    <div className="app" onClick={unlockAudio}>
      <div className="app__container">
        <Header
          currentUser={currentUser}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          takenCount={takenDosesCount}
          totalCount={todayDoses.length}
          onAddClick={openAddForm}
          notificationPermission={notificationPermission}
          onRequestNotification={handleRequestNotificationPermission}
          currentLang={currentLang}
          onLanguageChange={handleLanguageChange}
          onOpenCaregiverAccess={() => setCaregiverAccessModalOpen(true)}
          onSwitchAccount={() => setAuthModalOpen(true)}
          onLogout={handleLogout}
          t={t}
        />

        {loading && <p className="status-text">Loading...</p>}
        {!loading && loadError && <p className="status-text status-text--error">{loadError}</p>}

        {/* Tab: Caregiver Monitor View */}
        {!loading && !loadError && (activeTab === 'caregiver' || isCaregiver) && (
          <CaregiverView
            currentUser={currentUser}
            onSimulateStatus={handleSimulateStatus}
            onAddMedicine={handleCaregiverAddMedicine}
            onEditMedicine={handleCaregiverEditMedicine}
            onDeleteMedicine={handleCaregiverDeleteMedicine}
            reloadTrigger={caregiverReloadKey}
            t={t}
          />
        )}

        {/* Tab 1: Patient Today's Schedule */}
        {!loading && !loadError && activeTab === 'schedule' && !isCaregiver && (
          <>
            {todayDoses.length === 0 && prnReminders.length === 0 ? (
              <EmptyState onAddClick={openAddForm} t={t} />
            ) : (
              <div className="periods">
                {PERIODS.map((period) => {
                  const items = groupedDoses[period.key];
                  if (items.length === 0) return null;
                  const localizedPeriodLabel = t[period.labelKey] || period.defaultLabel;
                  return (
                    <section key={period.key} className="period-section" aria-labelledby={`heading-${period.key}`}>
                      <div className="period-section__header">
                        <h2 id={`heading-${period.key}`} className="period-section__heading">
                          <span aria-hidden="true" className="period-icon">{period.icon}</span> {localizedPeriodLabel}
                        </h2>
                        <span className="period-section__count">{items.length} {t.dosesTakenToday ? '' : 'doses'}</span>
                      </div>
                      <ul className="reminder-list">
                        {items.map((doseItem) => (
                          <ReminderCard
                            key={doseItem.doseId}
                            doseItem={doseItem}
                            period={period}
                            isRinging={activeAlarmDose && activeAlarmDose.doseId === doseItem.doseId}
                            onToggleTaken={handleToggleDoseTaken}
                            onSimulateStatus={handleSimulateStatus}
                            onEdit={openEditForm}
                            onDelete={handleDeleteReminder}
                            onTriggerAlarm={triggerAlarm}
                            t={t}
                          />
                        ))}
                      </ul>
                    </section>
                  );
                })}

                {/* As-Needed Section */}
                <AsNeededSection
                  prnReminders={prnReminders}
                  onLogPrnDose={handleLogPrnDose}
                  onEdit={openEditForm}
                  onDelete={handleDeleteReminder}
                  t={t}
                />
              </div>
            )}
          </>
        )}

        {/* Tab 2: History Log */}
        {!loading && !loadError && activeTab === 'history' && (
          <HistorySection
            history={history}
            onDeleteEntry={handleDeleteHistoryEntry}
            onClearHistory={handleClearHistory}
            t={t}
          />
        )}

        {/* Tab 3: Progress & Stock */}
        {!loading && !loadError && activeTab === 'analytics' && (
          <AnalyticsSection reminders={reminders} history={history} t={t} />
        )}
      </div>

      {formOpen && (
        <ReminderForm
          initialValue={editingReminder}
          onSave={handleSaveReminder}
          onClose={closeForm}
          t={t}
        />
      )}

      {activeAlarmDose && (
        <AlarmModal
          doseItem={activeAlarmDose}
          onTake={handleAlarmTake}
          onSnooze={handleAlarmSnooze}
          onDismiss={handleAlarmDismiss}
          t={t}
        />
      )}

      {authModalOpen && (
        <AuthModal
          onLogin={handleLoginSuccess}
          onClose={() => setAuthModalOpen(false)}
          currentLang={currentLang}
          onLanguageChange={handleLanguageChange}
          t={t}
        />
      )}

      {caregiverAccessModalOpen && (
        <CaregiverAccessModal
          currentUser={currentUser}
          onClose={() => setCaregiverAccessModalOpen(false)}
          onRevokeCaregiver={handleRevokeCaregiver}
          onUpdateUser={(updated) => {
            setCurrentUser(updated);
            try {
              localStorage.setItem('app_user', JSON.stringify(updated));
            } catch (e) {}
          }}
          t={t}
        />
      )}

      <div className={`toast ${toast ? 'toast--visible' : ''}`} role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  );
}
