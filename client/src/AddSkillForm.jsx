import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE


function AddSkillForm({ treeId, onCreated }) {
    const [label, setLabel] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        const res = await fetch(`${API_BASE}/skills`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tree_id: treeId, label, x_position: 0, y_position: 0 }),
        });
        const newSkill = await res.json();
        onCreated(newSkill);
        setLabel('');
    }

    return (
        <form onSubmit={handleSubmit}>
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="New skill" />
            <button type="submit">Add</button>
        </form>
    );
}

export default AddSkillForm