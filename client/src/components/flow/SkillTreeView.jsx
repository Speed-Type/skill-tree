import '@xyflow/react/dist/style.css';
import './SkillFlow.css';

import { useEffect } from 'react';
import SkillItem from './../SkillItem';
import { ReactFlow, useNodesState, useEdgesState, addEdge } from '@xyflow/react';
import { nodeTypes } from './nodeTypes';
import { edgeTypes } from './edgeTypes';

const API_BASE = import.meta.env.VITE_API_BASE;


function SkillTreeView({ tree, skills, edges, statuses, onSkillChanged, onSkillDeleted, onEdgeCreated }) {
    
    const buildNodes = () => 
        skills.map(skill => ({
            id: String(skill.id), 
            type: 'skill',
            position: { x: skill.x_position, y: skill.y_position },
            data: { 
                skill,
                statuses,
                onSkillChanged,
                onSkillDeleted,
            },
        }));

    const buildEdges = () => 
        edges.map(edge => ({
            id: String(edge.id),
            source: String(edge.from_skill_id),
            target: String(edge.to_skill_id),
            type: 'floating',
        }));

    const [nodes, setNodes, onNodesChange] = useNodesState(buildNodes());
    const [edgesState, setEdgesState, onEdgesChange] = useEdgesState(buildEdges());

    // Re-sync whenever the skills themselves change (e.g. on a skill delete, status edit, etc.)
    useEffect(() => {
        setNodes(buildNodes());
    }, [skills, statuses]);

    useEffect(() => {
        setEdgesState(buildEdges());
    }, [edges]);

    async function handleNodeDragStop(event, node) {

        //Check whether there has been any change in location at all (i.e. the node was not just clicked)
        const original = skills.find(s => String(s.id) === node.id);
        if (
            original &&
            Number(original.x_position) === node.position.x &&
            Number(original.y_position) === node.position.y
        ) {
            return; // no movement, skip the save
        }

        try {
            const res = await fetch(`${API_BASE}/skills/${node.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({
                    x_position: node.position.x,
                    y_position: node.position.y,
                }),
            });

            if (!res.ok) throw new Error(`Request failed: ${res.status}`);

            const updatedSkill = await res.json();
            onSkillChanged(updatedSkill);
        }
        catch(err) {
            console.error('Failed to save node position: ', err);
        }
    }

    async function handleConnect(connection)
    {
        try {
            const res = await fetch(`${API_BASE}/edges`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from_skill_id: connection.source,
                    to_skill_id: connection.target,
                }),
            });

            if (!res.ok) throw new Error(`Request failed: ${res.status}`);

            const newEdge = await res.json();
            onEdgeCreated(newEdge);
        } catch (err) {
            console.error('Failed to create edge: ', err);
        }
    }
 
    return (
        <div>
            <h2>{tree.title}</h2>
            {/* <ul>
                {skills.map(skill => (
                    <SkillItem
                        key = {skill.id}
                        skill = {skill}
                        statuses = {statuses}
                        onSkillChanged={onSkillChanged}
                        onSkillDeleted={onSkillDeleted}
                    />
                ))}
            </ul> */}

            <div style={{ height: '500px' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edgesState}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    onNodeDragStop={handleNodeDragStop}
                    onConnect={handleConnect}
                    fitView
                />
            </div>
        </div>
    );
}

export default SkillTreeView;