import SkillItem from './SkillItem'

function SkillTreeView({ tree, skills, statuses, onStatusChanged, onSkillChanged, onSkillDeleted }) {
    const statusLabel = (id) => statuses.find(s => s.id === id)?.label ?? 'Unknown';

    return (
        <div>
            <h2>{tree.title}</h2>
            <ul>
                {skills.map(skill => (
                    <SkillItem
                        key = {skill.id}
                        skill = {skill}
                        statuses = {statuses}
                        onStatusChanged={onStatusChanged}
                        onSkillChanged={onSkillChanged}
                        onSkillDeleted={onSkillDeleted}
                    />
                ))}
            </ul>
        </div>
    );
}

export default SkillTreeView