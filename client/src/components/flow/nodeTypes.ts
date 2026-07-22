/*
    Purpose of this file is to create node objects once
    with stable references, to avoid unnecessary re-rendering
    in ReactFlow components
*/

import SkillNode from './nodes/SkillNode';

export const nodeTypes = { skill: SkillNode };