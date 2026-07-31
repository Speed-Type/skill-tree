import { useState, useEffect } from 'react';
import { useParams } from 'react-router';

import SkillTreeView from "../components/flow/SkillTreeView";
import AddSkillForm from "../components/AddSkillForm";
import { useSkillTree } from '../hooks/useSkillTree';
import StatusView from '../components/StatusView';
import AddStatusForm from "../components/AddStatusForm";
import PopupButton from '../components/PopupButton';
import VisibilityToggle from '../components/VisibilityToggle';
import LoadingPage from '../pages/LoadingPage';
import NotFoundPage from '../pages/NotFoundPage';
import ErrorPage from '../pages/ErrorPage';
import { useAuth } from '../context/AuthContext';
import { apiFetch, ApiError, NETWORK_ERROR_MESSAGE } from '../lib/api';

import { Skill, SkillEdge, Status } from '../../../shared/types';

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

    const [myStatuses, setMyStatuses] = useState<Status[]>([]);

    useEffect(() => {
        if (!isOwner) return;

        apiFetch<Status[]>('/statuses')
            .then(data => setMyStatuses(data.sort((a, b) => a.sort_order - b.sort_order)))
            .catch(() => setMyStatuses([]));
    }, [isOwner]);

    function handleStatusCreated(newStatus: Status) {
        setMyStatuses(prev => [...prev, newStatus]);
    }

    function handleStatusChanged(updatedStatus: Status) {
        setMyStatuses(prev =>
            prev.map(status => status.id === updatedStatus.id ? updatedStatus : status)
        );
    }

    function handleStatusDeleted(deletedStatusID: number) {
        setMyStatuses(prev => prev.filter(status => status.id !== deletedStatusID));
    }
    
    // Function that rearranges the status list according to most recently used scheme
    async function bumpStatusUsage(statusId: number) {

        // already at the front — nothing to do
        if (myStatuses[0]?.id === statusId) return;

        const status = myStatuses.find(s => s.id === statusId);
        if (!status) return;

        const newSortOrder = (myStatuses[0]?.sort_order ?? 0) - 1;

        // optimistic local reorder
        setMyStatuses(prev =>
            prev
                .map(s => s.id === statusId ? { ...s, sort_order: newSortOrder } : s)
                .sort((a, b) => a.sort_order - b.sort_order)
        );

        try {
            await apiFetch<Status>(`/statuses/${statusId}`, {
                method: 'PUT',
                body: JSON.stringify({ label: status.label, sort_order: newSortOrder }),
            });
        } catch (err) {
            console.error('Failed to persist status usage order: ', err);
        }
    }

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
            
            <main className="app-main">
                <SkillTreeView
                    tree={tree}
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

                {isOwner && ( <AddSkillForm treeId={tree.id} onCreated={handleSkillCreated} /> )}
            </main>
        </div>
    )
}

export default TreePage;