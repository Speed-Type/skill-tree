import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDoubleConfirm } from '../../hooks/useDoubleConfirm';

function DeleteAccountSection() {
    const { deleteAccount } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');

    async function handleDelete() {
        try {
            await deleteAccount(currentPassword);
            // No success snackbar — the user is about to be redirected to /login
        }
        catch (err) {
            console.error('Failed to delete account: ', err);
        }
    }

    const deleteConfirm = useDoubleConfirm(handleDelete);

    return (
        <div className="settings-form settings-danger-zone">
            <h3>Delete account</h3>
            <p className="settings-form-hint">
                This permanently deletes your account and every tree, skill, edge, and status you own. This can't be undone.
            </p>
            <input
                className="input"
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                required
            />
            <button
                className={`btn btn-danger${deleteConfirm.pending ? ' is-confirming' : ''}`}
                onClick={deleteConfirm.trigger}
                disabled={!currentPassword}
            >
                {deleteConfirm.pending ? 'Click again to permanently delete' : 'Delete account'}
            </button>
        </div>
    );
}

export default DeleteAccountSection;