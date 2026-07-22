import { useState } from 'react';

import { Skill, SkillChangedHandler } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE

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
            const res = await fetch(`${API_BASE}/skills`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tree_id: treeId, label, x_position: 0, y_position: 0 }),
            });

            if (!res.ok)
            {  
                const errorData = await res.json();
                throw new Error(errorData.error || `Request failed: ${res.status}`);
            }

            const newSkill: Skill = await res.json();
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