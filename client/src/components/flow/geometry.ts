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

export function resolveOverlaps(nodes: SpacedNode[], padding: number = 40, maxIterations: number = 150): SpacedNode[] {
    const laidOut = nodes.map(n => ({ ...n }));

    for (let iter = 0; iter < maxIterations; iter++) {
        let anyOverlap = false;

        for (let i = 0; i < laidOut.length; i++) {
            for (let j = i + 1; j < laidOut.length; j++) {
                const a = laidOut[i];
                const b = laidOut[j];

                const ax1 = a.x - padding / 2, ax2 = a.x + a.width + padding / 2;
                const ay1 = a.y - padding / 2, ay2 = a.y + a.height + padding / 2;
                const bx1 = b.x - padding / 2, bx2 = b.x + b.width + padding / 2;
                const by1 = b.y - padding / 2, by2 = b.y + b.height + padding / 2;

                const overlapX = Math.min(ax2, bx2) - Math.max(ax1, bx1);
                const overlapY = Math.min(ay2, by2) - Math.max(ay1, by1);

                if (overlapX <= 0 || overlapY <= 0) continue; // not overlapping — leave both alone

                anyOverlap = true;

                const aCenterX = a.x + a.width / 2, aCenterY = a.y + a.height / 2;
                const bCenterX = b.x + b.width / 2, bCenterY = b.y + b.height / 2;

                // Push apart along whichever axis has the smaller overlap — the shortest
                // path out of the collision, so nodes move the minimum distance necessary
                if (overlapX < overlapY) {
                    const dir = bCenterX >= aCenterX ? 1 : -1;
                    const shift = (overlapX / 2) * dir;
                    a.x -= shift;
                    b.x += shift;
                } else {
                    const dir = bCenterY >= aCenterY ? 1 : -1;
                    const shift = (overlapY / 2) * dir;
                    a.y -= shift;
                    b.y += shift;
                }
            }
        }

        if (!anyOverlap) break; // stable — nothing left to separate
    }

    return laidOut;
}