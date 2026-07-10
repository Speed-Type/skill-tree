import SkillItem from './SkillItem'

function SkillTreeView({ tree, skills, statuses, onSkillChanged, onSkillDeleted }) {
    return (
        <div>
            <h2>{tree.title}</h2>
            <ul>
                {skills.map(skill => (
                    <SkillItem
                        key = {skill.id}
                        skill = {skill}
                        statuses = {statuses}
                        onSkillChanged={onSkillChanged}
                        onSkillDeleted={onSkillDeleted}
                    />
                ))}
            </ul>
        </div>
    );
}

export default SkillTreeView;