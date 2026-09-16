// client/src/components/flow/NewSkillAtPointPopup.tsx
import { createPortal } from 'react-dom';
import { useEffect, useRef } from 'react';
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

function NewSkillAtPointPopup({ treeId, screenX, screenY, flowX, flowY, onCreated, onCancel }: NewSkillAtPointPopupProps) {
    const { draft, updateDraft } = useDraft({ label: '', description: '' });
    const rootRef = useRef<HTMLDivElement>(null);

    // Close on outside click or Escape — same pattern as StatusSelect's dropdown
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
            style={{ position: 'fixed', left: screenX, top: screenY, zIndex: 1000 }}
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