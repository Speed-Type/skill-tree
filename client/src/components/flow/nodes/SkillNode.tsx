import { useState, useEffect } from 'react';
import { Handle, Position, NodeProps, Node, NodeToolbar } from '@xyflow/react';
import StatusSelect from '../../tree/StatusSelect';
import PopupButton from '../../ui/PopupButton';
import { useDoubleConfirm } from '../../../hooks/useDoubleConfirm';
import { useDelayedHover } from '../../../hooks/useDelayedHover';

import { Skill, Status, SkillChangedHandler, SkillDeletedHandler } from '../../../../../shared/types';
import { apiFetch } from '../../../lib/api';
import { snackbar } from '../../../lib/snackbar';
import { MAX_LENGTHS } from '../../../../../shared/constants';
import CharCounter from '../../ui/CharCounter';

// Deterministic hue from a status label, so any user-defined status gets a distinct,
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
    onStatusUsed: (statusId: number) => void;
}

export type SkillFlowNode = Node<SkillNodeData>;

function SkillNode({ data, dragging }: NodeProps<SkillFlowNode>) {

    // Unpack data (needs to be done because of how data is passed into react flow's nodes)
    const { skill, statuses, isOwner, onSkillChanged, onSkillDeleted, onStatusUsed } = data;

    // States for label and description
    const [label, setLabel] = useState(skill.label);
    const [description, setDescription] = useState(skill.description ?? '');
 
    // Determine the current status and its associated ring style (just visuals)
    const currentStatus = statuses.find(s => s.id === skill.status_id);
    const ringStyle = currentStatus
        ? ({ '--status-hue': hueFromLabel(currentStatus.label), '--status-glow': 0.35 } as React.CSSProperties)
        : undefined;

    const currentStatusLabel = currentStatus?.label ?? 'No status';
    const hasDescription = !!skill.description?.trim();

    // ======================= Hover Tooltip ==========================

    const tooltip = useDelayedHover(400, dragging);

    function handleMouseEnter() {
        // If the node is being dragged quickly, this can trigger because the cursor leaves the node and then comes back
        // Here, we check that we're dragging so that this can't trigger again
        if (dragging) return;

        tooltip.show();
    }

    // Hide tooltip once the node starts dragging
    useEffect(() => {
        if (dragging) tooltip.hide();
    }, [dragging]);

    // ======================= Handlers ==========================

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
            snackbar.success('Skill deleted successfully');
        }
        catch(err) {
            console.error('Failed to delete skill data: ', err);
        }
    }

    // Requires a second confirming click before actually calling handleDelete
    const deleteConfirm = useDoubleConfirm(handleDelete);

    return(
        <div 
            className={`skill-node${currentStatus ? '' : ' is-unset'}`} 
            style={ringStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={tooltip.hide}
        >
            {/*
              Quick-glance tooltip. isVisible stays tied to hasDescription (so it mounts once,
              rather than mounting/unmounting on every hover — unmounting can't be animated),
              and the actual show/hide is a CSS class driven by showTooltip, so the fade/slide
              transition in flow.css has something to animate
            */}
            <NodeToolbar
                isVisible={hasDescription}
                position={Position.Top}
                className={`skill-tooltip${tooltip.isVisible ? ' is-visible' : ''}`}
                offset={10}
            >
                <span className="skill-tooltip-text">{skill.description}</span>
            </NodeToolbar>
            
            {/* Handles to cover node borders */}
            <Handle type="source" position={Position.Top} id="top" className="skill-node-edge-handle skill-node-edge-top" isConnectable={isOwner} />
            <Handle type="source" position={Position.Right} id="right" className="skill-node-edge-handle skill-node-edge-right" isConnectable={isOwner} />
            <Handle type="source" position={Position.Bottom} id="bottom" className="skill-node-edge-handle skill-node-edge-bottom" isConnectable={isOwner} />
            <Handle type="source" position={Position.Left} id="left" className="skill-node-edge-handle skill-node-edge-left" isConnectable={isOwner} />

            {/* Actual body of the node — inherits --status-hue/--status-glow from the wrapper above */}
            <div className="skill-node-body">

                <strong className="skill-node-label">{skill.label}</strong>

                <div className="nodrag skill-node-controls">
                    {isOwner ? (
                        <StatusSelect
                            skill={skill}
                            statuses={statuses}
                            onSkillChanged={onSkillChanged}
                            onStatusUsed={onStatusUsed}
                            className="skill-node-status-select"
                        />
                    ) : (
                        <span className="skill-node-status-chip" title={currentStatusLabel}>{currentStatusLabel}</span>
                    )}

                    {/* Click-through detail card — available to everyone, editable only for the owner */}
                    <PopupButton
                        label="..."
                        className="btn btn-icon skill-node-inspect-btn"
                        resetValues={() => {
                            setLabel(skill.label);
                            setDescription(skill.description ?? '');
                            tooltip.hide();
                            deleteConfirm.reset();
                        }}

                        // Only owners can actually edit these fields, so this is always false
                        // for viewers — nothing to guard there
                        isDirty={() => isOwner && (label !== skill.label || description !== (skill.description ?? ''))}
                    >
                        {({ onClose }) => (
                            <div className="skill-card">
                                <div className="skill-card-header">
                                    <span className="eyebrow">Skill</span>
                                    <span className="skill-card-badge" style={ringStyle}>{currentStatusLabel}</span>
                                </div>
 
                                {/* Contents of skill edit popup */}
                                {isOwner ? (
                                    <>
                                        <div className="input-wrap">
                                            <input
                                                className="input skill-card-title-input"
                                                value={label}
                                                onChange={(e) => setLabel(e.target.value)}
                                                maxLength={MAX_LENGTHS.skillLabel}
                                            />
                                            <CharCounter value={label} max={MAX_LENGTHS.skillLabel} />
                                        </div>
                                        
                                        <div className="textarea-wrap">
                                            <textarea
                                                className="input skill-card-desc-input"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Add a description..."
                                                maxLength={MAX_LENGTHS.skillDescription}
                                                rows={9}
                                            />
                                            <CharCounter value={description} max={MAX_LENGTHS.skillDescription} />
                                        </div>

                                        <div className="btn-row">
                                            <button className="btn btn-primary" onClick={() => { handleEdit(); onClose(); }}>Save Changes</button>
                                            
                                            <button
                                                className={`btn btn-danger${deleteConfirm.pending ? ' is-confirming' : ''}`}
                                                onClick={deleteConfirm.trigger}
                                            >
                                                {deleteConfirm.pending ? 'Click again to delete' : 'Delete'}
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="skill-card-title">{skill.label}</h3>
                                        <p className="skill-card-desc">
                                            {skill.description?.trim() || 'No description provided.'}
                                        </p>
                                    </>
                                )}
                            </div>
                        )}
                    </PopupButton>
                </div>
            </div>
        </div>
    );
}

export default SkillNode;