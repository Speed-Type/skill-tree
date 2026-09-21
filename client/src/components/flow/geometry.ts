// Purpose of this file is to hold helper functions for flow components

import { InternalNode } from '@xyflow/react';

interface Point {
    x: number;
    y: number;
}

// getNodeIntersection(node, point) — returns border point on 'node'
// along the line from node's center to an arbitrary {x, y} point
export function getBorderPoint(node: InternalNode, point: Point) {
    const { positionAbsolute } = node.internals;

    if (!node.measured?.width || !node.measured?.height) {
        throw new Error('Node has not been measured yet');
    }

    const w = node.measured.width / 2;
    const h = node.measured.height / 2;
    const x2 = positionAbsolute.x + w;
    const y2 = positionAbsolute.y + h;

    const x1 = point.x;
    const y1 = point.y;

    const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
    const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
    const a = 1 / (Math.abs(xx1) + Math.abs(yy1));
    const xx3 = a * xx1;
    const yy3 = a * yy1;
    const x = w * (xx3 + yy3) + x2;
    const y = h * (-xx3 + yy3) + y2;

    return { x, y };
}

// Nudges only the nodes that currently overlap (or are within `padding` of overlapping)
// apart from each other, along whichever axis needs the smaller push. Non-overlapping
// nodes are left completely alone — this is de-crowding, not a full re-layout, so it
// won't radically rearrange a tree that's already mostly tidy.
interface SpacedNode {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

function addDelta(deltas: Map<string, { dx: number; dy: number }>, id: string, dx: number, dy: number) {
    const existing = deltas.get(id) ?? { dx: 0, dy: 0 };
    deltas.set(id, { dx: existing.dx + dx, dy: existing.dy + dy });
}

export function resolveOverlaps(nodes: SpacedNode[], padding: number = 40, maxIterations: number = 150): SpacedNode[] {
    const laidOut = nodes.map(n => ({ ...n }));

    // Every node starts "dirty" (needs checking); a node becomes dirty again only when it
    // actually moves. Once a pass produces no new overlaps among dirty nodes, we're done.
    let dirty = new Set(laidOut.map(n => n.id));

    for (let iter = 0; iter < maxIterations && dirty.size > 0; iter++) {
        let anyOverlap = false;
        const nextDirty = new Set<string>();

        // Accumulated position changes from this pass's overlaps. Deliberately NOT applied
        // until the whole sweep finishes
        const deltas = new Map<string, { dx: number; dy: number }>();

        // Sort by left edge (including padding) once per pass. This lets the inner loop
        // break out early: once a later node's left edge is past the current node's right
        // edge, no node further along the sorted order can overlap it on the x-axis either,
        // so there's no need to keep scanning the rest of the array for that pair.
        const sorted = [...laidOut].sort((a, b) => (a.x - padding / 2) - (b.x - padding / 2));

        for (let i = 0; i < sorted.length; i++) {
            const a = sorted[i];

            const ax1 = a.x - padding / 2, ax2 = a.x + a.width + padding / 2;


            for (let j = i + 1; j < sorted.length; j++) {
                const b = sorted[j];
                const bx1 = b.x - padding / 2;

                // Sorted by left edge: once b starts past a's right edge, nothing
                // further in the sorted array can overlap a on x either
                if (bx1 >= ax2) break;

                // Skip pairs where neither node moved since the last pass, since nothing will have changed
                if (!dirty.has(a.id) && !dirty.has(b.id)) continue;

                const bx2 = b.x + b.width + padding / 2;

                const ay1 = a.y - padding / 2, ay2 = a.y + a.height + padding / 2;
                const by1 = b.y - padding / 2, by2 = b.y + b.height + padding / 2;

                const overlapX = Math.min(ax2, bx2) - Math.max(ax1, bx1);
                const overlapY = Math.min(ay2, by2) - Math.max(ay1, by1);

                if (overlapX <= 0 || overlapY <= 0) continue; // not overlapping, so leave both alone

                anyOverlap = true;

                const aCenterX = a.x + a.width / 2, aCenterY = a.y + a.height / 2;
                const bCenterX = b.x + b.width / 2, bCenterY = b.y + b.height / 2;

                // Push apart along whichever axis has the smaller overlap, so nodes move the minimum distance necessary
                if (overlapX < overlapY) {
                    const dir = bCenterX >= aCenterX ? 1 : -1;
                    const shift = (overlapX / 2) * dir;
                    addDelta(deltas, a.id, -shift, 0);
                    addDelta(deltas, b.id, shift, 0);
                } else {
                    const dir = bCenterY >= aCenterY ? 1 : -1;
                    const shift = (overlapY / 2) * dir;
                    addDelta(deltas, a.id, 0, -shift);
                    addDelta(deltas, b.id, 0, shift);
                }


                // Both nodes moved, so both need to be re-checked against everyone next pass
                // A shift here could newly create (or resolve) overlaps elsewhere involving them
                nextDirty.add(a.id);
                nextDirty.add(b.id);
            }
        }

        // Apply this pass's accumulated shifts now that detection (which depended on a
        // stable, frozen snapshot) is complete
        for (const node of laidOut) {
            const delta = deltas.get(node.id);
            if (delta) {
                node.x += delta.dx;
                node.y += delta.dy;
            }
        }

        if (!anyOverlap) break;

        dirty = nextDirty;
    }

    return laidOut;
}