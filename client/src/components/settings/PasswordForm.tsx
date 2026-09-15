import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { snackbar } from '../../lib/snackbar';
import { PASSWORD_MIN_LENGTH } from '../../../../shared/constants';

interface PasswordFormProps {
    onCancel?: () => void;
}

function PasswordForm({ onCancel }: PasswordFormProps) {
    const { updatePassword } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            snackbar.error("New passwords don't match");
            return;
        }

        try {
            await updatePassword(newPassword, currentPassword);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            snackbar.success('Password updated successfully');
            onCancel?.(); // collapse the section now that the change is saved
        }
        catch (err) {
            console.error('Failed to update password: ', err);
        }
    }

    return (
        <form className="settings-form" onSubmit={handleSubmit}>
            <h3>Change Password</h3>
            <input
                className="input"
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                required
            />
            <input
                className="input"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New password"
                required
                minLength={PASSWORD_MIN_LENGTH}
            />
            <input
                className="input"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
            />
            
            <div className="btn-row">
                <button className="btn btn-primary" type="submit">Save</button>
                {onCancel && <button className="btn-link" type="button" onClick={onCancel}>Cancel</button>}
            </div>
        </form>
    );
}

export default PasswordForm;