import { useCallback } from 'react';
import { useStore, getStraightPath, EdgeLabelRenderer, EdgeProps, Edge } from '@xyflow/react';
import { getBorderPoint } from '../geometry';
import { resolveStatusColor } from '../../../lib/statusColor';

export interface FloatingEdgeData extends Record<string, unknown> {
    isOwner: boolean;
    onDelete: (id: string) => void;
    isSelected: boolean;
    onSelect: (event: React.MouseEvent<SVGPathElement>) => void;
}

export type FloatingSkillEdge = Edge<FloatingEdgeData>;

function FloatingEdge({ id, source, target, markerEnd, style, data }: EdgeProps<FloatingSkillEdge>) {

    if(!data) return null;

    // Unpack data
    const { isOwner, onDelete, isSelected, onSelect } = data;

    // Get source and target nodes
    const sourceNode = useStore(useCallback((store) => store.nodeLookup.get(source), [source]));
    const targetNode = useStore(useCallback((store) => store.nodeLookup.get(target), [target]));

    // Won't continue if any required variables are missing
    if (!sourceNode || !targetNode) return null;
    if (!sourceNode.measured?.width || !sourceNode.measured?.height 
        || !targetNode.measured?.width || !targetNode.measured?.height) return null;
    if (!sourceNode.internals?.positionAbsolute || !targetNode.internals?.positionAbsolute) return null;

    // Resolve each endpoint's glow color from the connected node's current status,
    // falling back to the same "locked" grey the node itself shows when unset
    const sourceSkillData = sourceNode.data as FloatingEdgeData & { skill?: { status_id: number | null }; statuses?: { id: number; label: string; color: string | null }[] };
    const targetSkillData = targetNode.data as FloatingEdgeData & { skill?: { status_id: number | null }; statuses?: { id: number; label: string; color: string | null }[] };

    const sourceStatus = sourceSkillData.statuses?.find(s => s.id === sourceSkillData.skill?.status_id);
    const targetStatus = targetSkillData.statuses?.find(s => s.id === targetSkillData.skill?.status_id);

    const sourceColor = sourceStatus ? resolveStatusColor(sourceStatus) : 'var(--locked)';
    const targetColor = targetStatus ? resolveStatusColor(targetStatus) : 'var(--locked)';

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

    const gradientId = `edge-gradient-${id}`;

    return (
        <>

            {/* Per-edge gradient blending from the source node's status color to the target's;
                userSpaceOnUse + explicit coords means it follows this edge's actual line,
                not a bounding-box-relative default */}
            <defs>
                <linearGradient
                    id={gradientId}
                    gradientUnits="userSpaceOnUse"
                    x1={sourcePoint.x}
                    y1={sourcePoint.y}
                    x2={targetPoint.x}
                    y2={targetPoint.y}
                >
                    <stop offset="0%" style={{ stopColor: sourceColor }} />
                    <stop offset="100%" style={{ stopColor: targetColor }} />
                </linearGradient>
            </defs>

            {/* Invisible wide hit-area path that sits behind to catch clicks/hover */}
            <path
                d={path}
                className="edge-hit-area"
                fill="none"
                stroke="transparent"
                strokeWidth={20}
                style={{ cursor: 'pointer', pointerEvents: 'all' }}
                onClick={onSelect}
            />

            {/* Visible thin line; purely visual. Stroke is the per-edge gradient while
                deselected; left unset (falls through to CSS) once selected, so the
                .is-selected class's flat gold can take over cleanly */}
            <path
                id={id}
                className={`react-flow__edge-path skill-edge-path${isSelected ? ' is-selected' : ''}`}
                d={path}
                markerEnd={markerEnd}
                style={{
                    ...style,
                    stroke: isSelected ? undefined : `url(#${gradientId})`,
                    pointerEvents: 'none', // Shouldn't take any pointer events; don't block hit-area
                }}
            />

            {/* Hover-only pulse: a short bright segment sweeping source -> target along the
                same path, using the same gradient so it still reads as "traveling between
                the two node colors" rather than a generic highlight. Always mounted/animating;
                visibility is purely an opacity toggle on hover so there's no restart flicker */}
            {!isSelected && (
                <path
                    d={path}
                    className="skill-edge-pulse"
                    fill="none"
                    style={{ stroke: `url(#${gradientId})`, pointerEvents: 'none' }}
                />
            )}

            {/* Soft glow dots where the edge meets each node's border, tinted to that node's status color */}
            <circle
                cx={sourcePoint.x}
                cy={sourcePoint.y}
                r={3.5}
                className={`skill-edge-endpoint${isSelected ? ' is-selected' : ''}`}
                style={{ '--endpoint-color': sourceColor, pointerEvents: 'none' } as React.CSSProperties}
            />
            <circle
                cx={targetPoint.x}
                cy={targetPoint.y}
                r={3.5}
                className={`skill-edge-endpoint${isSelected ? ' is-selected' : ''}`}
                style={{ '--endpoint-color': targetColor, pointerEvents: 'none' } as React.CSSProperties}
            />

            {/* Render the delete popup as necessary */}
            {isSelected && isOwner && (
                <EdgeLabelRenderer>
                    <div
                        className="nodrag nopan edge-delete-popup"
                        style={{
                            position: 'absolute',
                            zIndex: 1000,
                            transform: `translate(-50%, -100%) translate(${midX}px, ${midY}px)`,
                            pointerEvents: 'all',
                        }}
                    >

                        <button onClick={() => onDelete(id)}>Delete?</button>
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
}

export default FloatingEdge;