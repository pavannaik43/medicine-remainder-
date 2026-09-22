import React from 'react';
import { IconCheck, IconClock, IconPill, IconBell, IconCamera } from './Icons';

export default function AlarmModal({ doseItem, onTake, onSnooze, onDismiss, t = {} }) {
  if (!doseItem) return null;

  const { name, dosage, time, doseLabel, notes, image, reminder } = doseItem;
  const photoUrl = image || reminder?.image;

  return (
    <div className="alarm-backdrop" role="dialog" aria-modal="true" aria-labelledby="alarm-title">
      <div className="alarm-modal alarm-modal--senior">
        <div className="alarm-modal__bell-container">
          <div className="alarm-modal__bell-wave alarm-modal__bell-wave--1"></div>
          <div className="alarm-modal__bell-wave alarm-modal__bell-wave--2"></div>
          <div className="alarm-modal__bell">
            <IconBell size={32} />
          </div>
        </div>

        <div className="alarm-modal__header">
          <span className="alarm-modal__badge">
            {t.timeForMedicine || 'TIME TO TAKE YOUR MEDICINE'}
          </span>
          <h2 id="alarm-title" className="alarm-modal__name">
            {name}
          </h2>
          {dosage && (
            <p className="alarm-modal__dosage">
              <IconPill size={16} /> {t.takeAmount || 'Take'}: <strong>{dosage}</strong>
            </p>
          )}
        </div>

        {/* Visual Medicine Photo for Seniors */}
        {photoUrl ? (
          <div className="alarm-modal__photo-container">
            <div className="alarm-modal__photo-badge">
              <IconCamera size={13} /> {t.verifyPillPhoto || 'Match your pill with this photo'}
            </div>
            <img
              src={photoUrl}
              alt={`Appearance of ${name}`}
              className="alarm-modal__photo-img"
            />
            <span className="alarm-modal__photo-caption">{t.verifyPillPhoto || 'Match your pill with this photo'}</span>
          </div>
        ) : (
          <div className="alarm-modal__no-photo-badge">
            <IconPill size={16} />
            <span>{doseLabel || t.scheduledTime || 'Medicine Alert'}</span>
          </div>
        )}

        <div className="alarm-modal__details">
          <div className="alarm-modal__detail-item">
            <span className="alarm-modal__detail-label">
              <IconClock size={14} /> {t.prescribedTime || 'Scheduled Time'}:
            </span>
            <span className="alarm-modal__detail-value">{time}</span>
          </div>
          {notes && (
            <div className="alarm-modal__detail-item alarm-modal__detail-item--notes">
              <span className="alarm-modal__detail-label">{t.instructions || 'Notes'}:</span>
              <span className="alarm-modal__detail-value">"{notes}"</span>
            </div>
          )}
        </div>

        <div className="alarm-modal__actions">
          <button
            type="button"
            className="alarm-btn alarm-btn--take"
            onClick={() => onTake(doseItem)}
            autoFocus
          >
            <IconCheck size={22} /> {t.markTakenAndLog || '✓ I Have Taken This Medicine'}
          </button>
          <div className="alarm-modal__secondary-actions">
            <button
              type="button"
              className="alarm-btn alarm-btn--snooze"
              onClick={() => onSnooze(doseItem, 5)}
            >
              {t.snooze5Min || '⏱ Remind in 5 Minutes'}
            </button>
            <button
              type="button"
              className="alarm-btn alarm-btn--dismiss"
              onClick={() => onDismiss(doseItem)}
            >
              {t.dismissAlarm || 'Dismiss'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
