/*
    Purpose of this file is to create edge objects once
    with stable references, to avoid unnecessary re-rendering
    in ReactFlow components
*/

import FloatingEdge from './edges/FloatingEdge';
export const edgeTypes = { floating: FloatingEdge };