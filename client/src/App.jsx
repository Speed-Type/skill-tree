import { useState, useEffect } from 'react'

import SkillTreeView from "./SkillTreeView"
import AddSkillForm from "./AddSkillForm"
import { useSkillTree } from './useSkillTree'

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

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Something went wrong.</p>;

    return (
        <>
            <SkillTreeView tree={tree} skills={skills} statuses={statuses} />
            <AddSkillForm treeId={1} onCreated={handleSkillCreated} />
        </>
    )
}

export default App