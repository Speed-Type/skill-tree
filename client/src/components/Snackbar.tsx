import { useEffect } from 'react';
import { snackbar, useSnackbars, SnackbarItem } from '../lib/snackbar';

const ICONS: Record<SnackbarItem['variant'], string> = {
    success: '✓',
    error: '✕',
    warning: '!',
    info: 'i',
};

function SnackbarRow({ item }: { item: SnackbarItem }) {
    useEffect(() => {
        if (item.duration <= 0) return;
        const timer = setTimeout(() => snackbar.dismiss(item.id), item.duration);
        return () => clearTimeout(timer);
    }, [item.id, item.duration]);

    return (
        <div className={`snackbar snackbar--${item.variant}`} role="status">
            <span className="snackbar__icon" aria-hidden="true">{ICONS[item.variant]}</span>
            <span className="snackbar__message">{item.message}</span>
            <button
                type="button"
                className="snackbar__close"
                onClick={() => snackbar.dismiss(item.id)}
                aria-label="Dismiss notification"
            >
                &times;
            </button>
        </div>
    );
}

// Has no props
// Every part of the app triggers this by calling snackbar.success(...) / snackbar.error(...) etc.
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