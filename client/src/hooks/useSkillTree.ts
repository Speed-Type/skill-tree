import { useState, useEffect } from 'react';
import { TreeWithDetails, Status } from '../types'

const API_BASE = import.meta.env.VITE_API_BASE

interface UseSkillTreeResult {
    tree: TreeWithDetails | null;
    statuses: Status[];
    loading: boolean;
    error: unknown; // Because errors come in all kinds of types
}

export function useSkillTree(treeId: number): UseSkillTreeResult {
    const [tree, setTree] = useState<TreeWithDetails | null>(null);
    const [statuses, setStatuses] = useState<Status[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<unknown>(null);

    useEffect(() => {
        Promise.all([
            fetch(`${API_BASE}/trees/${treeId}`).then(res => res.json()),
            fetch(`${API_BASE}/statuses`).then(res => res.json()),
        ])
        .then(([treeData, statusData]: [TreeWithDetails, Status[]]) => {
            setTree(treeData);
            setStatuses(statusData.sort((a, b) => a.sort_order - b.sort_order));
        })
        .catch(setError)
        .finally(() => setLoading(false));
    }, [treeId]);

    return { tree, statuses, loading, error };
}