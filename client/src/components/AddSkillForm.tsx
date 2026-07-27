import { useState } from 'react';

import { Skill, SkillChangedHandler } from '../../../shared/types';
import { apiFetch } from '../lib/api';

interface AddSkillFormProps {
    treeId: number;
    onCreated: SkillChangedHandler;
}

function AddSkillForm({ treeId, onCreated }: AddSkillFormProps) {
    const [label, setLabel] = useState('')

    // Function to handle submitting a new skill
    // POSTs the skill data to the database
    async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();

        try
        {
            const newSkill = await apiFetch<Skill>('/skills', {
                method: 'POST',
                body: JSON.stringify({ tree_id: treeId, label, x_position: 0, y_position: 0 }),
            });

            onCreated(newSkill);
            setLabel('');
        }
        catch(err)
        {
            console.error('Failed to add skill: ', err);
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="New skill" required/>
            <button type="submit">Add</button>
        </form>
    );
}

export default AddSkillForm