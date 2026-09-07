import '../components/tree/tree.css';
import './TreePage.css';

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';

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
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router';

import { apiFetch, ApiError, NETWORK_ERROR_MESSAGE } from '../lib/api';
import { Skill, SkillEdge, SkillTree } from '../../../shared/types';
import { snackbar } from '../lib/snackbar';


function TreePage() {
    const { treeSlug } = useParams<{ treeSlug: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { tree, setTree, loading, error } = useSkillTree(treeSlug);
    useDocumentTitle(tree?.title);

    const isOwner = !!user && !!tree && user.id === tree.user_id;

    // ===================================== Skill Handling =====================================

    const [skills, setSkills] = useState<Skill[]>([]);

    useEffect(() => {
        if (tree) setSkills(tree.skills);
    }, [tree?.id]);

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

    // Draft for new skill form
    const {
        draft: newSkillDraft,
        updateDraft: updateNewSkillDraft,
        resetDraft: resetNewSkillDraft,
        draftIsDirty: newSkillDraftIsDirty,
    } = useDraft({ label: '', description: '' });

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
    }, [tree?.id]);

    function handleEdgeCreated(newEdge: SkillEdge) {
        setEdges(prev => [...prev, newEdge]);
    }

    function handleEdgeDeleted(deletedEdgeId: string) {
        setEdges(prev => prev.filter(e => String(e.id) !== deletedEdgeId));
        // Note that these id's need to be cast because deletedEdgeId is a String from buildEdges() in SkillTreeView
    }

    // ======================= Tree Title/Description Handling ==========================

    // Committed values shown in the header; synced from tree once it loads
    const [treeName, setTreeName] = useState('');
    const [treeDescription, setTreeDescription] = useState('');

    // Editable draft inside the rename/edit popup
    const { draft, updateDraft, resetDraft, draftIsDirty } = useDraft({
        title: treeName,
        description: treeDescription,
    });

    // Seed local tree name state once the tree data arrives
    useEffect(() => {
        if (tree)
        {
            setTreeName(tree.title);
            setTreeDescription(tree.description || '');
        }
    }, [tree?.id]);

    // Replace whitespace with a single space to avoid weird issues
    const descriptionPreview = treeDescription.replace(/\s+/g, ' ').trim();

    // Function to handle the actual change to the tree title/description in the database
    async function handleTreeDetailsChange() {
        if (!tree) return; // Guard for typescript that tree is not null beyond this point

        try {
            await apiFetch(`/trees/${tree.id}`, {
                method: 'PUT',
                body: JSON.stringify({ title: draft.title, description: draft.description }),
            });
            setTreeName(draft.title);
            setTreeDescription(draft.description);

            snackbar.success('Tree details updated successfully');
        } catch (err) {
            console.error('Failed to update tree details: ', err);
        }
    }

    // ======================= Visibility Handling ==========================

    function handleTreeChanged(updatedTree: SkillTree) {
        setTree(prev => prev ? { ...prev, ...updatedTree } : prev);

        // The slug rotates whenever the tree goes private (see server/routes/trees.ts).
        // If it changed, the URL in the address bar now points at a dead link — swap it
        // for the new one without adding a history entry, so Back doesn't return to a 404
        if (updatedTree.slug !== treeSlug) {
            navigate(`/trees/${updatedTree.slug}`, { replace: true });
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
        <div className="tree-page">
            <header className="tree-page-header">
                <div className="tree-page-top-row">
                    {/* If viewing this as a non-owner, show owner's display name */}
                    <span
                        className="eyebrow"
                        title={!isOwner ? `${tree.owner_display_name}'s Skill Tree` : 'Skill Tree'}
                    >
                        {!isOwner && (tree.owner_display_name + "'s")} Skill Tree
                    </span>

                    {/* Header Actions */}
                    <div className="header-actions">
                        {/* Everyone gets a way back to main menu, either tree list or login page */}
                        <Link className="btn btn-icon" to={user ? '/trees' : '/login'}>
                            {user ? 'Your trees' : 'Log in'}
                        </Link>

                        {/* For logged in users */}
                        {user && (
                            <Link className="btn btn-icon" to="/settings" state={{ from: location.pathname }} title="Account settings">Settings</Link>
                        )}
                    </div>
                
                </div>

                <div className="tree-page-meta">
                    <div className="tree-page-title-row">
                        <h1 className="tree-page-title">{treeName}</h1>
                        
                        {/* Tree details edit popup */}
                        {(isOwner || treeDescription) && (
                            <PopupButton 
                                label = {(
                                    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M13.5 3.5l3 3L6 17H3v-3L13.5 3.5z" />
                                    </svg>
                                )}
                                className="btn btn-icon"
                                resetValues={isOwner? resetDraft: undefined}
                                isDirty={isOwner? draftIsDirty: undefined}
                            >
                                {({ onClose }) => (
                                    isOwner ? (
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

                                            <div className="textarea-wrap">
                                                <textarea
                                                    className="input skill-card-desc-input"
                                                    value={draft.description}
                                                    onChange={e => updateDraft('description', e.target.value)}
                                                    placeholder="Add a description..."
                                                    maxLength={MAX_LENGTHS.treeDescription}
                                                    rows={9}
                                                />
                                                <CharCounter value={draft.description} max={MAX_LENGTHS.treeDescription} />
                                            </div>

                                            <div className="btn-row">
                                                <button className="btn btn-primary" onClick={() => { handleTreeDetailsChange(); onClose(); }}>Save Changes</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="skill-card">
                                            <span className="eyebrow">Tree details</span>
                                            <h3 className="skill-card-title">{treeName}</h3>
                                            <p className="skill-card-desc">{treeDescription}</p>
                                        </div>
                                    )
                                )}
                            </PopupButton>
                        )}

                        {/* Owner-only: Status edit and visibility toggle */}
                        {isOwner && (
                            <div className="tree-page-controls-row">
                                <PopupButton label = "Edit Statuses">
                                    {({ onClose }) => (
                                        <>
                                            <StatusView
                                                statuses={myStatuses}
                                                onStatusChanged={handleStatusChanged}
                                                onStatusDeleted={handleStatusDeleted}
                                            />
                                            
                                            <PopupButton label="Add Status" className="btn btn-primary">
                                                {() => (
                                                    <AddStatusForm
                                                        currentCount={myStatuses.length}
                                                        onStatusCreated={handleStatusCreated}
                                                    />
                                                )}
                                            </PopupButton>
                                        </>
                                    )}
                                </PopupButton>

                                <VisibilityToggle tree={tree} onTreeChanged={handleTreeChanged} />
                            </div>
                        )}
                    </div>

                    {treeDescription && <p className="tree-page-description">{descriptionPreview}</p>}
                </div>
            </header>

            {/* Main content area */}
            <div className="tree-page-canvas-wrap">
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

                {isOwner && (
                    <PopupButton
                        label={(
                            <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M10 3v14M3 10h14" />
                            </svg>
                        )}
                        className="btn tree-add-skill-fab"
                        resetValues={resetNewSkillDraft}
                        isDirty={newSkillDraftIsDirty}
                    >
                        {({ onClose }) => (
                            <div className="skill-card">
                                <span className="eyebrow">New skill</span>
                                <AddSkillForm
                                    treeId={tree.id}
                                    draft={newSkillDraft}
                                    updateDraft={updateNewSkillDraft}
                                    onCreated={(skill) => {
                                        handleSkillCreated(skill);
                                        resetNewSkillDraft();
                                        onClose();
                                    }}
                                />
                            </div>
                        )}
                    </PopupButton>
                )}
            </div>
        </div>
    )
}

export default TreePage;