import {useState} from 'react';
import StatusSelect from './StatusSelect'

const API_BASE = import.meta.env.VITE_API_BASE

function SkillItem({ skill, statuses, onStatusChanged, onSkillChanged, onSkillDeleted })
{
    const [menuOpen, setMenuOpen] = useState(false);
    const [label, setLabel] = useState(skill.label);
    const [description, setDescription] = useState(skill.description ?? '');

    async function handleEdit()
    {
        try {
            const res = await fetch(`${API_BASE}/skills/${skill.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ label, description }) //TODO
            });

            if(!res.ok)
            {
                throw new Error(`Request failed: ${res.status}`);
            }

            const updatedSkill = await res.json();
            onSkillChanged(updatedSkill);
            setMenuOpen(false);
        }
        catch(err) {
            console.error('Failed to update skill data: ', err);
        }
    }

    async function handleDelete()
    {
        try {
            await fetch(`${API_BASE}/skills/${skill.id}`, { method: 'DELETE' });
            onSkillDeleted(skill.id);
            setMenuOpen(false);
        }
        catch(err) {
            console.error('Failed to update skill data: ', err);
        }
    }

    return(
        <li>
            <strong>{skill.label} </strong>
            {<StatusSelect skill = {skill} statuses = {statuses} onStatusChanged={onStatusChanged}/>}
            <button onClick={() => setMenuOpen(true)}>⋯</button>

            {menuOpen && (
                <div className="overlay" onClick={() => setMenuOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <input value={label} onChange={e => setLabel(e.target.value)} />
                        <input value={description} onChange={e => setDescription(e.target.value)} />

                        <button onClick={handleEdit}>Save Changes</button>
                        <button onClick={handleDelete}>Delete</button>
                        <button onClick={() => setMenuOpen(false)}>Cancel</button>
                    </div>
                </div>
            )}
        </li>
    );
}

export default SkillItem;