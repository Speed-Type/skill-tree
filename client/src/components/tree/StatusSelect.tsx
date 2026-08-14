// Dropdown component to select a skill's status

import { Skill, Status, SkillChangedHandler } from '../../../../shared/types';
import { apiFetch } from '../../lib/api';

interface StatusSelectProps {
    skill: Skill;
    statuses: Status[];
    onSkillChanged: SkillChangedHandler;
    onStatusUsed: (statusId: number) => void;
    className?: string;
}

function StatusSelect({ skill, statuses, onSkillChanged, onStatusUsed, className = 'input' }: StatusSelectProps) {
    const currentLabel = statuses.find(s => s.id === skill.status_id)?.label ?? 'No status';
    
    async function handleChange(e: React.ChangeEvent<HTMLSelectElement>)
    {
        const newStatusId = e.target.value === '' ? null : Number(e.target.value);

        try
        {
            const updatedSkill = await apiFetch<Skill>(`/skills/${skill.id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status_id: newStatusId }),
            });

            onSkillChanged(updatedSkill);

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
        <select
            className={className}
            value={skill.status_id ?? ''}
            onChange={handleChange}
            title={currentLabel}
        >
            <option value="">None</option>
            {statuses.map(status => (
                <option key={status.id} value={status.id}>{status.label}</option>
            ))}
        </select>
    )
}

export default StatusSelect;
