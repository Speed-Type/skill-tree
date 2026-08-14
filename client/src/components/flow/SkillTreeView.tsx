import '@xyflow/react/dist/style.css';
import './SkillFlow.css';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
    ReactFlow,
    useNodesState,
    useEdgesState,
    OnNodeDrag,
    Connection,
    OnConnectEnd,
    ConnectionMode,
    IsValidConnection,
} from '@xyflow/react';
import { nodeTypes } from './nodeTypes';
import { edgeTypes } from './edgeTypes';
import { SkillFlowNode } from './nodes/SkillNode'; // Exported as types
import { FloatingSkillEdge } from './edges/FloatingEdge'; // Exported as types
import CustomConnectionLine from './connectionLines/CustomConnectionLine';

import { Skill, SkillEdge, Status, SkillChangedHandler, SkillDeletedHandler } from '../../../../shared/types';
import { apiFetch } from '../../lib/api';
import { snackbar } from '../../lib/snackbar';

interface SkillTreeViewProps {
    skills: Skill[];
    edges: SkillEdge[];
    statuses: Status[];
    isOwner: boolean;
    onSkillChanged: SkillChangedHandler;
    onSkillDeleted: SkillDeletedHandler;
    onEdgeCreated: (newEdge: SkillEdge) => void;
    onEdgeDeleted: (deletedEdgeID: string) => void;
    onStatusUsed: (statusId: number) => void;
}

function SkillTreeView({ skills, edges, statuses, isOwner, onSkillChanged, onSkillDeleted, onEdgeCreated, onEdgeDeleted, onStatusUsed }: SkillTreeViewProps) {
    
    // ======================= Tracking Delete Popups for Edges ==========================

    const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
    const reactFlowWrapperRef = useRef<HTMLDivElement>(null);

    // Handle keypress deletes
    useEffect(() => {
        if (!selectedEdgeId || !isOwner) return;

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
                isOwner,
                onSkillChanged,
                onSkillDeleted,
                onStatusUsed,
            },
        }));

    // Function to build edge data from edges prop
    const buildEdges = (): FloatingSkillEdge[] => 
        edges.map(edge => ({
            id: String(edge.id),
            source: String(edge.from_skill_id),
            target: String(edge.to_skill_id),
            type: 'floating',
            selectable: false, // We manage selection ourselves via data.isSelected; 
                               // this stops React Flow's own native edge-selection styling from also kicking in
            data: { 
                isOwner: isOwner,
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
    }, [skills, statuses, isOwner]);

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
            const updatedSkill = await apiFetch<Skill>(`/skills/${node.id}`, {
                method: 'PUT',
                body: JSON.stringify({ x_position: node.position.x, y_position: node.position.y }),
            });

            onSkillChanged(updatedSkill);
            // No need to use snackbar to confirm that operation was successful, especially since nodes can get moved a lot
        }
        catch(err) {
            console.error('Failed to update node position: ', err);
        }
    }

    // ========================================= Edge handling =============================================

    // Shared validation so both connection paths reject invalid links consistently
    const isConnectionAllowed = useCallback((connection: Connection | { source: string | null; target: string | null; sourceHandle?: string | null; targetHandle?: string | null }) => {
        // Check for self-connections
        if (!connection.source || !connection.target || connection.source === connection.target) return false;

        // Check for duplicate connections
        const hasDirectEdge = edges.some(edge =>
            String(edge.from_skill_id) === connection.source && String(edge.to_skill_id) === connection.target
        );

        if (hasDirectEdge) return false;

        const sourceNode = skills.find(skill => String(skill.id) === connection.source);
        const targetNode = skills.find(skill => String(skill.id) === connection.target);

        if (!sourceNode || !targetNode) return false;

        // Check for reverse connections
        const hasReverseConnection = edges.some(edge =>
            String(edge.from_skill_id) === connection.target && String(edge.to_skill_id) === connection.source
        );

        return !hasReverseConnection;
    }, [edges, skills]);

    // Handles edge creation
    // The connection handler that sends the actual API request
    async function handleConnect(connection: Connection)
    {
        if (!isConnectionAllowed(connection)) return;

        try {
            const newEdge = await apiFetch<SkillEdge>('/edges', {
                method: 'POST',
                body: JSON.stringify({ from_skill_id: connection.source, to_skill_id: connection.target }),
            });

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
            await apiFetch(`/edges/${deletedEdgeId}`, { method: 'DELETE' });
            onEdgeDeleted(deletedEdgeId);
            snackbar.success('Connection deleted successfully');
        } catch (err) {
            console.error('Failed to delete edge: ', err);
        }
    }

    // ========================================= Other ReactFlow Props =============================================

    // Prop for ReactFlow component that prevents self-connections, duplicate edges, and reverse-direction links
    const isValidConnection: IsValidConnection<FloatingSkillEdge> = useCallback((connection) => {
        return isConnectionAllowed(connection);
    }, [isConnectionAllowed]);

    // ========================================= Component HTML =============================================
 
    return (
        <div className="flow-canvas" ref={reactFlowWrapperRef}>
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

                // Lock out certain interactions for non-owner viewing
                nodesDraggable={isOwner}

                // Other settings
                connectionMode={ConnectionMode.Loose}
                fitView

                // Possibly temporary
                connectOnClick={false} // At least for now, we don't want to have another way to create edges
                deleteKeyCode={null} // Currently, node deletion this way isn't synced to backend
                multiSelectionKeyCode={null} // Multi-selection and bulk dragging doesn't sync correctly right now
            />
        </div>
    );
}

export default SkillTreeView;