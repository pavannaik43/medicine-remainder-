import React from 'react';
import { formatTime } from '../timeOfDay';
import { IconCheck, IconEdit, IconTrash, IconBell, IconClock, IconPill } from './Icons';

export default function ReminderCard({
  doseItem,
  period,
  isRinging,
  onToggleTaken,
  onSimulateStatus,
  onEdit,
  onDelete,
  onTriggerAlarm,
  t = {},
}) {
  const {
    name,
    dosage,
    time,
    doseIndex,
    totalDoses,
    frequency,
    notes,
    image,
    taken,
    stock,
    reminder,
  } = doseItem;

  const photoUrl = image || reminder?.image;

  return (
    <li
      className={`reminder-card ${taken ? 'reminder-card--taken' : ''} ${
        isRinging ? 'reminder-card--ringing' : ''
      }`}
      style={{
        '--accent': `var(--color-${period.key})`,
        '--accent-light': `var(--color-${period.key}-light)`,
      }}
    >
      {/* Individual Dose Check Toggle */}
      <button
        type="button"
        className="reminder-card__check"
        onClick={() => onToggleTaken(doseItem)}
        aria-pressed={taken}
        title={taken ? `${t.markAsPending || 'Mark as Pending'} (${name})` : `${t.markAsTaken || 'Mark as Taken'} (${name})`}
        aria-label={taken ? t.markAsPending : t.markAsTaken}
      >
        {taken ? <IconCheck size={18} /> : null}
      </button>

      {/* Visual Photo Thumbnail for Seniors */}
      {photoUrl && (
        <div className="reminder-card__thumb-container" title="Medicine photo">
          <img src={photoUrl} alt={name} className="reminder-card__thumb" />
        </div>
      )}

      {/* Main Medication Information */}
      <div className="reminder-card__body">
        <div className="reminder-card__top">
          <div className="reminder-card__title-group">
            {!photoUrl && <IconPill size={18} className="reminder-card__med-icon" />}
            <h3 className="reminder-card__name">{name}</h3>

            {totalDoses > 1 && (
              <span className="badge badge--dose-tag">
                {t.doseOf || 'Dose'} {doseIndex + 1} {t.of || 'of'} {totalDoses}
              </span>
            )}

            {isRinging && (
              <span className="badge badge--danger badge--pulse">
                <IconBell size={13} /> {t.ringingNow || 'Ringing Now'}
              </span>
            )}

            {taken && (
              <span className="badge badge--success">
                ✓ {t.taken || 'TAKEN'}
              </span>
            )}
          </div>

          <div className="reminder-card__time-tag">
            <IconClock size={15} />
            <span>{formatTime(time)}</span>
          </div>
        </div>

        <div className="reminder-card__meta">
          {dosage && <span className="meta-dosage">{dosage}</span>}
          {dosage && frequency && <span className="meta-bullet">•</span>}
          {frequency && <span className="meta-frequency">{frequency}</span>}
          {typeof stock === 'number' && (
            <>
              <span className="meta-bullet">•</span>
              <span className={`meta-stock ${stock <= 5 ? 'meta-stock--low' : ''}`}>
                {stock} {t.stockLeft || 'pills left'} {stock <= 5 ? `(${t.refillSoon || 'Refill soon'})` : ''}
              </span>
            </>
          )}
        </div>

        {notes && (
          <div className="reminder-card__instructions">
            <span className="instructions-label">{t.instructions || 'Notes'}:</span> {notes}
          </div>
        )}

        {/* Demo Live Triggers */}
        {onSimulateStatus && (
          <div className="card-demo-triggers">
            <button
              type="button"
              className="btn-demo-tag btn-demo-tag--late"
              onClick={() => onSimulateStatus(doseItem, 'taken_late')}
              title="Demonstrate late intake confirmation (>30 min delay)"
            >
              ⏱ {t.simulateLateTake || 'Take Late (>30m)'}
            </button>
            <button
              type="button"
              className="btn-demo-tag btn-demo-tag--missed"
              onClick={() => onSimulateStatus(doseItem, 'missed')}
              title="Demonstrate unconfirmed reminder (Missed Dose)"
            >
              ⚠️ {t.simulateMissed || 'Mark Missed'}
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="reminder-card__actions">
        {!taken && (
          <button
            type="button"
            className="btn-action btn-action--alarm"
            onClick={() => onTriggerAlarm(doseItem)}
            title={`${t.alarm || 'Alarm'}: ${name} (${time})`}
            aria-label={`${t.alarm || 'Alarm'} ${name}`}
          >
            <IconBell size={15} />
            <span>{t.alarm || 'Alarm'}</span>
          </button>
        )}

        <button
          type="button"
          className="btn-action btn-action--edit"
          onClick={() => onEdit(reminder)}
          aria-label={`${t.edit || 'Edit'} ${name}`}
          title={`${t.edit || 'Edit'} ${name}`}
        >
          <IconEdit size={15} />
          <span>{t.edit || 'Edit'}</span>
        </button>

        <button
          type="button"
          className="btn-action btn-action--delete"
          onClick={() => onDelete(reminder)}
          aria-label={`${t.delete || 'Delete'} ${name}`}
          title={`${t.delete || 'Delete'} ${name}`}
        >
          <IconTrash size={15} />
          <span>{t.delete || 'Delete'}</span>
        </button>
      </div>
    </li>
  );
}
