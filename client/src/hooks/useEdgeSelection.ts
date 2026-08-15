import { useState, useEffect } from 'react';

export function useEdgeSelection(isOwner: boolean, onDelete: (id: string) => void) {
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

    // Handle keypress deletes
    useEffect(() => {
        if (!selectedEdgeId || !isOwner) return;

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Backspace' || event.key === 'Delete') {
                onDelete(selectedEdgeId!);
            }
        }

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [selectedEdgeId]);

    // Auto-close edge delete popups
    useEffect(() => {
        if (!selectedEdgeId) return;

        function handleOutsideClick(event: MouseEvent) {
            // If the click is on the edge's own popup button, let that handler run instead
            const target = event.target as HTMLElement;
            if (target.closest('.edge-delete-popup')) return;
            setSelectedEdgeId(null);
        }

        document.addEventListener('mousedown', handleOutsideClick, true); // true = capture phase
        return () => document.removeEventListener('mousedown', handleOutsideClick, true);
    }, [selectedEdgeId]);

    return { selectedEdgeId, setSelectedEdgeId };
}