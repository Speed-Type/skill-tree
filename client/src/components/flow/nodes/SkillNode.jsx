import { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import StatusSelect from '../../StatusSelect';
import PopupButton from '../../PopupButton';

const API_BASE = import.meta.env.VITE_API_BASE;

function SkillNode({ data })
{
    const { skill, statuses, onSkillChanged, onSkillDeleted } = data;

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
        }
        catch(err) {
            console.error('Failed to update skill data: ', err);
        }
    }

    return(
        <div
            style={{ padding: 10, border: '1px solid #333', borderRadius: 6, background: '#fff' }}
            // stops dragging the node from hijacking clicks on inputs/buttons inside it
            className="nodrag">
            
            <Handle type="target" position={Position.Top} />

            <strong>{skill.label}</strong>
            <StatusSelect skill={skill} statuses={statuses} onStatusChanged={onSkillChanged} />

            <PopupButton label="...">
                {({ onClose }) => (
                    <>
                        <input value={label} onChange={(e) => setLabel(e.target.value)} />
                        <input value={description} onChange={(e) => setDescription(e.target.value)} />
                        
                        <button onClick={() => { handleEdit(); onClose(); }}>Save Changes</button>
                        <button onClick={handleDelete}>Delete</button>
                    </>
                )}
            </PopupButton>

            <Handle type="source" position={Position.Bottom} />
        </div>
    );
}

export default SkillNode