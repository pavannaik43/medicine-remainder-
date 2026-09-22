import React from 'react';
import { IconShield, IconTrash, IconUser } from './Icons';

export default function CaregiverAccessModal({
  currentUser,
  onClose,
  onRevokeCaregiver,
  t = {},
}) {
  if (!currentUser) return null;

  const pairingCode = currentUser.pairingCode || 'MED-7842';
  const caregivers = currentUser.connectedCaregivers || [];

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal modal--access"
        role="dialog"
        aria-modal="true"
        aria-labelledby="caregiver-access-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <div className="modal__title-group">
            <div className="modal__icon-badge modal__icon-badge--shield">
              <IconShield size={20} />
            </div>
            <div>
              <h2 id="caregiver-access-title">{t.caregiverAccess || 'Caregiver Access'}</h2>
              <p className="modal__subtitle">Manage who can monitor your medicines and receive dose alerts</p>
            </div>
          </div>
          <button type="button" className="icon-btn-close" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>

        <div className="access-modal__body">
          {/* Patient Pairing Code Box */}
          <div className="pairing-code-card">
            <span className="pairing-code-label">{t.myPairingCode || 'Your Caregiver Pairing Code:'}</span>
            <div className="pairing-code-badge-large">
              <span>{pairingCode}</span>
            </div>
            <p className="pairing-code-help">
              {t.pairingCodeHint ||
                'Share this 7-character code with your family member or caregiver so they can connect and monitor your doses.'}
            </p>
          </div>

          {/* Connected Caregivers List */}
          <div className="connected-caregivers-section">
            <h3 className="section-title-sm">{t.connectedCaregivers || 'Connected Caregivers'} ({caregivers.length})</h3>

            {caregivers.length === 0 ? (
              <div className="empty-caregivers-box">
                <p>{t.noCaregiversConnected || 'No caregivers connected yet. Share your code above to connect.'}</p>
              </div>
            ) : (
              <div className="caregivers-list">
                {caregivers.map((cg) => (
                  <div key={cg.id} className="caregiver-item-card">
                    <div className="caregiver-item-info">
                      <div className="caregiver-avatar">
                        <IconUser size={18} />
                      </div>
                      <div>
                        <h4 className="caregiver-name">{cg.name}</h4>
                        <span className="caregiver-meta">{cg.email} • {cg.relationship || 'Caregiver'}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn--ghost-danger btn--sm"
                      onClick={() => onRevokeCaregiver(cg.id)}
                      title={t.removeAccessBtn || 'Remove Access'}
                    >
                      <IconTrash size={14} /> {t.removeAccessBtn || 'Remove Access'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal__footer">
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            {t.cancel || 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
