import {useState} from 'react'

const API_BASE = import.meta.env.VITE_API_BASE

function AddStatusForm({ onStatusCreated, currentCount }) {
    const [label, setLabel] = useState('');

    // Function to handle submitting a new status
    // POSTs the status data to the database
    async function handleSubmit(e) {
        try {
            e.preventDefault();

            const res = await fetch(`${API_BASE}/statuses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                user_id: 1, // temporary until auth
                label,
                sort_order: currentCount
                }),
            });

            if (!res.ok)
            {  
                const errorData = await res.json();
                throw new Error(errorData.error || `Request failed: ${res.status}`);
            }

            const newStatus = await res.json();
            onStatusCreated(newStatus);
            setLabel('');
        }
        catch(err)
        {
            console.error('Failed to update skill status: ', err);
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="New status" required/>
            <button type="submit">Add Status</button>
        </form>
    );
}

export default AddStatusForm