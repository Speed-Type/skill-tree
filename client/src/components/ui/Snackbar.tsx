import './Snackbar.css';
import { useEffect, useState } from 'react';
import { snackbar, useSnackbars, SnackbarItem } from '../../lib/snackbar';

const ICONS: Record<SnackbarItem['variant'], string> = {
    success: '✓',
    error: '✕',
    warning: '!',
    info: 'i',
};

const EXIT_DURATION = 160; // ms; must match the .snackbar--leaving animation length in CSS

function SnackbarRow({ item }: { item: SnackbarItem }) {
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        if (!isLeaving) return;
        const timer = setTimeout(() => snackbar.dismiss(item.id), EXIT_DURATION);
        return () => clearTimeout(timer);
    }, [isLeaving, item.id]);

    useEffect(() => {
        if (item.duration <= 0) return;
        const timer = setTimeout(() => setIsLeaving(true), item.duration);
        return () => clearTimeout(timer);
    }, [item.id, item.duration]);

    return (
        <div className={`snackbar snackbar--${item.variant}${isLeaving ? ' snackbar--leaving' : ''}`} role="status">
            <span className="snackbar__icon" aria-hidden="true">{ICONS[item.variant]}</span>
            <span className="snackbar__message">{item.message}</span>
            <button
                type="button"
                className="snackbar__close"
                onClick={() => setIsLeaving(true)}
                aria-label="Dismiss notification"
            >
                &times;
            </button>
        </div>
    );
}

function SnackbarContainer() {
    const items = useSnackbars();

    if (items.length === 0) return null;

    return (
        <div className="snackbar-container" aria-live="polite">
            {items.map(item => (
                <SnackbarRow key={item.id} item={item} />
            ))}
        </div>
    );
}

export default SnackbarContainer;
