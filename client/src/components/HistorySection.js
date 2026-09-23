import React, { useState, useMemo } from 'react';
import { IconHistory, IconSearch, IconDownload, IconTrash, IconCheck, IconPill, IconClock } from './Icons';

export default function HistorySection({ history = [], currentUser, onDeleteEntry, onClearHistory, t = {} }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRange, setFilterRange] = useState('all'); // all | today | 7days | 30days

  const filteredHistory = useMemo(() => {
    const now = new Date();
    return history.filter((item) => {
      // Search filter
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.dosage && item.dosage.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      // Date range filter
      if (filterRange === 'all') return true;
      const takenDate = new Date(item.takenAt);
      const diffDays = (now - takenDate) / (1000 * 3600 * 24);

      if (filterRange === 'today') {
        return takenDate.toDateString() === now.toDateString();
      }
      if (filterRange === '7days') {
        return diffDays <= 7;
      }
      if (filterRange === '30days') {
        return diffDays <= 30;
      }
      return true;
    });
  }, [history, searchTerm, filterRange]);

  // Group by Date for timeline
  const groupedByDate = useMemo(() => {
    const groups = {};
    filteredHistory.forEach((item) => {
      const dateObj = new Date(item.takenAt);
      const dateKey = dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    });
    return groups;
  }, [filteredHistory]);

  const handleExportCSV = () => {
    if (filteredHistory.length === 0) return;
    const headers = ['Medicine Name', 'Dosage', 'Scheduled Time', 'Actual Taken Timestamp', 'Status', 'Delay Minutes', 'Notes'];
    const rows = filteredHistory.map((item) => [
      `"${item.name.replace(/"/g, '""')}"`,
      `"${(item.dosage || '').replace(/"/g, '""')}"`,
      `"${item.time || ''}"`,
      `"${new Date(item.takenAt).toLocaleString()}"`,
      `"${item.status || 'taken'}"`,
      `"${item.delayMinutes || 0}"`,
      `"${(item.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `medicine-log-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="section-container" aria-label="Medicine Intake History">
      <div className="section-header">
        <div className="section-header__title-group">
          <div className="section-icon-badge">
            <IconHistory size={20} />
          </div>
          <div>
            <h2 className="section-title">{t.historyTitle || 'Medicine History'}</h2>
            <p className="section-subtitle">
              {currentUser?.name
                ? `Intake records for ${currentUser.name}`
                : (t.historySubtitle || 'Record of all medicines taken in the past')}
            </p>
          </div>
        </div>

        <div className="section-header__actions">
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={handleExportCSV}
            disabled={filteredHistory.length === 0}
            title="Download report"
          >
            <IconDownload size={15} /> {t.exportCsv || 'Download Report'}
          </button>
          {history.length > 0 && (
            <button
              type="button"
              className="btn btn--ghost-danger btn--sm"
              onClick={onClearHistory}
              title="Clear all logs"
            >
              <IconTrash size={15} /> {t.clearAllLogs || 'Clear History'}
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="history-toolbar">
        <div className="search-input-wrapper">
          <IconSearch className="search-icon" size={16} />
          <input
            type="text"
            className="search-input"
            placeholder={t.searchPlaceholder || 'Search medicine name...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          <button
            type="button"
            className={`filter-tab ${filterRange === 'all' ? 'filter-tab--active' : ''}`}
            onClick={() => setFilterRange('all')}
          >
            {t.allLogs || 'All Logs'} ({history.length})
          </button>
          <button
            type="button"
            className={`filter-tab ${filterRange === 'today' ? 'filter-tab--active' : ''}`}
            onClick={() => setFilterRange('today')}
          >
            {t.today || 'Today'}
          </button>
          <button
            type="button"
            className={`filter-tab ${filterRange === '7days' ? 'filter-tab--active' : ''}`}
            onClick={() => setFilterRange('7days')}
          >
            {t.last7Days || 'Last 7 Days'}
          </button>
          <button
            type="button"
            className={`filter-tab ${filterRange === '30days' ? 'filter-tab--active' : ''}`}
            onClick={() => setFilterRange('30days')}
          >
            {t.last30Days || 'Last 30 Days'}
          </button>
        </div>
      </div>

      {/* History Log Timeline */}
      {Object.keys(groupedByDate).length === 0 ? (
        <div className="empty-state empty-state--compact">
          <div className="empty-state__icon">
            <IconHistory size={40} />
          </div>
          <h3>{t.noHistoryFound || 'No medicines logged yet.'}</h3>
          <p>
            {searchTerm || filterRange !== 'all'
              ? 'No medicines match your current search.'
              : `No intake records logged for ${currentUser?.name || 'this patient'} yet. Mark medicines as TAKEN in Today's Medicines to record history.`}
          </p>
        </div>
      ) : (
        <div className="history-timeline">
          {Object.entries(groupedByDate).map(([dateLabel, items]) => (
            <div key={dateLabel} className="history-date-group">
              <div className="history-date-badge">
                <span>{dateLabel}</span>
                <span className="history-date-count">{items.length} {t.dosesTakenToday || 'recorded'}</span>
              </div>

              <div className="history-cards-list">
                {items.map((item) => {
                  const takenTimeStr = new Date(item.takenAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  const isLate = item.status === 'taken_late';
                  const isMissed = item.status === 'missed';

                  return (
                    <div
                      key={item.id}
                      className={`history-card ${isLate ? 'history-card--late' : ''} ${
                        isMissed ? 'history-card--missed' : ''
                      }`}
                    >
                      {item.image ? (
                        <div className="history-card__thumb-wrap">
                          <img src={item.image} alt={item.name} className="history-card__thumb" />
                        </div>
                      ) : (
                        <div className={`history-card__status-indicator ${isMissed ? 'history-card__status-indicator--missed' : isLate ? 'history-card__status-indicator--late' : ''}`}>
                          {isMissed ? '⚠️' : isLate ? '⏱' : <IconCheck size={16} />}
                        </div>
                      )}

                      <div className="history-card__main">
                        <div className="history-card__title-row">
                          <div className="history-card__name-group">
                            {!item.image && <IconPill size={16} className="history-card__pill-icon" />}
                            <h4 className="history-card__name">{item.name}</h4>
                            {item.dosage && <span className="history-card__dosage">{item.dosage}</span>}
                            {item.doseLabel && (
                              <span className="badge badge--dose-tag">{item.doseLabel}</span>
                            )}
                          </div>

                          {/* Status Badge */}
                          {isMissed ? (
                            <span className="badge badge--danger">
                              ⚠️ {t.missed || 'MISSED'}
                            </span>
                          ) : isLate ? (
                            <span className="badge badge--warning">
                              ⏱ {t.takenLate || 'TAKEN LATE'} (~{item.delayMinutes || 45}m late)
                            </span>
                          ) : (
                            <span className="badge badge--success">
                              ✓ {t.taken || 'TAKEN'}
                            </span>
                          )}
                        </div>

                        <div className="history-card__meta-row">
                          <div className="history-card__time-tag">
                            <IconClock size={14} />
                            <span>{t.recordedAt || 'Taken at'}: <strong>{takenTimeStr}</strong></span>
                            {item.time && <span className="history-card__sched">({t.scheduledFor || 'Scheduled'}: {item.time})</span>}
                          </div>
                        </div>

                        {item.notes && <p className="history-card__notes">"{item.notes}"</p>}
                      </div>

                      <button
                        type="button"
                        className="btn-icon-danger"
                        onClick={() => onDeleteEntry(item.id)}
                        title="Delete entry"
                        aria-label="Delete entry"
                      >
                        <IconTrash size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
