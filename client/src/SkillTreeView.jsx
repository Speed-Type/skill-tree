function SkillTreeView({ tree, skills, statuses }) {
    const statusLabel = (id) => statuses.find(s => s.id === id)?.label ?? 'Unknown';

    return (
        <div>
            <h2>{tree.title}</h2>
            <ul>
                {skills.map(skill => (
                    <li key={skill.id}>
                        {skill.label} — <strong>{statusLabel(skill.status_id)}</strong>
                        <select name="status">
                            <option value="volvo">Volvo</option>
                            <option value="saab">Saab</option>
                            <option value="mercedes">Mercedes</option>
                            <option value="audi">Audi</option>
                        </select>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default SkillTreeView