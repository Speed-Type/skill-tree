// Dropdown component to select a skill's status

import {useState} from 'react';

import { Skill, Status, SkillChangedHandler } from '../types'

const API_BASE = import.meta.env.VITE_API_BASE;

interface StatusSelectProps {
    skill: Skill;
    statuses: Status[];
    onSkillChanged: SkillChangedHandler;
}

function StatusSelect({ skill, statuses, onSkillChanged }: StatusSelectProps) {
    
    // Function to handle a change in status for a specific skill
    async function handleChange(e: React.ChangeEvent<HTMLSelectElement>)
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

            const updatedSkill: Skill = await res.json();
            onSkillChanged(updatedSkill);
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