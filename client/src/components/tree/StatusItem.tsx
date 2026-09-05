import PopupButton from '../ui/PopupButton';
import ColorSwatchPicker from '../ui/ColorSwatchPicker';
import { useDoubleConfirm } from '../../hooks/useDoubleConfirm';
import { useDraft } from '../../hooks/useDraft';
import CharCounter from '../ui/CharCounter';

import { Status, StatusChangedHandler, StatusDeletedHandler } from '../../../../shared/types';
import { apiFetch } from '../../lib/api';
import { snackbar } from '../../lib/snackbar';
import { resolveStatusColor, resolveStatusColorHex } from '../../lib/statusColor';
import { MAX_LENGTHS } from '../../../../shared/constants';

interface StatusItemProps {
    status: Status;
    onStatusChanged: StatusChangedHandler;
    onStatusDeleted: StatusDeletedHandler;
}

function StatusItem({ status, onStatusChanged, onStatusDeleted }: StatusItemProps)
{
    const { draft, updateDraft, resetDraft, draftIsDirty } = useDraft({
        label: status.label,
        color: resolveStatusColorHex(status),
    });

    async function handleEdit()
    {
        try {
            const updatedStatus = await apiFetch<Status>(`/statuses/${status.id}`, {
                method: 'PUT',
                body: JSON.stringify({ label: draft.label, color: draft.color })
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
                style={{ '--status-color': resolveStatusColor(status) } as React.CSSProperties}
            />
            <strong title={status.label}>{status.label} </strong>

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
                        <div className="input-wrap">
                            <input
                                className="input"
                                value={draft.label}
                                onChange={e => updateDraft('label', e.target.value)}
                                maxLength={MAX_LENGTHS.statusLabel}
                            />

                            <CharCounter value={draft.label} max={MAX_LENGTHS.statusLabel} />
                        </div>

                        <ColorSwatchPicker value={draft.color} onChange={c => updateDraft('color', c)} />

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
