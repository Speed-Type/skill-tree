// Purpose of this file is to hold helper functions for flow components

// getNodeIntersection(node, point) — returns border point on 'node'
// along the line from node's center to an arbitrary {x, y} point
export function getBorderPoint(node, point) {
    const { positionAbsolute } = node.internals;
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