import { useState } from 'react';

function PopupButton({label, children}) {
    const [open, setOpen] = useState(false);

    return(
        <>
            <button onClick = {() => setOpen(true)}>{label}</button>

            {open && (
                <div className="overlay" onClick={() => setMenuOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        {children({ onClose: () => setOpen(false)})}
                        <button onClick={() => setOpen(false)}>Close</button>
                    </div>
                </div>
            )}
        </>
    );
}

export default PopupButton;