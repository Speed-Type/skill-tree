import {useState} from 'react';

const API_BASE = import.meta.env.VITE_API_BASE;

function StatusSelect({ skill, statuses, onStatusChanged })
{
    async function handleChange(e)
    {
        const newStatusId = Number(e.target.value);

        try
        {
            const res = await fetch(`${API_BASE}/skills/${skill.id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status_id: newStatusId }),
            });

            if (!res.ok)
            {  
                const errorData = await res.json();
                throw new Error(errorData.error || `Request failed: ${res.status}`);
            }

            const updatedSkill = await res.json();
            onStatusChanged(updatedSkill);
        }
        catch(err)
        {
            console.error('Failed to update skill status: ', err);
        }
    }

    return(
        <select value = {skill.status_id ?? ''} onChange = {handleChange}>
            {statuses.map(status => (
                <option key = {status.id} value = {status.id}>{status.label}</option>
            ))}
        </select>
    )
}

export default StatusSelect;