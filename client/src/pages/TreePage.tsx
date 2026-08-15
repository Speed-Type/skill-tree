import '../components/tree/tree.css';

import { useState, useEffect } from 'react';
import { useParams } from 'react-router';

import SkillTreeView from "../components/flow/SkillTreeView";
import AddSkillForm from "../components/tree/AddSkillForm";
import { useSkillTree } from '../hooks/useSkillTree';
import { useStatuses } from '../hooks/useStatuses';
import { useDraft } from '../hooks/useDraft';
import StatusView from '../components/tree/StatusView';
import AddStatusForm from "../components/tree/AddStatusForm";
import PopupButton from '../components/ui/PopupButton';
import VisibilityToggle from '../components/tree/VisibilityToggle';
import LoadingPage from '../pages/LoadingPage';
import NotFoundPage from '../pages/NotFoundPage';
import ErrorPage from '../pages/ErrorPage';
import { MAX_LENGTHS } from '../../../shared/constants';
import CharCounter from '../components/ui/CharCounter';
import { useAuth } from '../context/AuthContext';

import { apiFetch, ApiError, NETWORK_ERROR_MESSAGE } from '../lib/api';
import { Skill, SkillEdge } from '../../../shared/types';
import { snackbar } from '../lib/snackbar';


function TreePage() {
    const { treeId } = useParams<{ treeId: string }>();
    const { user } = useAuth();
    const { tree, loading, error } = useSkillTree(Number(treeId));

    const isOwner = !!user && !!tree && user.id === tree.user_id;

    // ===================================== Skill Handling =====================================

    const [skills, setSkills] = useState<Skill[]>([]);

    useEffect(() => {
        if (tree) setSkills(tree.skills);
    }, [tree]);

    function handleSkillCreated(newSkill: Skill) {
        setSkills(prev => [...prev, newSkill]);
    }

    function handleSkillChanged(updatedSkill: Skill) {
        setSkills(prev =>
            prev.map(skill => skill.id === updatedSkill.id ? updatedSkill : skill)
        );
    }

    // Note that this function has an ID parameter (not a skill)
    function handleSkillDeleted(deletedSkillID: number) {
        setSkills(prev => 
            prev.filter(skill => skill.id !== deletedSkillID)
        );
    }

    // ===================================== Status Handling =====================================

    // The owner's full personal status list — includes statuses not yet assigned to any skill

    // This is separately (and only for the owner) since it's a different scope than "statuses
    // currently used in this tree," which is what tree.statuses gives non-owners for display

    const { statuses: myStatuses, handleStatusCreated, handleStatusChanged, handleStatusDeleted, bumpStatusUsage } = useStatuses(isOwner);

    // The list of statuses to display in the UI
    // (if owner, all the owner's statuses; if not, just those present in the tree)
    const displayStatuses = isOwner ? myStatuses : (tree?.statuses ?? []);

    // ===================================== Edge Handling =====================================

    const [edges, setEdges] = useState<SkillEdge[]>([]);

    // Seed local edges state once the tree data arrives
    useEffect(() => {
        if (tree) setEdges(tree.edges);
    }, [tree]);

    function handleEdgeCreated(newEdge: SkillEdge) {
        setEdges(prev => [...prev, newEdge]);
    }

    function handleEdgeDeleted(deletedEdgeId: string) {
        setEdges(prev => prev.filter(e => String(e.id) !== deletedEdgeId));
        // Note that these id's need to be cast because deletedEdgeId is a String from buildEdges() in SkillTreeView
    }

    // ======================= Tree Name Handling ==========================

    // treeName is the committed value shown in the header; synced from tree once it loads
    const [treeName, setTreeName] = useState('');

    // draft.title is the editable value inside the rename popup
    const { draft, updateDraft, resetDraft, draftIsDirty } = useDraft({ title: treeName });

    // Seed local tree name state once the tree data arrives
    useEffect(() => {
        if (tree) setTreeName(tree.title);
    }, [tree]);

    // Function to handle the actual change to the tree name in the database
    async function handleNameChange() {
        if(!tree) return; // Guard for typescript that tree is not null beyond this point

        try {
            await apiFetch(`/trees/${tree.id}`, {
                method: 'PUT',
                body: JSON.stringify({ title: draft.title }),
            });
            setTreeName(draft.title);
            snackbar.success('Tree name updated successfully');
        } catch (err) {
            console.error('Failed to update tree name: ', err);
        }
    }

    // ===========================================================================================

    if (loading) return <LoadingPage message="Loading skill tree..." />;
    if (error) {
        if (error instanceof ApiError && error.status === 0) {
            return <ErrorPage message={NETWORK_ERROR_MESSAGE} />;
        }
        else if (error instanceof ApiError && error.status === 404) {
            return <NotFoundPage message="This skill tree doesn't exist, or is private." />;
        }
        return <ErrorPage message="Something went wrong loading this tree." />;
    }
    // This case should never actually happen, but it's helpful for TypeScript to know that tree won't be null past this check
    if (!tree) return <ErrorPage message="Something went wrong loading this tree." />;

    return (
        <div className="app-shell">
            <header className="app-header">
                <div className="brand">
                    <span className="eyebrow">Skill tree</span>
                    <h1>Map what you know</h1>
                    <p className="tagline">A skill portfolio that shows how things connect, not just a list of them.</p>
                </div>

                {isOwner && (
                    <div className="header-actions">
                        <PopupButton label = "Edit Statuses">
                            {({ onClose }) => (
                                <>
                                    <StatusView
                                        statuses={myStatuses}
                                        onStatusChanged={handleStatusChanged}
                                        onStatusDeleted={handleStatusDeleted}
                                    />
                                    <AddStatusForm
                                        currentCount={myStatuses.length}
                                        onStatusCreated={handleStatusCreated}
                                    />
                                </>
                            )}
                        </PopupButton>

                        <VisibilityToggle tree={tree} />
                    </div>
                )}
            </header>
            
            {/* Main content area */}
            <main className="app-main">
                <div className="panel">
                    <div className="tree-title-row">
                        <h2>{treeName}</h2>

                        {/* Tree name edit popup */}
                        {isOwner && (
                            <PopupButton 
                                label = {(
                                    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M13.5 3.5l3 3L6 17H3v-3L13.5 3.5z" />
                                    </svg>
                                )}
                                className="btn btn-icon"
                                resetValues={resetDraft}
                                isDirty={draftIsDirty}
                            >
                                {({ onClose }) => (
                                    <div className="status-edit-fields">
                                        <div className="input-wrap">
                                            <input
                                                className="input"
                                                value={draft.title}
                                                onChange={e => updateDraft('title', e.target.value)}
                                                maxLength={MAX_LENGTHS.treeTitle}
                                            />
                                            <CharCounter value={draft.title} max={MAX_LENGTHS.treeTitle} />
                                        </div>

                                        <div className="btn-row">
                                            <button className="btn btn-primary" onClick={() => { handleNameChange(); onClose(); }}>Save Changes</button>
                                        </div>
                                    </div>
                                )}
                            </PopupButton>
                        )}
                    </div>

                    <SkillTreeView
                        skills={skills}
                        edges={edges}
                        statuses={displayStatuses}
                        isOwner={isOwner}
                        onSkillChanged={handleSkillChanged}
                        onSkillDeleted={handleSkillDeleted}
                        onEdgeCreated={handleEdgeCreated}
                        onEdgeDeleted={handleEdgeDeleted}
                        onStatusUsed={bumpStatusUsage}
                    />
                </div>

                {isOwner && ( <AddSkillForm treeId={tree.id} onCreated={handleSkillCreated} /> )}
            </main>
        </div>
    )
}

export default TreePage;