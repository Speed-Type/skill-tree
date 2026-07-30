import { useState, useEffect } from 'react';
import { SkillTree } from '../../../shared/types';
import { apiFetch } from '../lib/api';
import { snackbar } from '../lib/snackbar';

interface VisibilityToggleProps {
    tree: SkillTree;
}

function VisibilityToggle({ tree }: VisibilityToggleProps) {
    const [isPublic, setIsPublic] = useState(false);

    useEffect(() => {
        setIsPublic(tree.is_public);
    }, [tree.id, tree.is_public]);

    // Function to handle changing tree visibility
    async function handleVisibilityChange(checked: boolean) {
        try
        {
            await apiFetch<SkillTree>(`/trees/${tree.id}`, {
                method: 'PUT',
                body: JSON.stringify({ is_public: checked }),
            });

            setIsPublic(checked);
            snackbar.success('Tree visibility updated successfully');
        }
        catch(err)
        {
            console.error('Failed to update tree visibility: ', err);
        }
    };

    return (
        <div className="toggle-row">
            <input
                type="checkbox"
                className="toggle"
                checked={isPublic}
                onChange={e => handleVisibilityChange(e.target.checked)}
            />
            <span className={`toggle-label${isPublic ? ' is-on' : ''}`}>
                {isPublic ? 'Public' : 'Private'}
            </span>
        </div>
    );
}

export default VisibilityToggle;