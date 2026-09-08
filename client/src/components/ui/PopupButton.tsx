import { useState, useRef, useEffect, ReactNode } from 'react';
import { useDoubleConfirm } from '../../hooks/useDoubleConfirm';
import { createPortal } from 'react-dom'

interface PopupButtonProps {
    label: ReactNode;
    className?: string;
    // The onClose passed to children is always an immediate, unguarded close — it's meant for
    // "I just saved/deleted, now close me" flows where there's nothing left to lose by closing
    children: (args: { onClose: () => void }) => ReactNode;
    // Optional function that can be passed in, usually for resetting popup values
    resetValues?: () => void;

    // Optional guard, checked only when the user tries to dismiss via the built-in Close button
    // or by clicking outside the modal, or via Escape (i.e. NOT via a child explicitly calling onClose after
    // an explicit Save/Delete). If it returns true, the first dismiss attempt is intercepted
    // with a warning instead of closing; a second attempt within a few seconds actually closes.
    isDirty?: () => boolean;
}

/*
    Shared stack of currently-open popups' guarded-close callbacks, most-recently-opened last.

    Popups are portaled to document.body (see the createPortal call below), so a "nested" popup
    — e.g. Add Status opened from inside Edit Statuses — isn't actually a DOM descendant of its
    logical parent; they're siblings under body. That means native DOM event bubbling can't tell
    us which one is innermost. This stack does that job instead: Escape always acts on whichever
    popup is on top, and closing it (fully or via the double-confirm warning) naturally reveals
    the next one down for the next Escape press.
*/
const openPopupStack: Array<() => void> = [];

function handleGlobalEscape(e: KeyboardEvent) {
    if (e.key !== 'Escape') return;
    const top = openPopupStack[openPopupStack.length - 1];
    top?.();
}

// Ref-counted so exactly one document-level listener exists regardless of how many
// PopupButtons are mounted/open at once
let escapeListenerCount = 0;
function subscribeToEscape(): () => void {
    if (escapeListenerCount === 0) {
        document.addEventListener('keydown', handleGlobalEscape);
    }
    escapeListenerCount++;

    return () => {
        escapeListenerCount--;
        if (escapeListenerCount === 0) {
            document.removeEventListener('keydown', handleGlobalEscape);
        }
    };
}

function PopupButton({label, className = 'btn btn-icon', children, resetValues, isDirty}: PopupButtonProps) {
    const [open, setOpen] = useState(false);

    const handleOpen = () => {
        setOpen(true);
        closeConfirm.reset();
        resetValues?.();
    };

    // The real close, which happens immediately, without guard
    const handleClose = () => {
        setOpen(false);
        closeConfirm.reset();
        resetValues?.();
    };

    // Requires a second confirming click (or Escape press) before actually calling handleClose
    const closeConfirm = useDoubleConfirm(handleClose);

    // Guarded close, used for the overlay click, the built-in Close button, and Escape
    const requestClose = () => {
        if (isDirty?.()) {
            closeConfirm.trigger();
            return;
        }
        handleClose();
    };

    // The stack needs a stable function identity to push/pop, but should always invoke
    // whatever the current requestClose closure is (it captures fresh isDirty/closeConfirm
    // each render) — a ref bridges that without re-subscribing on every render
    const requestCloseRef = useRef(requestClose);
    requestCloseRef.current = requestClose;

    // Push this popup onto the shared stack exactly while it's open, and keep the shared
    // Escape listener alive for as long as any popup anywhere is open
    useEffect(() => {
        if (!open) return;

        const stackEntry = () => requestCloseRef.current();
        openPopupStack.push(stackEntry);
        const unsubscribe = subscribeToEscape();

        return () => {
            const idx = openPopupStack.indexOf(stackEntry);
            if (idx !== -1) openPopupStack.splice(idx, 1);
            unsubscribe();
       };
    }, [open]);

    const overlayMouseDownRef = useRef(false);

    function handleOverlayMouseDown(e: React.MouseEvent<HTMLDivElement>) {
        overlayMouseDownRef.current = e.target === e.currentTarget;
    }

    function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
        if (overlayMouseDownRef.current && e.target === e.currentTarget) {
            requestClose();
        }
    }

    return(
        <>
            <button className={className} onClick={handleOpen}>{label}</button>

            {open && createPortal(
                <div className="overlay" onClick={handleOverlayClick} onMouseDown={handleOverlayMouseDown}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        {children({ onClose: handleClose })}

                        {closeConfirm.pending && (
                            <p className="popup-discard-warning">Warning: You have unsaved changes.</p>
                        )}

                        <button
                            className={`btn${closeConfirm.pending ? ' btn-danger' : ''}`}
                            onClick={() => requestClose()}
                        >
                            {closeConfirm.pending ? 'Discard changes' : 'Close'}
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

export default PopupButton;
