import { useState, useEffect } from 'react';

import SkillTreeView from "./components/SkillTreeView";
import AddSkillForm from "./components/AddSkillForm";
import { useSkillTree } from './hooks/useSkillTree';
import StatusView from './components/StatusView';
import AddStatusForm from "./components/AddStatusForm";
import PopupButton from './components/PopupButton';

function App() {

    const { tree, statuses: initialStatuses, loading, error } = useSkillTree(1); //NOTE: the argument 1 is temporary

    // ===================================== Skill Handling =====================================

    const [skills, setSkills] = useState([]);

    //Seed local skills state once the tree data arrives
    useEffect(() => {
        if (tree) setSkills(tree.skills);
    }, [tree]);

    function handleSkillCreated(newSkill) {
        setSkills(prev => [...prev, newSkill]);
    }

    function handleSkillChanged(updatedSkill) {
        setSkills(prev =>
            prev.map(skill => skill.id === updatedSkill.id ? updatedSkill : skill)
        );
    }

    // Note that this function has an ID parameter (not a skill)
    function handleSkillDeleted(deletedSkillID) {
        setSkills(prev => 
            prev.filter(skill => skill.id !== deletedSkillID)
        );
    }

    // ===================================== Status Handling =====================================

    const [statuses, setStatuses] = useState([]);

    //Seed local statuses state once the tree data arrives
    useEffect(() => {
        if (initialStatuses.length > 0) setStatuses(initialStatuses);
    }, [initialStatuses]);

    function handleStatusCreated(newStatus)
    {
        setStatuses(prev => [...prev, newStatus]);
    }

    function handleStatusChanged(updatedStatus)
    {
        setStatuses(prev =>
            prev.map(status => status.id === updatedStatus.id ? updatedStatus : status)
        );
    }

    // Note that this function has an ID parameter (not a status)
    function handleStatusDeleted(deletedStatusID)
    {
        setStatuses(prev => prev.filter(status => status.id !== deletedStatusID));
    }


    //NOTE: this is a sort of temporary solution to be able to grab the edges
    const [edges, setEdges] = useState([]);

    //Seed local edges state once the tree data arrives
    useEffect(() => {
        if (tree) setEdges(tree.edges);
    }, [tree]);



    if (loading) return <p>Loading...</p>;
    if (error) return <p>Something went wrong.</p>;

    return (
        <>
            <SkillTreeView
                tree={tree}
                skills={skills}
                edges={edges}
                statuses={statuses}
                onSkillChanged={handleSkillChanged}
                onSkillDeleted={handleSkillDeleted}
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