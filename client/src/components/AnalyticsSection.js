import React, { useMemo } from 'react';
import { IconChart, IconShield, IconPill, IconCheck, IconClock } from './Icons';

export default function AnalyticsSection({ reminders = [], history = [], todayDoses = [], t = {} }) {
  // Calculate today's adherence accurately using today's scheduled dose items
  const totalToday = todayDoses.length;
  const takenToday = todayDoses.filter((d) => d.taken).length;
  const todayAdherencePct = totalToday > 0 ? Math.round((takenToday / totalToday) * 100) : 0;

  // Calculate 7-day adherence trends
  const past7DaysLogs = useMemo(() => {
    const now = new Date();
    return history.filter((h) => {
      const d = new Date(h.takenAt);
      return (now - d) / (1000 * 3600 * 24) <= 7;
    });
  }, [history]);

  // Medication stock status
  const lowStockMeds = reminders.filter(
    (r) => typeof r.stock === 'number' && r.stock <= 5
  );

  return (
    <section className="section-container" aria-label="Medicine Progress and Stock">
      <div className="section-header">
        <div className="section-header__title-group">
          <div className="section-icon-badge">
            <IconChart size={20} />
          </div>
          <div>
            <h2 className="section-title">{t.progressTitle || 'Medicine Progress & Stock'}</h2>
            <p className="section-subtitle">
              {t.progressSubtitle || 'Daily medicine intake and remaining pill counts'}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="analytics-card__header">
            <span className="analytics-card__title">{t.todayProgress || "Today's Progress"}</span>
            <span className="analytics-card__badge badge--info">{takenToday} {t.of || 'of'} {totalToday} {t.taken || 'Taken'}</span>
          </div>
          <div className="analytics-card__main-stat">
            <span className="analytics-card__number">{todayAdherencePct}%</span>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${todayAdherencePct}%` }}
            ></div>
          </div>
          <p className="analytics-card__desc">
            {todayAdherencePct === 100
              ? (t.allDoneToday || 'All medicines taken for today! Great job!')
              : `${totalToday - takenToday} ${t.pending || 'Pending'}`}
          </p>
        </div>

        <div className="analytics-card">
          <div className="analytics-card__header">
            <span className="analytics-card__title">{t.past7DaysDoses || 'Doses taken in last 7 days'}</span>
            <span className="analytics-card__badge badge--success">✓</span>
          </div>
          <div className="analytics-card__main-stat">
            <span className="analytics-card__number">{past7DaysLogs.length}</span>
            <span className="analytics-card__unit">{t.dosesTakenToday || 'taken'}</span>
          </div>
          <p className="analytics-card__desc">
            {t.historySubtitle || 'Record of all medicines taken in the past'}
          </p>
        </div>

        <div className="analytics-card">
          <div className="analytics-card__header">
            <span className="analytics-card__title">{t.activeMedicines || 'Active Medicines'}</span>
            <span className="analytics-card__badge badge--neutral">{reminders.length}</span>
          </div>
          <div className="analytics-card__main-stat">
            <span className="analytics-card__number">{lowStockMeds.length}</span>
            <span className="analytics-card__unit">{t.refillSoon || 'Refill soon'}</span>
          </div>
          <p className="analytics-card__desc">
            {lowStockMeds.length > 0
              ? (t.lowStockWarning || 'Pill Refill Needed')
              : 'All medicines have sufficient stock.'}
          </p>
        </div>
      </div>

      {/* Low Stock Warning Alert */}
      {lowStockMeds.length > 0 && (
        <div className="alert-box alert-box--warning">
          <div className="alert-box__icon">⚠️</div>
          <div>
            <h4 className="alert-box__title">{t.lowStockWarning || 'Pill Refill Needed'}</h4>
            <p className="alert-box__text">
              {t.lowStockNotice || 'These medicines are running out of pills:'}
            </p>
            <ul className="alert-box__list">
              {lowStockMeds.map((med) => (
                <li key={med.id}>
                  <strong>{med.name}</strong> ({med.dosage}) — only <strong>{med.stock}</strong> {t.stockLeft || 'pills left'}.
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Medication Summary Table */}
      <div className="analytics-table-card">
        <h3 className="analytics-table-card__title">{t.allMedsTable || 'All Medicines Summary'}</h3>
        <div className="table-responsive">
          <table className="clinical-table">
            <thead>
              <tr>
                <th>{t.tableMedName || 'Medicine Name'}</th>
                <th>{t.tableDosage || 'Dose'}</th>
                <th>{t.tableTime || 'Time'}</th>
                <th>{t.tableFrequency || 'How Often'}</th>
                <th>{t.tableStatus || 'Today'}</th>
                <th>{t.tableStock || 'Pills Left'}</th>
              </tr>
            </thead>
            <tbody>
              {reminders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="table-empty-cell">{t.noRemindersYet || 'No medicines added yet.'}</td>
                </tr>
              ) : (
                reminders.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="table-med-name">
                        <IconPill size={15} />
                        <strong>{r.name}</strong>
                      </div>
                    </td>
                    <td>{r.dosage || '—'}</td>
                    <td>
                      <span className="time-badge">
                        <IconClock size={12} /> {r.time}
                      </span>
                    </td>
                    <td>{r.frequency || 'Every day'}</td>
                    <td>
                      {r.taken ? (
                        <span className="badge badge--success">
                          <IconCheck size={12} /> {t.takenToday || 'Taken Today'}
                        </span>
                      ) : (
                        <span className="badge badge--pending">{t.pending || 'Pending'}</span>
                      )}
                    </td>
                    <td>
                      {typeof r.stock === 'number' ? (
                        r.stock <= 5 ? (
                          <span className="badge badge--danger">{r.stock} {t.stockLeft || 'left'} ({t.refillSoon || 'Refill soon'})</span>
                        ) : (
                          <span className="badge badge--neutral">{r.stock} {t.stockLeft || 'left'}</span>
                        )
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Health Tip Card */}
      <div className="clinical-notes-card">
        <div className="clinical-notes-card__icon">
          <IconShield size={24} />
        </div>
        <div>
          <h4>Important Health Reminder</h4>
          <p>
            Always take medicines on time with water. If you miss a dose or feel unwell, consult your doctor.
          </p>
        </div>
      </div>
    </section>
  );
}
