import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { snackbar } from '../../lib/snackbar';

function PasswordForm() {
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
            />
            <input
                className="input"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
            />
            <button className="btn btn-primary" type="submit">Save</button>
        </form>
    );
}

export default PasswordForm;