import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MAX_LENGTHS } from '../../../../shared/constants';
import { snackbar } from '../../lib/snackbar';

interface EmailFormProps {
    onCancel?: () => void;
}

function EmailForm({ onCancel }: EmailFormProps) {
    const { user, updateEmail } = useAuth();
    const [email, setEmail] = useState(user?.email ?? '');
    const [currentPassword, setCurrentPassword] = useState('');

    async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        try {
            await updateEmail(email, currentPassword);
            setCurrentPassword('');
            snackbar.success('Email updated successfully');
            onCancel?.(); // collapse the section now that the change is saved
        }
        catch (err) {
            console.error('Failed to update email: ', err);
        }
    }

    return (
        <form className="settings-form" onSubmit={handleSubmit}>
            <h3>Change Email</h3>
            <input
                className="input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="New email"
                required
                maxLength={MAX_LENGTHS.userEmail}
            />
            <input
                className="input"
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                required
            />

            <div className="btn-row">
                <button className="btn btn-primary" type="submit">Save</button>
                {onCancel && <button className="btn-link" type="button" onClick={onCancel}>Cancel</button>}
            </div>
        </form>
    );
}

export default EmailForm;