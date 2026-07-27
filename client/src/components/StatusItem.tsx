import { useState } from 'react';

import PopupButton from './PopupButton';

import { Status, StatusChangedHandler, StatusDeletedHandler } from '../../../shared/types';
import { apiFetch } from '../lib/api';

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
        }
        catch(err) {
            console.error('Failed to update status data: ', err);
        }
    }

    return(
        <li>
            <strong>{status.label} </strong>

            <PopupButton label = "...">
                {({ onClose }) => (
                    <>
                        <input value={label} onChange={e => setLabel(e.target.value)} />

                        <button onClick={() => {handleEdit(); onClose();}}>Save Changes</button>
                        <button onClick={handleDelete}>Delete</button>                    
                    </>
                )}
            </PopupButton>
        </li>
    );
}

export default StatusItem;