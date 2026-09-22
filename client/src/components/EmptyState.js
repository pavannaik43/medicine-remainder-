import React from 'react';
import { IconCalendar, IconPlus } from './Icons';

export default function EmptyState({ onAddClick, t = {} }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon-wrap">
        <IconCalendar size={36} />
      </div>
      <h2>{t.noRemindersYet || 'No medicines added yet'}</h2>
      <p>
        {t.appSubtitle || 'Daily medicine tracking and alarm helper'}
      </p>
      <button type="button" className="btn btn--primary" onClick={onAddClick}>
        <IconPlus size={16} /> {t.addMedicine || 'Add Medicine'}
      </button>
    </div>
  );
}
