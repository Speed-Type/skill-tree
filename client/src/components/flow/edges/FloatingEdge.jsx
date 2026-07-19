import { useState, useCallback } from 'react';
import { useStore, getStraightPath, EdgeLabelRenderer } from '@xyflow/react';

function getNodeIntersection(intersectionNode, targetNode) {
    const { measured, internals } = intersectionNode;
    const { positionAbsolute } = internals;

    const w = measured.width / 2;
    const h = measured.height / 2;
    const x2 = positionAbsolute.x + w;
    const y2 = positionAbsolute.y + h;

    const targetPosition = targetNode.internals.positionAbsolute;
    const x1 = targetPosition.x + targetNode.measured.width / 2;
    const y1 = targetPosition.y + targetNode.measured.height / 2;

    const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
    const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
    const a = 1 / (Math.abs(xx1) + Math.abs(yy1));
    const xx3 = a * xx1;
    const yy3 = a * yy1;
    const x = w * (xx3 + yy3) + x2;
    const y = h * (-xx3 + yy3) + y2;

    return { x, y };
}

function FloatingEdge({ id, source, target, markerEnd, style, data }) {
    const [showDelete, setShowDelete] = useState(false);

    const sourceNode = useStore(useCallback((store) => store.nodeLookup.get(source), [source]));
    const targetNode = useStore(useCallback((store) => store.nodeLookup.get(target), [target]));

    if (!sourceNode || !targetNode) return null;
    if (!sourceNode.measured?.width || !sourceNode.measured?.height || !targetNode.measured?.width || !targetNode.measured?.height) {
        return null;
    }
    if (!sourceNode.internals?.positionAbsolute || !targetNode.internals?.positionAbsolute) return null;

    const sourcePoint = getNodeIntersection(sourceNode, targetNode);
    const targetPoint = getNodeIntersection(targetNode, sourceNode);

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
            <path
                id={id}
                className="react-flow__edge-path"
                d={path}
                markerEnd={markerEnd}
                style={{ ...style, pointerEvents: 'stroke', cursor: 'pointer' }}
                onClick={() => setShowDelete(true)}
            />

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