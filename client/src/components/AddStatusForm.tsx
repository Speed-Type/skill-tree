import {useState} from 'react'

import { Status, StatusChangedHandler } from '../../../shared/types';
import { apiFetch } from '../lib/api';

interface AddStatusFormProps {
    onStatusCreated: StatusChangedHandler;
    currentCount: number;
}

function AddStatusForm({ onStatusCreated, currentCount }: AddStatusFormProps) {
    const [label, setLabel] = useState('');

    // Function to handle submitting a new status
    // POSTs the status data to the database
    async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        try {
            e.preventDefault();

            const newStatus = await apiFetch<Status>('/statuses', {
                method: 'POST',
                body: JSON.stringify({ label, sort_order: currentCount}),
            });

            onStatusCreated(newStatus);
            setLabel('');
        }
        catch(err)
        {
            console.error('Failed to create status: ', err);
        }
    }

    return (
        <form className="form-row" onSubmit={handleSubmit}>
            <input className="input" value={label} onChange={e => setLabel(e.target.value)} placeholder="New status" required/>
            <button className="btn btn-primary" type="submit">Add Status</button>
        </form>
    );
}

export default AddStatusForm