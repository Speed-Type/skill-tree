// CustomConnectionLine.jsx
import { useState, useEffect, useCallback } from 'react';
import { useConnection, useStore, useReactFlow, getStraightPath } from '@xyflow/react';
import { getBorderPoint } from '../geometry'

function CustomConnectionLine() {
    const connection = useConnection();
    const { screenToFlowPosition } = useReactFlow();
    const [hoveredNodeId, setHoveredNodeId] = useState(null);
    const [pointerPos, setPointerPos] = useState(null);

    /*
        Manually track which node's DOM element is under the pointer, 
        since useConnection().toNode only fires near an actual Handle,
        leading to an issue where hovering the mouse near but not on
        the body of a node will snap it to the border instead of the
        center of the node as desired
    */
    useEffect(() => {
        if (!connection.inProgress) {
            setHoveredNodeId(null);
            setPointerPos(null);
            return;
        }

        function handlePointerMove(event) {
            const el = document.elementFromPoint(event.clientX, event.clientY);
            const nodeEl = el?.closest('.react-flow__node');
            setHoveredNodeId(nodeEl?.getAttribute('data-id') ?? null);

            // Use raw cursor position in flow coordinates
            // Deliberately NOT using connection.to, since React Flow snaps that internally
            // to nearby handles within its own connectionRadius
            setPointerPos(screenToFlowPosition({ x: event.clientX, y: event.clientY }));
        }

        window.addEventListener('pointermove', handlePointerMove);
        return () => window.removeEventListener('pointermove', handlePointerMove);
    }, [connection.inProgress, screenToFlowPosition]);

    // Get the node that the mouse is hovered over, if there is one
    const hoveredNode = useStore(
        useCallback(
            (store) => (hoveredNodeId ? store.nodeLookup.get(hoveredNodeId) : null),
            [hoveredNodeId]
        )
    );

    // We know the starting node from this connection
    const fromNode = connection.fromNode;

    // Don't draw the connection if it hasn't been started
    if (!connection.inProgress) return null;
    // Don't draw the connection if we're hovering over the node we've started from
    if (hoveredNode && fromNode && hoveredNode.id === fromNode.id) return null;

    // Default connection end point at mouse position
    let toX = pointerPos?.x ?? connection.to.x;
    let toY = pointerPos?.y ?? connection.to.y;

    // Override connection end point to be at the center of the hovered node if there is one
    if (hoveredNode && hoveredNode.measured?.width && hoveredNode.measured?.height) {
        const { x, y } = hoveredNode.internals.positionAbsolute;

        // Stop at the target's border, along the line from source center to target center,
        // instead of clipping through to the exact center point
        const borderPoint = getBorderPoint(hoveredNode, {
            x: fromNode.internals.positionAbsolute.x + fromNode.measured.width / 2,
            y: fromNode.internals.positionAbsolute.y + fromNode.measured.height / 2,
        });
        toX = borderPoint.x;
        toY = borderPoint.y;
    }

    // Default connection start point
    let fromX = connection.from.x;
    let fromY = connection.from.y;

    // Re-derive the start point so it lies on fromNode's border,
    // on the line from its center through (toX, toY)
    if (fromNode?.measured?.width && fromNode?.measured?.height) {
        const borderPoint = getBorderPoint(fromNode, { x: toX, y: toY });
        fromX = borderPoint.x;
        fromY = borderPoint.y;
    }

    // Calculate path
    const [path] = getStraightPath({ sourceX: fromX, sourceY: fromY, targetX: toX, targetY: toY });

    return (
        <path
            fill="none"
            strokeWidth={1.5}
            className="react-flow__connection-path"
            d={path}
            style={{ pointerEvents: 'none' }}
        />
    );
}

export default CustomConnectionLine;