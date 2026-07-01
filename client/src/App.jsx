import { useState, useEffect } from 'react'

import SkillTreeView from "./SkillTreeView"
import AddSkillForm from "./AddSkillForm"
import { useSkillTree } from './useSkillTree'

import './App.css'

function App() {

    const { tree, statuses, loading, error } = useSkillTree(1); //NOTE: the argument 1 is temporary
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

        // Note that this is the same functionality as handleStatusChanged; may be helpful to use the same function for both later
    }

    // Note that this function has an ID parameter (not a skill)
    function handleSkillDeleted(deletedSkillID) {
        setSkills(prev => 
            prev.filter(skill => skill.id !== deletedSkillID)
        );
    }

    function handleStatusChanged(updatedSkill) {
        setSkills(prev =>
            prev.map(skill => skill.id === updatedSkill.id ? updatedSkill : skill)
        );
    }

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Something went wrong.</p>;

    return (
        <>
            <SkillTreeView
                tree={tree}
                skills={skills}
                statuses={statuses}
                onStatusChanged={handleStatusChanged}
                onSkillChanged={handleSkillChanged}
                onSkillDeleted={handleSkillDeleted}
            />
            
            <AddSkillForm treeId={1} onCreated={handleSkillCreated} />
        </>
    )
}

export default App