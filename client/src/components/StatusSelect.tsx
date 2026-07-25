// Dropdown component to select a skill's status

import { Skill, Status, SkillChangedHandler } from '../../../shared/types';
import { apiFetch } from '../lib/api';

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
            const updatedSkill = await apiFetch<Skill>(`/skills/${skill.id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status_id: newStatusId }),
            });

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