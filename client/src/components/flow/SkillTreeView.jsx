import '@xyflow/react/dist/style.css';
import './SkillFlow.css';

import { useEffect, useCallback } from 'react';
import { ReactFlow, useNodesState, useEdgesState, addEdge } from '@xyflow/react';
import { nodeTypes } from './nodeTypes';
import { edgeTypes } from './edgeTypes';
import SkillItem from './../SkillItem';

const API_BASE = import.meta.env.VITE_API_BASE;

function SkillTreeView({ tree, skills, edges, statuses, onSkillChanged, onSkillDeleted, onEdgeCreated, onEdgeDeleted }) {
    
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
            data: { onDelete: handleEdgeDelete}
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

    // Sends request to update backend with new node position
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

            if (!res.ok)
            {  
                const errorData = await res.json();
                throw new Error(errorData.error || `Request failed: ${res.status}`);
            }

            const updatedSkill = await res.json();
            onSkillChanged(updatedSkill);
        }
        catch(err) {
            console.error('Failed to save node position: ', err);
        }
    }

    // Sends request to create new edge from one node to another
    // The connection handler that actually makes the API call
    async function handleConnect(connection)
    {
        // Check whether this edge connects a node to itself
        if (connection.source === connection.target) return;

        try {
            const res = await fetch(`${API_BASE}/edges`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from_skill_id: connection.source,
                    to_skill_id: connection.target,
                }),
            });

            if (!res.ok)
            {  
                const errorData = await res.json();
                throw new Error(errorData.error || `Request failed: ${res.status}`);
            }

            const newEdge = await res.json();
            onEdgeCreated(newEdge);
        } catch (err) {
            console.error('Failed to create edge: ', err);
        }
    }

    // Middleman function used to create connections when dragging from a border to the body of another node
    // Calls handleConnect for actual edge creation in backend
    const onConnectEnd = useCallback((event, connectionState) => {
        // If it ended on a valid handle, onConnect already fired — nothing more to do
        if (connectionState.isValid) return;

        // Otherwise, check if the drop point landed inside a node's DOM element
        const targetEl = event.target.closest('.react-flow__node');
        if (!targetEl) return; // dropped on empty canvas, ignore

        const targetNodeId = targetEl.getAttribute('data-id');
        const sourceNodeId = connectionState.fromNode?.id;

        if (!targetNodeId || !sourceNodeId || targetNodeId === sourceNodeId) return;

        handleConnect({
            source: sourceNodeId,
            target: targetNodeId,
            sourceHandle: connectionState.fromHandle?.id ?? null,
            targetHandle: null,
        });
    }, [handleConnect]);

    // Handles deletion of a single edge
    async function handleEdgeDelete(deletedEdgeId) {
        try {
            const res = await fetch(`${API_BASE}/edges/${deletedEdgeId}`, { method: 'DELETE' });

            if (!res.ok)
            {  
                const errorData = await res.json();
                throw new Error(errorData.error || `Request failed: ${res.status}`);
            }

            onEdgeDeleted(deletedEdgeId);
        } catch (err) {
            console.error('Failed to delete edge: ', err);
        }
    }

    // Handles deletion of edges (PLURAL) in the backend
    // This is its own function because of ReactFlow's onEdgesDelete event
    async function handleEdgesDelete(deletedEdges) {
        for (const edge of deletedEdges) {
            handleEdgeDelete(edge.id);
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
                    onConnectEnd={onConnectEnd}
                    deleteKeyCode={['Backspace', 'Delete']}
                    onEdgesDelete={handleEdgesDelete}
                    connectionMode="loose"
                    fitView
                />
            </div>
        </div>
    );
}

export default SkillTreeView;