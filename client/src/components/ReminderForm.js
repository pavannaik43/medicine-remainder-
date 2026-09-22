import React, { useEffect, useRef, useState } from 'react';
import { IconPill, IconClock, IconPlus, IconEdit, IconTrash, IconCamera, IconImage } from './Icons';

const FREQUENCY_CONFIG = [
  { value: 'Every day', labelKey: 'freqEveryday', defaultLabel: 'Every day (Once daily)', defaultTimes: ['08:00'] },
  { value: 'Twice a day', labelKey: 'freqTwiceDay', defaultLabel: 'Twice a day (2 times)', defaultTimes: ['08:00', '20:00'] },
  { value: '3 times a day', labelKey: 'freq3TimesDay', defaultLabel: '3 times a day (3 times)', defaultTimes: ['08:00', '14:00', '20:00'] },
  { value: '4 times a day', labelKey: 'freq4TimesDay', defaultLabel: '4 times a day (4 times)', defaultTimes: ['08:00', '12:00', '17:00', '21:00'] },
  { value: 'Specific days', labelKey: 'freqSpecificDays', defaultLabel: 'Specific days of week', defaultTimes: ['08:00'] },
  { value: 'Weekdays only', labelKey: 'freqWeekdays', defaultLabel: 'Weekdays only (Mon – Fri)', defaultTimes: ['08:00'] },
  { value: 'Weekends only', labelKey: 'freqWeekends', defaultLabel: 'Weekends only (Sat – Sun)', defaultTimes: ['08:00'] },
  { value: 'Every other day', labelKey: 'freqAlternate', defaultLabel: 'Every other day (Alternate days)', defaultTimes: ['08:00'] },
  { value: 'As needed', labelKey: 'freqAsNeeded', defaultLabel: 'As needed (When needed)', defaultTimes: [] },
];

const DAYS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 0 },
];

// Quick visual pill appearance presets for senior ease of use
const PILL_PRESETS = [
  { nameKey: 'whitePill', name: 'White Round Tablet', icon: '⚪', color: '#f8fafc', border: '#cbd5e1' },
  { nameKey: 'blueCapsule', name: 'Blue Capsule', icon: '💊', color: '#3b82f6', border: '#2563eb' },
  { nameKey: 'redPill', name: 'Red/Pink Tablet', icon: '🔴', color: '#ef4444', border: '#dc2626' },
  { nameKey: 'yellowCapsule', name: 'Yellow Capsule', icon: '🟡', color: '#eab308', border: '#ca8a04' },
  { nameKey: 'greenPill', name: 'Green Pill', icon: '🟢', color: '#10b981', border: '#059669' },
  { nameKey: 'syrupBottle', name: 'Liquid / Syrup Bottle', icon: '🧴', color: '#8b5cf6', border: '#7c3aed' },
];

function getDoseLabel(index, total, t = {}) {
  if (total === 1) return t.scheduledTime || 'Medicine Time';
  if (total === 2) return index === 0 ? (t.morning || 'Morning') + ' (1)' : (t.evening || 'Evening') + ' (2)';
  if (total === 3) {
    if (index === 0) return (t.morning || 'Morning') + ' (1)';
    if (index === 1) return (t.afternoon || 'Afternoon') + ' (2)';
    return (t.night || 'Night') + ' (3)';
  }
  return `${t.doseOf || 'Dose'} ${index + 1} ${t.of || 'of'} ${total}`;
}

