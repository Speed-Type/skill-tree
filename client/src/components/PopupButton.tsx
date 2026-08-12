// Generic popup element

// Example usage (no preservation of popup values):

/*

<PopupButton label="...">
    {({ onClose }) => (
        <>
            <!--Contents of skill edit popup here-->

            <input value={label} onChange={(e) => setLabel(e.target.value)} />
            <input value={description} onChange={(e) => setDescription(e.target.value)} />
            
            <button onClick={() => { handleEdit(); onClose(); }}>Save Changes</button>
            <button onClick={handleDelete}>Delete</button>
        </>
    )}
</PopupButton>

*/

// Example usage (with preservation of popup values):

/*

<PopupButton label = "Edit Name" resetValues={() => setNewTreeName(treeName)}>
    {({ onClose }) => (
        <div className="status-edit-fields">
            <input className="input" value={newTreeName} onChange={e => setNewTreeName(e.target.value)} />
            
            <div className="btn-row">
                <button className="btn btn-primary" onClick={() => { handleNameChange(); onClose(); }}>Save Changes</button>
            </div>
        </div>
    )}
</PopupButton>

*/

// Example usage (with an unsaved-changes guard on Close/click-outside):

/*

<PopupButton
    label="Edit"
    resetValues={() => setDraft(value)}
    isDirty={() => draft !== value}
>
    {({ onClose }) => (
        <>
            <input value={draft} onChange={e => setDraft(e.target.value)} />
            <button onClick={() => { handleSave(); onClose(); }}>Save Changes</button>
        </>
    )}
</PopupButton>

*/

import { useState, useRef, ReactNode } from 'react';
import { useDoubleConfirm } from '../hooks/useDoubleConfirm';
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
    // or by clicking outside the modal (i.e. NOT via a child explicitly calling onClose after
    // an explicit Save/Delete). If it returns true, the first dismiss attempt is intercepted
    // with a warning instead of closing; a second attempt within a few seconds actually closes.
    isDirty?: () => boolean;
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

    // Requires a second confirming click before actually calling handleClose
    const closeConfirm = useDoubleConfirm(handleClose);

    // Guarded close, used for the overlay click and the built-in Close button
    const requestClose = () => {
        if (isDirty?.()) {
            closeConfirm.trigger();
            return;
        }
        handleClose();
    };

    // A click's target is wherever the cursor is on mouseup, not where the drag/click started —
    // so selecting text (or dragging anything) that begins inside the modal but is released over
    // the backdrop would otherwise register as a click directly on the overlay and incorrectly
    // dismiss it, without .modal's onClick/stopPropagation ever getting a chance to run (the
    // event never actually passes through .modal in that case). Tracking where the mousedown
    // itself started fixes this: only treat it as a backdrop dismiss if it started there too.
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