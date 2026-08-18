import './VisibilityToggle.css';
import { SkillTree } from '../../../../shared/types';
import { apiFetch } from '../../lib/api';
import { snackbar } from '../../lib/snackbar';

interface VisibilityToggleProps {
    tree: SkillTree;
    onTreeChanged: (updatedTree: SkillTree) => void;
}

function VisibilityToggle({ tree, onTreeChanged }: VisibilityToggleProps) {
    async function handleVisibilityChange(checked: boolean) {
        try {
            const updatedTree = await apiFetch<SkillTree>(`/trees/${tree.id}`, {
                method: 'PUT',
                body: JSON.stringify({ is_public: checked }),
            });

            // Includes the rotated slug when flipping to private — parent needs
            // the full object, not just is_public, to keep the URL in sync
            onTreeChanged(updatedTree);
            snackbar.success('Tree visibility updated successfully');
        }
        catch (err) {
            console.error('Failed to update tree visibility: ', err);
        }
    };

    return (
        <div className="toggle-row">
            <input
                type="checkbox"
                className="toggle"
                checked={tree.is_public}
                onChange={e => handleVisibilityChange(e.target.checked)}
            />
            <span className={`toggle-label${tree.is_public ? ' is-on' : ''}`}>
                {tree.is_public ? 'Public' : 'Private'}
            </span>
        </div>
    );
}

export default VisibilityToggle;
