import StatusSelect from './StatusSelect'

function SkillTreeView({ tree, skills, statuses, onStatusChanged }) {
    const statusLabel = (id) => statuses.find(s => s.id === id)?.label ?? 'Unknown';

    return (
        <div>
            <h2>{tree.title}</h2>
            <ul>
                {skills.map(skill => (
                    <li key={skill.id}>
                        {skill.label} — <strong>{<StatusSelect skill = {skill} statuses = {statuses} onStatusChanged={onStatusChanged}/>}</strong>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default SkillTreeView