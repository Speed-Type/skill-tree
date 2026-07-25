import {useState} from 'react';

import StatusSelect from './StatusSelect';
import PopupButton from './PopupButton';

import { Skill, Status, SkillChangedHandler, SkillDeletedHandler } from '../../../shared/types';
import { apiFetch } from '../lib/api';

interface SkillItemProps {
    skill: Skill;
    statuses: Status[];
    onSkillChanged: SkillChangedHandler;
    onSkillDeleted: SkillDeletedHandler;
}

function SkillItem({ skill, statuses, onSkillChanged, onSkillDeleted }: SkillItemProps)
{
    const [label, setLabel] = useState(skill.label);
    const [description, setDescription] = useState(skill.description ?? '');

    // Function to handle editing a skill
    async function handleEdit()
    {
        try {
            const updatedSkill = await apiFetch<Skill>(`/skills/${skill.id}`, {
                method: 'PUT',
                body: JSON.stringify({ label, description }),
            });

            onSkillChanged(updatedSkill);
        }
        catch(err) {
            console.error('Failed to update skill data: ', err);
        }
    }

    // Function to handle deleting a skill
    async function handleDelete()
    {
        try {
            await apiFetch(`/skills/${skill.id}`, { method: 'DELETE' });
            onSkillDeleted(skill.id);
        }
        catch(err) {
            console.error('Failed to update skill data: ', err);
        }
    }

    return(
        <li>
            <strong>{skill.label} </strong>
            
            {<StatusSelect skill = {skill} statuses = {statuses} onSkillChanged={onSkillChanged}/>}

            <PopupButton label = "...">
                {({ onClose }) => (
                    <>
                        <input value={label} onChange={e => setLabel(e.target.value)} />
                        <input value={description} onChange={e => setDescription(e.target.value)} />

                        <button onClick={() => {handleEdit(); onClose();}}>Save Changes</button>
                        <button onClick={handleDelete}>Delete</button>                    
                    </>
                )}
            </PopupButton>
        </li>
    );
}

export default SkillItem;