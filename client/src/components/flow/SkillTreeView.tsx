import '@xyflow/react/dist/style.css';
import './SkillFlow.css';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ReactFlow, useNodesState, useEdgesState, OnNodeDrag, Connection, OnConnectEnd, ConnectionMode, IsValidConnection } from '@xyflow/react';
import { nodeTypes } from './nodeTypes';
import { edgeTypes } from './edgeTypes';
import { SkillFlowNode } from './nodes/SkillNode';
import { FloatingSkillEdge } from './edges/FloatingEdge';
import CustomConnectionLine from './connectionLines/CustomConnectionLine';

import { TreeWithDetails, Skill, SkillEdge, Status, SkillChangedHandler, SkillDeletedHandler } from '../../types';

const API_BASE = import.meta.env.VITE_API_BASE;

interface SkillTreeViewProps {
    tree: TreeWithDetails;
    skills: Skill[];
    edges: SkillEdge[];
    statuses: Status[];
    onSkillChanged: SkillChangedHandler;
    onSkillDeleted: SkillDeletedHandler;
    onEdgeCreated: (newEdge: SkillEdge) => void;
    onEdgeDeleted: (deletedEdgeID: string) => void;
}

function SkillTreeView({ tree, skills, edges, statuses, onSkillChanged, onSkillDeleted, onEdgeCreated, onEdgeDeleted }: SkillTreeViewProps) {
    
    // ======================= Tracking Delete Popups for Edges ==========================

    const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
    const reactFlowWrapperRef = useRef<HTMLDivElement>(null);

    // Handle keypress deletes
    useEffect(() => {
        if (!selectedEdgeId) return;

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Backspace' || event.key === 'Delete') {
                handleEdgeDelete(selectedEdgeId!);
            }
        }

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [selectedEdgeId]);

    // Auto-close edge delete popups
    useEffect(() => {
        if (!selectedEdgeId) return;

        function handleOutsideClick(event: MouseEvent) {
            // If the click is on the edge's own popup button, let that handler run instead
            const target = event.target as HTMLElement;
            if (target.closest('.edge-delete-popup')) return;
            setSelectedEdgeId(null);
        }

        document.addEventListener('mousedown', handleOutsideClick, true); // true = capture phase
        return () => document.removeEventListener('mousedown', handleOutsideClick, true);
    }, [selectedEdgeId]);

    // ====================== Convert/maintain props to states for React Flow component =========================

    // Function to build node data from skills prop
    const buildNodes = (): SkillFlowNode[] => 
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

    // Function to build edge data from edges prop
    const buildEdges = (): FloatingSkillEdge[] => 
        edges.map(edge => ({
            id: String(edge.id),
            source: String(edge.from_skill_id),
            target: String(edge.to_skill_id),
            type: 'floating',
            data: { 
                onDelete: handleEdgeDelete,
                isSelected: selectedEdgeId === String(edge.id),
                onSelect: () => setSelectedEdgeId(String(edge.id)),
            }
        }));

    // Nodes and edges states (different than regular react useState; react flow specific)
    const [nodes, setNodes, onNodesChange] = useNodesState<SkillFlowNode>(buildNodes());
    const [edgesState, setEdgesState, onEdgesChange] = useEdgesState<FloatingSkillEdge>(buildEdges());

    // Re-sync whenever the skills themselves change (e.g. on a skill delete, status edit, etc.)
    useEffect(() => {
        setNodes(buildNodes());
    }, [skills, statuses]);

    useEffect(() => {
        setEdgesState(buildEdges());
    }, [edges, selectedEdgeId]);

    // ===================================== Node handling ==================================================

    // Handles node dragging
    // Sends request to update backend with new node position
    const handleNodeDragStop : OnNodeDrag<SkillFlowNode> = async (event, node) => {

        //Check whether there has been any change in location at all (i.e. the node was not just clicked)
        const original = skills.find(s => String(s.id) === node.id);
        if (
            original &&
            original.x_position === node.position.x &&
            original.y_position === node.position.y
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

            const updatedSkill: Skill = await res.json();
            onSkillChanged(updatedSkill);
        }
        catch(err) {
            console.error('Failed to save node position: ', err);
        }
    }

    // ========================================= Edge handling =============================================

    // Handles edge creation
    // The connection handler that sends the actual API request
    async function handleConnect(connection: Connection)
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

            const newEdge: SkillEdge = await res.json();
            onEdgeCreated(newEdge);
        } catch (err) {
            console.error('Failed to create edge: ', err);
        }
    }

    // Middleman function used to create connections when dragging from a border to the body of another node
    // Calls handleConnect for actual edge creation in backend
    const onConnectEnd: OnConnectEnd = useCallback((event, connectionState) => {
        // If it ended on a valid handle, onConnect already fired — nothing more to do
        if (connectionState.isValid) return;

        // Otherwise, check if the drop point landed inside a node's DOM element
        const target = event.target as HTMLElement;
        const targetEl = target.closest('.react-flow__node');
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
    async function handleEdgeDelete(deletedEdgeId: string) {
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
    async function handleEdgesDelete(deletedEdges: FloatingSkillEdge[]) {
        for (const edge of deletedEdges) {
            handleEdgeDelete(edge.id);
        }
    }

    // ========================================= Other ReactFlow Props =============================================

    // Prop for ReactFlow component that prevents self connections
    const isValidConnection: IsValidConnection<FloatingSkillEdge> = useCallback((connection) => {
        return connection.source !== connection.target;
    }, []);

    // ========================================= Component HTML =============================================
 
    return (
        <div>
            <h2>{tree.title}</h2>

            <div style={{ height: '500px' }} ref={reactFlowWrapperRef}>
                <ReactFlow
                    // Node and edge data
                    nodes={nodes}
                    edges={edgesState}

                    // Custom node and edge objects to display the data
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}

                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeDragStop={handleNodeDragStop} // Callback for node movement
                    onConnect={handleConnect} // Callback for connection on node border
                    onConnectEnd={onConnectEnd} // Callback used to check for connection on node body

                    // Connection settings
                    connectionLineComponent={CustomConnectionLine} // Custom line for while connection is being dragged
                    isValidConnection={isValidConnection} // Custom criteria for valid connections

                    // Other settings
                    connectionMode={ConnectionMode.Loose}
                    fitView

                    // Possibly temporary
                    connectOnClick={false} // At least for now, we don't want to have another way to create edges
                    deleteKeyCode={null} // Currently, node deletion this way isn't synced to backend
                    multiSelectionKeyCode={null} // Multi-selection and bulk dragging doesn't sync correctly right now
                />
            </div>
        </div>
    );
}

export default SkillTreeView;