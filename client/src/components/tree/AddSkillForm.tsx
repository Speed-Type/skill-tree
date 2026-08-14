import { useState } from 'react';
import { Skill, SkillChangedHandler } from '../../../../shared/types';
import { apiFetch } from '../../lib/api';
import { MAX_LENGTHS } from '../../../../shared/constants';
import CharCounter from '../ui/CharCounter';

interface AddSkillFormProps {
    treeId: number;
    onCreated: SkillChangedHandler;
}

function AddSkillForm({ treeId, onCreated }: AddSkillFormProps) {
    const [label, setLabel] = useState('')

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
        <form className="panel form-row" onSubmit={handleSubmit}>
            <div className="input-wrap">
                <input
                    className="input"
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                    placeholder="New skill"
                    required
                    maxLength={MAX_LENGTHS.skillLabel}
                />
                <CharCounter value={label} max={MAX_LENGTHS.skillLabel} />
            </div>

            <button className="btn btn-primary" type="submit">Add</button>
        </form>
    );
}

export default AddSkillForm
