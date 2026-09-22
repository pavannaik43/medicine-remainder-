import React from 'react';
import { IconPill, IconCheck, IconEdit, IconTrash } from './Icons';

export default function AsNeededSection({
  prnReminders,
  onLogPrnDose,
  onEdit,
  onDelete,
  t = {},
}) {
  if (!prnReminders || prnReminders.length === 0) return null;

  return (
    <section className="prn-section" aria-label="As Needed Medicines">
      <div className="prn-section__header">
        <div className="prn-section__title-group">
          <IconPill size={18} className="text-primary" />
          <h3 className="prn-section__title">{t.asNeededTitle || 'Extra Medicines (When Needed)'}</h3>
          <span className="badge badge--neutral">{prnReminders.length}</span>
        </div>
        <span className="prn-section__hint">{t.asNeededSubtitle || 'No set alarm • Take whenever needed'}</span>
      </div>

      <div className="prn-grid">
        {prnReminders.map((med) => (
          <div key={med.id} className="prn-card">
            <div className="prn-card__content">
              {med.image && (
                <div className="prn-card__thumb-wrap">
                  <img src={med.image} alt={med.name} className="prn-card__thumb" />
                </div>
              )}

              <div className="prn-card__main">
                <div className="prn-card__title-row">
                  <h4 className="prn-card__name">{med.name}</h4>
                  {med.dosage && <span className="prn-card__dosage">{med.dosage}</span>}
                </div>

                {med.notes && <p className="prn-card__notes">"{med.notes}"</p>}

                {typeof med.stock === 'number' && (
                  <div className="prn-card__stock">
                    <span className={`meta-stock ${med.stock <= 5 ? 'meta-stock--low' : ''}`}>
                      {med.stock} {t.stockLeft || 'pills left'} {med.stock <= 5 ? `(${t.refillSoon || 'Refill soon'})` : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="prn-card__actions">
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => onLogPrnDose(med)}
                title={t.logDoseTaken || 'Take Medicine Now'}
              >
                <IconCheck size={14} /> {t.logDoseTaken || 'Take Medicine Now'}
              </button>

              <button
                type="button"
                className="btn-action btn-action--edit"
                onClick={() => onEdit(med)}
                title={t.edit || 'Edit'}
              >
                <IconEdit size={14} />
              </button>

              <button
                type="button"
                className="btn-action btn-action--delete"
                onClick={() => onDelete(med)}
                title={t.delete || 'Delete'}
              >
                <IconTrash size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
