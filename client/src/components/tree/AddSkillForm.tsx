import { Skill, SkillChangedHandler } from '../../../../shared/types';
import { apiFetch } from '../../lib/api';
import { MAX_LENGTHS } from '../../../../shared/constants';
import CharCounter from '../ui/CharCounter';

export interface AddSkillDraft {
    label: string;
    description: string;
}

interface AddSkillFormProps {
    treeId: number;
    draft: AddSkillDraft;
    updateDraft: <K extends keyof AddSkillDraft>(key: K, value: AddSkillDraft[K]) => void;
    onCreated: SkillChangedHandler;
}

function AddSkillForm({ treeId, draft, updateDraft, onCreated }: AddSkillFormProps) {

    async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();

        try
        {
            const newSkill = await apiFetch<Skill>('/skills', {
                method: 'POST',
                body: JSON.stringify({ tree_id: treeId, label: draft.label, description: draft.description, x_position: 0, y_position: 0 }),
            });

            onCreated(newSkill);
        }
        catch(err)
        {
            console.error('Failed to add skill: ', err);
        }
    }

    return (
        <form className="status-edit-fields" onSubmit={handleSubmit}>
            <div className="input-wrap">
                <input
                    className="input skill-card-title-input"
                    value={draft.label}
                    onChange={e => updateDraft('label', e.target.value)}
                    placeholder="New skill"
                    required
                    maxLength={MAX_LENGTHS.skillLabel}
                />
                <CharCounter value={draft.label} max={MAX_LENGTHS.skillLabel} />
            </div>

            <div className="textarea-wrap">
                <textarea
                    className="input skill-card-desc-input"
                    value={draft.description}
                    onChange={e => updateDraft('description', e.target.value)}
                    placeholder="Add a description..."
                    maxLength={MAX_LENGTHS.skillDescription}
                    rows={9}
                />
                <CharCounter value={draft.description} max={MAX_LENGTHS.skillDescription} />
            </div>

            <button className="btn btn-primary" type="submit">Add</button>
        </form>
    );
}

export default AddSkillForm
