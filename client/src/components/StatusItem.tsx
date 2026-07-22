import { useState } from 'react';

import PopupButton from './PopupButton';

import { Status, StatusChangedHandler, StatusDeletedHandler } from '../../../shared/types';

const API_BASE = import.meta.env.VITE_API_BASE;

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
            const res = await fetch(`${API_BASE}/statuses/${status.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ label })
            });

            if (!res.ok)
            {  
                const errorData = await res.json();
                throw new Error(errorData.error || `Request failed: ${res.status}`);
            }

            const updatedStatus: Status = await res.json();
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
            await fetch(`${API_BASE}/statuses/${status.id}`, { method: 'DELETE' });
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