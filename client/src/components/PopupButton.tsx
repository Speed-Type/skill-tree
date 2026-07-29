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

import { useState, ReactNode } from 'react';
import { createPortal } from 'react-dom'

interface PopupButtonProps {
    label: string;
    className?: string;
    children: (args: { onClose: () => void }) => ReactNode;
    // Optional function that can be passed in, usually for resetting popup values
    resetValues?: () => void;
}

function PopupButton({label, className = 'btn btn-icon', children, resetValues}: PopupButtonProps) {
    const [open, setOpen] = useState(false);

    const handleOpen = () => {
        setOpen(true);
        resetValues?.();
    };

    const handleClose = () => {
        setOpen(false);
        resetValues?.();
    };

    return(
        <>
            <button className={className} onClick={handleOpen}>{label}</button>

            {open && createPortal(
                <div className="overlay" onClick={() => handleClose()}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        {children({ onClose: handleClose })}
                        <button className="btn" onClick={() => handleClose()}>Close</button>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

export default PopupButton;