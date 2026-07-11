import { useState } from 'react';
import { createPortal } from 'react-dom'

function PopupButton({label, children}) {
    const [open, setOpen] = useState(false);

    return(
        <>
            <button onClick = {() => setOpen(true)}>{label}</button>

            {open && createPortal(
                <div className="overlay" onClick={() => setOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        {children ({ onClose: () => setOpen(false)})}
                        <button onClick={() => setOpen(false)}>Close</button>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

export default PopupButton;