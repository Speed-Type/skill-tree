// Dropdown component to select a skill's status

import { Skill, Status, SkillChangedHandler } from '../../../shared/types';
import { apiFetch } from '../lib/api';

interface StatusSelectProps {
    skill: Skill;
    statuses: Status[];
    onSkillChanged: SkillChangedHandler;
    // Called after a status (not "None") is successfully applied to a skill,
    // so the parent can bump it to the front of the MRU order
    onStatusUsed: (statusId: number) => void;
}

function StatusSelect({ skill, statuses, onSkillChanged, onStatusUsed }: StatusSelectProps) {
    
    // Function to handle a change in status for a specific skill
    async function handleChange(e: React.ChangeEvent<HTMLSelectElement>)
    {
        // An empty selection means "no status" — send null, not a fake 0/NaN id
        const newStatusId = e.target.value === '' ? null : Number(e.target.value);

        try
        {
            const updatedSkill = await apiFetch<Skill>(`/skills/${skill.id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status_id: newStatusId }),
            });

            onSkillChanged(updatedSkill);

            // Only bump usage for an actual status, not "None"
            if (newStatusId !== null)
            {
                onStatusUsed(newStatusId);
            }
        }
        catch(err)
        {
            console.error('Failed to update skill status: ', err);
        }
    }

    return(
        <select className="input" value = {skill.status_id ?? ''} onChange = {handleChange}>
            <option value="">None</option>
            {statuses.map(status => (
                <option key = {status.id} value = {status.id}>{status.label}</option>
            ))}
        </select>
    )
}

export default StatusSelect;