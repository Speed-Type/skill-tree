import { useState, useEffect } from 'react';
import { useParams } from 'react-router';

import SkillTreeView from "../components/flow/SkillTreeView";
import AddSkillForm from "../components/AddSkillForm";
import { useSkillTree } from '../hooks/useSkillTree';
import StatusView from '../components/StatusView';
import AddStatusForm from "../components/AddStatusForm";
import PopupButton from '../components/PopupButton';
import VisibilityToggle from '../components/VisibilityToggle';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';

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

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Something went wrong.</p>;
    if (!tree) return <p>No tree found.</p>;

    return (
        <div className="app-shell">
            <header className="app-header">
                <div className="brand">
                    <span className="eyebrow">Skill tree</span>
                    <h1>Map what you know</h1>
                    <p className="tagline">A skill portfolio that shows how things connect, not just a list of them.</p>
                </div>

                {isOwner && (
                    <div>
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
                />

                {isOwner && ( <AddSkillForm treeId={tree.id} onCreated={handleSkillCreated} /> )}
            </main>
        </div>
    )
}

export default TreePage;