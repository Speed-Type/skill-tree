import { useState } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import StatusSelect from '../../StatusSelect';
import PopupButton from '../../PopupButton';

import { Skill, Status, SkillChangedHandler, SkillDeletedHandler } from '../../../../../shared/types';
import { apiFetch } from '../../../lib/api';

// Deterministic hue from a status label, so any user-defined status gets a  distinct,
// stable ring color without needing a color field in the schema
function hueFromLabel(label: string): number {
    let hash = 0;
    for (let i = 0; i < label.length; i++) {
        hash = label.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 360;
}

export interface SkillNodeData extends Record<string, unknown> {
    skill: Skill;
    statuses: Status[];
    isOwner: boolean;
    onSkillChanged: SkillChangedHandler;
    onSkillDeleted: SkillDeletedHandler;
}

export type SkillFlowNode = Node<SkillNodeData>;

function SkillNode({ data }: NodeProps<SkillFlowNode>) {

    // Unpack data (needs to be done because of how data is passed into react flow's nodes)
    const { skill, statuses, isOwner, onSkillChanged, onSkillDeleted } = data;

    // States for label and description
    const [label, setLabel] = useState(skill.label);
    const [description, setDescription] = useState(skill.description ?? '');

    // Determine the current status and its associated ring style (just visuals)
    const currentStatus = statuses.find(s => s.id === skill.status_id);
    const ringStyle = currentStatus
        ? ({ '--status-hue': hueFromLabel(currentStatus.label), '--status-glow': 0.35 } as React.CSSProperties)
        : undefined;

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

    const currentStatusLabel = statuses.find(s => s.id === skill.status_id)?.label ?? 'No status';

    return(
        <div className={`skill-node${currentStatus ? '' : ' is-unset'}`} >
            
            {/* Handles to cover node borders */}
            <Handle type="source" position={Position.Top} id="top" className="skill-node-edge-handle skill-node-edge-top" />
            <Handle type="source" position={Position.Right} id="right" className="skill-node-edge-handle skill-node-edge-right" />
            <Handle type="source" position={Position.Bottom} id="bottom" className="skill-node-edge-handle skill-node-edge-bottom" />
            <Handle type="source" position={Position.Left} id="left" className="skill-node-edge-handle skill-node-edge-left" />

            {/* Actual body of the node */}
            <div className="skill-node-body">

                <strong className="skill-node-label">{skill.label}</strong>

                <div className="nodrag skill-node-controls">
                    {isOwner ? (
                        <StatusSelect skill={skill} statuses={statuses} onSkillChanged={onSkillChanged} />
                    ) : (
                        <span>{currentStatusLabel}</span>
                    )}

                    {isOwner && (
                        <PopupButton label="..." className="btn btn-icon">
                            {({ onClose }) => (
                                <div className="status-edit-fields">
                                    {/* Contents of skill edit popup */}
                                    <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} />
                                    <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
                                    
                                    <div className="btn-row">
                                        <button className="btn btn-primary" onClick={() => { handleEdit(); onClose(); }}>Save Changes</button>
                                        <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
                                    </div>
                                </div>
                            )}
                        </PopupButton>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SkillNode;