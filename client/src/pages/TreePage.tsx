import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import SkillTreeView from "../components/flow/SkillTreeView";
import AddSkillForm from "../components/AddSkillForm";
import { useSkillTree } from '../hooks/useSkillTree';
import StatusView from '../components/StatusView';
import AddStatusForm from "../components/AddStatusForm";
import PopupButton from '../components/PopupButton';

import { Skill, SkillEdge, Status } from '../../../shared/types';

function TreePage() {
    const { treeId } = useParams<{ treeId: string }>();
    const { tree, statuses: initialStatuses, loading, error } = useSkillTree(Number(treeId));

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

    const [statuses, setStatuses] = useState<Status[]>([]);

    useEffect(() => {
        if (initialStatuses.length > 0) setStatuses(initialStatuses);
    }, [initialStatuses]);

    function handleStatusCreated(newStatus: Status) {
        setStatuses(prev => [...prev, newStatus]);
    }

    function handleStatusChanged(updatedStatus: Status) {
        setStatuses(prev =>
            prev.map(status => status.id === updatedStatus.id ? updatedStatus : status)
        );
    }

    function handleStatusDeleted(deletedStatusID: number) {
        setStatuses(prev => prev.filter(status => status.id !== deletedStatusID));
    }

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
        <>
            <SkillTreeView
                tree={tree}
                skills={skills}
                edges={edges}
                statuses={statuses}
                onSkillChanged={handleSkillChanged}
                onSkillDeleted={handleSkillDeleted}
                onEdgeCreated={handleEdgeCreated}
                onEdgeDeleted={handleEdgeDeleted}
            />
            
            <AddSkillForm treeId={tree.id} onCreated={handleSkillCreated} />

            <PopupButton label = "Edit Statuses">
                {({ onClose }) => (
                    <>
                        <StatusView
                            statuses={statuses}
                            onStatusChanged={handleStatusChanged}
                            onStatusDeleted={handleStatusDeleted}
                        />
                        <AddStatusForm
                            currentCount={statuses.length}
                            onStatusCreated={handleStatusCreated}
                        />               
                    </>
                )}
            </PopupButton>
        </>
    )
}

export default TreePage;