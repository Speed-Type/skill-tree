import { useState, useEffect } from 'react';

import SkillTreeView from "./components/flow/SkillTreeView";
import AddSkillForm from "./components/AddSkillForm";
import { useSkillTree } from './hooks/useSkillTree';
import StatusView from './components/StatusView';
import AddStatusForm from "./components/AddStatusForm";
import PopupButton from './components/PopupButton';

import { Skill, SkillEdge, Status } from './types';

function App() {

    const { tree, statuses: initialStatuses, loading, error } = useSkillTree(1); //NOTE: the argument 1 is temporary

    // ===================================== Skill Handling =====================================

    const [skills, setSkills] = useState<Skill[]>([]);

    //Seed local skills state once the tree data arrives
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

    //Seed local statuses state once the tree data arrives
    useEffect(() => {
        if (initialStatuses.length > 0) setStatuses(initialStatuses);
    }, [initialStatuses]);

    function handleStatusCreated(newStatus: Status)
    {
        setStatuses(prev => [...prev, newStatus]);
    }

    function handleStatusChanged(updatedStatus: Status)
    {
        setStatuses(prev =>
            prev.map(status => status.id === updatedStatus.id ? updatedStatus : status)
        );
    }

    // Note that this function has an ID parameter (not a status)
    function handleStatusDeleted(deletedStatusID: number)
    {
        setStatuses(prev => prev.filter(status => status.id !== deletedStatusID));
    }

    // ===================================== Edge Handling =====================================

    const [edges, setEdges] = useState<SkillEdge[]>([]);

    //Seed local edges state once the tree data arrives
    useEffect(() => {
        if (tree) setEdges(tree.edges);
    }, [tree]);

    function handleEdgeCreated(newEdge: SkillEdge)
    {
        setEdges(prev => [...prev, newEdge]);
    }

    function handleEdgeDeleted(deletedEdgeId: string) {
        setEdges(prev => prev.filter(e => String(e.id) !== deletedEdgeId));
        // Note that these id's need to be cast because deletedEdgeId is a String from buildEdges() in SkillTreeView
    }

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
            
            <AddSkillForm treeId={1} onCreated={handleSkillCreated} />

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

export default App;