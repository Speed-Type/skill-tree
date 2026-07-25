import { useState } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import StatusSelect from '../../StatusSelect';
import PopupButton from '../../PopupButton';

import { Skill, Status, SkillChangedHandler, SkillDeletedHandler } from '../../../../../shared/types';
import { apiFetch } from '../../../lib/api';

export interface SkillNodeData extends Record<string, unknown> {
    skill: Skill;
    statuses: Status[];
    onSkillChanged: SkillChangedHandler;
    onSkillDeleted: SkillDeletedHandler;
}

export type SkillFlowNode = Node<SkillNodeData>;

function SkillNode({ data }: NodeProps<SkillFlowNode>) {

    // Unpack data (needs to be done because of how data is passed into react flow's nodes)
    const { skill, statuses, onSkillChanged, onSkillDeleted } = data;

    // States for label and description
    const [label, setLabel] = useState(skill.label);
    const [description, setDescription] = useState(skill.description ?? '');

    // Function to handle edits of this node
    async function handleEdit()
    {
        try {
            const updatedSkill = await apiFetch<Skill>(`/skills/${skill.id}`, {
                method: 'PUT',
                body: JSON.stringify({ label, description })
            });

            onSkillChanged(updatedSkill);
        }
        catch(err) {
            console.error('Failed to update skill data: ', err);
        }
    }

    // Function to handle the deletion of this node
    async function handleDelete()
    {
        try {
            await apiFetch(`/skills/${skill.id}`, { method: 'DELETE' });
            onSkillDeleted(skill.id);
        }
        catch(err) {
            console.error('Failed to update skill data: ', err);
        }
    }

    return(
        <div className="skill-node" >
            
            {/* Handles to cover node borders */}
            <Handle type="source" position={Position.Top} id="top" className="skill-node-edge-handle skill-node-edge-top" />
            <Handle type="source" position={Position.Right} id="right" className="skill-node-edge-handle skill-node-edge-right" />
            <Handle type="source" position={Position.Bottom} id="bottom" className="skill-node-edge-handle skill-node-edge-bottom" />
            <Handle type="source" position={Position.Left} id="left" className="skill-node-edge-handle skill-node-edge-left" />

            {/* Actual body of the node */}
            <div className="skill-node-body">

                <strong>{skill.label}</strong>

                <div className="nodrag">
                    <StatusSelect skill={skill} statuses={statuses} onSkillChanged={onSkillChanged} />

                    <PopupButton label="...">
                        {({ onClose }) => (
                            <>
                                {/* Contents of skill edit popup */}
                                <input value={label} onChange={(e) => setLabel(e.target.value)} />
                                <input value={description} onChange={(e) => setDescription(e.target.value)} />
                                
                                <button onClick={() => { handleEdit(); onClose(); }}>Save Changes</button>
                                <button onClick={handleDelete}>Delete</button>
                            </>
                        )}
                    </PopupButton>
                </div>
            </div>
        </div>
    );
}

export default SkillNode;