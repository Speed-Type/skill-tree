// Dropdown component to select a skill's status

import './StatusSelect.css';

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom';
import { useOnViewportChange } from '@xyflow/react';
import { Skill, Status, SkillChangedHandler } from '../../../../shared/types';
import { apiFetch } from '../../lib/api';
import { resolveStatusColor } from '../../lib/statusColor';

interface StatusSelectProps {
    skill: Skill;
    statuses: Status[];
    onSkillChanged: SkillChangedHandler;
    onStatusUsed: (statusId: number) => void;
    className?: string;
}

interface MenuPosition {
    left: number;
    top?: number;    // set when opening downward
    bottom?: number; // set when opening upward
}

// Rough ceiling on how tall the menu can get (matches max-height in StatusSelect.css)
// plus the 4px gap above/below the trigger
const MENU_SPACE_ESTIMATE = 224;

function computeMenuPosition(triggerEl: HTMLElement): MenuPosition {
    const rect = triggerEl.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    const openUpward = spaceBelow < MENU_SPACE_ESTIMATE && spaceAbove > spaceBelow;

    return openUpward
        ? { left: rect.left, bottom: window.innerHeight - rect.top + 4 }
        : { left: rect.left, top: rect.bottom + 4 };
}

function StatusSelect({ skill, statuses, onSkillChanged, onStatusUsed, className = 'input' }: StatusSelectProps) {
    const [open, setOpen] = useState(false);
    const [menuPos, setMenuPos] = useState<MenuPosition | null>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    
    const currentStatus = statuses.find(s => s.id === skill.status_id);
    const currentLabel = currentStatus?.label ?? 'No status';

    function handleToggle() {
        if (!open && triggerRef.current) {
            setMenuPos(computeMenuPosition(triggerRef.current));
        }
        setOpen(o => !o);
    }

    // The menu's position is a one-time snapshot in fixed screen coordinates, taken from the
    // trigger's rendered position at open time. Any pan/zoom of the ReactFlow canvas moves the
    // trigger without firing a native scroll/resize event (ReactFlow applies its own transform
    // internally), so that snapshot would otherwise go stale silently. Just close the dropdown
    // the moment the viewport starts moving, rather than trying to track/follow it live.
    useOnViewportChange({
        onStart: () => setOpen(false),
    });

    // Close on outside click — checks both the trigger (rootRef) and the portaled menu,
    // since the menu now lives outside rootRef's DOM subtree entirely
    useEffect(() => {
        if (!open) return;

        function handleOutsideClick(event: MouseEvent) {
            const target = event.target as HTMLElement;
            if (rootRef.current?.contains(target)) return;
            if (target.closest('.status-dropdown-menu')) return;
            setOpen(false);
        }

        document.addEventListener('mousedown', handleOutsideClick, true);
        return () => document.removeEventListener('mousedown', handleOutsideClick, true);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') setOpen(false);
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open]);
    
    async function handleSelect(newStatusId: number | null) {
        setOpen(false);
        if (newStatusId === skill.status_id) return;

        try {
            const updatedSkill = await apiFetch<Skill>(`/skills/${skill.id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status_id: newStatusId }),
            });

            onSkillChanged(updatedSkill);

            if (newStatusId !== null) {
                onStatusUsed(newStatusId);
            }
        }
        catch (err) {
            console.error('Failed to update skill status: ', err);
        }
    }

    return(
        <div className="status-dropdown nodrag" ref={rootRef}>
            <button
                ref={triggerRef}
                type="button"
                className={`${className} status-dropdown-trigger`}
                onClick={handleToggle}
                title={currentLabel}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span
                    className="status-dot"
                    style={currentStatus ? ({ '--status-color': resolveStatusColor(currentStatus) } as React.CSSProperties) : undefined}
                />
                <span className="status-dropdown-trigger-label">{currentLabel}</span>
            </button>

            {open && menuPos && createPortal(
                <ul
                    className="status-dropdown-menu nodrag nopan nowheel"
                    role="listbox"
                    style={{ position: 'fixed', left: menuPos.left, top: menuPos.top, bottom: menuPos.bottom }}
                >

                    <li role="option" aria-selected={skill.status_id === null}>
                        <button type="button" className="status-dropdown-option" onClick={() => handleSelect(null)}>
                            <span className="status-dot status-dot-none" />
                            <span className="status-dropdown-option-label" title="No status">No status</span>
                        </button>
                    </li>
                    {statuses.map(status => (
                        <li key={status.id} role="option" aria-selected={status.id === skill.status_id}>
                            <button
                                type="button"
                                className={`status-dropdown-option${status.id === skill.status_id ? ' is-current' : ''}`}
                                onClick={() => handleSelect(status.id)}
                            >
                                <span
                                    className="status-dot"
                                    style={{ '--status-color': resolveStatusColor(status) } as React.CSSProperties}
                                />
                                <span className="status-dropdown-option-label" title={status.label}>{status.label}</span>
                            </button>
                        </li>
                    ))}
                </ul>,
                document.body
            )}
        </div>
    );
}

export default StatusSelect;
