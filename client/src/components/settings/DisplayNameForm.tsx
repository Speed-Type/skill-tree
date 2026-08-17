import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MAX_LENGTHS } from '../../../../shared/constants';
import { snackbar } from '../../lib/snackbar';
import CharCounter from '../ui/CharCounter';

function DisplayNameForm() {
    const { user, updateDisplayName } = useAuth();
    const [displayName, setDisplayName] = useState(user?.display_name ?? '');

    async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        try {
            await updateDisplayName(displayName);
            snackbar.success('Display name updated successfully');
        }
        catch (err) {
            console.error('Failed to update display name: ', err);
        }
    }

    return (
        <form className="settings-form" onSubmit={handleSubmit}>
            <h3>Change Display Name</h3>
            <p className="settings-form-hint">Shown to visitors of your public trees.</p>
            <div className="input-wrap">
                <input
                    className="input"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    required
                    maxLength={MAX_LENGTHS.displayName}
                />
                <CharCounter value={displayName} max={MAX_LENGTHS.displayName} />
            </div>
            <button className="btn btn-primary" type="submit">Save</button>
        </form>
    );
}

export default DisplayNameForm;