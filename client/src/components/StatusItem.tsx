import { useState } from 'react';

import PopupButton from './PopupButton';
import { useDoubleConfirm } from '../hooks/useDoubleConfirm';

import { Status, StatusChangedHandler, StatusDeletedHandler } from '../../../shared/types';
import { apiFetch } from '../lib/api';
import { snackbar } from '../lib/snackbar';
import { MAX_LENGTHS } from '../../../shared/constants';

// Deterministic hue from a status label, so any user-defined status gets a distinct,
// stable color without needing a color field in the schema
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
    const [label, setLabel] = useState(status.label);

    // Function to handle editing a status
    async function handleEdit()
    {
        try {
            const updatedStatus = await apiFetch<Status>(`/statuses/${status.id}`, {
                method: 'PUT',
                body: JSON.stringify({ label })
            });

            onStatusChanged(updatedStatus);
        }
        catch(err) {
            console.error('Failed to update status data: ', err);
        }
    }

    // Function to handle deleting a status
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

    // Requires a second confirming click before actually calling handleDelete
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
                    setLabel(status.label);
                    deleteConfirm.reset();
                }}
            >
                {({ onClose }) => (
                    <div className="status-edit-fields">
                        <input
                            className="input"
                            value={label}
                            onChange={e => setLabel(e.target.value)}
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