// Compress image to lightweight Base64 data URL via canvas
function compressImageFile(file, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 400;
      let width = img.width;
      let height = img.height;

      if (width > height && width > maxDim) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else if (height > maxDim) {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      callback(dataUrl);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

export default function ReminderForm({ initialValue, onSave, onClose, t = {} }) {
  const isEditing = Boolean(initialValue);
  const firstFieldRef = useRef(null);
  const fileInputRef = useRef(null);

  const [name, setName] = useState(initialValue?.name || '');
  const [dosage, setDosage] = useState(initialValue?.dosage || '');
  const [frequency, setFrequency] = useState(initialValue?.frequency || 'Every day');
  const [image, setImage] = useState(initialValue?.image || '');

  // Multi-times state
  const [times, setTimes] = useState(() => {
    if (initialValue?.times && Array.isArray(initialValue.times) && initialValue.times.length > 0) {
      return initialValue.times;
    }
    if (initialValue?.time) {
      return [initialValue.time];
    }
    return ['08:00'];
  });

  // Selected days of week
  const [daysOfWeek, setDaysOfWeek] = useState(
    initialValue?.daysOfWeek && Array.isArray(initialValue.daysOfWeek)
      ? initialValue.daysOfWeek
      : [1, 2, 3, 4, 5, 6, 0]
  );

  const [stock, setStock] = useState(
    initialValue?.stock !== null && initialValue?.stock !== undefined ? initialValue.stock : ''
  );
  const [notes, setNotes] = useState(initialValue?.notes || '');
  const [error, setError] = useState('');

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleFrequencyChange = (newFreq) => {
    setFrequency(newFreq);
    const opt = FREQUENCY_CONFIG.find((o) => o.value === newFreq);
    if (opt) {
      if (opt.defaultTimes.length > 0) {
        setTimes(opt.defaultTimes);
      } else if (newFreq === 'As needed') {
        setTimes([]);
      }
    }
  };

  const handleTimeChange = (index, val) => {
    const updated = [...times];
    updated[index] = val;
    setTimes(updated);
  };

  const handleAddTimeSlot = () => {
    setTimes([...times, '12:00']);
  };

  const handleRemoveTimeSlot = (index) => {
    if (times.length <= 1 && frequency !== 'As needed') return;
    setTimes(times.filter((_, i) => i !== index));
  };

  const toggleDay = (dayVal) => {
    if (daysOfWeek.includes(dayVal)) {
      if (daysOfWeek.length > 1) {
        setDaysOfWeek(daysOfWeek.filter((d) => d !== dayVal));
      }
    } else {
      setDaysOfWeek([...daysOfWeek, dayVal].sort());
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImageFile(file, (dataUrl) => {
        setImage(dataUrl);
      });
    }
  };

  const handleRemoveImage = () => {
    setImage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError(t.medName ? `${t.medName} is required` : 'Please enter the medicine name.');
      return;
    }

    if (frequency !== 'As needed' && times.length === 0) {
      setError('Please set at least one time for this medicine.');
      return;
    }

    if (frequency === 'Specific days' && daysOfWeek.length === 0) {
      setError('Please select at least one day.');
      return;
    }

    setError('');
    onSave({
      ...(initialValue || {}),
      name: name.trim(),
      dosage: dosage.trim(),
      frequency,
      times: frequency === 'As needed' ? [] : times,
      time: times[0] || '08:00',
      daysOfWeek: frequency === 'Specific days' ? daysOfWeek : undefined,
      image: image || null,
      stock: stock !== '' && !isNaN(Number(stock)) ? parseInt(stock, 10) : null,
      notes: notes.trim(),
    });
  }

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reminder-form-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <div className="modal__title-group">
            <div className="modal__icon-badge">
              {isEditing ? <IconEdit size={18} /> : <IconPlus size={18} />}
            </div>
            <div>
              <h2 id="reminder-form-title">{isEditing ? (t.editMedicine || 'Edit Medicine') : (t.addMedicine || 'Add Medicine')}</h2>
              <p className="modal__subtitle">{t.appSubtitle || 'Daily medicine tracking and alarm helper'}</p>
            </div>
          </div>
          <button type="button" className="icon-btn-close" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="reminder-form">
          {/* Medicine Name */}
          <label className="field">
            <span>{t.medName || 'Medicine Name'} *</span>
            <div className="input-with-icon">
              <IconPill size={16} className="input-icon" />
              <input
                ref={firstFieldRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Paracetamol, Metformin, Vitamin D"
                required
              />
            </div>
          </label>

          {/* Senior-Friendly Photo Section */}
          <div className="field photo-upload-field">
            <div className="photo-upload-header">
              <span className="photo-upload-title">
                <IconCamera size={16} /> {t.medPhoto || 'Medicine Photo (For easy identification)'}
              </span>
              <span className="photo-upload-hint">{t.medPhotoHint || 'Shows picture on screen during alarm'}</span>
            </div>

            {image ? (
              <div className="photo-preview-box">
                <img src={image} alt="Medicine preview" className="photo-preview-img" />
                <div className="photo-preview-info">
                  <span className="photo-preview-success">{t.photoAttached || '✓ Photo Added'}</span>
                  <p>{t.medPhotoHint || 'Shows picture on screen during alarm'}</p>
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm"
                    onClick={handleRemoveImage}
                  >
                    <IconTrash size={14} /> {t.removePhoto || 'Remove Photo'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="photo-upload-options">
                <div className="photo-dropzone" onClick={() => fileInputRef.current?.click()}>
                  <IconImage size={28} className="photo-dropzone-icon" />
                  <div className="photo-dropzone-text">
                    <strong>{t.takePhotoOrUpload || 'Tap to Take Photo or Upload Picture'}</strong>
                    <span>Camera photo, medicine packet, or tablet strip</span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="photo-file-input"
                    onChange={handleFileChange}
                  />
                </div>

                <div className="photo-presets-row">
                  <span className="photo-presets-label">{t.pillPresetsLabel || 'Or pick pill color:'}</span>
                  <div className="photo-presets-list">
                    {PILL_PRESETS.map((p) => {
                      const presetDisplayName = t[p.nameKey] || p.name;
                      return (
                        <button
                          key={p.nameKey}
                          type="button"
                          className="preset-pill-btn"
                          onClick={() => {
                            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260" viewBox="0 0 260 260"><rect width="100%" height="100%" fill="${p.color}" rx="16"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-size="80">${p.icon}</text><text x="50%" y="82%" dominant-baseline="middle" text-anchor="middle" font-size="16" font-family="sans-serif" font-weight="bold" fill="#0f172a">${presetDisplayName}</text></svg>`;
                            setImage(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
                          }}
                          title={presetDisplayName}
                        >
                          <span className="preset-pill-icon">{p.icon}</span>
                          <span className="preset-pill-name">{presetDisplayName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dosage and Frequency */}
          <div className="field-row">
            <label className="field">
              <span>{t.dosage || 'Dose Amount (e.g. 1 pill, 500mg)'}</span>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g. 500mg, 1 pill"
              />
            </label>

            <label className="field">
              <span>{t.frequency || 'How Often?'} *</span>
              <select
                value={frequency}
                onChange={(e) => handleFrequencyChange(e.target.value)}
              >
                {FREQUENCY_CONFIG.map((f) => (
                  <option key={f.value} value={f.value}>
                    {t[f.labelKey] || f.defaultLabel}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Day of week selector */}
          {frequency === 'Specific days' && (
            <div className="field">
              <span>{t.freqSpecificDays || 'Select Days'} *</span>
              <div className="days-selector-grid">
                {DAYS.map((d) => {
                  const isSelected = daysOfWeek.includes(d.value);
                  return (
                    <button
                      key={d.value}
                      type="button"
                      className={`day-pill ${isSelected ? 'day-pill--active' : ''}`}
                      onClick={() => toggleDay(d.value)}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dynamic Time Slots */}
          {frequency !== 'As needed' ? (
            <div className="field time-slots-container">
              <div className="time-slots-header">
                <span>{t.scheduledTimes || 'Medicine Times'} ({times.length}) *</span>
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={handleAddTimeSlot}
                  title="Add time"
                >
                  <IconPlus size={14} /> + Time
                </button>
              </div>

              <div className="time-slots-list">
                {times.map((timeVal, idx) => (
                  <div key={idx} className="time-slot-item">
                    <div className="time-slot-label">
                      <IconClock size={15} />
                      <span>{getDoseLabel(idx, times.length, t)}</span>
                    </div>

                    <div className="time-slot-input-wrap">
                      <input
                        type="time"
                        value={timeVal}
                        onChange={(e) => handleTimeChange(idx, e.target.value)}
                        required
                        className="time-slot-input"
                      />
                      {times.length > 1 && (
                        <button
                          type="button"
                          className="btn-icon-danger"
                          onClick={() => handleRemoveTimeSlot(idx)}
                          title="Remove time"
                          aria-label={`Remove time ${timeVal}`}
                        >
                          <IconTrash size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="prn-info-box">
              <IconPill size={18} />
              <div>
                <strong>{t.asNeededTitle || 'Extra Medicines (When Needed)'}</strong>
                <p>{t.asNeededSubtitle || 'No set alarm • Take whenever needed'}</p>
              </div>
            </div>
          )}

          {/* Stock / Pill Count */}
          <div className="field-row">
            <label className="field">
              <span>{t.stockCount || 'Number of pills left in box (optional)'}</span>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="e.g. 30"
              />
            </label>
          </div>

          {/* Instructions */}
          <label className="field">
            <span>{t.instructions || 'Notes'} (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.notesPlaceholder || 'e.g. Take after eating breakfast with water'}
              rows={2}
            />
          </label>

          {error && (
            <p className="field-error" role="alert">
              ⚠️ {error}
            </p>
          )}

          <div className="modal__footer">
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              {t.cancel || 'Cancel'}
            </button>
            <button type="submit" className="btn btn--primary">
              {isEditing ? (t.saveChanges || 'Save Changes') : (t.addMedicineBtn || 'Save Medicine')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
