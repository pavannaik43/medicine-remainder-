import React, { useState, useEffect, useCallback } from 'react';
import {
  IconShield,
  IconUser,
  IconPill,
  IconClock,
  IconCheck,
  IconPlus,
} from './Icons';
import { API_CAREGIVER } from '../config/api';

export default function CaregiverView({
  currentUser,
  onSimulateStatus,
  t = {},
}) {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pairingModalOpen, setPairingModalOpen] = useState(false);
  const [pairingCodeInput, setPairingCodeInput] = useState('');
  const [relationshipInput, setRelationshipInput] = useState('');
  const [pairingError, setPairingError] = useState('');
  const [pairingSuccess, setPairingSuccess] = useState('');

  const loadPatients = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_CAREGIVER}/patients?caregiverId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
        if (data.length > 0 && !selectedPatientId) {
          setSelectedPatientId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, selectedPatientId]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const handleConnectPatient = async (e) => {
    e.preventDefault();
    setPairingError('');
    setPairingSuccess('');

    if (!pairingCodeInput.trim()) {
      setPairingError('Please enter a valid Patient Pairing Code.');
      return;
    }

    try {
      const res = await fetch(`${API_CAREGIVER}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caregiverId: currentUser.id,
          pairingCode: pairingCodeInput.trim(),
          relationship: relationshipInput.trim() || 'Family Care',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to connect patient');
      }

      setPairingSuccess(`✓ Successfully connected to ${data.patient.name}!`);
      setPairingCodeInput('');
      setRelationshipInput('');
      await loadPatients();
      setTimeout(() => {
        setPairingModalOpen(false);
        setPairingSuccess('');
      }, 1200);
    } catch (err) {
      setPairingError(err.message);
    }
  };

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  // Derive Alerts for Caregiver
  const allAlerts = [];
  patients.forEach((pat) => {
    (pat.history || []).forEach((h) => {
      if (h.status === 'missed') {
        allAlerts.push({
          type: 'missed',
          patientName: pat.name,
          medicineName: h.name,
          time: h.time,
          timestamp: h.takenAt,
        });
      } else if (h.status === 'taken_late') {
        allAlerts.push({
          type: 'late',
          patientName: pat.name,
          medicineName: h.name,
          time: h.time,
          timestamp: h.takenAt,
          delayMinutes: h.delayMinutes || 45,
        });
      }
    });
  });

  return (
    <div className="caregiver-dashboard">
      {/* Header */}
      <div className="section-header">
        <div className="section-header__title-group">
          <div className="section-icon-badge modal__icon-badge--shield">
            <IconShield size={22} />
          </div>
          <div>
            <h2 className="section-title">{t.caregiverDashboardTitle || 'Caregiver Monitoring Center'}</h2>
            <p className="section-subtitle">
              {t.caregiverDashboardSubtitle ||
                'Live health status, adherence tracking, and dose alerts for your connected patients'}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={() => setPairingModalOpen(true)}
        >
          <IconPlus size={16} /> {t.connectNewPatient || '+ Connect Patient'}
        </button>
      </div>

      {loading && <p className="status-text">Loading patient records…</p>}

      {/* Critical Caregiver Alerts Banner */}
      {allAlerts.length > 0 ? (
        <div className="caregiver-alerts-panel">
          <div className="caregiver-alerts-header">
            <span className="caregiver-alerts-title">{t.caregiverAlertsTitle || '⚠️ Critical Caregiver Alerts'}</span>
            <span className="badge badge--danger">{allAlerts.length} alert{allAlerts.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="caregiver-alerts-list">
            {allAlerts.slice(0, 4).map((alert, i) => (
              <div
                key={i}
                className={`caregiver-alert-item ${
                  alert.type === 'missed' ? 'caregiver-alert-item--missed' : 'caregiver-alert-item--late'
                }`}
              >
                <div className="alert-item-icon">
                  {alert.type === 'missed' ? '🔴' : '🟡'}
                </div>
                <div className="alert-item-content">
                  <strong>{alert.patientName}: </strong>
                  {alert.type === 'missed' ? (
                    <span>
                      {t.missedAlertText || 'MISSED DOSE ALERT: Patient did not confirm scheduled medicine on time!'} (
                      <strong>{alert.medicineName}</strong> at {alert.time})
                    </span>
                  ) : (
                    <span>
                      {t.lateAlertText || 'LATE DOSE: Patient confirmed taking medicine with delay.'} (
                      <strong>{alert.medicineName}</strong> taken with ~{alert.delayMinutes}m delay)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="caregiver-all-clear-banner">
          <span>{t.allMedsOnTrack || '✓ All connected patients are up-to-date with their medicines!'}</span>
        </div>
      )}

      {/* Patient Selector Tabs */}
      {patients.length > 0 && (
        <div className="patient-selector-tabs">
          {patients.map((pat) => (
            <button
              key={pat.id}
              type="button"
              className={`patient-tab ${selectedPatient?.id === pat.id ? 'patient-tab--active' : ''}`}
              onClick={() => setSelectedPatientId(pat.id)}
            >
              <IconUser size={16} />
              <div className="patient-tab-info">
                <strong>{pat.name}</strong>
                <span>Code: {pat.pairingCode || 'MED-7842'}</span>
              </div>
              {pat.stats?.missedCount > 0 && (
                <span className="badge badge--danger badge--pulse">{pat.stats.missedCount} Missed</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Selected Patient Live View */}
      {selectedPatient ? (
        <div className="caregiver-patient-details">
          {/* Top KPI Cards for Connected Patient */}
          <div className="analytics-grid">
            <div className="analytics-card">
              <div className="analytics-card__header">
                <span className="analytics-card__title">Connected Patient</span>
                <span className="badge badge--info">{selectedPatient.relationship || 'Family'}</span>
              </div>
              <div className="analytics-card__main-stat">
                <span className="analytics-card__name-large">{selectedPatient.name}</span>
              </div>
              <p className="analytics-card__desc">Pairing Code: <strong>{selectedPatient.pairingCode}</strong></p>
            </div>

            <div className="analytics-card">
              <div className="analytics-card__header">
                <span className="analytics-card__title">{t.weeklyAdherenceRate || 'Weekly Adherence Rate'}</span>
                <span className="badge badge--success">Verified</span>
              </div>
              <div className="analytics-card__main-stat">
                <span className="analytics-card__number">
                  {selectedPatient.stats?.missedCount > 0
                    ? Math.max(60, 100 - selectedPatient.stats.missedCount * 15)
                    : 100}%
                </span>
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${
                      selectedPatient.stats?.missedCount > 0
                        ? Math.max(60, 100 - selectedPatient.stats.missedCount * 15)
                        : 100
                    }%`,
                  }}
                ></div>
              </div>
              <p className="analytics-card__desc">
                {selectedPatient.stats?.missedCount === 0
                  ? 'Excellent routine compliance this week.'
                  : `${selectedPatient.stats.missedCount} missed dose(s) logged recently.`}
              </p>
            </div>

            <div className="analytics-card">
              <div className="analytics-card__header">
                <span className="analytics-card__title">Scheduled Medicines</span>
                <span className="badge badge--neutral">{selectedPatient.reminders?.length || 0} active</span>
              </div>
              <div className="analytics-card__main-stat">
                <span className="analytics-card__number">{selectedPatient.stats?.todayTakenCount || 0}</span>
                <span className="analytics-card__unit">{t.dosesTakenToday || 'taken today'}</span>
              </div>
              <p className="analytics-card__desc">Monitored live by caregiver.</p>
            </div>
          </div>

          {/* Connected Patient Today's Schedule with Live Status */}
          <div className="caregiver-patient-section">
            <div className="section-header">
              <h3 className="section-title">
                {selectedPatient.name}'s Medicines & Today's Status
              </h3>
            </div>

            {(!selectedPatient.reminders || selectedPatient.reminders.length === 0) ? (
              <div className="empty-state empty-state--compact">
                <IconPill size={36} />
                <p>No active medicines scheduled for this patient.</p>
              </div>
            ) : (
              <div className="caregiver-meds-list">
                {selectedPatient.reminders.map((med) => {
                  // Check status in today's history
                  const latestLog = (selectedPatient.history || []).find((h) => h.reminderId === med.id);
                  let currentStatus = 'pending';
                  if (latestLog) {
                    currentStatus = latestLog.status; // 'taken' | 'taken_late' | 'missed'
                  } else if (med.taken) {
                    currentStatus = 'taken';
                  }

                  return (
                    <div key={med.id} className={`caregiver-med-card caregiver-med-card--${currentStatus}`}>
                      {med.image && (
                        <div className="caregiver-med-card__thumb-wrap">
                          <img src={med.image} alt={med.name} className="caregiver-med-card__thumb" />
                        </div>
                      )}

                      <div className="caregiver-med-card__body">
                        <div className="caregiver-med-card__header">
                          <div className="caregiver-med-card__name-row">
                            <h4>{med.name}</h4>
                            {med.dosage && <span className="meta-dosage">{med.dosage}</span>}
                          </div>

                          <div className="caregiver-status-pill-group">
                            {currentStatus === 'taken' && (
                              <span className="badge badge--success">
                                <IconCheck size={13} /> {t.taken || 'TAKEN'}
                              </span>
                            )}
                            {currentStatus === 'taken_late' && (
                              <span className="badge badge--warning">
                                ⏱ {t.takenLate || 'TAKEN LATE'} (~45m late)
                              </span>
                            )}
                            {currentStatus === 'missed' && (
                              <span className="badge badge--danger badge--pulse">
                                ⚠️ {t.missed || 'MISSED'}
                              </span>
                            )}
                            {currentStatus === 'pending' && (
                              <span className="badge badge--pending">
                                ⏳ {t.pending || 'PENDING'}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="caregiver-med-card__meta">
                          <span className="time-badge">
                            <IconClock size={13} /> {med.time} ({med.frequency})
                          </span>
                          {med.notes && <span className="instructions-label">Note: "{med.notes}"</span>}
                        </div>

                        {/* Interactive Project Demonstration Simulation Tools */}
                        <div className="caregiver-demo-actions">
                          <span className="demo-actions-label">Demonstration Controls:</span>
                          <button
                            type="button"
                            className="btn btn--outline btn--sm"
                            onClick={async () => {
                              await onSimulateStatus(med, 'taken');
                              await loadPatients();
                            }}
                          >
                            ✓ Mark TAKEN
                          </button>
                          <button
                            type="button"
                            className="btn btn--outline btn--sm"
                            onClick={async () => {
                              await onSimulateStatus(med, 'taken_late');
                              await loadPatients();
                            }}
                          >
                            ⏱ Mark TAKEN LATE
                          </button>
                          <button
                            type="button"
                            className="btn btn--ghost-danger btn--sm"
                            onClick={async () => {
                              await onSimulateStatus(med, 'missed');
                              await loadPatients();
                            }}
                          >
                            ⚠️ Mark MISSED
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <IconShield size={44} />
          <h3>{t.noPatientsConnected || 'No patients connected yet.'}</h3>
          <p>Click "+ Connect Patient" and enter the patient pairing code.</p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setPairingModalOpen(true)}
          >
            <IconPlus size={16} /> {t.connectNewPatient || '+ Connect Patient'}
          </button>
        </div>
      )}

      {/* Connect Patient Pairing Modal */}
      {pairingModalOpen && (
        <div className="modal-overlay" onMouseDown={() => setPairingModalOpen(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="connect-patient-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="modal__header">
              <div className="modal__title-group">
                <div className="modal__icon-badge modal__icon-badge--shield">
                  <IconPlus size={18} />
                </div>
                <div>
                  <h2 id="connect-patient-title">{t.connectNewPatient || '+ Connect Patient'}</h2>
                  <p className="modal__subtitle">Enter the 7-character Pairing Code provided by the patient</p>
                </div>
              </div>
              <button
                type="button"
                className="icon-btn-close"
                onClick={() => setPairingModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConnectPatient} className="reminder-form">
              <label className="field">
                <span>{t.enterPairingCode || 'Enter Patient Pairing Code'} *</span>
                <input
                  type="text"
                  value={pairingCodeInput}
                  onChange={(e) => setPairingCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. MED-7842"
                  required
                  autoFocus
                />
              </label>

              <label className="field">
                <span>Relationship / Role (e.g. Daughter, Nurse, Doctor)</span>
                <input
                  type="text"
                  value={relationshipInput}
                  onChange={(e) => setRelationshipInput(e.target.value)}
                  placeholder="e.g. Family Caregiver"
                />
              </label>

              {pairingError && <div className="field-error">⚠️ {pairingError}</div>}
              {pairingSuccess && <div className="badge badge--success">{pairingSuccess}</div>}

              <div className="modal__footer">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setPairingModalOpen(false)}
                >
                  {t.cancel || 'Cancel'}
                </button>
                <button type="submit" className="btn btn--primary">
                  {t.connectPatientBtn || 'Connect Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
