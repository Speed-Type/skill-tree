// client/src/components/flow/NewSkillAtPointPopup.tsx
import './NewSkillAtPointPopup.css';

import { createPortal } from 'react-dom';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useDraft } from '../../hooks/useDraft';
import AddSkillForm from '../tree/AddSkillForm';
import { Skill } from '../../../../shared/types';

interface NewSkillAtPointPopupProps {
    treeId: number;
    screenX: number;
    screenY: number;
    flowX: number;
    flowY: number;
    onCreated: (skill: Skill) => void;
    onCancel: () => void;
}

const VIEWPORT_MARGIN = 12; // keep the popup at least this far from any screen edge
const DROP_OFFSET = 12; // vertical gap between the drop point and the popup, same spirit as StatusSelect's 4px gap

function NewSkillAtPointPopup({ treeId, screenX, screenY, flowX, flowY, onCreated, onCancel }: NewSkillAtPointPopupProps) {
    const { draft, updateDraft } = useDraft({ label: '', description: '' });
    const rootRef = useRef<HTMLDivElement>(null);

    // Two-pass positioning to make sure popup doesn't go off screen
    const [style, setStyle] = useState<{ left: number; top: number } | null>(null);

    useLayoutEffect(() => {
        const el = rootRef.current;
        if (!el) return;

        const { width, height } = el.getBoundingClientRect();

        // Naive position: centered under the cursor, offset down
        let left = screenX - width / 2;
        let top = screenY + DROP_OFFSET;

        // Flip above the drop point if there's not enough room below
        if (top + height + VIEWPORT_MARGIN > window.innerHeight) {
            const above = screenY - DROP_OFFSET - height;
            if (above >= VIEWPORT_MARGIN) top = above;
        }

        // Clamp horizontally/vertically so no edge goes off-screen either way
        left = Math.min(Math.max(left, VIEWPORT_MARGIN), window.innerWidth - width - VIEWPORT_MARGIN);
        top = Math.min(Math.max(top, VIEWPORT_MARGIN), window.innerHeight - height - VIEWPORT_MARGIN);

        setStyle({ left, top });
    }, [screenX, screenY]);

    // Close on outside click or Escape
    useEffect(() => {
        function handleOutsideClick(event: MouseEvent) {
            if (!rootRef.current?.contains(event.target as HTMLElement)) onCancel();
        }
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') onCancel();
        }
        document.addEventListener('mousedown', handleOutsideClick, true);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick, true);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onCancel]);

    return createPortal(
        <div
            ref={rootRef}
            className="nodrag nopan nowheel skill-card new-skill-at-point"
            // Rendered off-screen and invisible until the first measurement pass lands,
            // so there's no visible flash/jump from the naive spot to the clamped one
            style={style ? { position: 'fixed', left: style.left, top: style.top } : { position: 'fixed', left: -9999, top: -9999, visibility: 'hidden' }}
        >
            <span className="eyebrow">New skill</span>
            <AddSkillForm
                treeId={treeId}
                draft={draft}
                updateDraft={updateDraft}
                onCreated={onCreated}
                position={{ x: flowX, y: flowY }}
            />
        </div>,
        document.body
    );
}

export default NewSkillAtPointPopup;