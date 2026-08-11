import { useState, useRef } from 'react';
import { Handle, Position, NodeProps, Node, NodeToolbar } from '@xyflow/react';
import StatusSelect from '../../StatusSelect';
import PopupButton from '../../PopupButton';

import { Skill, Status, SkillChangedHandler, SkillDeletedHandler } from '../../../../../shared/types';
import { apiFetch } from '../../../lib/api';
import { snackbar } from '../../../lib/snackbar';
import { MAX_LENGTHS } from '../../../../../shared/constants';
import CharCounter from '../../CharCounter';

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

function SkillNode({ data }: NodeProps<SkillFlowNode>) {

    // Unpack data (needs to be done because of how data is passed into react flow's nodes)
    const { skill, statuses, isOwner, onSkillChanged, onSkillDeleted, onStatusUsed } = data;

    // States for label and description
    const [label, setLabel] = useState(skill.label);
    const [description, setDescription] = useState(skill.description ?? '');

    // Drives the quick-glance tooltip. Shown after a short delay on hover (so it doesn't pop in
    // instantly while just passing the cursor over the graph) and hidden immediately on leave
    const [showTooltip, setShowTooltip] = useState(false);
    const tooltipTimeoutRef = useRef<number | undefined>(undefined);

    function handleMouseEnter() {
        tooltipTimeoutRef.current = window.setTimeout(() => setShowTooltip(true), 400);
    }

    // This function is also used in PopupButton's resetValues below, so that the popup immediately disappears when
    // the popup is closed (fixes a bug where it would remain open because mouseLeave never fires)
    function hideTooltip() {
        window.clearTimeout(tooltipTimeoutRef.current);
        setShowTooltip(false);
    }
 
    // Determine the current status and its associated ring style (just visuals)
    const currentStatus = statuses.find(s => s.id === skill.status_id);
    const ringStyle = currentStatus
        ? ({ '--status-hue': hueFromLabel(currentStatus.label), '--status-glow': 0.35 } as React.CSSProperties)
        : undefined;

    const currentStatusLabel = currentStatus?.label ?? 'No status';
    const hasDescription = !!skill.description?.trim();

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

    return(
        <div 
            className={`skill-node${currentStatus ? '' : ' is-unset'}`} 
            style={ringStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={hideTooltip}
        >
            {/*
              Quick-glance tooltip. isVisible stays tied to hasDescription (so it mounts once,
              rather than mounting/unmounting on every hover — unmounting can't be animated),
              and the actual show/hide is a CSS class driven by showTooltip, so the fade/slide
              transition in SkillFlow.css has something to animate
            */}
            <NodeToolbar
                isVisible={hasDescription}
                position={Position.Top}
                className={`skill-tooltip${showTooltip ? ' is-visible' : ''}`}
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
                            hideTooltip();
                        }}
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
                                        <input
                                            className="input skill-card-title-input"
                                            value={label}
                                            onChange={(e) => setLabel(e.target.value)}
                                            maxLength={MAX_LENGTHS.skillLabel}
                                        />
                                        <CharCounter value={label} max={MAX_LENGTHS.skillLabel} />
                                        <textarea
                                            className="input skill-card-desc-input"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Add a description..."
                                            maxLength={MAX_LENGTHS.skillDescription}
                                            rows={4}
                                        />
                                        <CharCounter value={description} max={MAX_LENGTHS.skillDescription} />
                                        
                                        <div className="btn-row">
                                            <button className="btn btn-primary" onClick={() => { handleEdit(); onClose(); }}>Save Changes</button>
                                            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
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