import SkillItem from './SkillItem';
import { ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from './flow/nodeTypes';

function SkillTreeView({ tree, skills, edges, statuses, onSkillChanged, onSkillDeleted }) {
    
    const graphNodes = skills.map(skill => ({
        id: String(skill.id), 
        type: 'skill',
        position: { x: skill.x_position, y: skill.y_position },
        data: { 
            skill,
            statuses,
            onSkillChanged,
            onSkillDeleted,
        },
    }));

    const graphEdges = edges.map(edge => ({
        id: String(edge.id),
        source: String(edge.from_skill_id),
        target: String(edge.to_skill_id),
    }));
 
    return (
        <div>
            <h2>{tree.title}</h2>
            {/* <ul>
                {skills.map(skill => (
                    <SkillItem
                        key = {skill.id}
                        skill = {skill}
                        statuses = {statuses}
                        onSkillChanged={onSkillChanged}
                        onSkillDeleted={onSkillDeleted}
                    />
                ))}
            </ul> */}

            <div style={{ height: '500px' }}>
                <ReactFlow
                    nodes={graphNodes}
                    edges={graphEdges}
                    nodeTypes={nodeTypes}
                    fitView
                />
            </div>
        </div>
    );
}

export default SkillTreeView;