import { useState } from 'react';

import PopupButton from '../ui/PopupButton';
import { useDoubleConfirm } from '../../hooks/useDoubleConfirm';
import { useDraft } from '../../hooks/useDraft';

import { Status, StatusChangedHandler, StatusDeletedHandler } from '../../../../shared/types';
import { apiFetch } from '../../lib/api';
import { snackbar } from '../../lib/snackbar';
import { MAX_LENGTHS } from '../../../../shared/constants';

function hueFromLabel(label: string): number {
    let hash = 0;
    for (let i = 0; i < label.length; i++) {
        hash = label.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 360;
}

interface StatusItemProps {
    status: Status;
    onStatusChanged: StatusChangedHandler;
    onStatusDeleted: StatusDeletedHandler;
}

function StatusItem({ status, onStatusChanged, onStatusDeleted }: StatusItemProps)
{
    const { draft, updateDraft, resetDraft, draftIsDirty } = useDraft({ label: status.label });

    async function handleEdit()
    {
        try {
            const updatedStatus = await apiFetch<Status>(`/statuses/${status.id}`, {
                method: 'PUT',
                body: JSON.stringify({ label: draft.label })
            });

            onStatusChanged(updatedStatus);
        }
        catch(err) {
            console.error('Failed to update status data: ', err);
        }
    }

    async function handleDelete()
    {
        try {
            await apiFetch(`/statuses/${status.id}`, { method: 'DELETE' });
            onStatusDeleted(status.id);
            snackbar.success('Status deleted successfully');
        }
        catch(err) {
            console.error('Failed to delete status: ', err);
        }
    }

    const deleteConfirm = useDoubleConfirm(handleDelete);

    return(
        <li className="status-row">
            <span
                className="status-dot"
                style={{ '--status-hue': hueFromLabel(status.label) } as React.CSSProperties}
            />
            <strong>{status.label} </strong>

            <PopupButton
                label = "..."
                resetValues={() => {
                    resetDraft();
                    deleteConfirm.reset();
                }}
                isDirty={draftIsDirty}
            >
                {({ onClose }) => (
                    <div className="status-edit-fields">
                        <input
                            className="input"
                            value={draft.label}
                            onChange={e => updateDraft('label', e.target.value)}
                            maxLength={MAX_LENGTHS.statusLabel}
                        />

                        <div className="btn-row">
                            <button className="btn btn-primary" onClick={() => {handleEdit(); onClose();}}>Save Changes</button>
                            
                            <button
                                className={`btn btn-danger${deleteConfirm.pending ? ' is-confirming' : ''}`}
                                onClick={deleteConfirm.trigger}
                            >
                                {deleteConfirm.pending ? 'Click again to delete' : 'Delete'}
                            </button>
                        </div>
                                      
                    </div>
                )}
            </PopupButton>
        </li>
    );
}

export default StatusItem;
