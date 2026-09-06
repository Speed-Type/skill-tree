import '@xyflow/react/dist/style.css';
import './flow.css';

import { useRef, useEffect, useCallback } from 'react';
import { useEdgeSelection } from '../../hooks/useEdgeSelection';
import { 
    ReactFlow,
    ReactFlowInstance,
    OnMoveEnd,
    ReactFlowProvider,
    useNodesState,
    useEdgesState,
    useReactFlow,
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
import { getBorderPoint, resolveOverlaps } from './geometry';

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

function SkillTreeView(props: SkillTreeViewProps) {
    return (
        <ReactFlowProvider>
            <SkillTreeViewInner {...props} />
        </ReactFlowProvider>
    );
}

function SkillTreeViewInner({ skills, edges, statuses, isOwner, onSkillChanged, onSkillDeleted, onEdgeCreated, onEdgeDeleted, onStatusUsed }: SkillTreeViewProps) {
    
    // ======================= Blurry Text Prevention ==========================

    const rfInstanceRef = useRef<ReactFlowInstance<SkillFlowNode, FloatingSkillEdge> | null>(null);

    // Snap the viewport to integer pixel coordinates once panning/zooming
    // settles, so text and node borders don't end up rendered at a subpixel
    // offset — see https://github.com/wbkd/react-flow/issues/3282
    const onMoveEnd: OnMoveEnd = useCallback((_event, viewport) => {
        const roundedX = Math.round(viewport.x);
        const roundedY = Math.round(viewport.y);

        if (roundedX !== viewport.x || roundedY !== viewport.y) {
            rfInstanceRef.current?.setViewport(
                { x: roundedX, y: roundedY, zoom: viewport.zoom },
                { duration: 0 } // snap instantly, no visible jump
            );
        }
    }, []);

    // ======================= Tracking Delete Popups for Edges ==========================

    const { selectedEdgeId, setSelectedEdgeId } = useEdgeSelection(isOwner, handleEdgeDelete);

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
                onSelect: () => { if (isOwner) setSelectedEdgeId(String(edge.id)); },
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

    // ====================== Recenter Logic =========================

    const { fitView } = useReactFlow();

    function handleRecenter() {
        fitView({ maxZoom: 1.5, duration: 300 });
    }

    // ====================== Autospace Logic =========================

    // Fallback dimensions in case a node hasn't been measured yet (shouldn't normally happen
    // post-mount, but keeps this from silently no-op-ing if it does)
    const FALLBACK_NODE_WIDTH = 200;
    const FALLBACK_NODE_HEIGHT = 90;

    async function handleAutoSpace() {
        const spacingInput = nodes.map(n => ({
            id: n.id,
            x: n.position.x,
            y: n.position.y,
            width: n.measured?.width ?? FALLBACK_NODE_WIDTH,
            height: n.measured?.height ?? FALLBACK_NODE_HEIGHT,
        }));

        const spaced = resolveOverlaps(spacingInput);

        // Only nodes that actually needed to move
        const moved = spaced.filter(s => {
            const original = spacingInput.find(n => n.id === s.id)!;
            return Math.abs(original.x - s.x) > 0.5 || Math.abs(original.y - s.y) > 0.5;
        });

        if (moved.length === 0) {
            return;
        }

        // Update visually right away, ahead of the round-trip to the server
        setNodes(nds => nds.map(n => {
            const update = moved.find(m => m.id === n.id);
            return update ? { ...n, position: { x: update.x, y: update.y } } : n;
        }));

        const results = await Promise.allSettled(moved.map(m =>
            apiFetch<Skill>(`/skills/${m.id}`, {
                method: 'PUT',
                body: JSON.stringify({ x_position: m.x, y_position: m.y }),
            }).then(onSkillChanged)
        ));

        const failures = results.filter(r => r.status === 'rejected').length;
        if (failures > 0) {
            console.error(`Failed to persist ${failures} node position(s) after auto-spacing`);
            snackbar.error("Some positions couldn't be saved — try again");
        }
    }

    // ========================================= Other ReactFlow Props =============================================

    // Prop for ReactFlow component that prevents self-connections, duplicate edges, and reverse-direction links
    const isValidConnection: IsValidConnection<FloatingSkillEdge> = useCallback((connection) => {
        return isConnectionAllowed(connection);
    }, [isConnectionAllowed]);

    // ========================================= Component HTML =============================================
 
    return (
        <div className="flow-canvas">
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
                fitViewOptions={{ padding: 0.2, maxZoom: 1.5 }}

                // Blur prevention
                onInit={(instance) => { rfInstanceRef.current = instance; }}
                onMoveEnd={onMoveEnd}

                // Possibly temporary
                connectOnClick={false} // At least for now, we don't want to have another way to create edges
                deleteKeyCode={null} // Currently, node deletion this way isn't synced to backend
                multiSelectionKeyCode={null} // Multi-selection and bulk dragging doesn't sync correctly right now
            />

            <button
                type="button"
                className="btn btn-icon flow-recenter-btn"
                onClick={handleRecenter}
                title="Recenter view"
            >
                <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="14" height="14" rx="2" />
                    <path d="M10 6.5v7M6.5 10h7" />
                </svg>
            </button>

            {isOwner && (
                <button
                    type="button"
                    className="btn btn-icon flow-autospace-btn"
                    onClick={handleAutoSpace}
                    title="Space out overlapping skills"
                >
                    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4l4 4M4 4v4M4 4h4" />
                        <path d="M16 4l-4 4M16 4v4M16 4h-4" />
                        <path d="M4 16l4-4M4 16v-4M4 16h4" />
                        <path d="M16 16l-4-4M16 16v-4M16 16h-4" />
                    </svg>
                </button>
            )}
        </div>
    );
}

export default SkillTreeView;