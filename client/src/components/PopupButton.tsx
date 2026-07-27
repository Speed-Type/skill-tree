// Generic popup element
// Example usage:

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

import { useState, ReactNode } from 'react';
import { createPortal } from 'react-dom'

interface PopupButtonProps {
    label: string;
    className?: string;
    children: (args: { onClose: () => void }) => ReactNode;
}

function PopupButton({label, className = 'btn btn-icon', children}: PopupButtonProps) {
    const [open, setOpen] = useState(false);

    return(
        <>
            <button className={className} onClick = {() => setOpen(true)}>{label}</button>

            {open && createPortal(
                <div className="overlay" onClick={() => setOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        {children ({ onClose: () => setOpen(false)})}
                        <button className="btn" onClick={() => setOpen(false)}>Close</button>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

export default PopupButton;