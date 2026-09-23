import React, { useState, useEffect, useCallback } from 'react';
import { IconShield, IconTrash, IconUser } from './Icons';
import { API_AUTH } from '../config/api';

export default function CaregiverAccessModal({
  currentUser,
  onClose,
  onRevokeCaregiver,
  onUpdateUser,
  t = {},
}) {
  const [caregivers, setCaregivers] = useState(currentUser?.connectedCaregivers || []);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const pairingCode = currentUser?.pairingCode || 'MED-7842';

  const fetchFreshProfile = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      setRefreshing(true);
      const res = await fetch(`${API_AUTH}/users/${currentUser.id}`);
      if (res.ok) {
        const freshUser = await res.json();
        const updatedList = freshUser.connectedCaregivers || [];
        setCaregivers(updatedList);
        if (onUpdateUser) {
          onUpdateUser(freshUser);
        }
      }
    } catch (err) {
      console.error('Failed to refresh caregiver list:', err);
    } finally {
      setRefreshing(false);
    }
  }, [currentUser?.id, onUpdateUser]);

  useEffect(() => {
    fetchFreshProfile();
  }, [fetchFreshProfile]);

  const handleCopyCode = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(pairingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleRevoke = async (caregiverId) => {
    await onRevokeCaregiver(caregiverId);
    setCaregivers((prev) => prev.filter((c) => c.id !== caregiverId));
  };

  if (!currentUser) return null;

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
            <div className="pairing-code-badge-large" onClick={handleCopyCode} style={{ cursor: 'pointer' }} title="Click to copy code">
              <span>{pairingCode}</span>
            </div>
            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={handleCopyCode}
              >
                {copied ? '✓ Copied to Clipboard!' : '📋 Copy Pairing Code'}
              </button>
            </div>
            <p className="pairing-code-help" style={{ marginTop: '10px' }}>
              {t.pairingCodeHint ||
                'Share this 8-character code with your family member or caregiver so they can connect from their account.'}
            </p>
          </div>

          {/* Connected Caregivers List */}
          <div className="connected-caregivers-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 className="section-title-sm" style={{ margin: 0 }}>
                {t.connectedCaregivers || 'Connected Caregivers'} ({caregivers.length})
              </h3>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={fetchFreshProfile}
                disabled={refreshing}
                title="Check for new caregiver connections"
              >
                {refreshing ? '🔄 Checking…' : '🔄 Refresh List'}
              </button>
            </div>

            {caregivers.length === 0 ? (
              <div className="empty-caregivers-box">
                <p>{t.noCaregiversConnected || 'No caregivers connected yet. Share your code above so a family member can connect.'}</p>
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
                      onClick={() => handleRevoke(cg.id)}
                      title={t.removeAccessBtn || 'Remove Access'}
                    >
                      <IconTrash size={14} /> {t.removeAccessBtn || 'Remove'}
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
