import { useState, useRef } from 'react';

const DEFAULT_CONFIRM_WINDOW_MS = 5000;

/*
    Small reusable "click again to confirm" pattern for destructive actions, so we don't fire
    something irreversible (delete a skill, delete a status, ...) off a single misclick.

    Usage:
        const deleteConfirm = useDoubleConfirm(handleDelete);
        <button onClick={deleteConfirm.trigger}>
            {deleteConfirm.pending ? 'Click again to delete' : 'Delete'}
        </button>

    First call arms `pending` (and auto-disarms after a few seconds if never confirmed, so a
    much-later, unrelated click doesn't unexpectedly trigger the action). A second call while
    still pending actually runs the action and resets.
*/
export function useDoubleConfirm(action: () => void, windowMs: number = DEFAULT_CONFIRM_WINDOW_MS) {
    const [pending, setPending] = useState(false);
    const timeoutRef = useRef<number | undefined>(undefined);

    function trigger() {
        if (pending) {
            window.clearTimeout(timeoutRef.current);
            setPending(false);
            action();
            return;
        }

        setPending(true);
        timeoutRef.current = window.setTimeout(() => setPending(false), windowMs);
    }

    // Lets a caller cancel an armed-but-unconfirmed action, e.g. when the surrounding popup closes
    function reset() {
        window.clearTimeout(timeoutRef.current);
        setPending(false);
    }

    return { pending, trigger, reset };
}