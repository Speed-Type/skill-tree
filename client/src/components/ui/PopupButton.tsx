import { useState, useRef, ReactNode } from 'react';
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
