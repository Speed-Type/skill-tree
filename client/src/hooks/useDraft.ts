import { useState } from 'react';

export function useDraft<T extends Record<string, unknown>>(source: T) {
    const [draft, setDraft] = useState<T>(source);

    function updateDraft<K extends keyof T>(key: K, value: T[K]) {
        setDraft(prev => ({ ...prev, [key]: value }));
    }

    // Resets the draft back to the current source values — pass as PopupButton's resetValues
    function resetDraft() {
        setDraft(source);
    }

    // True if any field differs from source — pass as PopupButton's isDirty
    function draftIsDirty() {
        return (Object.keys(source) as (keyof T)[]).some(key => draft[key] !== source[key]);
    }

    return { draft, updateDraft, resetDraft, draftIsDirty };
}