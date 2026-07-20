import { useState, useCallback } from 'react';
import { useStore, getStraightPath, EdgeLabelRenderer } from '@xyflow/react';
import { getBorderPoint } from '../geometry';

function FloatingEdge({ id, source, target, markerEnd, style, data }) {

    // State for showing the delete popup
    const [showDelete, setShowDelete] = useState(false);

    // Get source and target nodes
    const sourceNode = useStore(useCallback((store) => store.nodeLookup.get(source), [source]));
    const targetNode = useStore(useCallback((store) => store.nodeLookup.get(target), [target]));

    // Won't continue if any required variables are missing
    if (!sourceNode || !targetNode) return null;
    if (!sourceNode.measured?.width || !sourceNode.measured?.height 
        || !targetNode.measured?.width || !targetNode.measured?.height) return null;
    if (!sourceNode.internals?.positionAbsolute || !targetNode.internals?.positionAbsolute) return null;

    // Calculate endpoints of edge by using getBorderPoint
    // Imagine there's a line drawn across the centers of the source and target nodes,
    // and then shrink that line such that the endpoints of that line are on the borders
    // of the source and target nodes. That is where these points are
    const sourcePoint = getBorderPoint(sourceNode, {
        x: targetNode.internals.positionAbsolute.x + targetNode.measured.width / 2,
        y: targetNode.internals.positionAbsolute.y + targetNode.measured.height / 2,
    });
    const targetPoint = getBorderPoint(targetNode, {
        x: sourceNode.internals.positionAbsolute.x + sourceNode.measured.width / 2,
        y: sourceNode.internals.positionAbsolute.y + sourceNode.measured.height / 2,
    });

    // Calculate path
    const [path] = getStraightPath({
        sourceX: sourcePoint.x,
        sourceY: sourcePoint.y,
        targetX: targetPoint.x,
        targetY: targetPoint.y,
    });

    // Calculate midpoint of edge, necessary for delete popup
    const midX = (sourcePoint.x + targetPoint.x) / 2;
    const midY = (sourcePoint.y + targetPoint.y) / 2;

    return (
        <>

            {/* Invisible wide hit-area path that sits behind to catche clicks/hover */}
            <path
                d={path}
                fill="none"
                stroke="transparent"
                strokeWidth={20}
                style={{ cursor: 'pointer' }}
                onClick={() => setShowDelete(true)}
            />

            {/* Visible thin line; purely visual */}
            <path
                id={id}
                className="react-flow__edge-path"
                d={path}
                markerEnd={markerEnd}
                style={style}
            />

            {/* Render the delete popup as necessary */}
            {showDelete && (
                <EdgeLabelRenderer>
                    <div
                        className="nodrag nopan edge-delete-popup"
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -100%) translate(${midX}px, ${midY}px)`,
                            pointerEvents: 'all',
                        }}
                    >

                        <button onClick={() => data?.onDelete?.(id)}>Delete?</button>
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
}

export default FloatingEdge;